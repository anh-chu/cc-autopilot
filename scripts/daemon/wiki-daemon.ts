#!/usr/bin/env node

/**
 * wiki-daemon.ts
 * Long-running process that keeps the SDK warm and processes wiki generation
 * jobs from a watched jobs directory.
 *
 * Job files: {wikiDir}/.jobs/{runId}.json
 * PID file:  {wikiDir}/.wiki-daemon.pid
 */

import {
	appendFileSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { watch } from "node:fs/promises";
import path from "node:path";
import {
	query,
	type SDKMessage,
	startup,
	type WarmQuery,
} from "@anthropic-ai/claude-agent-sdk";
import {
	DOC_MAINTAINER_AGENT_ID,
	DOC_MAINTAINER_AGENT_INSTRUCTIONS,
	getWorkspaceDataDir,
} from "../../src/lib/data";
import { getWikiDir, getWorkspaceDir } from "../../src/lib/paths";
import { logger } from "./logger";
import { AgentRunner } from "./runner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WikiJobFile {
	runId: string;
	workspaceId: string;
	agentId: string;
	model: string;
	sessionId: string | null;
	message: string | null;
}

interface WikiAgentConfig {
	id: string;
	name?: string;
	instructions?: string;
}

export interface WikiRunRecord {
	id: string;
	workspaceId: string;
	status: "running" | "completed" | "failed";
	agentId: string;
	model?: string;
	pluginStatus?: "installed" | "already-installed" | "missing";
	pluginVersion?: string | null;
	pluginUpdated?: boolean;
	bootstrapStatus?: "bootstrapped" | "already-initialized";
	lockFile?: string | null;
	coverageReport?: string | null;
	streamFile?: string;
	startedAt: string;
	completedAt: string | null;
	exitCode: number | null;
	error: string | null;
	pid: number;
	sessionId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readAgentConfig(
	workspaceId: string,
	agentId: string,
): WikiAgentConfig | null {
	try {
		const agentsPath = path.join(
			getWorkspaceDataDir(workspaceId),
			"agents.json",
		);
		const raw = readFileSync(agentsPath, "utf-8");
		const data = JSON.parse(raw) as { agents?: WikiAgentConfig[] };
		if (!Array.isArray(data.agents)) return null;
		return data.agents.find((a) => a.id === agentId) ?? null;
	} catch {
		return null;
	}
}

function buildPrompt(message?: string | null): string {
	return message?.trim() || "Run wiki maintenance.";
}

function normalizeSdkMessage(msg: SDKMessage): unknown[] {
	return [msg];
}

function writeRun(
	runsDir: string,
	runFile: string,
	record: WikiRunRecord,
): void {
	try {
		mkdirSync(runsDir, { recursive: true });
		writeFileSync(runFile, JSON.stringify(record, null, 2), "utf-8");
	} catch (err) {
		logger.error(
			"wiki-daemon",
			`Failed to write run record: ${err instanceof Error ? err.message : String(err)}`,
		);
	}
}

function appendStreamEvent(streamFile: string, event: unknown): void {
	appendFileSync(streamFile, `${JSON.stringify(event)}\n`, "utf-8");
}

// ─── Core run logic ───────────────────────────────────────────────────────────

function buildSdkOptions(opts: {
	pluginPath: string;
	agentInstruction: string;
	workspaceDir: string;
	wikiDir: string;
	model: string;
	sessionId: string | null;
}) {
	const {
		pluginPath,
		agentInstruction,
		workspaceDir,
		wikiDir,
		model,
		sessionId: resumeSessionId,
	} = opts;
	return {
		cwd: workspaceDir,
		settingSources: ["project", "user"] as ("project" | "user")[],
		plugins: [{ type: "local" as const, path: pluginPath }],
		includePartialMessages: true,
		...(model ? { model } : {}),
		systemPrompt: {
			type: "preset" as const,
			preset: "claude_code" as const,
			append: agentInstruction,
		},
		maxTurns: 30,
		permissionMode: "bypassPermissions" as const,
		allowDangerouslySkipPermissions: true,
		persistSession: true,
		...(resumeSessionId ? { resume: resumeSessionId } : {}),
		env: {
			...process.env,
			WIKI_PATH: wikiDir,
			WIKI_LOCK_PATH: path.join(wikiDir, ".wiki-lock"),
			WIKI_COVERAGE_PATH: path.join(wikiDir, ".coverage.json"),
		},
	};
}

function consumeStream(
	stream: AsyncIterable<SDKMessage>,
	streamFile: string,
): Promise<{ exitCode: number; sessionId: string | null }> {
	return (async () => {
		let exitCode = 1;
		let sessionId: string | null = null;
		for await (const msg of stream) {
			for (const evt of normalizeSdkMessage(msg))
				appendStreamEvent(streamFile, evt);
			if (
				!sessionId &&
				"session_id" in msg &&
				typeof msg.session_id === "string"
			) {
				sessionId = msg.session_id;
			}
			if (msg.type === "result") {
				exitCode = msg.subtype === "success" && !msg.is_error ? 0 : 1;
			}
		}
		return { exitCode, sessionId };
	})();
}

/** Cold path: used for resume sessions or when warm handle unavailable */
async function runWithSdk(opts: {
	prompt: string;
	pluginPath: string;
	agentInstruction: string;
	workspaceDir: string;
	wikiDir: string;
	streamFile: string;
	model: string;
	sessionId: string | null;
}): Promise<{ exitCode: number; sessionId: string | null }> {
	const sdkOpts = buildSdkOptions(opts);
	const q = query({ prompt: opts.prompt, options: sdkOpts });
	return consumeStream(q, opts.streamFile);
}

// ─── Warm SDK handle ──────────────────────────────────────────────────────────

let warmHandle: WarmQuery | null = null;
let warmOpts: ReturnType<typeof buildSdkOptions> | null = null;

async function preheatSdk(
	opts: Parameters<typeof buildSdkOptions>[0],
): Promise<void> {
	try {
		const sdkOpts = buildSdkOptions(opts);
		warmHandle = await startup({ options: sdkOpts });
		warmOpts = sdkOpts;
		logger.info("wiki-daemon", "SDK pre-warmed and ready");
	} catch (err) {
		logger.warn(
			"wiki-daemon",
			`Failed to pre-warm SDK: ${err instanceof Error ? err.message : String(err)}`,
		);
		warmHandle = null;
		warmOpts = null;
	}
}

async function runWithCliFallback(opts: {
	prompt: string;
	wikiDir: string;
	streamFile: string;
}): Promise<number> {
	const { prompt, wikiDir, streamFile } = opts;
	const runner = new AgentRunner(wikiDir);
	const result = await runner.spawnAgent({
		prompt,
		maxTurns: 30,
		timeoutMinutes: 15,
		skipPermissions: true,
		cwd: wikiDir,
		streamFile,
		env: {
			WIKI_PATH: wikiDir,
			WIKI_LOCK_PATH: path.join(wikiDir, ".wiki-lock"),
			WIKI_COVERAGE_PATH: path.join(wikiDir, ".coverage.json"),
		},
	});
	return result.exitCode ?? 1;
}

async function processJob(jobFilePath: string): Promise<void> {
	let job: WikiJobFile | null = null;
	// Retry once after short delay in case of incomplete write
	for (let attempt = 0; attempt < 2; attempt++) {
		try {
			job = JSON.parse(readFileSync(jobFilePath, "utf-8")) as WikiJobFile;
			break;
		} catch (err) {
			if (attempt === 0) {
				await new Promise((r) => setTimeout(r, 100));
				continue;
			}
			logger.error(
				"wiki-daemon",
				`Failed to read job file ${jobFilePath}: ${err instanceof Error ? err.message : String(err)}`,
			);
			return;
		}
	}
	if (!job) return;

	const { runId, workspaceId, agentId, model, sessionId, message } = job;

	logger.info(
		"wiki-daemon",
		`Processing job ${runId} for workspace ${workspaceId}`,
	);

	const workspaceDir = getWorkspaceDir(workspaceId);
	const wikiDir = getWikiDir(workspaceId);
	const runsDir = path.join(wikiDir, ".runs");
	const runFile = path.join(runsDir, `${runId}.json`);
	const streamFile = path.join(runsDir, `${runId}.stream.jsonl`);

	const selectedAgent = readAgentConfig(workspaceId, agentId);
	const resolvedAgentId = selectedAgent?.id ?? DOC_MAINTAINER_AGENT_ID;
	const agentInstruction =
		selectedAgent?.instructions?.trim() || DOC_MAINTAINER_AGENT_INSTRUCTIONS;

	let pluginPath: string;
	try {
		pluginPath = readFileSync(
			path.join(wikiDir, ".plugin-path"),
			"utf-8",
		).trim();
	} catch (err) {
		logger.error(
			"wiki-daemon",
			`Failed to read plugin path for workspace ${workspaceId}: ${err instanceof Error ? err.message : String(err)}`,
		);
		// Write failed run record
		const failRecord: WikiRunRecord = {
			id: runId,
			workspaceId,
			status: "failed",
			agentId: resolvedAgentId,
			model: model || undefined,
			startedAt: new Date().toISOString(),
			completedAt: new Date().toISOString(),
			exitCode: 1,
			error: `Plugin path unavailable: ${err instanceof Error ? err.message : String(err)}`,
			pid: process.pid,
		};
		writeRun(runsDir, runFile, failRecord);
		deleteJobFile(jobFilePath);
		return;
	}

	// Run record + stream file are pre-created by the generate route.
	// Read existing or create if missing (fallback for direct job writes).
	let record: WikiRunRecord;
	if (existsSync(runFile)) {
		record = JSON.parse(readFileSync(runFile, "utf-8")) as WikiRunRecord;
		record.pid = process.pid;
		writeRun(runsDir, runFile, record);
	} else {
		record = {
			id: runId,
			workspaceId,
			status: "running",
			agentId: resolvedAgentId,
			model: model || undefined,
			startedAt: new Date().toISOString(),
			completedAt: null,
			exitCode: null,
			error: null,
			pid: process.pid,
			streamFile: `.runs/${runId}.stream.jsonl`,
		};
		mkdirSync(runsDir, { recursive: true });
		writeFileSync(streamFile, "", "utf-8");
		writeRun(runsDir, runFile, record);
	}

	const prompt = sessionId && message ? message : buildPrompt(message);
	let exitCode = 1;
	let finalSessionId: string | null = null;

	const sdkBuildOpts = {
		pluginPath,
		agentInstruction,
		workspaceDir,
		wikiDir,
		model: model || "",
		sessionId,
	};

	try {
		// Use warm handle for fresh runs (no resume, default model)
		const canUseWarm = warmHandle && !sessionId;
		let result: { exitCode: number; sessionId: string | null };

		if (canUseWarm) {
			logger.info("wiki-daemon", `Using warm SDK handle for ${runId}`);
			const q = warmHandle!.query(prompt);
			warmHandle = null; // consumed — will re-preheat after job
			result = await consumeStream(q, streamFile);
		} else {
			logger.info(
				"wiki-daemon",
				`Using cold SDK path for ${runId} (resume=${!!sessionId})`,
			);
			result = await runWithSdk({ prompt, ...sdkBuildOpts, streamFile });
		}

		exitCode = result.exitCode;
		finalSessionId = result.sessionId;
	} catch (err) {
		appendStreamEvent(streamFile, {
			type: "system",
			subtype: "sdk_fallback",
			message: err instanceof Error ? err.message : String(err),
		});
		logger.warn(
			"wiki-daemon",
			`SDK run failed for ${runId}, falling back to CLI: ${err instanceof Error ? err.message : String(err)}`,
		);
		exitCode = await runWithCliFallback({ prompt, wikiDir, streamFile });
	}

	// Pre-warm SDK for next job
	void preheatSdk(sdkBuildOpts);

	record.status = exitCode === 0 ? "completed" : "failed";
	record.exitCode = exitCode;
	record.error = exitCode !== 0 ? "Wiki generation failed" : null;
	record.completedAt = new Date().toISOString();
	record.sessionId = finalSessionId ?? undefined;
	writeRun(runsDir, runFile, record);

	logger.info(
		"wiki-daemon",
		`Job ${runId} finished with exit code ${exitCode}`,
	);

	deleteJobFile(jobFilePath);
}

function deleteJobFile(filePath: string): void {
	try {
		rmSync(filePath);
	} catch {
		// best-effort
	}
}

// ─── Daemon main ──────────────────────────────────────────────────────────────

async function main(): Promise<void> {
	// Determine wiki dir from env (set by parent process or env)
	const workspaceId = process.env.CMC_WORKSPACE_ID ?? "default";
	const wikiDir = getWikiDir(workspaceId);
	const jobsDir = path.join(wikiDir, ".jobs");
	const pidFile = path.join(wikiDir, ".wiki-daemon.pid");

	// Write PID
	try {
		mkdirSync(wikiDir, { recursive: true });
		mkdirSync(jobsDir, { recursive: true });
		writeFileSync(pidFile, String(process.pid), "utf-8");
	} catch (err) {
		logger.error(
			"wiki-daemon",
			`Failed to write PID file: ${err instanceof Error ? err.message : String(err)}`,
		);
	}

	logger.info(
		"wiki-daemon",
		`Started. PID=${process.pid}, workspace=${workspaceId}, jobsDir=${jobsDir}`,
	);

	// Pre-warm SDK so first job is instant
	const workspaceDir = getWorkspaceDir(workspaceId);
	let pluginPath: string | null = null;
	try {
		pluginPath = readFileSync(
			path.join(wikiDir, ".plugin-path"),
			"utf-8",
		).trim();
	} catch {
		logger.warn("wiki-daemon", "No .plugin-path found, skipping preheat");
	}
	if (pluginPath) {
		void preheatSdk({
			pluginPath,
			agentInstruction: DOC_MAINTAINER_AGENT_INSTRUCTIONS,
			workspaceDir,
			wikiDir,
			model: "",
			sessionId: null,
		});
	}

	// Job queue: process one at a time
	const queue: string[] = [];
	let processing = false;

	async function drainQueue(): Promise<void> {
		if (processing) return;
		while (queue.length > 0) {
			processing = true;
			const jobPath = queue.shift()!;
			try {
				await processJob(jobPath);
			} catch (err) {
				logger.error(
					"wiki-daemon",
					`Unhandled error in job ${jobPath}: ${err instanceof Error ? err.message : String(err)}`,
				);
			}
			processing = false;
		}
	}

	// Scan for any jobs that existed before daemon started
	try {
		const existing = readdirSync(jobsDir).filter((f) => f.endsWith(".json"));
		for (const f of existing) {
			queue.push(path.join(jobsDir, f));
		}
	} catch {
		// jobsDir may not exist yet
	}

	void drainQueue();

	// Watch for new job files
	let watcher: AsyncIterable<{ eventType: string; filename: string | null }>;
	try {
		watcher = watch(jobsDir, { persistent: true }) as AsyncIterable<{
			eventType: string;
			filename: string | null;
		}>;
	} catch (err) {
		logger.error(
			"wiki-daemon",
			`Failed to watch jobs dir: ${err instanceof Error ? err.message : String(err)}`,
		);
		process.exit(1);
	}

	// Graceful shutdown
	let shuttingDown = false;
	function shutdown(signal: string): void {
		if (shuttingDown) return;
		shuttingDown = true;
		logger.info("wiki-daemon", `Received ${signal}, shutting down`);
		try {
			rmSync(pidFile);
		} catch {
			// best-effort
		}
		process.exit(0);
	}

	process.on("SIGTERM", () => shutdown("SIGTERM"));
	process.on("SIGINT", () => shutdown("SIGINT"));

	for await (const event of watcher) {
		if (shuttingDown) break;
		if (event.eventType !== "rename" || !event.filename?.endsWith(".json"))
			continue;

		const jobPath = path.join(jobsDir, event.filename);
		if (!existsSync(jobPath)) continue;
		if (queue.includes(jobPath)) continue;

		queue.push(jobPath);
		void drainQueue();
	}
}

main().catch((err) => {
	logger.error(
		"wiki-daemon",
		`Fatal: ${err instanceof Error ? err.message : String(err)}`,
	);
	process.exit(1);
});
