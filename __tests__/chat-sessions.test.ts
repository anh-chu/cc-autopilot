import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getSessionId, saveSessionId } from "../src/lib/chat-sessions";

const MANDIO_DATA_DIR = process.env.MANDIO_DATA_DIR
	? path.resolve(process.env.MANDIO_DATA_DIR)
	: path.join(os.homedir(), ".mandio");
const WORKSPACE_DIR = path.join(MANDIO_DATA_DIR, "workspaces", "default");
const SESSIONS_FILE = path.join(WORKSPACE_DIR, "chat-sessions.json");

describe("Chat Sessions", () => {
	beforeEach(async () => {
		// Ensure workspace directory exists
		await fs.mkdir(WORKSPACE_DIR, { recursive: true });

		// Clean up any existing sessions file
		try {
			await fs.unlink(SESSIONS_FILE);
		} catch {
			// File doesn't exist, that's fine
		}
	});

	afterEach(async () => {
		// Clean up sessions file after each test
		try {
			await fs.unlink(SESSIONS_FILE);
		} catch {
			// File doesn't exist, that's fine
		}
	});

	describe("round-trip save and get", () => {
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

			// Simulate fresh function calls by calling again
			const retrievedId1 = getSessionId("default");
			const retrievedId2 = getSessionId("default");

			expect(retrievedId1).toBe(sessionId);
			expect(retrievedId2).toBe(sessionId);
		});
	});

	describe("atomic write behavior", () => {
		it("does not corrupt under concurrent writes", async () => {
			const numConcurrentWrites = 10;
			const sessionIds = Array.from(
				{ length: numConcurrentWrites },
				(_, i) => `concurrent-session-${i}`,
			);

			// Execute concurrent saves
			const savePromises = sessionIds.map((sessionId, index) =>
				Promise.resolve().then(() => {
					// Add small random delay to increase chances of race conditions
					const delay = Math.random() * 5;
					return new Promise((resolve) => setTimeout(resolve, delay)).then(
						() => {
							saveSessionId("concurrent-test", sessionId, `context-${index}`);
						},
					);
				}),
			);

			await Promise.all(savePromises);

			// Verify file was created and is still valid JSON
			try {
				const fileContent = await fs.readFile(SESSIONS_FILE, "utf-8");
				let parsedData: Record<string, unknown> | undefined;
				expect(() => {
					parsedData = JSON.parse(fileContent);
				}).not.toThrow();

				// Verify all sessions were saved
				expect(parsedData).toBeDefined();
				expect(parsedData?.["concurrent-test"]).toBeDefined();
			} catch (error) {
				// If file doesn't exist, that's okay - at least no corruption occurred
				if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
					throw error;
				}
			}

			// Verify we can read back all sessions
			sessionIds.forEach((sessionId, index) => {
				const retrieved = getSessionId("concurrent-test", `context-${index}`);
				expect(retrieved).toBe(sessionId);
			});
		});

		it("maintains file integrity during rapid successive writes", async () => {
			const sessionId = "rapid-session";
			const numWrites = 20;

			// Perform rapid successive writes to the same session
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
			// Remove the workspace directory
			await fs.rm(WORKSPACE_DIR, { recursive: true, force: true });

			// Save should create the directory structure
			saveSessionId("default", "test-session");

			// Verify directory was created and file exists
			const stats = await fs.stat(SESSIONS_FILE);
			expect(stats.isFile()).toBe(true);

			// Verify we can read the session
			expect(getSessionId("default")).toBe("test-session");
		});

		it("handles empty file gracefully", async () => {
			// Create empty sessions file
			await fs.writeFile(SESSIONS_FILE, "", "utf-8");

			// Should not crash and return null
			expect(getSessionId("default")).toBeNull();

			// Should be able to save new session
			saveSessionId("default", "new-session");
			expect(getSessionId("default")).toBe("new-session");
		});

		it("handles malformed JSON gracefully", async () => {
			// Create malformed JSON file
			await fs.writeFile(SESSIONS_FILE, "{invalid json", "utf-8");

			// Should not crash and return null
			expect(getSessionId("default")).toBeNull();

			// Should be able to save new session (overwrites malformed file)
			saveSessionId("default", "recovery-session");
			expect(getSessionId("default")).toBe("recovery-session");

			// File should now be valid JSON
			const fileContent = await fs.readFile(SESSIONS_FILE, "utf-8");
			expect(() => JSON.parse(fileContent)).not.toThrow();
		});
	});
});
