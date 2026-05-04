// Phase 0 smoke test — assistant-ui + AI SDK v6 + claude-code provider
// Deviation from plan: result.toDataStreamResponse() does NOT exist in ai v6.
// Verified: StreamTextResult only exposes toUIMessageStreamResponse() and toTextStreamResponse()
// (node_modules/ai/dist/index.d.ts:2496). AssistantChatTransport extends DefaultChatTransport
// which processes the UIMessageStream format, so toUIMessageStreamResponse() is correct here.
import { type ModelMessage, streamText } from "ai";
import { claudeCode } from "ai-sdk-provider-claude-code";

export async function POST(request: Request) {
	const body = (await request.json()) as {
		messages: ModelMessage[];
		data?: { cwd?: string };
	};

	const { messages, data } = body;
	const cwd = data?.cwd ?? process.cwd();

	// claudeCode() signature confirmed:
	//   node_modules/ai-sdk-provider-claude-code/dist/index.d.ts
	//   ClaudeCodeSettings.cwd (line 122), allowDangerouslySkipPermissions, persistSession
	const model = claudeCode("sonnet", {
		cwd,
		persistSession: true,
		allowDangerouslySkipPermissions: true,
	});

	const result = streamText({ model, messages });

	// toUIMessageStreamResponse() — the v6 method for the UI message stream protocol.
	// Plan specified toDataStreamResponse() but that method does not exist in ai@6.
	// Verified: node_modules/ai/dist/index.d.ts:2496
	return result.toUIMessageStreamResponse();
}
