import { NextResponse } from "next/server";
import { getActiveRuns } from "@/lib/data";
import { applyWorkspaceContext } from "@/lib/workspace-context";

// ─── GET: Read a single active run by id ────────────────────────────────────

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	await applyWorkspaceContext();

	const { id } = await params;
	const data = await getActiveRuns();
	const run = data.runs.find((r) => r.id === id);

	if (!run) {
		return NextResponse.json({ error: "Run not found" }, { status: 404 });
	}

	return NextResponse.json(run);
}
