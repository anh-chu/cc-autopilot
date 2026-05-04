/**
 * Chat session management for Claude Code conversations.
 * Persists session IDs per workspace/context for conversation continuity.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import {
	atomicWriteJson,
	readJsonFile,
} from "../../scripts/daemon/runs-registry";
import { getWorkspaceDataDir } from "./data";

interface SessionEntry {
	sessionId: string;
	updatedAt: string;
}

type SessionsData = Record<string, SessionEntry>;

function getSessionsFilePath(workspaceId: string): string {
	return path.join(getWorkspaceDataDir(workspaceId), "chat-sessions.json");
}

function getSessionKey(workspaceId: string, context?: string): string {
	return `${workspaceId}::${context ?? "default"}`;
}

/**
 * Retrieve the current session ID for a workspace/context.
 * @param workspaceId - The workspace identifier
 * @param context - The session context (defaults to 'default')
 * @returns The session ID if found, null otherwise
 */
export function getSessionId(
	workspaceId: string,
	context?: string,
): string | null {
	const filePath = getSessionsFilePath(workspaceId);
	const data = readJsonFile<SessionsData>(filePath, {});
	const key = getSessionKey(workspaceId, context);

	return data[key]?.sessionId ?? null;
}

/**
 * Save a session ID for a workspace/context.
 * @param workspaceId - The workspace identifier
 * @param sessionId - The Claude Code session ID to save
 * @param context - The session context (defaults to 'default')
 */
export function saveSessionId(
	workspaceId: string,
	sessionId: string,
	context?: string,
): void {
	const filePath = getSessionsFilePath(workspaceId);

	// Ensure directory exists
	const dir = path.dirname(filePath);
	fs.mkdirSync(dir, { recursive: true });

	const data = readJsonFile<SessionsData>(filePath, {});
	const key = getSessionKey(workspaceId, context);

	data[key] = {
		sessionId,
		updatedAt: new Date().toISOString(),
	};

	atomicWriteJson(filePath, data);
}

/**
 * Clear the session for a workspace/context.
 * @param workspaceId - The workspace identifier
 * @param context - The session context (defaults to 'default')
 */
export function clearSession(workspaceId: string, context?: string): void {
	const filePath = getSessionsFilePath(workspaceId);

	// Ensure directory exists
	const dir = path.dirname(filePath);
	fs.mkdirSync(dir, { recursive: true });

	const data = readJsonFile<SessionsData>(filePath, {});
	const key = getSessionKey(workspaceId, context);

	delete data[key];

	atomicWriteJson(filePath, data);
}
