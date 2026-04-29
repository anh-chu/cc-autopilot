import { NextResponse } from "next/server";
import {
	activateCommand,
	deactivateCommand,
	listActivatedCommands,
} from "@/lib/command-activation";
import { commandActivateSchema, safeId, validateBody } from "@/lib/validations";
import { applyWorkspaceContext } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
	const workspaceId = await applyWorkspaceContext();
	const validation = await validateBody(request, commandActivateSchema);
	if (!validation.success) return validation.error;
	const { commandId, active } = validation.data;

	// Additional explicit validation before path operations
	const cmdParse = safeId.safeParse(commandId);
	const wsParse = safeId.safeParse(workspaceId);
	if (!cmdParse.success || !wsParse.success) {
		return NextResponse.json(
			{ error: "Invalid commandId or workspaceId" },
			{ status: 400 },
		);
	}

	if (active) {
		await activateCommand(workspaceId, commandId);
	} else {
		await deactivateCommand(workspaceId, commandId);
	}

	return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
	const workspaceId = await applyWorkspaceContext();

	if (!workspaceId) {
		return NextResponse.json(
			{ error: "workspaceId required" },
			{ status: 400 },
		);
	}

	const parseResult = safeId.safeParse(workspaceId);
	if (!parseResult.success) {
		return NextResponse.json({ error: "Invalid workspaceId" }, { status: 400 });
	}

	const activatedCommandIds = await listActivatedCommands(workspaceId);
	return NextResponse.json({ activatedCommandIds });
}
