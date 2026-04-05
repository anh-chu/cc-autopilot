import { mkdir, copyFile, writeFile, access } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const WORKSPACES_DIR = path.join(DATA_DIR, "workspaces");
const DEFAULT_DIR = path.join(WORKSPACES_DIR, "default");
const DEFAULT_FIELD_OPS_DIR = path.join(DEFAULT_DIR, "field-ops");

interface WorkspaceSettings {
  autonomyLevel: "approve-all" | "approve-high-risk" | "auto";
}

interface Workspace {
  id: string;
  name: string;
  isDefault: boolean;
  color: string;
  settings: WorkspaceSettings;
  createdAt: string;
  updatedAt: string;
}

interface WorkspacesRegistry {
  workspaces: Workspace[];
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyIfExists(src: string, dest: string): Promise<string | null> {
  if (await fileExists(src)) {
    await copyFile(src, dest);
    return dest;
  }
  return null;
}

async function main(): Promise<void> {
  // 1. Check if already migrated
  const tasksDest = path.join(DEFAULT_DIR, "tasks.json");
  if (await fileExists(tasksDest)) {
    console.log("Already migrated. data/workspaces/default/tasks.json exists. Exiting.");
    process.exit(0);
  }

  console.log("Starting migration to workspace layout...\n");

  // 2. Create directory structure
  await mkdir(DEFAULT_FIELD_OPS_DIR, { recursive: true });
  console.log("Created: data/workspaces/default/");
  console.log("Created: data/workspaces/default/field-ops/\n");

  const copied: string[] = [];
  const skipped: string[] = [];

  // 3. Copy root-level data files
  const rootFiles: string[] = [
    "tasks.json",
    "tasks-archive.json",
    "goals.json",
    "projects.json",
    "brain-dump.json",
    "activity-log.json",
    "inbox.json",
    "decisions.json",
    "agents.json",
    "skills-library.json",
    "daemon-config.json",
    "active-runs.json",
    "respond-runs.json",
  ];

  for (const file of rootFiles) {
    const src = path.join(DATA_DIR, file);
    const dest = path.join(DEFAULT_DIR, file);
    const result = await copyIfExists(src, dest);
    if (result) {
      copied.push(`data/${file} -> data/workspaces/default/${file}`);
    } else {
      skipped.push(`data/${file} (not found, skipped)`);
    }
  }

  // 4. Copy field-ops files
  const fieldOpsFiles: string[] = [
    "missions.json",
    "tasks.json",
    "services.json",
    "activity-log.json",
    "approval-config.json",
    "safety-limits.json",
    "templates.json",
    "service-catalog.json",
    ".credentials.json",
  ];

  for (const file of fieldOpsFiles) {
    const src = path.join(DATA_DIR, "field-ops", file);
    const dest = path.join(DEFAULT_FIELD_OPS_DIR, file);
    const result = await copyIfExists(src, dest);
    if (result) {
      copied.push(`data/field-ops/${file} -> data/workspaces/default/field-ops/${file}`);
    } else {
      skipped.push(`data/field-ops/${file} (not found, skipped)`);
    }
  }

  // 5. Create initiatives.json
  const initiativesPath = path.join(DEFAULT_DIR, "initiatives.json");
  await writeFile(initiativesPath, JSON.stringify({ initiatives: [] }, null, 2) + "\n");
  copied.push("(new) data/workspaces/default/initiatives.json");

  // 6. Create actions.json
  const actionsPath = path.join(DEFAULT_DIR, "actions.json");
  await writeFile(actionsPath, JSON.stringify({ actions: [] }, null, 2) + "\n");
  copied.push("(new) data/workspaces/default/actions.json");

  // 7. Create workspaces.json registry
  const now = new Date().toISOString();
  const registry: WorkspacesRegistry = {
    workspaces: [
      {
        id: "default",
        name: "Personal",
        isDefault: true,
        color: "#6366f1",
        settings: {
          autonomyLevel: "approve-all",
        },
        createdAt: now,
        updatedAt: now,
      },
    ],
  };

  const registryPath = path.join(DATA_DIR, "workspaces.json");
  await writeFile(registryPath, JSON.stringify(registry, null, 2) + "\n");
  copied.push("(new) data/workspaces.json");

  // 8. Print migration report
  console.log("Migration Report");
  console.log("================\n");

  if (copied.length > 0) {
    console.log("Copied / Created:");
    for (const entry of copied) {
      console.log(`  + ${entry}`);
    }
  }

  if (skipped.length > 0) {
    console.log("\nSkipped (file not found):");
    for (const entry of skipped) {
      console.log(`  - ${entry}`);
    }
  }

  console.log(`\nTotal copied/created: ${copied.length}`);
  console.log(`Total skipped: ${skipped.length}`);
  console.log("\nOriginal files in data/ are preserved as backup.");
  console.log("Migration complete.");
}

main().catch((err: unknown) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
