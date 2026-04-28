import { type ModelInfo, startup } from "@anthropic-ai/claude-agent-sdk";
import { NextResponse } from "next/server";

let cachedModels: ModelInfo[] | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getModels(): Promise<ModelInfo[]> {
	const now = Date.now();
	if (cachedModels && now < cacheExpiry) {
		return cachedModels;
	}

	let models: ModelInfo[] = [];
	const warm = await startup({ options: { maxTurns: 1 } });
	const q = warm.query("__init_probe__");

	try {
		for await (const message of q) {
			if (message.type === "system" && message.subtype === "init") {
				models = await q.supportedModels();
				break;
			}
		}
	} finally {
		q.close();
	}

	cachedModels = models;
	cacheExpiry = now + CACHE_TTL;
	return models;
}

export async function GET() {
	try {
		const models = await getModels();
		return NextResponse.json(
			{ models },
			{ headers: { "Cache-Control": "public, max-age=3600" } },
		);
	} catch {
		// Return empty on failure — non-critical
		return NextResponse.json({ models: [] });
	}
}
