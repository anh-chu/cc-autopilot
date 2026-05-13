import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	gitInit,
	gitInitialCommit,
	gitSnapshot,
	gitStatusPorcelain,
	hasAnyCommit,
	isDirty,
	isGitRepo,
	sanitizeGitRef,
	WORKSPACE_GITIGNORE,
	writeWorkspaceGitignore,
} from "@/lib/workspace-git";

// Each test gets a fresh tmpdir
let tmpDir: string;

beforeEach(() => {
	tmpDir = path.join(
		os.tmpdir(),
		`ws-git-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
	);
	mkdirSync(tmpDir, { recursive: true });
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("isGitRepo", () => {
	it("returns false for a plain directory", () => {
		expect(isGitRepo(tmpDir)).toBe(false);
	});

	it("returns true after gitInit", () => {
		gitInit(tmpDir);
		expect(isGitRepo(tmpDir)).toBe(true);
	});
});

describe("gitInit", () => {
	it("creates .git in an empty dir", () => {
		const result = gitInit(tmpDir);
		expect(result).toBe(true);
		expect(existsSync(path.join(tmpDir, ".git"))).toBe(true);
	});

	it("is idempotent — returns true on a repo that already exists", () => {
		gitInit(tmpDir);
		const result = gitInit(tmpDir);
		expect(result).toBe(true);
		expect(existsSync(path.join(tmpDir, ".git"))).toBe(true);
	});

	it("sets local git user identity", () => {
		gitInit(tmpDir);
		const email = execFileSync(
			"git",
			["-C", tmpDir, "config", "--local", "user.email"],
			{ stdio: "pipe" },
		)
			.toString()
			.trim();
		const name = execFileSync(
			"git",
			["-C", tmpDir, "config", "--local", "user.name"],
			{ stdio: "pipe" },
		)
			.toString()
			.trim();
		expect(email).toBe("ccmc-workspace@local");
		expect(name).toBe("CCMC Workspace");
	});
});

describe("writeWorkspaceGitignore", () => {
	it("writes .gitignore with expected content", async () => {
		await writeWorkspaceGitignore(tmpDir);
		const content = await readFile(path.join(tmpDir, ".gitignore"), "utf-8");
		expect(content).toContain("uploads/");
		expect(content).toContain("agent-streams/");
		expect(content).toContain("*.log");
	});

	it("preserves existing .gitignore content and appends managed entries", async () => {
		const custom = "# my rules\nsecrets/\n";
		await writeFile(path.join(tmpDir, ".gitignore"), custom, "utf-8");
		await writeWorkspaceGitignore(tmpDir);
		const content = await readFile(path.join(tmpDir, ".gitignore"), "utf-8");
		expect(content).toContain(custom);
		expect(content).toContain("uploads/");
		expect(content).toContain("agent-streams/");
	});

	it("does not duplicate managed entries", async () => {
		await writeWorkspaceGitignore(tmpDir);
		await writeWorkspaceGitignore(tmpDir);
		const content = await readFile(path.join(tmpDir, ".gitignore"), "utf-8");
		expect(content.match(/uploads\//g)).toHaveLength(1);
	});
});

describe("hasAnyCommit", () => {
	it("returns false after init with no commits", () => {
		gitInit(tmpDir);
		expect(hasAnyCommit(tmpDir)).toBe(false);
	});

	it("returns true after gitInitialCommit", () => {
		gitInit(tmpDir);
		gitInitialCommit(tmpDir);
		expect(hasAnyCommit(tmpDir)).toBe(true);
	});
});

describe("gitInitialCommit", () => {
	it("creates exactly one commit", () => {
		gitInit(tmpDir);
		gitInitialCommit(tmpDir);
		const log = execFileSync("git", ["-C", tmpDir, "log", "--oneline"], {
			stdio: "pipe",
		})
			.toString()
			.trim();
		expect(log.split("\n").length).toBe(1);
	});

	it("is idempotent — running twice produces only one commit", () => {
		gitInit(tmpDir);
		gitInitialCommit(tmpDir, "init");
		gitInitialCommit(tmpDir, "init again");
		const log = execFileSync("git", ["-C", tmpDir, "log", "--oneline"], {
			stdio: "pipe",
		})
			.toString()
			.trim();
		expect(log.split("\n").length).toBe(1);
	});
});

describe("gitStatusPorcelain / isDirty", () => {
	it("returns empty string on a clean committed repo", () => {
		gitInit(tmpDir);
		gitInitialCommit(tmpDir);
		expect(gitStatusPorcelain(tmpDir)).toBe("");
	});

	it("returns non-empty when an untracked file is present", async () => {
		gitInit(tmpDir);
		gitInitialCommit(tmpDir);
		await writeFile(path.join(tmpDir, "new-file.txt"), "hello", "utf-8");
		expect(gitStatusPorcelain(tmpDir).length).toBeGreaterThan(0);
	});

	it("isDirty is false on a clean repo", () => {
		gitInit(tmpDir);
		gitInitialCommit(tmpDir);
		expect(isDirty(tmpDir)).toBe(false);
	});

	it("isDirty is true when a new file is added", async () => {
		gitInit(tmpDir);
		gitInitialCommit(tmpDir);
		await writeFile(path.join(tmpDir, "dirty.txt"), "dirty", "utf-8");
		expect(isDirty(tmpDir)).toBe(true);
	});
});

describe("gitSnapshot", () => {
	it("no-ops on a clean committed repo", () => {
		gitInit(tmpDir);
		gitInitialCommit(tmpDir);
		const result = gitSnapshot(tmpDir, "snap");
		expect(result).toBe(true);
		const log = execFileSync("git", ["-C", tmpDir, "log", "--oneline"], {
			stdio: "pipe",
		})
			.toString()
			.trim();
		expect(log.split("\n").length).toBe(1); // still only the initial commit
	});

	it("creates a commit on a dirty repo", async () => {
		gitInit(tmpDir);
		gitInitialCommit(tmpDir);
		await writeFile(path.join(tmpDir, "change.txt"), "changed", "utf-8");
		const result = gitSnapshot(tmpDir, "Pre-run snapshot");
		expect(result).toBe(true);
		const log = execFileSync("git", ["-C", tmpDir, "log", "--oneline"], {
			stdio: "pipe",
		})
			.toString()
			.trim();
		expect(log.split("\n").length).toBe(2);
	});

	it("creates an initial commit on a repo with no prior commits", async () => {
		gitInit(tmpDir);
		await writeFile(path.join(tmpDir, "file.txt"), "content", "utf-8");
		const result = gitSnapshot(tmpDir, "first snapshot");
		expect(result).toBe(true);
		expect(hasAnyCommit(tmpDir)).toBe(true);
	});

	it("returns false on a non-repo directory", async () => {
		const nonRepo = path.join(tmpDir, "not-a-repo");
		mkdirSync(nonRepo, { recursive: true });
		expect(gitSnapshot(nonRepo, "snap")).toBe(false);
	});
});

describe("sanitizeGitRef", () => {
	it("strips spaces and replaces with hyphens", () => {
		expect(sanitizeGitRef("hello world")).toBe("hello-world");
	});

	it("strips leading dots and slashes", () => {
		expect(sanitizeGitRef("./foo")).toBe("foo");
		expect(sanitizeGitRef("..foo")).toBe("foo");
	});

	it("allows forward slashes inside", () => {
		expect(sanitizeGitRef("pre-run/abc123")).toBe("pre-run/abc123");
	});

	it("collapses repeated hyphens", () => {
		expect(sanitizeGitRef("a---b")).toBe("a-b");
	});

	it("handles run IDs with colons", () => {
		const result = sanitizeGitRef("pre-run/run_2026-05-13T18:30:00.000Z");
		expect(result).not.toContain(":");
	});
});

describe("WORKSPACE_GITIGNORE template", () => {
	it("contains expected entries", () => {
		expect(WORKSPACE_GITIGNORE).toContain("uploads/");
		expect(WORKSPACE_GITIGNORE).toContain("agent-streams/");
		expect(WORKSPACE_GITIGNORE).toContain("*.log");
		expect(WORKSPACE_GITIGNORE).toContain(".next/");
		expect(WORKSPACE_GITIGNORE).toContain("node_modules/");
		expect(WORKSPACE_GITIGNORE).toContain("tmp/");
	});
});
