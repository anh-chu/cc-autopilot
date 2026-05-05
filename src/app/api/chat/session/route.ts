// Session CRUD for multi-session chat history.
// POST { action: "new", context? }       → create + activate session
// POST { action: "activate", id, context? } → activate existing session
// DELETE ?id=...&context=...             → delete session

import {
	createSession,
	deleteSession,
	setCurrentSession,
} from "@/lib/chat-sessions";
import { applyWorkspaceContext } from "@/lib/workspace-context";

export async function POST(request: Request) {
	const workspaceId = await applyWorkspaceContext();
	const body = (await request.json()) as {
		action: "new" | "activate";
		id?: string;
		context?: string;
	};
	const context = body.context;

	if (body.action === "new") {
		const entry = createSession(workspaceId, context);
		return Response.json(entry);
	}

	if (body.action === "activate") {
		if (!body.id) {
			return new Response(JSON.stringify({ error: "id required" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}
		const entry = setCurrentSession(workspaceId, context, body.id);
		if (!entry) {
			return new Response(JSON.stringify({ error: "session not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}
		return Response.json(entry);
	}

	return new Response(JSON.stringify({ error: "unknown action" }), {
		status: 400,
		headers: { "Content-Type": "application/json" },
	});
}

export async function DELETE(request: Request) {
	const workspaceId = await applyWorkspaceContext();
	const { searchParams } = new URL(request.url);
	const id = searchParams.get("id");
	const context = searchParams.get("context") || undefined;

	if (!id) {
		return new Response(JSON.stringify({ error: "id required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const newCurrentId = deleteSession(workspaceId, context, id);
	return Response.json({ currentId: newCurrentId });
}
