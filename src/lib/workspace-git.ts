/**
 * workspace-git.ts — Best-effort git utilities for CCMC workspace directories.
 *
 * All functions are best-effort: they log a warning and return a failure value
 * instead of throwing. Git is never a hard dependency for workspace operations.
 *
 * Shell calls use execFileSync with stdio: "pipe" and a 10-second timeout so
 * output never floods the daemon log and slow operations do not block spawns.
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// ─── .gitignore template ─────────────────────────────────────────────────────

export const WORKSPACE_GITIGNORE = `# Binary uploads
uploads/

# Agent runtime artifacts
agent-streams/
*.log

# Local caches
.next/
node_modules/
tmp/
`;

const WORKSPACE_GITIGNORE_ENTRIES = [
	"uploads/",
	"agent-streams/",
	"*.log",
	".next/",
	"node_modules/",
	"tmp/",
];

const WORKSPACE_GITIGNORE_MANAGED_BLOCK = `# CCMC workspace runtime artifacts
${WORKSPACE_GITIGNORE_ENTRIES.join("\n")}
`;

// ─── Low-level helpers ───────────────────────────────────────────────────────

/** Returns true if dir already contains a .git directory. */
export function isGitRepo(dir: string): boolean {
	return existsSync(path.join(dir, ".git"));
}

/**
 * Initialise dir as a git repo if not already one.
 * Also sets a local user identity so commits never fail on a fresh machine.
 * Returns true on success (or if repo already existed), false on failure.
 */
export function gitInit(dir: string): boolean {
	if (!isGitRepo(dir)) {
		try {
			execFileSync("git", ["init", "--quiet", dir], {
				stdio: "pipe",
				timeout: 10_000,
			});
		} catch (err) {
			console.warn("[workspace-git] git init failed:", dir, err);
			return false;
		}
	}

	// Set local identity so commits work on machines without a global git config.
	// Only write if not already configured (skip errors — non-fatal).
	for (const [key, value] of [
		["user.email", "ccmc-workspace@local"],
		["user.name", "CCMC Workspace"],
	]) {
		try {
			const current = execFileSync(
				"git",
				["-C", dir, "config", "--local", key],
				{
					stdio: "pipe",
					timeout: 10_000,
				},
			)
				.toString()
				.trim();
			if (!current) {
				execFileSync("git", ["-C", dir, "config", "--local", key, value], {
					stdio: "pipe",
					timeout: 10_000,
				});
			}
		} catch {
			// config get returns non-zero when key is missing — set it
			try {
				execFileSync("git", ["-C", dir, "config", "--local", key, value], {
					stdio: "pipe",
					timeout: 10_000,
				});
			} catch {
				// non-fatal
			}
		}
	}

	return true;
}

/**
 * Ensure workspace runtime artifacts are ignored.
 * Existing .gitignore content is preserved; missing managed entries are appended.
 */
export async function writeWorkspaceGitignore(dir: string): Promise<void> {
	const gitignorePath = path.join(dir, ".gitignore");
	try {
		if (!existsSync(gitignorePath)) {
			await writeFile(gitignorePath, WORKSPACE_GITIGNORE, "utf-8");
			return;
		}

		const existing = await readFile(gitignorePath, "utf-8");
		const missingEntries = WORKSPACE_GITIGNORE_ENTRIES.filter(
			(entry) => !existing.split(/\r?\n/).includes(entry),
		);
		if (missingEntries.length === 0) return;

		const separator = existing.endsWith("\n") ? "\n" : "\n\n";
		await writeFile(
			gitignorePath,
			`${existing}${separator}${WORKSPACE_GITIGNORE_MANAGED_BLOCK}`,
			"utf-8",
		);
	} catch (err) {
		console.warn("[workspace-git] Failed to write .gitignore:", dir, err);
	}
}

/** Returns true if the repo has at least one commit. */
export function hasAnyCommit(dir: string): boolean {
	try {
		execFileSync("git", ["-C", dir, "rev-parse", "--verify", "HEAD"], {
			stdio: "pipe",
			timeout: 10_000,
		});
		return true;
	} catch {
		return false;
	}
}

/** Returns the porcelain status string, or "" on failure / clean repo. */
export function gitStatusPorcelain(dir: string): string {
	try {
		return execFileSync("git", ["-C", dir, "status", "--porcelain"], {
			stdio: "pipe",
			timeout: 10_000,
		})
			.toString()
			.trim();
	} catch {
		return "";
	}
}

/** Returns true if the working tree has any uncommitted changes. */
export function isDirty(dir: string): boolean {
	return gitStatusPorcelain(dir).length > 0;
}

/**
 * Create the first commit in a repo.
 * Idempotent: no-op if the repo already has a HEAD commit.
 * Returns true on success.
 */
export function gitInitialCommit(
	dir: string,
	message = "Initialize workspace",
): boolean {
	if (hasAnyCommit(dir)) return true;
	try {
		execFileSync("git", ["-C", dir, "add", "-A"], {
			stdio: "pipe",
			timeout: 10_000,
		});
		execFileSync(
			"git",
			[
				"-C",
				dir,
				"commit",
				"--allow-empty",
				"--quiet",
				"--no-verify",
				"-m",
				message,
			],
			{ stdio: "pipe", timeout: 10_000 },
		);
		return true;
	} catch (err) {
		console.warn("[workspace-git] gitInitialCommit failed:", dir, err);
		return false;
	}
}

/**
 * Commit all dirty changes as a snapshot.
 * If the repo has no prior commit, creates an initial commit first.
 * No-op if the working tree is clean.
 * Returns true on success or when there was nothing to commit.
 */
export function gitSnapshot(dir: string, message: string): boolean {
	if (!isGitRepo(dir)) return false;

	if (!hasAnyCommit(dir)) {
		// Repo exists but has no commits — create baseline first then snapshot
		// the baseline will cover the current state already
		return gitInitialCommit(dir, message);
	}

	if (!isDirty(dir)) return true; // Nothing to do

	try {
		execFileSync("git", ["-C", dir, "add", "-A"], {
			stdio: "pipe",
			timeout: 10_000,
		});
		execFileSync(
			"git",
			["-C", dir, "commit", "--quiet", "--no-verify", "-m", message],
			{ stdio: "pipe", timeout: 10_000 },
		);
		return true;
	} catch (err) {
		console.warn("[workspace-git] gitSnapshot failed:", dir, err);
		return false;
	}
}

/**
 * Create and checkout a new branch.
 * Returns true on success.
 * Use sanitizeGitRef on the branch name before calling this.
 */
export function gitCreateBranch(dir: string, branch: string): boolean {
	// TODO(git-risk): wire branchPerAgentRun when UI surfaces dirty/branch state
	try {
		execFileSync("git", ["-C", dir, "checkout", "-b", branch], {
			stdio: "pipe",
			timeout: 10_000,
		});
		return true;
	} catch (err) {
		console.warn("[workspace-git] gitCreateBranch failed:", dir, branch, err);
		return false;
	}
}

/**
 * Auto-commit all changes with a generated message.
 * Returns true on success or when there was nothing to commit.
 */
export function gitAutoCommit(dir: string, message: string): boolean {
	// TODO(git-risk): wire autoCommit when UI surfaces dirty/branch state
	if (!isGitRepo(dir) || !isDirty(dir)) return true;
	try {
		execFileSync("git", ["-C", dir, "add", "-A"], {
			stdio: "pipe",
			timeout: 10_000,
		});
		execFileSync(
			"git",
			["-C", dir, "commit", "--quiet", "--no-verify", "-m", message],
			{ stdio: "pipe", timeout: 10_000 },
		);
		return true;
	} catch (err) {
		console.warn("[workspace-git] gitAutoCommit failed:", dir, err);
		return false;
	}
}

/**
 * Sanitize a string for use as a git ref (branch/tag name).
 * Replaces disallowed characters with hyphens, collapses repeats,
 * and strips leading/trailing hyphens, dots, or slashes.
 */
export function sanitizeGitRef(name: string): string {
	return name
		.replace(/[^A-Za-z0-9/_.-]/g, "-") // replace disallowed chars
		.replace(/-{2,}/g, "-") // collapse repeated hyphens
		.replace(/^[-./]+/, "") // strip leading -./
		.replace(/[-./]+$/, ""); // strip trailing -./
}
