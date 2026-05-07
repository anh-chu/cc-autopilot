import { spawn } from "node:child_process";
import { NextResponse } from "next/server";
import { getActiveRuns, getDaemonConfig, mutateDaemonConfig } from "@/lib/data";
import { readJSON } from "@/lib/json-io";
import { DAEMON_STATUS_FILE } from "@/lib/paths";
import { resolveScriptEntrypoint } from "@/lib/script-entrypoints";
import { daemonConfigUpdateSchema, validateBody } from "@/lib/validations";

const STATUS_FILE = DAEMON_STATUS_FILE;

// ─── GET: Read daemon status + config ────────────────────────────────────────

export async function GET() {
	const savedStatus = readJSON(STATUS_FILE) ?? {
		status: "stopped",
		pid: null,
		startedAt: null,
		activeSessions: [],
		history: [],
		stats: {
			tasksDispatched: 0,
			tasksCompleted: 0,
			tasksFailed: 0,
			uptimeMinutes: 0,
			totalCostUsd: 0,
			totalInputTokens: 0,
			totalOutputTokens: 0,
			totalCacheReadTokens: 0,
			totalCacheCreationTokens: 0,
		},
		lastPollAt: null,
		nextScheduledRuns: {},
	};

	const config = await getDaemonConfig();
	const activeRuns = await getActiveRuns();

	// Derive running sessions from active-runs.json
	const activeSessions = activeRuns.runs
		.filter((r) => r.status === "running")
		.map((r) => ({
			id: r.id,
			agentId: r.agentId,
			taskId: r.taskId ?? null,
			command: r.source ?? "task",
			pid: r.pid,
			startedAt: r.startedAt,
			status: r.status,
		}));

	const isRunning =
		(config as { polling?: { enabled?: boolean } }).polling?.enabled ?? false;
	const statusObj = savedStatus as Record<string, unknown>;

	// Override with live data
	statusObj.status = isRunning ? "running" : "stopped";
	statusObj.activeSessions = activeSessions;
	// Keep pid as null — no longer tracked at the daemon level
	statusObj.pid = null;

	return NextResponse.json({
		status: statusObj,
		config,
		isRunning,
	});
}

// ─── POST: Toggle polling on/off or run a command ad-hoc ─────────────────────

export async function POST(request: Request) {
	try {
		const body = await request.json();

		// ── Ad-hoc command run ──────────────────────────────────────────────────
		if (body.action === "run-command") {
			const command = body.command;
			if (!command || typeof command !== "string") {
				return NextResponse.json(
					{ error: "Missing or invalid 'command' field" },
					{ status: 400 },
				);
			}

			const cwd = process.cwd();
			const runTaskEntry = resolveScriptEntrypoint("run-task");
			const args = [...runTaskEntry.args, command, "--source", "manual"];

			try {
				const child = spawn(runTaskEntry.runner, args, {
					cwd,
					detached: true,
					stdio: "ignore",
					shell: false,
				});
				child.unref();
				return NextResponse.json({
					message: "Command started",
					pid: child.pid ?? null,
				});
			} catch (spawnErr) {
				return NextResponse.json(
					{
						error: `Failed to spawn command: ${
							spawnErr instanceof Error ? spawnErr.message : String(spawnErr)
						}`,
					},
					{ status: 500 },
				);
			}
		}

		// ── Toggle polling ──────────────────────────────────────────────────────
		if (body.action !== "toggle-polling") {
			return NextResponse.json(
				{ error: "Invalid action. Use 'toggle-polling' or 'run-command'" },
				{ status: 400 },
			);
		}

		const newConfig = await mutateDaemonConfig(async (cfg) => {
			const enabled = !(cfg as { polling?: { enabled?: boolean } }).polling
				?.enabled;
			(cfg as Record<string, unknown>).polling = {
				...((cfg as Record<string, unknown>).polling as Record<
					string,
					unknown
				>),
				enabled,
			};
			return cfg;
		});

		return NextResponse.json({ config: newConfig });
	} catch (err) {
		return NextResponse.json(
			{
				error: `Invalid request: ${err instanceof Error ? err.message : String(err)}`,
			},
			{ status: 400 },
		);
	}
}

// ─── PUT: Update daemon config ───────────────────────────────────────────────

export async function PUT(request: Request) {
	// Validate request body against Zod schema
	const validation = await validateBody(request, daemonConfigUpdateSchema);
	if (!validation.success) return validation.error;
	const updates = validation.data;

	// Atomic read-modify-write with mutex
	const newConfig = await mutateDaemonConfig(async (currentConfig) => {
		// Section-level merge: replace entire sections, not individual fields
		if (updates.polling) currentConfig.polling = updates.polling;
		if (updates.concurrency) currentConfig.concurrency = updates.concurrency;
		if (updates.schedule) currentConfig.schedule = updates.schedule;
		if (updates.execution) currentConfig.execution = updates.execution;
		return { ...currentConfig };
	});

	return NextResponse.json({ message: "Config updated", config: newConfig });
}
