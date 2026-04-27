import { spawn } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	renameSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { DOC_MAINTAINER_AGENT_ID } from "@/lib/data";
import { getWikiDir } from "@/lib/paths";
import { applyWorkspaceContext } from "@/lib/workspace-context";

interface WikiJobFile {
	runId: string;
	workspaceId: string;
	agentId: string;
	model: string;
	sessionId: string | null;
	message: string | null;
}

// ─── Daemon helpers ───────────────────────────────────────────────────────────

function getDaemonPid(wikiDir: string): number | null {
	const pidFile = path.join(wikiDir, ".wiki-daemon.pid");
	if (!existsSync(pidFile)) return null;
	try {
		const pid = Number(readFileSync(pidFile, "utf-8").trim());
		return Number.isFinite(pid) && pid > 0 ? pid : null;
	} catch {
		return null;
	}
}

function isDaemonAlive(pid: number): boolean {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

function startDaemon(workspaceId: string): void {
	const cwd = process.cwd();
	const daemonScript = path.resolve(cwd, "dist", "daemon", "wiki-daemon.mjs");
	const child = spawn(process.execPath, [daemonScript], {
		cwd,
		detached: true,
		stdio: "ignore",
		shell: false,
		env: {
			...process.env,
			CMC_WORKSPACE_ID: workspaceId,
		},
	});
	child.unref();
}

function writeJobFile(wikiDir: string, job: WikiJobFile): void {
	const jobsDir = path.join(wikiDir, ".jobs");
	mkdirSync(jobsDir, { recursive: true });
	// Atomic write: tmp file then rename to avoid race with fs.watch
	const tmpPath = path.join(jobsDir, `${job.runId}.tmp`);
	const finalPath = path.join(jobsDir, `${job.runId}.json`);
	writeFileSync(tmpPath, JSON.stringify(job, null, 2), "utf-8");
	renameSync(tmpPath, finalPath);
}

// ─── POST: Trigger wiki generation ───────────────────────────────────────────

export async function POST(request: Request) {
	try {
		const workspaceId = await applyWorkspaceContext();

		let body: {
			agentId?: string;
			model?: string;
			sessionId?: string;
			message?: string;
		} = {};
		try {
			body = (await request.json()) as {
				agentId?: string;
				model?: string;
				sessionId?: string;
				message?: string;
			};
		} catch {
			// body is optional
		}

		const runId = `wiki_${Date.now()}`;
		const wikiDir = getWikiDir(workspaceId);
		const runsDir = path.join(wikiDir, ".runs");
		const startedAt = new Date().toISOString();

		// Pre-create run record + empty stream file so SSE can connect immediately
		mkdirSync(runsDir, { recursive: true });
		const runRecord = {
			id: runId,
			workspaceId,
			status: "running",
			agentId: body.agentId?.trim() || DOC_MAINTAINER_AGENT_ID,
			model: body.model?.trim() || undefined,
			startedAt,
			completedAt: null,
			exitCode: null,
			error: null,
			pid: process.pid,
			streamFile: `.runs/${runId}.stream.jsonl`,
		};
		writeFileSync(
			path.join(runsDir, `${runId}.json`),
			JSON.stringify(runRecord, null, 2),
			"utf-8",
		);
		writeFileSync(path.join(runsDir, `${runId}.stream.jsonl`), "", "utf-8");

		// Try daemon path first
		try {
			const daemonScript = path.resolve(
				process.cwd(),
				"dist",
				"daemon",
				"wiki-daemon.mjs",
			);

			if (!existsSync(daemonScript)) {
				throw new Error(`Daemon script not found: ${daemonScript}`);
			}

			// Ensure daemon is running
			const existingPid = getDaemonPid(wikiDir);
			if (!existingPid || !isDaemonAlive(existingPid)) {
				startDaemon(workspaceId);
			}

			const job: WikiJobFile = {
				runId,
				workspaceId,
				agentId: body.agentId?.trim() || DOC_MAINTAINER_AGENT_ID,
				model: body.model?.trim() || "",
				sessionId: body.sessionId?.trim() || null,
				message: body.message?.trim() || null,
			};

			writeJobFile(wikiDir, job);

			return NextResponse.json(
				{ runId, workspaceId, startedAt, via: "daemon" },
				{ status: 202 },
			);
		} catch (daemonErr) {
			// Fallback: spawn the per-run script
			const cwd = process.cwd();
			const scriptPath = path.resolve(
				cwd,
				"dist",
				"daemon",
				"run-wiki-generate.mjs",
			);

			const args: string[] = [
				scriptPath,
				"--run-id",
				runId,
				"--workspace-id",
				workspaceId,
			];

			if (body.agentId?.trim()) {
				args.push("--agent-id", body.agentId.trim());
			}
			if (body.model?.trim()) {
				args.push("--model", body.model.trim());
			}
			if (body.sessionId?.trim()) {
				args.push("--session-id", body.sessionId.trim());
			}
			if (body.message?.trim()) {
				args.push("--message", body.message.trim());
			}

			try {
				const child = spawn(process.execPath, args, {
					cwd,
					detached: true,
					stdio: "ignore",
					shell: false,
				});
				child.unref();

				return NextResponse.json(
					{ runId, workspaceId, startedAt, via: "fallback" },
					{ status: 202 },
				);
			} catch (spawnErr) {
				return NextResponse.json(
					{
						error: `Failed to spawn: ${spawnErr instanceof Error ? spawnErr.message : String(spawnErr)}`,
					},
					{ status: 500 },
				);
			}
		}
	} catch (err) {
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Internal server error" },
			{ status: 500 },
		);
	}
}
