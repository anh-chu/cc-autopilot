import { type ChildProcess, fork } from "child_process";
import * as fs from "fs";
import * as http from "http";
import * as path from "path";
import treeKill from "tree-kill";
import { DATA_DIR } from "../src/lib/paths";

const PID_FILE = path.join(DATA_DIR, "mission-control.pid");

export interface PidInfo {
	pid: number;
	serverPid: number;
	daemonPid: number;
	port: number;
	startedAt: string;
}

export interface StartOptions {
	port: number;
	daemon: boolean;
	installDir: string;
}

export interface StatusInfo {
	running: boolean;
	serverAlive: boolean;
	daemonAlive: boolean;
	pidInfo: PidInfo | null;
}

// Track if we're in shutdown mode
let isShuttingDown = false;

// Track child processes
let serverProcess: ChildProcess | null = null;
let daemonProcess: ChildProcess | null = null;

// Auto-restart backoff state
let restartDelay = 1000; // Start with 1s
let lastCrashTime = 0;
let stableRuns = 0;
const MAX_RESTART_DELAY = 30000;
const STABLE_THRESHOLD_MS = 60000;

/**
 * Load PID info from the PID file.
 */
function loadPidFile(): PidInfo | null {
	if (!fs.existsSync(PID_FILE)) return null;

	try {
		const content = fs.readFileSync(PID_FILE, "utf-8");
		return JSON.parse(content);
	} catch {
		return null;
	}
}

/**
 * Write PID info to the PID file.
 */
function writePidFile(info: PidInfo): void {
	const dir = path.dirname(PID_FILE);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	fs.writeFileSync(PID_FILE, JSON.stringify(info, null, 2), "utf-8");
}

/**
 * Clear the PID file.
 */
function clearPidFile(): void {
	if (fs.existsSync(PID_FILE)) {
		fs.unlinkSync(PID_FILE);
	}
}

/**
 * Kill a process tree reliably.
 */
function killProcess(
	pid: number,
	signal: "SIGTERM" | "SIGKILL" = "SIGTERM",
): Promise<boolean> {
	return new Promise((resolve) => {
		try {
			treeKill(pid, signal, (err) => {
				if (err) {
					// Process may already be dead
					try {
						process.kill(pid, 0);
						resolve(false);
					} catch {
						resolve(true);
					}
				} else {
					resolve(true);
				}
			});
		} catch {
			resolve(false);
		}
	});
}

/**
 * Wait for a process to exit with timeout.
 */
async function waitForExit(pid: number, timeoutMs: number): Promise<boolean> {
	const startTime = Date.now();

	while (Date.now() - startTime < timeoutMs) {
		try {
			process.kill(pid, 0);
			await new Promise((r) => setTimeout(r, 100));
		} catch {
			return true; // Process exited
		}
	}

	return false; // Timeout
}

/**
 * Check if a process is alive.
 */
function isProcessAlive(pid: number): boolean {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

/**
 * HTTP GET with timeout.
 */
function httpGet(url: string, timeout: number = 5000): Promise<string> {
	return new Promise((resolve, reject) => {
		const req = http.get(url, (res) => {
			let data = "";
			res.on("data", (chunk) => (data += chunk));
			res.on("end", () => resolve(data));
		});

		req.on("error", reject);
		req.setTimeout(timeout, () => {
			req.destroy();
			reject(new Error("Request timeout"));
		});
	});
}

/**
 * Health check - verify server responds at /api/server-status
 */
export async function healthCheck(port: number): Promise<boolean> {
	const url = `http://localhost:${port}/api/server-status`;

	for (let i = 0; i < 10; i++) {
		try {
			const response = await httpGet(url, 5000);
			const data = JSON.parse(response);
			if (data && data.status === "ok") {
				return true;
			}
		} catch {
			// Wait before retry
			if (i < 9) {
				await new Promise((r) => setTimeout(r, 1000));
			}
		}
	}

	return false;
}

/**
 * Get current status of both processes.
 */
export function getStatus(): StatusInfo {
	const pidInfo = loadPidFile();

	if (!pidInfo) {
		return {
			running: false,
			serverAlive: false,
			daemonAlive: false,
			pidInfo: null,
		};
	}

	const serverAlive = pidInfo.serverPid
		? isProcessAlive(pidInfo.serverPid)
		: false;
	const daemonAlive = pidInfo.daemonPid
		? isProcessAlive(pidInfo.daemonPid)
		: false;

	return {
		running: serverAlive || daemonAlive,
		serverAlive,
		daemonAlive,
		pidInfo,
	};
}

/**
 * Stop all processes (server + daemon).
 */
export async function stopAll(): Promise<void> {
	isShuttingDown = true;

	const pidInfo = loadPidFile();

	if (!pidInfo) {
		console.log("[process-manager] No PID file found");
		return;
	}

	console.log(
		`[process-manager] Stopping server (PID ${pidInfo.serverPid}) and daemon (PID ${pidInfo.daemonPid})`,
	);

	// Send SIGTERM to both processes
	const promises: Promise<boolean>[] = [];

	if (pidInfo.serverPid && isProcessAlive(pidInfo.serverPid)) {
		promises.push(killProcess(pidInfo.serverPid, "SIGTERM"));
	}

	if (pidInfo.daemonPid && isProcessAlive(pidInfo.daemonPid)) {
		promises.push(killProcess(pidInfo.daemonPid, "SIGTERM"));
	}

	// Wait up to 5s for graceful shutdown
	const results = await Promise.all(promises);

	// If any process didn't exit, SIGKILL
	if (!results[0] && pidInfo.serverPid) {
		console.log(`[process-manager] Force killing PID ${pidInfo.serverPid}`);
		await killProcess(pidInfo.serverPid, "SIGKILL");
	}

	if (!results[1] && pidInfo.daemonPid) {
		console.log(`[process-manager] Force killing PID ${pidInfo.daemonPid}`);
		await killProcess(pidInfo.daemonPid, "SIGKILL");
	}

	// Clear PID file
	clearPidFile();
	console.log("[process-manager] Stopped all processes");
}

/**
 * Start both server and daemon.
 */
export async function startAll(options: StartOptions): Promise<void> {
	const { port, daemon: daemonEnabled, installDir } = options;

	// Ensure data directory exists
	const dir = path.dirname(PID_FILE);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	console.log(`[process-manager] Starting server on port ${port}...`);

	// Fork the Next.js server
	const serverEnv = {
		...process.env,
		HOSTNAME: "0.0.0.0",
		MC_INSTALL_DIR: installDir,
	};

	serverProcess = fork(".next/standalone/server.js", [], {
		execArgv: [],
		env: { ...serverEnv, PORT: String(port) },
		silent: true,
	});

	const serverPid = serverProcess.pid!;
	console.log(`[process-manager] Server started (PID ${serverPid})`);

	// Fork the daemon
	let daemonPid = 0;
	if (daemonEnabled) {
		console.log("[process-manager] Starting daemon...");

		daemonProcess = fork(
			path.join(process.cwd(), "dist/daemon.js"),
			["start"],
			{
				execArgv: [],
				env: process.env,
				silent: false,
			},
		);

		daemonPid = daemonProcess.pid!;
		console.log(`[process-manager] Daemon started (PID ${daemonPid})`);
	}

	// Write PID file
	const pidInfo: PidInfo = {
		pid: process.pid,
		serverPid,
		daemonPid,
		port,
		startedAt: new Date().toISOString(),
	};

	writePidFile(pidInfo);
	console.log(`[process-manager] PID file written to ${PID_FILE}`);

	// Set up auto-restart handlers for server
	if (serverProcess) {
		serverProcess.on("exit", (code, signal) => {
			if (!isShuttingDown) {
				console.log(
					`[process-manager] Server exited (code: ${code}, signal: ${signal})`,
				);
				handleServerCrash(port, installDir);
			}
		});

		serverProcess.on("error", (err) => {
			if (!isShuttingDown) {
				console.error(`[process-manager] Server error: ${err}`);
				handleServerCrash(port, installDir);
			}
		});
	}

	// Set up auto-restart handlers for daemon
	if (daemonProcess) {
		daemonProcess.on("exit", (code, signal) => {
			if (!isShuttingDown) {
				console.log(
					`[process-manager] Daemon exited (code: ${code}, signal: ${signal})`,
				);
				handleDaemonCrash(port, installDir);
			}
		});

		daemonProcess.on("error", (err) => {
			if (!isShuttingDown) {
				console.error(`[process-manager] Daemon error: ${err}`);
				handleDaemonCrash(port, installDir);
			}
		});
	}

	// Register signal handlers for graceful shutdown
	registerSignalHandlers();

	// Wait for server to be ready
	console.log("[process-manager] Waiting for server to be ready...");
	const ready = await healthCheck(port);

	if (ready) {
		console.log("[process-manager] Server ready");
	} else {
		console.warn("[process-manager] Server health check failed");
	}
}

/**
 * Handle server crash with auto-restart.
 */
async function handleServerCrash(
	port: number,
	installDir: string,
): Promise<void> {
	const now = Date.now();

	// Check if we should reset the backoff
	if (now - lastCrashTime > STABLE_THRESHOLD_MS) {
		restartDelay = 1000;
		stableRuns = 0;
	}

	lastCrashTime = now;
	stableRuns++;

	// Calculate delay with jitter
	const delay = Math.min(restartDelay, MAX_RESTART_DELAY);
	console.log(
		`[process-manager] Restarting server in ${delay}ms (attempt ${stableRuns})`,
	);

	await new Promise((r) => setTimeout(r, delay));

	// Double the delay for next crash (up to max)
	restartDelay = Math.min(restartDelay * 2, MAX_RESTART_DELAY);

	// Restart the server
	try {
		serverProcess = fork(".next/standalone/server.js", [], {
			execArgv: [],
			env: {
				...process.env,
				HOSTNAME: "0.0.0.0",
				MC_INSTALL_DIR: installDir,
				PORT: String(port),
			},
			silent: true,
		});

		const serverPid = serverProcess.pid!;
		console.log(`[process-manager] Server restarted (PID ${serverPid})`);

		// Update PID file
		const pidInfo = loadPidFile();
		if (pidInfo) {
			pidInfo.serverPid = serverPid;
			writePidFile(pidInfo);
		}

		// Set up handlers again
		serverProcess.on("exit", (code, signal) => {
			if (!isShuttingDown) {
				handleServerCrash(port, installDir);
			}
		});

		serverProcess.on("error", (err) => {
			if (!isShuttingDown) {
				console.error(`[process-manager] Server error: ${err}`);
				handleServerCrash(port, installDir);
			}
		});

		// Wait for server to be ready
		await healthCheck(port);
		console.log("[process-manager] Server ready after restart");
	} catch (err) {
		console.error(`[process-manager] Failed to restart server: ${err}`);
	}
}

/**
 * Handle daemon crash with auto-restart.
 */
async function handleDaemonCrash(
	port: number,
	installDir: string,
): Promise<void> {
	const now = Date.now();

	// Check if we should reset the backoff
	if (now - lastCrashTime > STABLE_THRESHOLD_MS) {
		restartDelay = 1000;
		stableRuns = 0;
	}

	lastCrashTime = now;
	stableRuns++;

	// Calculate delay with jitter
	const delay = Math.min(restartDelay, MAX_RESTART_DELAY);
	console.log(
		`[process-manager] Restarting daemon in ${delay}ms (attempt ${stableRuns})`,
	);

	await new Promise((r) => setTimeout(r, delay));

	// Double the delay for next crash (up to max)
	restartDelay = Math.min(restartDelay * 2, MAX_RESTART_DELAY);

	// Restart the daemon
	try {
		daemonProcess = fork(
			path.join(process.cwd(), "dist/daemon.js"),
			["start"],
			{
				execArgv: [],
				env: process.env,
				silent: false,
			},
		);

		const daemonPid = daemonProcess.pid!;
		console.log(`[process-manager] Daemon restarted (PID ${daemonPid})`);

		// Update PID file
		const pidInfo = loadPidFile();
		if (pidInfo) {
			pidInfo.daemonPid = daemonPid;
			writePidFile(pidInfo);
		}

		// Set up handlers again
		daemonProcess.on("exit", (code, signal) => {
			if (!isShuttingDown) {
				handleDaemonCrash(port, installDir);
			}
		});

		daemonProcess.on("error", (err) => {
			if (!isShuttingDown) {
				console.error(`[process-manager] Daemon error: ${err}`);
				handleDaemonCrash(port, installDir);
			}
		});
	} catch (err) {
		console.error(`[process-manager] Failed to restart daemon: ${err}`);
	}
}

/**
 * Register SIGTERM/SIGINT handlers for graceful shutdown.
 */
function registerSignalHandlers(): void {
	process.on("SIGTERM", async () => {
		console.log("[process-manager] Received SIGTERM, shutting down...");
		await stopAll();
		process.exit(0);
	});

	process.on("SIGINT", async () => {
		console.log("[process-manager] Received SIGINT, shutting down...");
		await stopAll();
		process.exit(0);
	});
}

/**
 * Fork the CLI as a daemon (detached process).
 * The parent process exits after forking.
 */
export function forkDaemonMode(
	cliPath: string,
	options: { port: number; installDir: string },
): never {
	console.log("[process-manager] Starting in daemon mode...");

	const daemonProcess = fork(cliPath, [], {
		detached: true,
		env: {
			...process.env,
			CMC_DAEMON: "true",
			CMC_PORT: String(options.port),
			CMC_INSTALL_DIR: options.installDir,
		},
	});

	// Unref so parent can exit
	daemonProcess.unref();

	console.log(`[process-manager] Daemon forked (PID ${daemonProcess.pid})`);
	process.exit(0);
}
