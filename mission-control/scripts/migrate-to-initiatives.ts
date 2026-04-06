import { readFile, writeFile } from "fs/promises";
import path from "path";
import os from "os";

const DATA_DIR = process.env.CMC_DATA_DIR ?? path.join(os.homedir(), ".cmc");
const DEFAULT_DIR = path.join(DATA_DIR, "workspaces", "default");
const FIELD_OPS_DIR = path.join(DEFAULT_DIR, "field-ops");

const NOW = new Date().toISOString();

// ─── Minimal local types (avoid importing src/ which needs tsconfig paths) ────

interface Goal {
  id: string;
  title: string;
  type: "long-term" | "medium-term";
  parentGoalId: string | null;
  status: "not-started" | "in-progress" | "completed";
  tasks?: string[];
  createdAt: string;
  deletedAt?: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "completed" | "archived";
  color: string;
  teamMembers: string[];
  tags: string[];
  createdAt: string;
  deletedAt?: string | null;
}

interface FieldMission {
  id: string;
  title: string;
  description: string;
  status: "active" | "paused" | "completed";
  autonomyLevel: "approve-all" | "approve-high-risk" | "auto" | null;
  linkedProjectId?: string | null;
  tasks?: string[];
  createdAt: string;
  completedAt?: string | null;
}

interface FieldTask {
  id: string;
  missionId?: string | null;
  title: string;
  description: string;
  type: string;
  serviceId?: string | null;
  assignedTo?: string | null;
  status: string;
  approvalRequired: boolean;
  payload?: Record<string, unknown>;
  result?: Record<string, unknown>;
  attachments?: unknown[];
  linkedTaskId?: string | null;
  blockedBy?: string[];
  rejectionFeedback?: string | null;
  approvedBy?: string | null;
  rejectedBy?: string | null;
  scheduledFor?: string | null;
  createdAt: string;
  updatedAt?: string;
  executedAt?: string | null;
  completedAt?: string | null;
}

interface Task {
  id: string;
  projectId?: string | null;
  milestoneId?: string | null;
  initiativeId?: string | null;
  updatedAt: string;
  [key: string]: unknown;
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function mapGoalStatus(status: string): "active" | "paused" | "completed" | "archived" {
  if (status === "completed") return "completed";
  return "active";
}

async function main(): Promise<void> {
  // 1. Check if already migrated
  const initiativesPath = path.join(DEFAULT_DIR, "initiatives.json");
  const existingInitiatives = await readJson<{ initiatives: unknown[] }>(initiativesPath);
  if (existingInitiatives.initiatives.length > 0) {
    console.log("Already migrated — initiatives.json has entries. Exiting.");
    process.exit(0);
  }

  console.log("Starting migration to initiatives model...\n");

  const initiatives: Record<string, unknown>[] = [];
  const actions: Record<string, unknown>[] = [];

  // ── 2. Convert medium-term goals to initiatives ──────────────────────────────
  const goalsFile = await readJson<{ goals: Goal[] }>(path.join(DEFAULT_DIR, "goals.json"));
  const mediumTermGoals = goalsFile.goals.filter((g) => g.type === "medium-term");
  const updatedGoals = goalsFile.goals.map((g) => {
    if (g.type === "medium-term" && !g.deletedAt) {
      return { ...g, deletedAt: NOW };
    }
    return g;
  });

  for (const goal of mediumTermGoals) {
    initiatives.push({
      id: goal.id,
      title: goal.title,
      description: "",
      status: mapGoalStatus(goal.status),
      parentGoalId: goal.parentGoalId,
      color: "#6366f1",
      teamMembers: [],
      autonomyLevel: null,
      taskIds: goal.tasks ?? [],
      actionIds: [],
      tags: [],
      createdAt: goal.createdAt,
      updatedAt: NOW,
      completedAt: null,
      deletedAt: goal.deletedAt ?? null,
    });
  }
  console.log(`Converted ${mediumTermGoals.length} medium-term goal(s) to initiatives.`);

  // ── 3. Convert projects to initiatives ──────────────────────────────────────
  const projectsFile = await readJson<{ projects: Project[] }>(path.join(DEFAULT_DIR, "projects.json"));
  for (const project of projectsFile.projects) {
    initiatives.push({
      id: project.id,
      title: project.name,
      description: project.description,
      status: project.status,
      parentGoalId: null,
      color: project.color,
      teamMembers: project.teamMembers,
      autonomyLevel: null,
      taskIds: [],
      actionIds: [],
      tags: project.tags,
      createdAt: project.createdAt,
      updatedAt: NOW,
      completedAt: null,
      deletedAt: project.deletedAt ?? null,
    });
  }
  console.log(`Converted ${projectsFile.projects.length} project(s) to initiatives.`);

  // ── 4. Convert field-ops missions to initiatives ─────────────────────────────
  const missionsFile = await readJson<{ missions: FieldMission[] }>(
    path.join(FIELD_OPS_DIR, "missions.json")
  );
  for (const mission of missionsFile.missions) {
    initiatives.push({
      id: mission.id,
      title: mission.title,
      description: mission.description,
      status: mission.status,
      parentGoalId: null,
      color: "#f59e0b",
      teamMembers: [],
      autonomyLevel: mission.autonomyLevel ?? null,
      taskIds: mission.tasks ?? [],
      actionIds: [],
      tags: [],
      createdAt: mission.createdAt,
      updatedAt: NOW,
      completedAt: mission.completedAt ?? null,
      deletedAt: null,
    });
  }
  console.log(`Converted ${missionsFile.missions.length} mission(s) to initiatives.`);

  // ── 5. Convert field-ops tasks to actions ────────────────────────────────────
  const fieldTasksFile = await readJson<{ tasks: FieldTask[] }>(
    path.join(FIELD_OPS_DIR, "tasks.json")
  );

  // Build a map from initiative id -> actionIds for updating actionIds[]
  const initiativeActionIds: Record<string, string[]> = {};

  for (const task of fieldTasksFile.tasks) {
    const action: Record<string, unknown> = {
      id: task.id,
      initiativeId: task.missionId ?? null,
      title: task.title,
      description: task.description,
      type: task.type,
      serviceId: task.serviceId ?? null,
      assignedTo: task.assignedTo ?? null,
      status: task.status,
      approvalRequired: task.approvalRequired,
      autonomyOverride: null,
      payload: task.payload ?? {},
      result: task.result ?? {},
      attachments: task.attachments ?? [],
      linkedTaskId: task.linkedTaskId ?? null,
      blockedBy: task.blockedBy ?? [],
      rejectionFeedback: task.rejectionFeedback ?? null,
      approvedBy: task.approvedBy ?? null,
      rejectedBy: task.rejectedBy ?? null,
      scheduledFor: task.scheduledFor ?? null,
      createdAt: task.createdAt,
      updatedAt: NOW,
      executedAt: task.executedAt ?? null,
      completedAt: task.completedAt ?? null,
    };
    actions.push(action);

    if (task.missionId) {
      if (!initiativeActionIds[task.missionId]) {
        initiativeActionIds[task.missionId] = [];
      }
      initiativeActionIds[task.missionId].push(task.id);
    }
  }

  // Patch actionIds on the mission-derived initiatives
  for (const initiative of initiatives) {
    const id = initiative.id as string;
    if (initiativeActionIds[id]) {
      initiative.actionIds = initiativeActionIds[id];
    }
  }
  console.log(`Converted ${fieldTasksFile.tasks.length} field task(s) to actions.`);

  // ── 6. Update tasks.json — set initiativeId from milestoneId ?? projectId ───
  const tasksFile = await readJson<{ tasks: Task[] }>(path.join(DEFAULT_DIR, "tasks.json"));
  let tasksPatched = 0;
  const updatedTasks = tasksFile.tasks.map((task) => {
    const initiativeId = task.milestoneId ?? task.projectId ?? null;
    if (initiativeId && !task.initiativeId) {
      tasksPatched++;
      return { ...task, initiativeId, updatedAt: NOW };
    }
    return task;
  });
  console.log(`Patched initiativeId on ${tasksPatched} task(s).`);

  // ── 7. Write files ───────────────────────────────────────────────────────────
  await writeJson(initiativesPath, { initiatives });
  await writeJson(path.join(DEFAULT_DIR, "actions.json"), { actions });
  await writeJson(path.join(DEFAULT_DIR, "goals.json"), { goals: updatedGoals });
  await writeJson(path.join(DEFAULT_DIR, "tasks.json"), { tasks: updatedTasks });

  // ── 8. Migration report ──────────────────────────────────────────────────────
  console.log("\n─── Migration complete ──────────────────────────────────────");
  console.log(`  initiatives.json : ${initiatives.length} entries`);
  console.log(`  actions.json     : ${actions.length} entries`);
  console.log(`  goals.json       : medium-term goals soft-deleted`);
  console.log(`  tasks.json       : ${tasksPatched} task(s) gained initiativeId`);
  console.log("─────────────────────────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
