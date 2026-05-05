import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	clearSession,
	createSession,
	deleteSession,
	getCurrentSession,
	getSessionId,
	listSessions,
	saveSessionId,
	setCurrentSession,
	updateSession,
} from "../src/lib/chat-sessions";

const MANDIO_DATA_DIR = process.env.MANDIO_DATA_DIR
	? path.resolve(process.env.MANDIO_DATA_DIR)
	: path.join(os.homedir(), ".mandio");
const WORKSPACE_DIR = path.join(MANDIO_DATA_DIR, "workspaces", "default");
const SESSIONS_FILE = path.join(WORKSPACE_DIR, "chat-sessions.json");

describe("Chat Sessions", () => {
	beforeEach(async () => {
		await fs.mkdir(WORKSPACE_DIR, { recursive: true });
		try {
			await fs.unlink(SESSIONS_FILE);
		} catch {
			// File doesn't exist, that's fine
		}
	});

	afterEach(async () => {
		try {
			await fs.unlink(SESSIONS_FILE);
		} catch {
			// ignore
		}
	});

	// ---- Legacy compat wrappers (getSessionId / saveSessionId) ----------------

	describe("round-trip save and get (compat wrappers)", () => {
		it("returns null when no session exists", () => {
			const sessionId = getSessionId("default");
			expect(sessionId).toBeNull();
		});

		it("returns saved session ID", () => {
			const testSessionId = "test-session-123";
			saveSessionId("default", testSessionId);

			const retrievedId = getSessionId("default");
			expect(retrievedId).toBe(testSessionId);
		});

		it("handles context-specific sessions", () => {
			const wikiSessionId = "wiki-session-456";
			const chatSessionId = "chat-session-789";

			saveSessionId("default", wikiSessionId, "wiki");
			saveSessionId("default", chatSessionId, "chat");

			expect(getSessionId("default", "wiki")).toBe(wikiSessionId);
			expect(getSessionId("default", "chat")).toBe(chatSessionId);
			expect(getSessionId("default")).toBeNull(); // No default context
		});

		it("handles multiple workspaces", () => {
			const workspace1Session = "ws1-session";
			const workspace2Session = "ws2-session";

			saveSessionId("workspace1", workspace1Session);
			saveSessionId("workspace2", workspace2Session);

			expect(getSessionId("workspace1")).toBe(workspace1Session);
			expect(getSessionId("workspace2")).toBe(workspace2Session);
		});

		it("overwrites existing session for same workspace/context", () => {
			const firstSession = "first-session";
			const secondSession = "second-session";

			saveSessionId("default", firstSession, "wiki");
			saveSessionId("default", secondSession, "wiki");

			expect(getSessionId("default", "wiki")).toBe(secondSession);
		});

		it("persists sessions across function calls", () => {
			const sessionId = "persistent-session";
			saveSessionId("default", sessionId);

			const retrievedId1 = getSessionId("default");
			const retrievedId2 = getSessionId("default");

			expect(retrievedId1).toBe(sessionId);
			expect(retrievedId2).toBe(sessionId);
		});
	});

	// ---- New multi-session API ------------------------------------------------

	describe("createSession", () => {
		it("creates a session with title 'New chat' and null sessionId", () => {
			const entry = createSession("default");
			expect(entry.id).toBeTypeOf("string");
			expect(entry.sessionId).toBeNull();
			expect(entry.title).toBe("New chat");
			expect(entry.createdAt).toBeTypeOf("string");
			expect(entry.updatedAt).toBeTypeOf("string");
		});

		it("marks the new session as current", () => {
			const entry = createSession("default");
			const current = getCurrentSession("default");
			expect(current?.id).toBe(entry.id);
		});

		it("creates multiple independent sessions", () => {
			const a = createSession("default");
			const b = createSession("default");
			const sessions = listSessions("default");
			expect(sessions).toHaveLength(2);
			expect(sessions.some((s) => s.id === a.id)).toBe(true);
			expect(sessions.some((s) => s.id === b.id)).toBe(true);
			// b is current (last created)
			expect(getCurrentSession("default")?.id).toBe(b.id);
		});
	});

	describe("listSessions", () => {
		it("returns empty array when no sessions exist", () => {
			expect(listSessions("default")).toEqual([]);
		});

		it("returns sessions ordered most-recent-updated first", () => {
			const a = createSession("default");
			updateSession("default", undefined, a.id, { title: "A" });
			const b = createSession("default");
			updateSession("default", undefined, b.id, { title: "B" });

			const sessions = listSessions("default");
			expect(sessions[0]?.id).toBe(b.id);
			expect(sessions[1]?.id).toBe(a.id);
		});
	});

	describe("setCurrentSession", () => {
		it("activates an existing session", () => {
			const a = createSession("default");
			const b = createSession("default");
			// b is current; switch back to a
			const activated = setCurrentSession("default", undefined, a.id);
			expect(activated?.id).toBe(a.id);
			expect(getCurrentSession("default")?.id).toBe(a.id);
			void b;
		});

		it("returns null for unknown id", () => {
			expect(setCurrentSession("default", undefined, "no-such-id")).toBeNull();
		});
	});

	describe("updateSession", () => {
		it("patches title", () => {
			const entry = createSession("default");
			const updated = updateSession("default", undefined, entry.id, {
				title: "My chat",
			});
			expect(updated?.title).toBe("My chat");
			expect(getCurrentSession("default")?.title).toBe("My chat");
		});

		it("patches sessionId", () => {
			const entry = createSession("default");
			updateSession("default", undefined, entry.id, {
				sessionId: "cc-session-abc",
			});
			expect(getSessionId("default")).toBe("cc-session-abc");
		});

		it("returns null for unknown id", () => {
			expect(
				updateSession("default", undefined, "bad-id", { title: "X" }),
			).toBeNull();
		});
	});

	describe("deleteSession", () => {
		it("removes the session from the list", () => {
			const entry = createSession("default");
			deleteSession("default", undefined, entry.id);
			expect(listSessions("default")).toHaveLength(0);
		});

		it("sets currentId to most-recent remaining after deleting current", () => {
			const a = createSession("default");
			const b = createSession("default"); // current
			const newCurrent = deleteSession("default", undefined, b.id);
			expect(newCurrent).toBe(a.id);
			expect(getCurrentSession("default")?.id).toBe(a.id);
		});

		it("sets currentId null when last session deleted", () => {
			const a = createSession("default");
			const newCurrent = deleteSession("default", undefined, a.id);
			expect(newCurrent).toBeNull();
			expect(getCurrentSession("default")).toBeNull();
		});

		it("ignores deleting the non-current session", () => {
			const a = createSession("default");
			const b = createSession("default"); // current
			deleteSession("default", undefined, a.id);
			expect(getCurrentSession("default")?.id).toBe(b.id);
			expect(listSessions("default")).toHaveLength(1);
		});
	});

	// ---- Legacy shape migration -----------------------------------------------

	describe("legacy shape migration", () => {
		it("migrates old { sessionId, updatedAt } shape on first read", async () => {
			const legacyData = {
				"default::default": {
					sessionId: "legacy-cc-session",
					updatedAt: "2024-01-01T00:00:00.000Z",
				},
			};
			await fs.writeFile(SESSIONS_FILE, JSON.stringify(legacyData), "utf-8");

			// First read should migrate
			const sessions = listSessions("default");
			expect(sessions).toHaveLength(1);
			expect(sessions[0]?.sessionId).toBe("legacy-cc-session");
			expect(sessions[0]?.title).toBe("Imported session");

			const current = getCurrentSession("default");
			expect(current?.sessionId).toBe("legacy-cc-session");

			// getSessionId compat wrapper should still work
			expect(getSessionId("default")).toBe("legacy-cc-session");
		});

		it("writes migrated data back so subsequent reads use new shape", async () => {
			const legacyData = {
				"default::default": {
					sessionId: "legacy-session-2",
					updatedAt: "2024-06-01T00:00:00.000Z",
				},
			};
			await fs.writeFile(SESSIONS_FILE, JSON.stringify(legacyData), "utf-8");

			listSessions("default"); // triggers migration

			const raw = JSON.parse(
				await fs.readFile(SESSIONS_FILE, "utf-8"),
			) as Record<string, { currentId?: string; sessions?: unknown[] }>;
			const bucket = raw["default::default"];
			expect(bucket?.sessions).toBeDefined();
			expect(Array.isArray(bucket?.sessions)).toBe(true);
		});
	});

	// ---- clearSession compat --------------------------------------------------

	describe("clearSession", () => {
		it("removes the current session", () => {
			createSession("default");
			clearSession("default");
			expect(getCurrentSession("default")).toBeNull();
			expect(listSessions("default")).toHaveLength(0);
		});
	});

	// ---- Atomic write behavior -----------------------------------------------

	describe("atomic write behavior", () => {
		it("does not corrupt under concurrent writes", async () => {
			const numConcurrentWrites = 10;
			const sessionIds = Array.from(
				{ length: numConcurrentWrites },
				(_, i) => `concurrent-session-${i}`,
			);

			const savePromises = sessionIds.map((sid, index) =>
				Promise.resolve().then(() => {
					const delay = Math.random() * 5;
					return new Promise((resolve) => setTimeout(resolve, delay)).then(
						() => {
							saveSessionId("concurrent-test", sid, `context-${index}`);
						},
					);
				}),
			);

			await Promise.all(savePromises);

			// Verify we can read back all sessions
			sessionIds.forEach((sid, index) => {
				const retrieved = getSessionId("concurrent-test", `context-${index}`);
				expect(retrieved).toBe(sid);
			});
		});

		it("maintains file integrity during rapid successive writes", async () => {
			const sessionId = "rapid-session";
			const numWrites = 20;

			for (let i = 0; i < numWrites; i++) {
				saveSessionId("default", `${sessionId}-${i}`);
			}

			// File should still be valid JSON
			const fileContent = await fs.readFile(SESSIONS_FILE, "utf-8");
			expect(() => {
				JSON.parse(fileContent);
			}).not.toThrow();

			// Should have the latest session
			const retrieved = getSessionId("default");
			expect(retrieved).toBe(`${sessionId}-${numWrites - 1}`);
		});

		it("creates intermediate directories if they don't exist", async () => {
			await fs.rm(WORKSPACE_DIR, { recursive: true, force: true });

			saveSessionId("default", "test-session");

			const stats = await fs.stat(SESSIONS_FILE);
			expect(stats.isFile()).toBe(true);

			expect(getSessionId("default")).toBe("test-session");
		});

		it("handles empty file gracefully", async () => {
			await fs.writeFile(SESSIONS_FILE, "", "utf-8");

			expect(getSessionId("default")).toBeNull();

			saveSessionId("default", "new-session");
			expect(getSessionId("default")).toBe("new-session");
		});

		it("handles malformed JSON gracefully", async () => {
			await fs.writeFile(SESSIONS_FILE, "{invalid json", "utf-8");

			expect(getSessionId("default")).toBeNull();

			saveSessionId("default", "recovery-session");
			expect(getSessionId("default")).toBe("recovery-session");

			const fileContent = await fs.readFile(SESSIONS_FILE, "utf-8");
			expect(() => JSON.parse(fileContent)).not.toThrow();
		});
	});
});
