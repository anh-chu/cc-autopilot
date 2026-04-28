import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import { join } from "path";

function getVersion(): string {
	try {
		const pkg = JSON.parse(
			readFileSync(join(process.cwd(), "package.json"), "utf-8"),
		);
		return pkg.version || "unknown";
	} catch {
		return "unknown";
	}
}

// ─── GET: Server mode detection (PM2 vs terminal) ───────────────────────────

export async function GET() {
	const isPm2 = process.env.pm_id !== undefined;
	const uptimeSeconds = Math.floor(process.uptime());

	return NextResponse.json({
		status: "ok",
		version: getVersion(),
		mode: isPm2 ? "pm2" : "terminal",
		uptimeSeconds,
		pid: process.pid,
	});
}
