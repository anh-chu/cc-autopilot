"use client";

// Phase 0 smoke test — minimal chat thread using assistant-ui primitives.
//
// Deviations from plan (verified against node_modules):
//
// 1. useChatRuntime({ api: '...' }) — WRONG for ai v6.
//    ChatInit (which UseChatRuntimeOptions extends) has no `api` field; it has `transport`.
//    Source: node_modules/@assistant-ui/react-ai-sdk/dist/ui/use-chat/useChatRuntime.d.ts
//            node_modules/ai/dist/index.d.ts:3796 (ChatInit.transport)
//    Fix: use useChatRuntime({ transport: new AssistantChatTransport({ api: '/api/chat' }) })
//
// 2. import { Thread } from '@assistant-ui/react' — NO Thread component exported.
//    @assistant-ui/react only exports ThreadPrimitive namespace + ComposerPrimitive namespace.
//    Source: node_modules/@assistant-ui/react/dist/index.d.ts:72,77
//    Fix: compose ThreadPrimitive.Root / Viewport / Messages + ComposerPrimitive.Root / Input / Send

import {
	AssistantRuntimeProvider,
	ComposerPrimitive,
	MessagePartPrimitive,
	MessagePrimitive,
	ThreadPrimitive,
} from "@assistant-ui/react";
import {
	AssistantChatTransport,
	useChatRuntime,
} from "@assistant-ui/react-ai-sdk";

// Minimal message renderer for the smoke test.
// Uses MessagePrimitive.Content (alias for MessagePrimitiveParts) which renders all parts.
function SmokeTestMessage() {
	return (
		<MessagePrimitive.Root className="py-2">
			{/* MessagePrimitive.Content renders all message parts (text, tool-call, etc.) */}
			<MessagePrimitive.Content
				components={{
					Text: ({ text }) => (
						<MessagePartPrimitive.Text>
							{/* TextPrimitive just renders the text from context — no children needed */}
						</MessagePartPrimitive.Text>
					),
				}}
			/>
		</MessagePrimitive.Root>
	);
}

export function AssistantThread() {
	// AssistantChatTransport({ api }) is confirmed at:
	//   node_modules/@assistant-ui/react-ai-sdk/dist/ui/use-chat/AssistantChatTransport.d.ts
	//   constructor(initOptions?: HttpChatTransportInitOptions<UI_MESSAGE>)
	//   HttpChatTransportInitOptions.api?: string (default '/api/chat')
	//   node_modules/ai/dist/index.d.ts:3977
	const runtime = useChatRuntime({
		transport: new AssistantChatTransport({ api: "/api/chat" }),
	});

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<div className="flex flex-col h-full">
				{/* ThreadPrimitive.Root — div wrapper, accepts standard div props */}
				<ThreadPrimitive.Root className="flex flex-col flex-1 overflow-hidden">
					{/* ThreadPrimitive.Viewport — scrollable message list */}
					<ThreadPrimitive.Viewport className="flex-1 overflow-y-auto p-4 space-y-2">
						{/* ThreadPrimitive.Messages — render function receives { message: MessageState } */}
						<ThreadPrimitive.Messages>
							{() => <SmokeTestMessage />}
						</ThreadPrimitive.Messages>
					</ThreadPrimitive.Viewport>

					{/* Composer at the bottom */}
					<ComposerPrimitive.Root className="border-t p-4 flex gap-2">
						<ComposerPrimitive.Input
							className="flex-1 resize-none rounded border p-2 text-sm"
							placeholder="Send a message…"
						/>
						<ComposerPrimitive.Send className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">
							Send
						</ComposerPrimitive.Send>
					</ComposerPrimitive.Root>
				</ThreadPrimitive.Root>
			</div>
		</AssistantRuntimeProvider>
	);
}
