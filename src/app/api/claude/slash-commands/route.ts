import { query, type SlashCommand } from "@anthropic-ai/claude-agent-sdk";
import { NextResponse } from "next/server";

export async function GET() {
	let commands: SlashCommand[] = [];

	const q = query({
		prompt: "__init_probe__",
		options: { maxTurns: 1 },
	});

	try {
		// Advance past system/init so the session is initialized
		for await (const message of q) {
			if (message.type === "system" && message.subtype === "init") {
				commands = await q.supportedCommands();
				break;
			}
		}
	} catch {
		// ignore
	}

	return NextResponse.json({ commands });
}
