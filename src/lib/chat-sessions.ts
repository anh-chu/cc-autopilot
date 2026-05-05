/**
 * Chat session management for Claude Code conversations.
 * Supports multiple named sessions per workspace/context.
 *
 * Schema (per workspace file):
 *   Record<key, SessionBucket>
 *   where key = `${workspaceId}::${context ?? "default"}`
 *
 * One-shot migration from legacy shape { sessionId, updatedAt } on first read.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import {
	atomicWriteJson,
	readJsonFile,
} from "../../scripts/daemon/runs-registry";
import { getWorkspaceDataDir } from "./data";

// ---- Public types ----------------------------------------------------------

export interface SessionEntry {
	id: string;
	sessionId: string | null;
	title: string;
	createdAt: string;
	updatedAt: string;
}

// ---- Internal types --------------------------------------------------------

interface SessionBucket {
	currentId: string | null;
	sessions: SessionEntry[];
}

/** Legacy shape — detected by presence of sessionId string without sessions array. */
interface LegacyEntry {
	sessionId: string;
	updatedAt: string;
}

type StoredValue = SessionBucket | LegacyEntry;
type SessionsData = Record<string, StoredValue>;

// ---- Helpers ---------------------------------------------------------------

function getSessionsFilePath(workspaceId: string): string {
	return path.join(getWorkspaceDataDir(workspaceId), "chat-sessions.json");
}

function getSessionKey(workspaceId: string, context?: string): string {
	return `${workspaceId}::${context ?? "default"}`;
}

function isLegacyEntry(v: StoredValue): v is LegacyEntry {
	return (
		"sessionId" in v &&
		typeof (v as LegacyEntry).sessionId === "string" &&
		!("sessions" in v)
	);
}

/**
 * Read the bucket for a workspace/context, migrating from legacy shape if needed.
 * Migration is written back atomically.
 */
function readBucket(workspaceId: string, context?: string): SessionBucket {
	const filePath = getSessionsFilePath(workspaceId);
	const data = readJsonFile<SessionsData>(filePath, {});
	const key = getSessionKey(workspaceId, context);
	const stored = data[key];

	if (!stored) return { currentId: null, sessions: [] };

	if (isLegacyEntry(stored)) {
		const entry: SessionEntry = {
			id: crypto.randomUUID(),
			sessionId: stored.sessionId,
			title: "Imported session",
			createdAt: stored.updatedAt,
			updatedAt: stored.updatedAt,
		};
		const bucket: SessionBucket = { currentId: entry.id, sessions: [entry] };
		// Persist the migration
		const dir = path.dirname(filePath);
		fs.mkdirSync(dir, { recursive: true });
		data[key] = bucket;
		atomicWriteJson(filePath, data);
		return bucket;
	}

	return stored;
}

function writeBucket(
	workspaceId: string,
	context: string | undefined,
	bucket: SessionBucket,
): void {
	const filePath = getSessionsFilePath(workspaceId);
	const dir = path.dirname(filePath);
	fs.mkdirSync(dir, { recursive: true });
	const data = readJsonFile<SessionsData>(filePath, {});
	const key = getSessionKey(workspaceId, context);
	data[key] = bucket;
	atomicWriteJson(filePath, data);
}

// ---- Public API ------------------------------------------------------------

/**
 * List all sessions for a workspace/context, ordered by updatedAt descending.
 */
export function listSessions(
	workspaceId: string,
	context?: string,
): SessionEntry[] {
	const bucket = readBucket(workspaceId, context);
	return [...bucket.sessions].sort(
		(a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
	);
}

/**
 * Return the currently active session, or null if none exists.
 */
export function getCurrentSession(
	workspaceId: string,
	context?: string,
): SessionEntry | null {
	const bucket = readBucket(workspaceId, context);
	if (!bucket.currentId) return null;
	return bucket.sessions.find((s) => s.id === bucket.currentId) ?? null;
}

/**
 * Create a new session, mark it current, and return it.
 */
export function createSession(
	workspaceId: string,
	context?: string,
): SessionEntry {
	const bucket = readBucket(workspaceId, context);
	const now = new Date().toISOString();
	const entry: SessionEntry = {
		id: crypto.randomUUID(),
		sessionId: null,
		title: "New chat",
		createdAt: now,
		updatedAt: now,
	};
	bucket.sessions.push(entry);
	bucket.currentId = entry.id;
	writeBucket(workspaceId, context, bucket);
	return entry;
}

/**
 * Activate an existing session by id. Returns the entry or null if not found.
 */
export function setCurrentSession(
	workspaceId: string,
	context: string | undefined,
	id: string,
): SessionEntry | null {
	const bucket = readBucket(workspaceId, context);
	const entry = bucket.sessions.find((s) => s.id === id);
	if (!entry) return null;
	bucket.currentId = id;
	writeBucket(workspaceId, context, bucket);
	return entry;
}

/**
 * Clear the current session id without deleting any sessions.
 * Used when the user starts a fresh chat that should not be persisted
 * until the first message is sent.
 */
export function clearCurrentSession(
	workspaceId: string,
	context: string | undefined,
): void {
	const bucket = readBucket(workspaceId, context);
	bucket.currentId = null;
	writeBucket(workspaceId, context, bucket);
}

/**
 * Patch title or sessionId on an existing entry. Returns updated entry or null.
 */
export function updateSession(
	workspaceId: string,
	context: string | undefined,
	id: string,
	patch: { sessionId?: string | null; title?: string },
): SessionEntry | null {
	const bucket = readBucket(workspaceId, context);
	const idx = bucket.sessions.findIndex((s) => s.id === id);
	if (idx === -1) return null;
	const updated: SessionEntry = {
		// biome-ignore lint/style/noNonNullAssertion: idx is valid
		...bucket.sessions[idx]!,
		...patch,
		updatedAt: new Date().toISOString(),
	};
	bucket.sessions[idx] = updated;
	writeBucket(workspaceId, context, bucket);
	return updated;
}

/**
 * Delete a session. If it was current, currentId becomes the most recently
 * updated remaining session, or null. Returns new currentId.
 */
export function deleteSession(
	workspaceId: string,
	context: string | undefined,
	id: string,
): string | null {
	const bucket = readBucket(workspaceId, context);
	bucket.sessions = bucket.sessions.filter((s) => s.id !== id);
	if (bucket.currentId === id) {
		const remaining = [...bucket.sessions].sort(
			(a, b) =>
				new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
		);
		bucket.currentId = remaining[0]?.id ?? null;
	}
	writeBucket(workspaceId, context, bucket);
	return bucket.currentId;
}

/**
 * Look up a single session by id within a workspace/context.
 */
export function getSession(
	workspaceId: string,
	context: string | undefined,
	id: string,
): SessionEntry | null {
	const bucket = readBucket(workspaceId, context);
	return bucket.sessions.find((s) => s.id === id) ?? null;
}

// ---- Compatibility wrappers ------------------------------------------------

/**
 * Retrieve the current session's Claude Code session ID.
 * @deprecated Use getCurrentSession().sessionId instead.
 */
export function getSessionId(
	workspaceId: string,
	context?: string,
): string | null {
	return getCurrentSession(workspaceId, context)?.sessionId ?? null;
}

/**
 * Save a Claude Code session ID to the current session.
 * Creates a new session if none exists.
 * @deprecated Use updateSession() instead.
 */
export function saveSessionId(
	workspaceId: string,
	sessionId: string,
	context?: string,
): void {
	let bucket = readBucket(workspaceId, context);
	if (!bucket.currentId || bucket.sessions.length === 0) {
		const entry = createSession(workspaceId, context);
		bucket = readBucket(workspaceId, context);
		updateSession(workspaceId, context, entry.id, { sessionId });
		return;
	}
	updateSession(workspaceId, context, bucket.currentId, { sessionId });
}

/**
 * Clear the current session for a workspace/context.
 * @deprecated Use deleteSession() instead.
 */
export function clearSession(workspaceId: string, context?: string): void {
	const current = getCurrentSession(workspaceId, context);
	if (current) deleteSession(workspaceId, context, current.id);
}
