#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import path from "path";
import { logger } from "./logger";
import { loadConfig } from "./config";
import { HealthMonitor } from "./health";
import { AgentRunner } from "./runner";
import { Dispatcher } from "./dispatcher";
import { Scheduler } from "./scheduler";
import { runCrashRecovery } from "./recovery";
import { DATA_DIR } from "../../src/lib/paths";

// ─── Constants ───────────────────────────────────────────────────────────────
const PID_FILE = path.join(DATA_DIR, "daemon.pid");

// ─── Workspace Registry ──────────────────────────────────────────────────────

interface WorkspaceEntry {
  id: string;
  name: string;
  settings?: { daemonEnabled?: boolean };
}

function readWorkspaces(): WorkspaceEntry[] {
  const file = path.join(DATA_DIR, "workspaces.json");
  try {
    const raw = readFileSync(file, "utf-8");
    const data = JSON.parse(raw) as { workspaces: WorkspaceEntry[] };
    return data.workspaces ?? [];
  } catch {
    // Fall back to default workspace if registry missing
    return [{ id: "default", name: "Default" }];
  }
}

// ─── PID File Management ─────────────────────────────────────────────────────

function writePidFile(): void {
  writeFileSync(PID_FILE, String(process.pid), "utf-8");
}

function readPidFile(): number | null {
  try {
    if (!existsSync(PID_FILE)) return null;
    const pid = parseInt(readFileSync(PID_FILE, "utf-8").trim());
    return isNaN(pid) ? null : pid;
  } catch {
    return null;
  }
}

function removePidFile(): void {
  try {
    if (existsSync(PID_FILE)) unlinkSync(PID_FILE);
  } catch {
    // Best effort
  }
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0); // Signal 0 = check if process exists
    return true;
  } catch {
    return false;
  }
}

// ─── Commands ────────────────────────────────────────────────────────────────

function handleStatus(): void {
  const pid = readPidFile();
  if (pid && isProcessRunning(pid)) {
    console.log("\n=== Mission Control Agent Daemon ===");
    console.log(`Status:  \x1b[32mRunning\x1b[0m`);
    console.log(`PID:     ${pid}`);
    console.log("");
  } else {
    if (pid) removePidFile(); // Clean stale PID file
    console.log("\n=== Mission Control Agent Daemon ===");
    console.log(`Status:  \x1b[31mStopped\x1b[0m`);
    console.log("");
  }
}

function handleStop(): void {
  const pid = readPidFile();
  if (!pid) {
    console.log("Daemon is not running (no PID file).");
    return;
  }

  if (!isProcessRunning(pid)) {
    console.log("Daemon is not running (stale PID file). Cleaning up.");
    removePidFile();
    return;
  }

  console.log(`Stopping daemon (PID: ${pid})...`);
  try {
    process.kill(pid, "SIGTERM");
    console.log("Stop signal sent. Daemon will shut down gracefully.");
  } catch (err) {
    console.error(`Failed to stop daemon: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function handleStart(): Promise<void> {
  // Check for existing instance
  const existingPid = readPidFile();
  if (existingPid && isProcessRunning(existingPid)) {
    console.error(`Daemon is already running (PID: ${existingPid}). Use "stop" first.`);
    process.exit(1);
  }
  if (existingPid) removePidFile();

  console.log("\n=== Mission Control Agent Daemon ===\n");

  // Discover active workspaces
  const allWorkspaces = readWorkspaces();
  const activeWorkspaces = allWorkspaces.filter(w => w.settings?.daemonEnabled !== false);

  if (activeWorkspaces.length === 0) {
    logger.warn("daemon", "No active workspaces found (all have daemonEnabled: false). Exiting.");
    process.exit(0);
  }

  logger.info("daemon", `Active workspaces: ${activeWorkspaces.map(w => w.id).join(", ")}`);

  // Spin up one Dispatcher + Scheduler per workspace
  const runner = new AgentRunner();
  const workspaceInstances: Array<{ workspaceId: string; dispatcher: Dispatcher; scheduler: Scheduler; health: HealthMonitor }> = [];

  for (const ws of activeWorkspaces) {
    const config = loadConfig(ws.id);

    if (config.execution.skipPermissions) {
      logger.security("daemon", `[${ws.id}] ⚠  skipPermissions ENABLED`);
    }

    const health = new HealthMonitor();
    const dispatcher = new Dispatcher(ws.id, config, runner, health);
    const scheduler = new Scheduler(ws.id, config, dispatcher, health);

    workspaceInstances.push({ workspaceId: ws.id, dispatcher, scheduler, health });

    scheduler.start();

    // Crash recovery per workspace
    const recovery = runCrashRecovery(ws.id);
    if (recovery.sessionsToResume.length > 0) {
      logger.info("daemon", `[${ws.id}] Resuming ${recovery.sessionsToResume.length} interrupted session(s)...`);
      for (const session of recovery.sessionsToResume) {
        void dispatcher.resumeOrphanedSession(session.taskId, session.agentId, session.sessionId);
      }
    }

    if (config.polling.enabled) {
      logger.info("daemon", `[${ws.id}] Running initial task poll...`);
      await dispatcher.pollAndDispatch();
    }

    health.flush();
    logger.info("daemon", `[${ws.id}] Ready. watching=${config.polling.enabled}, concurrency=${config.concurrency.maxParallelAgents}`);
  }

  writePidFile();
  logger.info("daemon", `Daemon started (PID: ${process.pid}) — ${workspaceInstances.length} workspace(s) active`);

  // ─── Graceful Shutdown ──────────────────────────────────────────────────
  let shuttingDown = false;

  async function shutdown(signal: string): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info("daemon", `Received ${signal} — shutting down gracefully...`);

    for (const { workspaceId, dispatcher: _d, scheduler, health } of workspaceInstances) {
      scheduler.stop();

      const activeSessions = health.getActiveSessions();
      if (activeSessions.length > 0) {
        logger.info("daemon", `[${workspaceId}] Killing ${activeSessions.length} active session(s)...`);
        for (const session of activeSessions) {
          if (session.pid > 0) await runner.killSession(session.pid);
          health.endSession(session.id, null, "Daemon shutdown", false);
        }
      }

      health.writeStoppedStatus();
    }

    removePidFile();
    logger.info("daemon", "Daemon stopped.");
    process.exit(0);
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  setInterval(() => {
    for (const { health } of workspaceInstances) {
      health.cleanStaleSessions();
      health.updateUptime();
      health.flush();
    }
  }, 60_000);
}

// ─── CLI Entry Point ─────────────────────────────────────────────────────────

const command = process.argv[2] || "start";

switch (command) {
  case "start":
    handleStart().catch(err => {
      logger.error("daemon", `Fatal error: ${err instanceof Error ? err.message : String(err)}`);
      removePidFile();
      process.exit(1);
    });
    break;

  case "stop":
    handleStop();
    break;

  case "status":
    handleStatus();
    break;

  default:
    console.log("Usage: npx tsx scripts/daemon/index.ts [start|stop|status]");
    console.log("");
    console.log("Commands:");
    console.log("  start   Start the daemon (default)");
    console.log("  stop    Stop a running daemon");
    console.log("  status  Show daemon status");
    process.exit(1);
}
