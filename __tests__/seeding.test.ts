import { existsSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { ensureWorkspaceDir, getWorkspaceDataDir } from "@/lib/data";

// Use a throwaway workspace ID so we never touch the live "default" workspace.
const TEST_WS_ID = `test-seed-${Date.now()}`;
const DATA_DIR = process.env.MANDIO_DATA_DIR
	? path.resolve(process.env.MANDIO_DATA_DIR)
	: path.join(os.tmpdir(), "mandio-vitest");
const WS_DIR = path.join(DATA_DIR, "workspaces", TEST_WS_ID);

afterAll(async () => {
	// Clean up the test workspace
	if (existsSync(WS_DIR)) {
		await rm(WS_DIR, { recursive: true, force: true });
	}
});

describe("ensureWorkspaceDir", () => {
	it("creates the workspace directory structure", async () => {
		await ensureWorkspaceDir(TEST_WS_ID);
		expect(existsSync(WS_DIR)).toBe(true);
	});

	it("seeds all expected JSON files", async () => {
		const expectedFiles = [
			"tasks.json",
			"tasks-archive.json",
			"initiatives.json",
			"projects.json",
			"brain-dump.json",
			"activity-log.json",
			"inbox.json",
			"decisions.json",
			"agents.json",
			"active-runs.json",
			"daemon-config.json",
		];
		for (const file of expectedFiles) {
			const fp = path.join(WS_DIR, file);
			expect(existsSync(fp), `Missing: ${file}`).toBe(true);
			const raw = await readFile(fp, "utf-8");
			expect(() => JSON.parse(raw), `Invalid JSON: ${file}`).not.toThrow();
		}
	});

	it("seeds agents from artifacts (not empty)", async () => {
		const raw = await readFile(path.join(WS_DIR, "agents.json"), "utf-8");
		const data = JSON.parse(raw);
		expect(data.agents.length).toBeGreaterThan(0);
		// Should have the built-in agents
		const ids = data.agents.map((a: { id: string }) => a.id);
		expect(ids).toContain("me");
		expect(ids).toContain("developer");
		expect(ids).toContain("researcher");
	});

	it("seeds global skills from artifacts", async () => {
		// Skills are now stored as SKILL.md files in the global skills dir
		const { getGlobalSkillsDir } = await import("@/lib/paths");
		const globalSkillsDir = getGlobalSkillsDir();
		expect(existsSync(globalSkillsDir)).toBe(true);
	});

	it("seeds daemon-config from artifacts (not empty object)", async () => {
		const raw = await readFile(
			path.join(WS_DIR, "daemon-config.json"),
			"utf-8",
		);
		const data = JSON.parse(raw);
		expect(Object.keys(data).length).toBeGreaterThan(0);
		expect(data).toHaveProperty("polling");
		expect(data).toHaveProperty("execution");
	});

	it("seeds CLAUDE.md from artifacts", async () => {
		const fp = path.join(WS_DIR, "CLAUDE.md");
		expect(existsSync(fp)).toBe(true);
		const content = await readFile(fp, "utf-8");
		expect(content.length).toBeGreaterThan(100);
	});

	it("seeds .claude/commands from artifacts", async () => {
		const claudeDir = path.join(WS_DIR, ".claude");
		expect(existsSync(claudeDir)).toBe(true);
		expect(existsSync(path.join(claudeDir, "commands"))).toBe(true);
		// Commands are activated as mandio- prefixed symlinks
		expect(
			existsSync(path.join(claudeDir, "commands", "mandio-standup", "user.md")),
		).toBe(true);
		expect(
			existsSync(
				path.join(claudeDir, "commands", "mandio-daily-plan", "user.md"),
			),
		).toBe(true);
	});

	it("seeds .claude/skills from artifacts", async () => {
		const skillsDir = path.join(WS_DIR, ".claude", "skills");
		expect(existsSync(skillsDir)).toBe(true);
		expect(
			existsSync(path.join(skillsDir, "task-management", "SKILL.md")),
		).toBe(true);
	});

	it("does not overwrite existing files on re-run", async () => {
		// Write a known value to tasks.json
		const marker = JSON.stringify({ tasks: [{ id: "marker_task" }] });
		const fp = path.join(WS_DIR, "tasks.json");
		await writeFile(fp, marker, "utf-8");

		// Re-run seeding
		await ensureWorkspaceDir(TEST_WS_ID);

		// tasks.json should still have our marker, not be overwritten
		const raw = await readFile(fp, "utf-8");
		const data = JSON.parse(raw);
		expect(data.tasks[0].id).toBe("marker_task");
	});

	it("restores missing default agents without overwriting existing agents", async () => {
		const partialWsId = `${TEST_WS_ID}-partial-agents`;
		const partialWsDir = path.join(DATA_DIR, "workspaces", partialWsId);
		await rm(partialWsDir, { recursive: true, force: true });
		await ensureWorkspaceDir(partialWsId);

		const fp = path.join(partialWsDir, "agents.json");
		await writeFile(
			fp,
			JSON.stringify(
				{
					agents: [
						{
							id: "doc-maintainer",
							name: "Custom Doc Maintainer",
							icon: "BookOpen",
							description: "Custom description",
							instructions: "Custom instructions",
							skillIds: [],
							status: "active",
							createdAt: "2026-05-01T00:00:00.000Z",
							updatedAt: "2026-05-01T00:00:00.000Z",
						},
					],
				},
				null,
				2,
			),
			"utf-8",
		);

		await ensureWorkspaceDir(partialWsId);

		const raw = await readFile(fp, "utf-8");
		const data = JSON.parse(raw);
		const ids = data.agents.map((agent: { id: string }) => agent.id);
		expect(ids).toContain("me");
		expect(ids).toContain("developer");
		expect(ids).toContain("researcher");
		expect(
			data.agents.find((agent: { id: string }) => agent.id === "doc-maintainer")
				.name,
		).toBe("Custom Doc Maintainer");

		await rm(partialWsDir, { recursive: true, force: true });
	});

	it("getWorkspaceDataDir returns correct path", () => {
		const dir = getWorkspaceDataDir(TEST_WS_ID);
		expect(dir).toBe(WS_DIR);
	});
});
