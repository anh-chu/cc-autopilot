import { spawn } from "node:child_process";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-guards";
import { readJSON } from "@/lib/json-io";
import { DATA_DIR } from "@/lib/paths";
import { resolveScriptEntrypoint } from "@/lib/script-entrypoints";
import { applyWorkspaceContext } from "@/lib/workspace-context";

interface ProjectEntry {
	id: string;
	name: string;
	description: string;
	status: string;
}

interface TaskEntry {
	id: string;
	projectId: string | null;
	kanban: string;
	deletedAt?: string | null;
}

// ─── POST: Decompose a project goal into tasks ────────────────────────────────

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const unauthorized = await requireSession();
	if (unauthorized) return unauthorized;

	return applyWorkspaceContext(async (workspaceId) => {
		const { id: projectId } = await params;

		let body: { autoRun?: boolean } = {};
		try {
			body = (await request.json()) as { autoRun?: boolean };
		} catch {
			// body is optional
		}

		// 1. Verify the project exists
		const projectsData = readJSON<{ projects: ProjectEntry[] }>(
			path.join(DATA_DIR, "projects.json"),
		);
		const project = projectsData?.projects.find((p) => p.id === projectId);
		if (!project) {
			return NextResponse.json({ error: "Project not found" }, { status: 404 });
		}

		// 2. Guard: don't plan if tasks already exist
		const tasksData = readJSON<{ tasks: TaskEntry[] }>(
			path.join(DATA_DIR, "tasks.json"),
		);
		const existingTasks = (tasksData?.tasks ?? []).filter(
			(t) => t.projectId === projectId && !t.deletedAt && t.kanban !== "done",
		);
		if (existingTasks.length > 0) {
			return NextResponse.json(
				{
					error:
						"Project already has tasks. Clear or complete them before re-planning.",
					existingCount: existingTasks.length,
				},
				{ status: 409 },
			);
		}

		// 3. Spawn run-plan-project as a detached process
		const entry = resolveScriptEntrypoint("run-plan-project");
		const args = [...entry.args, projectId];
		if (body.autoRun) args.push("--auto-run");

		try {
			const child = spawn(entry.runner, args, {
				cwd: process.cwd(),
				detached: true,
				stdio: "ignore",
				shell: false,
				env: {
					...process.env,
					MANDIO_WORKSPACE_ID: workspaceId,
				},
			});
			child.unref();

			return NextResponse.json({
				projectId,
				projectName: project.name,
				pid: child.pid ?? 0,
				autoRun: body.autoRun ?? false,
				message: `Planning started for "${project.name}"`,
			});
		} catch (err) {
			return NextResponse.json(
				{
					error: `Failed to spawn planner: ${err instanceof Error ? err.message : String(err)}`,
				},
				{ status: 500 },
			);
		}
	});
}
