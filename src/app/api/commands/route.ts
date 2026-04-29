import { rm } from "node:fs/promises";
import { NextResponse } from "next/server";
import {
	deactivateCommandFromAllWorkspaces,
	listActivatedCommands,
} from "@/lib/command-activation";
import {
	readAllCommands,
	readCommandFile,
	writeCommandFile,
} from "@/lib/command-files";
import { getWorkspaces } from "@/lib/data";
import { getGlobalCommandDir, getGlobalCommandsDir } from "@/lib/paths";
import type { CommandDefinition } from "@/lib/types";
import { generateId } from "@/lib/utils";
import {
	commandCreateSchema,
	commandUpdateSchema,
	safeId,
	validateBody,
} from "@/lib/validations";
import { applyWorkspaceContext } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	const workspaceId = await applyWorkspaceContext();
	const { searchParams } = new URL(request.url);
	const id = searchParams.get("id");

	// Single command fetch
	if (id) {
		const parseResult = safeId.safeParse(id);
		if (!parseResult.success) {
			return NextResponse.json(
				{ error: "Invalid command ID" },
				{ status: 400 },
			);
		}
		const cmdDir = getGlobalCommandDir(id);
		const cmd = await readCommandFile(cmdDir);
		if (!cmd) {
			return NextResponse.json({ error: "Command not found" }, { status: 404 });
		}
		let activated = false;
		if (workspaceId) {
			const activatedIds = await listActivatedCommands(workspaceId);
			activated = activatedIds.includes(id);
		}
		return NextResponse.json({ command: { ...cmd, activated } });
	}

	// List all commands
	const rawCommands = await readAllCommands(getGlobalCommandsDir());

	let activatedIds: Set<string> | null = null;
	if (workspaceId) {
		const ids = await listActivatedCommands(workspaceId);
		activatedIds = new Set(ids);
	}

	const commands: CommandDefinition[] = rawCommands.map((c) => ({
		...c,
		...(activatedIds !== null ? { activated: activatedIds.has(c.id) } : {}),
	}));

	return NextResponse.json({ commands });
}

export async function POST(request: Request) {
	await applyWorkspaceContext();
	const validation = await validateBody(request, commandCreateSchema);
	if (!validation.success) return validation.error;
	const body = validation.data;

	let id: string;
	if (body.id) {
		const parseResult = safeId.safeParse(body.id);
		if (!parseResult.success) {
			return NextResponse.json(
				{ error: "Invalid command ID" },
				{ status: 400 },
			);
		}
		id = body.id;
	} else {
		id = generateId("cmd");
	}

	const now = new Date().toISOString();
	const command: CommandDefinition = {
		id,
		name: body.name,
		command: body.command,
		description: body.description,
		longDescription: body.longDescription,
		icon: body.icon,
		content: body.content,
		createdAt: now,
		updatedAt: now,
	};

	const cmdDir = getGlobalCommandDir(id);
	await writeCommandFile(cmdDir, command);

	return NextResponse.json(command, { status: 201 });
}

export async function PUT(request: Request) {
	await applyWorkspaceContext();
	const validation = await validateBody(request, commandUpdateSchema);
	if (!validation.success) return validation.error;
	const body = validation.data;

	const parseResult = safeId.safeParse(body.id);
	if (!parseResult.success) {
		return NextResponse.json({ error: "Invalid command ID" }, { status: 400 });
	}

	const cmdDir = getGlobalCommandDir(body.id);
	const existing = await readCommandFile(cmdDir);
	if (!existing) {
		return NextResponse.json({ error: "Command not found" }, { status: 404 });
	}

	const updated: CommandDefinition = {
		...existing,
		...(body.name !== undefined ? { name: body.name } : {}),
		...(body.command !== undefined ? { command: body.command } : {}),
		...(body.description !== undefined
			? { description: body.description }
			: {}),
		...(body.longDescription !== undefined
			? { longDescription: body.longDescription }
			: {}),
		...(body.icon !== undefined ? { icon: body.icon } : {}),
		...(body.content !== undefined ? { content: body.content } : {}),
		updatedAt: new Date().toISOString(),
	};

	await writeCommandFile(cmdDir, updated);

	return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
	await applyWorkspaceContext();
	const { searchParams } = new URL(request.url);
	const id = searchParams.get("id");
	if (!id) {
		return NextResponse.json({ error: "id required" }, { status: 400 });
	}

	const parseResult = safeId.safeParse(id);
	if (!parseResult.success) {
		return NextResponse.json({ error: "Invalid command ID" }, { status: 400 });
	}

	const cmdDir = getGlobalCommandDir(id);
	const existing = await readCommandFile(cmdDir);

	if (existing) {
		// Remove symlinks from all workspaces
		try {
			const workspacesData = await getWorkspaces();
			const workspaceIds = workspacesData.workspaces.map((w) => w.id);
			await deactivateCommandFromAllWorkspaces(id, workspaceIds);
		} catch (err) {
			console.warn(
				`[commands] DELETE: failed to deactivate command ${id} from workspaces:`,
				err,
			);
		}

		// Remove global command directory
		await rm(cmdDir, { recursive: true, force: true });
	}

	return NextResponse.json({ ok: true });
}
