import { type SlashCommand, startup } from "@anthropic-ai/claude-agent-sdk";
import { NextResponse } from "next/server";

let cachedCommands: SlashCommand[] | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getCommands(): Promise<SlashCommand[]> {
	const now = Date.now();
	if (cachedCommands && now < cacheExpiry) {
		return cachedCommands;
	}

	let commands: SlashCommand[] = [];
	const warm = await startup({ options: { maxTurns: 1 } });
	const q = warm.query("__init_probe__");

	try {
		for await (const message of q) {
			if (message.type === "system" && message.subtype === "init") {
				commands = await q.supportedCommands();
				break;
			}
		}
	} finally {
		q.close();
	}

	cachedCommands = commands;
	cacheExpiry = now + CACHE_TTL;
	return commands;
}

export async function GET() {
	try {
		const commands = await getCommands();
		return NextResponse.json(
			{ commands },
			{ headers: { "Cache-Control": "public, max-age=3600" } },
		);
	} catch {
		// Return empty on failure — non-critical
		return NextResponse.json({ commands: [] });
	}
}
