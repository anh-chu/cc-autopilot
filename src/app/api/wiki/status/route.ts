import { NextResponse } from "next/server";
import { getWorkspaceDir } from "@/lib/paths";
import { getPluginStatus } from "@/lib/wiki-plugin";
import { applyWorkspaceContext } from "@/lib/workspace-context";

export async function GET() {
	try {
		const workspaceId = await applyWorkspaceContext();
		const workspaceDir = getWorkspaceDir(workspaceId);
		const status = getPluginStatus(workspaceDir);
		return NextResponse.json(status);
	} catch {
		return NextResponse.json({ installed: false, version: null });
	}
}
