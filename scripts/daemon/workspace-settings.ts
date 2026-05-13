/**
 * workspace-settings.ts — Sync workspace settings reader for daemon scripts.
 *
 * Daemon scripts are sync-heavy (readFileSync, writeFileSync). This helper
 * reads WorkspaceSettings synchronously so runners can inspect git.* flags
 * without await.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { DATA_DIR } from "../../src/lib/paths";
import type { WorkspaceSettings } from "../../src/lib/types";

export function readWorkspaceSettingsSync(
	workspaceId: string,
): WorkspaceSettings | null {
	try {
		const raw = readFileSync(path.join(DATA_DIR, "workspaces.json"), "utf-8");
		const data = JSON.parse(raw) as {
			workspaces: Array<{ id: string; settings?: WorkspaceSettings }>;
		};
		const ws = data.workspaces.find((w) => w.id === workspaceId);
		return ws?.settings ?? null;
	} catch {
		return null;
	}
}
