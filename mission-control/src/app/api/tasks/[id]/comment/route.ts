import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { parseAgentMentions, generateId } from "@/lib/utils";

const DATA_DIR = path.resolve(process.cwd(), "data");

function readJSON<T>(file: string): T | null {
  try {
    if (!existsSync(file)) return null;
    return JSON.parse(readFileSync(file, "utf-8")) as T;
  } catch {
    return null;
  }
}

interface TaskEntry {
  id: string;
  title: string;
  assignedTo: string | null;
  kanban: string;
  comments?: Array<{
    id: string;
    author: string;
    content: string;
    createdAt: string;
  }>;
  [key: string]: unknown;
}

interface AgentEntry {
  id: string;
  status: string;
}

// ─── POST: Add a comment to a task, with @-mention agent spawning ───────────

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params;

  // Parse request body
  let body: { content: string; author?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const content = body.content?.trim();
  if (!content) {
    return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
  }
  if (content.length > 5000) {
    return NextResponse.json({ error: "Comment too long (max 5000 chars)" }, { status: 400 });
  }

  const author = body.author ?? "me";

  // 1. Read and validate task exists
  const tasksPath = path.join(DATA_DIR, "tasks.json");
  const tasksData = readJSON<{ tasks: TaskEntry[] }>(tasksPath);
  if (!tasksData) {
    return NextResponse.json({ error: "Could not read tasks" }, { status: 500 });
  }

  const task = tasksData.tasks.find((t) => t.id === taskId);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // 2. Create the comment
  const comment = {
    id: generateId("cmt"),
    author,
    content,
    createdAt: new Date().toISOString(),
  };

  // Append to task.comments
  if (!Array.isArray(task.comments)) {
    task.comments = [];
  }
  if (task.comments.length >= 100) {
    return NextResponse.json({ error: "Max 100 comments per task" }, { status: 400 });
  }
  task.comments.push(comment);
  task.updatedAt = new Date().toISOString();

  // Write back
  try {
    writeFileSync(tasksPath, JSON.stringify(tasksData, null, 2), "utf-8");
  } catch {
    return NextResponse.json({ error: "Failed to write task" }, { status: 500 });
  }

  // 3. Parse @mentions and validate agents
  const mentionedIds = parseAgentMentions(content);
  const agentsData = readJSON<{ agents: AgentEntry[] }>(path.join(DATA_DIR, "agents.json"));
  const validAgents = agentsData?.agents ?? [];
  const validMentions = mentionedIds.filter((id) =>
    validAgents.some((a) => a.id === id && a.status === "active")
  );

  // 4. Spawn agent comment handler for each mentioned agent
  const spawned: Array<{ agentId: string; pid: number }> = [];

  if (validMentions.length > 0) {
    const cwd = process.cwd();
    const scriptPath = path.resolve(cwd, "scripts", "daemon", "run-task-comment.ts");

    for (const agentId of validMentions) {
      try {
        const args = [
          "--import", "tsx",
          scriptPath,
          taskId,
          "--agent", agentId,
          "--comment", content,
          "--comment-author", author,
        ];

        const child = spawn(process.execPath, args, {
          cwd,
          detached: true,
          stdio: "ignore",
          shell: false,
        });
        child.unref();
        spawned.push({ agentId, pid: child.pid ?? 0 });
      } catch {
        // Non-fatal — continue with other agents
      }
    }
  }

  // 5. Log activity event
  try {
    const activityPath = path.join(DATA_DIR, "activity-log.json");
    const activityRaw = existsSync(activityPath)
      ? readFileSync(activityPath, "utf-8")
      : '{"events":[]}';
    const activityData = JSON.parse(activityRaw) as { events: Array<Record<string, unknown>> };

    activityData.events.push({
      id: generateId("evt"),
      type: "message_sent",
      actor: author,
      taskId,
      summary: validMentions.length > 0
        ? `Comment on "${task.title}" mentioning @${validMentions.join(", @")}`
        : `Comment on "${task.title}"`,
      details: content.slice(0, 300),
      timestamp: new Date().toISOString(),
    });

    writeFileSync(activityPath, JSON.stringify(activityData, null, 2), "utf-8");
  } catch {
    // Non-fatal
  }

  return NextResponse.json({
    comment,
    mentionedAgents: validMentions,
    spawned,
  });
}

// ─── DELETE: Remove a comment from a task ───────────────────────────────────

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params;

  const url = new URL(request.url);
  const commentId = url.searchParams.get("commentId");
  if (!commentId) {
    return NextResponse.json({ error: "commentId query param is required" }, { status: 400 });
  }

  const tasksPath = path.join(DATA_DIR, "tasks.json");
  const tasksData = readJSON<{ tasks: TaskEntry[] }>(tasksPath);
  if (!tasksData) {
    return NextResponse.json({ error: "Could not read tasks" }, { status: 500 });
  }

  const task = tasksData.tasks.find((t) => t.id === taskId);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (!Array.isArray(task.comments)) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  const idx = task.comments.findIndex((c) => c.id === commentId);
  if (idx === -1) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  task.comments.splice(idx, 1);
  task.updatedAt = new Date().toISOString();

  try {
    writeFileSync(tasksPath, JSON.stringify(tasksData, null, 2), "utf-8");
  } catch {
    return NextResponse.json({ error: "Failed to write task" }, { status: 500 });
  }

  return NextResponse.json({ deleted: commentId });
}
