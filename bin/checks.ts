import { execSync } from "child_process";
import * as fs from "fs";
import * as net from "net";
import * as path from "path";

// ANSI color codes
const colors = {
	reset: "\x1b[0m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
};

function printResult(
	checkName: string,
	passed: boolean,
	message?: string,
): boolean {
	const status = passed
		? `${colors.green}✓ PASS${colors.reset}`
		: `${colors.red}✗ FAIL${colors.reset}`;
	console.log(`${status} - ${checkName}${message ? `: ${message}` : ""}`);
	return passed;
}

export function checkNodeVersion(minVersion: string = "18.0.0"): boolean {
	const nodeVersion = process.version.slice(1); // Remove 'v'
	const [major, minor, patch] = nodeVersion.split(".").map(Number);
	const [minMajor, minMinor, minPatch] = minVersion.split(".").map(Number);

	if (major < minMajor) {
		return printResult(
			"Node.js version",
			false,
			`required >= ${minVersion}, got ${process.version}`,
		);
	}
	if (major === minMajor && minor < minMinor) {
		return printResult(
			"Node.js version",
			false,
			`required >= ${minVersion}, got ${process.version}`,
		);
	}
	if (major === minMajor && minor === minMinor && patch < minPatch) {
		return printResult(
			"Node.js version",
			false,
			`required >= ${minVersion}, got ${process.version}`,
		);
	}

	return printResult("Node.js version", true, process.version);
}

export function checkClaudeCLI(): boolean {
	try {
		execSync("claude --version", { stdio: "ignore" });
		return printResult("Claude CLI", true);
	} catch {
		printResult("Claude CLI", false, "not installed");
		console.log(
			`${colors.yellow}  Please install: npm install -g @anthropic/claude-cli${colors.reset}`,
		);
		return false;
	}
}

export async function checkPortAvailable(
	port: number = 3000,
): Promise<boolean> {
	return new Promise<boolean>((resolve) => {
		const server = net.createServer();

		server.once("error", (err: NodeJS.ErrnoException) => {
			if (err.code === "EADDRINUSE") {
				printResult(`Port ${port}`, false, "already in use");
				resolve(false);
			} else {
				printResult(`Port ${port}`, false, err.message);
				resolve(false);
			}
		});

		server.once("listening", () => {
			server.close(() => {
				printResult(`Port ${port}`, true, "available");
				resolve(true);
			});
		});

		server.listen(port);
	}).then((result) => result);
}

export function checkDataDirWritable(dataDir: string): boolean {
	try {
		fs.mkdirSync(dataDir, { recursive: true });

		// Test write access by creating a temp file
		const testFile = path.join(dataDir, ".write-test-" + Date.now());
		fs.writeFileSync(testFile, "test");
		fs.unlinkSync(testFile);

		return printResult("Data directory", true, dataDir);
	} catch (err) {
		const message = err instanceof Error ? err.message : "unknown error";
		printResult("Data directory", false, message);
		return false;
	}
}

export async function runPreflightChecks(
	options: { port?: number; dataDir?: string } = {},
): Promise<boolean> {
	const { port = 3000, dataDir = path.join(process.env.HOME || "", ".cmc") } =
		options;

	console.log("\n--- Preflight Checks ---\n");

	// Critical check: Node version
	if (!checkNodeVersion()) {
		console.log(
			`\n${colors.red}Critical check failed. Aborting.${colors.reset}\n`,
		);
		process.exit(1);
	}

	// Critical check: Claude CLI
	if (!checkClaudeCLI()) {
		console.log(
			`\n${colors.red}Critical check failed. Aborting.${colors.reset}\n`,
		);
		process.exit(1);
	}

	// Check: Port available
	const portAvailable = await checkPortAvailable(port);
	if (!portAvailable) {
		console.log(
			`\n${colors.yellow}Port not available. You may need to stop another process or use a different port.${colors.reset}\n`,
		);
		// Not failing fast for port - it's a warning
	}

	// Check: Data dir writable
	if (!checkDataDirWritable(dataDir)) {
		console.log(
			`\n${colors.red}Cannot write to data directory. Aborting.${colors.reset}\n`,
		);
		process.exit(1);
	}

	console.log("\n--- All checks passed ---\n");
	return true;
}
