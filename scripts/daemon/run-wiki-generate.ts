#!/usr/bin/env tsx

/**
 * run-wiki-generate.ts
 * Background script: run selected agent for wiki generation in workspace wiki dir.
 *
 * Usage:
 *   node --import tsx run-wiki-generate.ts \
 *     --run-id <id> \
 *     --workspace-id <wsid> \
 *     [--agent-id doc-maintainer]
 */

import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import {
	DOC_MAINTAINER_AGENT_ID,
	DOC_MAINTAINER_AGENT_INSTRUCTIONS,
	getWorkspaceDataDir,
} from "../../src/lib/data";
import { getWikiDir, getWorkspaceDir } from "../../src/lib/paths";
import { logger } from "./logger";
import { AgentRunner } from "./runner";

function getArg(name: string): string | null {
	const idx = process.argv.indexOf(`--${name}`);
	return idx !== -1 ? (process.argv[idx + 1] ?? null) : null;
}

const runId = getArg("run-id") ?? `wiki_${Date.now()}`;
const workspaceId =
	getArg("workspace-id") ?? process.env.CMC_WORKSPACE_ID ?? "default";
const resumeSessionId = getArg("session-id") ?? null;
const userMessage = getArg("message") ?? null;
const selectedAgentId = getArg("agent-id") ?? DOC_MAINTAINER_AGENT_ID;
const selectedModel = getArg("model") ?? "";

const workspaceDir = getWorkspaceDir(workspaceId);
const wikiDir = getWikiDir(workspaceId);
const runsDir = path.join(wikiDir, ".runs");
const runFile = path.join(runsDir, `${runId}.json`);
const streamFile = path.join(runsDir, `${runId}.stream.jsonl`);

interface WikiAgentConfig {
	id: string;
	name?: string;
	instructions?: string;
}

function readAgentConfig(
	workspace: string,
	agentId: string,
): WikiAgentConfig | null {
	try {
		const agentsPath = path.join(getWorkspaceDataDir(workspace), "agents.json");
		const raw = readFileSync(agentsPath, "utf-8");
		const data = JSON.parse(raw) as { agents?: WikiAgentConfig[] };
		if (!Array.isArray(data.agents)) return null;
		return data.agents.find((a) => a.id === agentId) ?? null;
	} catch {
		return null;
	}
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
	/** v2.5.0: lock file path written by plugin after bootstrap/reconcile */
	lockFile?: string | null;
	/** v2.5.0: coverage report path written by plugin after lint */
	coverageReport?: string | null;
	streamFile?: string;
	startedAt: string;
	completedAt: string | null;
	exitCode: number | null;
	error: string | null;
	pid: number;
	/** Session ID for resuming this run */
	sessionId?: string;
}

function writeRun(record: WikiRunRecord): void {
	try {
		mkdirSync(runsDir, { recursive: true });
		writeFileSync(runFile, JSON.stringify(record, null, 2), "utf-8");
	} catch (err) {
		logger.error(
			"run-wiki-generate",
			`Failed to write run record: ${err instanceof Error ? err.message : String(err)}`,
		);
	}
}

function appendStreamEvent(event: unknown): void {
	appendFileSync(streamFile, `${JSON.stringify(event)}\n`, "utf-8");
}

function buildPrompt(message?: string | null): string {
	return message?.trim() || "Run wiki maintenance.";
}

function normalizeSdkMessage(msg: SDKMessage): unknown[] {
	// Only emit the raw SDK message — don't synthesize assistant entries
	// from stream_event deltas. The SDK already emits consolidated
	// assistant messages (with includePartialMessages: true) which contain
	// the final text/tool_use blocks. Synthesizing from deltas caused
	// duplicate rendering (incremental chunks + final message).
	return [msg];
}

async function runWithSdk(
	prompt: string,
	pluginPath: string,
	agentInstruction: string,
): Promise<{ exitCode: number; sessionId: string | null }> {
	let exitCode = 1;
	let sessionId: string | null = null;

	for await (const msg of query({
		prompt,
		options: {
			cwd: workspaceDir,
			settingSources: ["project", "user"],
			plugins: [{ type: "local", path: pluginPath }],
			includePartialMessages: true,
			...(selectedModel ? { model: selectedModel } : {}),
			systemPrompt: {
				type: "preset" as const,
				preset: "claude_code" as const,
				append: agentInstruction,
			},
			maxTurns: 30,
			permissionMode: "bypassPermissions",
			allowDangerouslySkipPermissions: true,
			persistSession: true,
			...(resumeSessionId ? { resume: resumeSessionId } : {}),
			env: {
				...process.env,
				WIKI_PATH: wikiDir,
				WIKI_LOCK_PATH: path.join(wikiDir, ".wiki-lock"),
				WIKI_COVERAGE_PATH: path.join(wikiDir, ".coverage.json"),
			},
		},
	})) {
		for (const evt of normalizeSdkMessage(msg)) appendStreamEvent(evt);
		// Capture session_id from SDK messages
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
}

async function runWithCliFallback(prompt: string): Promise<number> {
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

async function main(): Promise<void> {
	logger.info(
		"run-wiki-generate",
		`Starting wiki generation run ${runId} for workspace ${workspaceId}`,
	);

	const selectedAgent = readAgentConfig(workspaceId, selectedAgentId);
	const agentId = selectedAgent?.id ?? DOC_MAINTAINER_AGENT_ID;
	const agentInstruction =
		selectedAgent?.instructions?.trim() || DOC_MAINTAINER_AGENT_INSTRUCTIONS;

	// Read cached plugin path (written by /api/wiki/init on page open)
	const pluginPath = readFileSync(
		path.join(wikiDir, ".plugin-path"),
		"utf-8",
	).trim();

	const record: WikiRunRecord = {
		id: runId,
		workspaceId,
		status: "running",
		agentId,
		model: selectedModel || undefined,
		startedAt: new Date().toISOString(),
		completedAt: null,
		exitCode: null,
		error: null,
		pid: process.pid,
	};
	record.streamFile = `.runs/${runId}.stream.jsonl`;
	mkdirSync(runsDir, { recursive: true });
	writeFileSync(streamFile, "", "utf-8");
	writeRun(record);

	const prompt =
		resumeSessionId && userMessage ? userMessage : buildPrompt(userMessage);
	let exitCode = 1;
	let sessionId: string | null = null;
	try {
		const result = await runWithSdk(prompt, pluginPath, agentInstruction);
		exitCode = result.exitCode;
		sessionId = result.sessionId;
	} catch (err) {
		appendStreamEvent({
			type: "system",
			subtype: "sdk_fallback",
			message: err instanceof Error ? err.message : String(err),
		});
		logger.warn(
			"run-wiki-generate",
			`SDK run failed, fallback CLI: ${err instanceof Error ? err.message : String(err)}`,
		);
		exitCode = await runWithCliFallback(prompt);
	}

	record.status = exitCode === 0 ? "completed" : "failed";
	record.exitCode = exitCode;
	record.error = exitCode !== 0 ? "Wiki generation failed" : null;
	record.completedAt = new Date().toISOString();
	record.sessionId = sessionId ?? undefined;
	writeRun(record);

	logger.info(
		"run-wiki-generate",
		`Run ${runId} finished with exit code ${exitCode}`,
	);
}

main().catch((err) => {
	logger.error(
		"run-wiki-generate",
		`Unhandled: ${err instanceof Error ? err.message : String(err)}`,
	);
	process.exit(1);
});
