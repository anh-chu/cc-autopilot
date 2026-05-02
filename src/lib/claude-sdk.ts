import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

let cachedPath: string | null | undefined;

/**
 * Locate the user's installed `claude` CLI binary.
 *
 * The Claude Agent SDK bundles its own native CLI as an optional platform
 * package. Next.js standalone output drops those optional dependencies, so we
 * tell the SDK to use whatever `claude` the user already has on PATH (mandio
 * preflights this at startup, so it's guaranteed to exist).
 *
 * Returns null when no binary is found, in which case the SDK falls back to
 * its own native CLI lookup and may surface a clearer install error.
 */
export function resolveClaudeExecutable(): string | null {
	if (cachedPath !== undefined) return cachedPath;

	if (process.env.CLAUDE_CODE_EXECUTABLE) {
		cachedPath = existsSync(process.env.CLAUDE_CODE_EXECUTABLE)
			? process.env.CLAUDE_CODE_EXECUTABLE
			: null;
		return cachedPath;
	}

	try {
		const out = execFileSync("which", ["claude"], { encoding: "utf-8" }).trim();
		cachedPath = out.length > 0 ? out : null;
	} catch {
		cachedPath = null;
	}
	return cachedPath;
}
