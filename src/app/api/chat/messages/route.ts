/**
 * GET /api/chat/messages?id=<sessionEntryId>&context=<optional>
 *
 * Returns the historical UIMessage[] for a session by reading the
 * Claude Code on-disk JSONL log for that session's claudeSessionId.
 */

import { getSession } from "@/lib/chat-sessions";
import { readSessionMessages } from "@/lib/claude-session-log";
import { getWikiDir, getWorkspaceDir } from "@/lib/paths";
import { applyWorkspaceContext } from "@/lib/workspace-context";

function defaultCwdForContext(
	workspaceId: string,
	context: string | undefined,
): string {
	if (context?.startsWith("wiki:")) return getWikiDir(workspaceId);
	return getWorkspaceDir(workspaceId);
}

export async function GET(request: Request) {
	const workspaceId = await applyWorkspaceContext();
	const { searchParams } = new URL(request.url);
	const id = searchParams.get("id");
	const context = searchParams.get("context") || undefined;

	if (!id) {
		return Response.json({ error: "id required" }, { status: 400 });
	}

	const entry = getSession(workspaceId, context, id);
	if (!entry?.sessionId) {
		return Response.json({ messages: [] });
	}

	const cwd = defaultCwdForContext(workspaceId, context);
	const messages = readSessionMessages(cwd, entry.sessionId);

	return Response.json({ messages });
}
