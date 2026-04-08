/**
 * Node.js-only instrumentation logic.
 * Imported dynamically from instrumentation.ts to avoid Edge bundling.
 */
import { existsSync, mkdirSync, copyFileSync, cpSync, writeFileSync } from "fs";
import path from "path";
import os from "os";
import { createLogger } from "@/lib/logger";
import { scheduleLogCleanup, scheduleUploadsCleanup, scheduleDaemonWatchdog } from "@/lib/scheduled-jobs";

const DATA_DIR = process.env.CMC_DATA_DIR
  ? path.resolve(process.env.CMC_DATA_DIR)
  : path.join(os.homedir(), ".cmc");
const appLogger = createLogger("app");

// ─── Seed default workspace on fresh install ────────────────────────────────

const wsDir = path.join(DATA_DIR, "workspaces", "default");
const fieldOpsDir = path.join(wsDir, "field-ops");
const artifactsDir = path.join(process.cwd(), "artifacts", "workspaces", "default");

if (!existsSync(wsDir)) {
  appLogger.info("startup", "Initializing workspace", { workspaceId: "default" });
  mkdirSync(fieldOpsDir, { recursive: true });

  if (existsSync(artifactsDir)) {
    for (const file of ["agents.json", "skills-library.json", "daemon-config.json", "CLAUDE.md"]) {
      const src = path.join(artifactsDir, file);
      if (existsSync(src)) {
        copyFileSync(src, path.join(wsDir, file));
        appLogger.info("startup", "Seeded workspace artifact", { workspaceId: "default", file });
      }
    }
    const claudeSrc = path.join(artifactsDir, ".claude");
    if (existsSync(claudeSrc)) {
      cpSync(claudeSrc, path.join(wsDir, ".claude"), { recursive: true });
      appLogger.info("startup", "Seeded workspace directory", { workspaceId: "default", directory: ".claude" });
    }
    const foSrc = path.join(artifactsDir, "field-ops");
    if (existsSync(foSrc)) {
      cpSync(foSrc, fieldOpsDir, { recursive: true });
      appLogger.info("startup", "Seeded workspace directory", { workspaceId: "default", directory: "field-ops" });
    }
  }

  const emptySeeds: Record<string, unknown> = {
    "tasks.json": { tasks: [] },
    "tasks-archive.json": { tasks: [] },
    "goals.json": { goals: [] },
    "initiatives.json": { initiatives: [] },
    "actions.json": { actions: [] },
    "projects.json": { projects: [] },
    "brain-dump.json": { entries: [] },
    "activity-log.json": { events: [] },
    "inbox.json": { messages: [] },
    "decisions.json": { decisions: [] },
    "active-runs.json": { runs: [] },
  };
  for (const [file, content] of Object.entries(emptySeeds)) {
    const dest = path.join(wsDir, file);
    if (!existsSync(dest)) {
      writeFileSync(dest, JSON.stringify(content, null, 2), "utf-8");
      appLogger.info("startup", "Seeded workspace data file", { workspaceId: "default", file });
    }
  }

  const foEmptySeeds: Record<string, unknown> = {
    "missions.json": { missions: [] },
    "tasks.json": { tasks: [] },
    "services.json": { services: [] },
    "activity-log.json": { events: [] },
    "approval-config.json": { config: { mode: "approve-all", overrides: {} } },
    "safety-limits.json": {
      global: { enabled: true, dailyBudgetUsd: 100, weeklyBudgetUsd: 500, monthlyBudgetUsd: 2000, pauseOnBreach: true },
      services: {},
      spendLog: [],
    },
    "templates.json": { templates: [] },
  };
  for (const [file, content] of Object.entries(foEmptySeeds)) {
    const dest = path.join(fieldOpsDir, file);
    if (!existsSync(dest)) {
      writeFileSync(dest, JSON.stringify(content, null, 2), "utf-8");
      appLogger.info("startup", "Seeded field-ops data file", { workspaceId: "default", file });
    }
  }
}

// ─── Schedule uploads cleanup + daemon watchdog ─────────────────────────────

scheduleUploadsCleanup();
scheduleLogCleanup();
scheduleDaemonWatchdog();
