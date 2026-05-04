"use client";

// Phase 1 — enhanced chat thread with tool UIs, cwd/model/persona forwarding
//
// Phase 0 deviations still apply:
// 1. useChatRuntime({ transport: new AssistantChatTransport(...) }) not direct api field
// 2. ThreadPrimitive composition instead of simple Thread component
// 3. toUIMessageStreamResponse() for the message stream format

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
import { useEffect, useState } from "react";

// Enhanced message renderer that properly displays text content.
// Phase 0 fix: TextPrimitive was empty, now properly renders message text.
function MessageRenderer() {
	return (
		<MessagePrimitive.Root className="py-2">
			<MessagePrimitive.Content
				components={{
					Text: () => (
						<MessagePartPrimitive.Text className="text-sm text-foreground whitespace-pre-wrap" />
					),
				}}
			/>
		</MessagePrimitive.Root>
	);
}

interface AssistantThreadProps {
	cwd?: string;
	context?: string;
	model?: string;
	persona?: string;
}

export function AssistantThread({
	cwd,
	context,
	model,
	persona,
}: AssistantThreadProps) {
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Fetch current session ID on mount
	useEffect(() => {
		async function fetchSessionId() {
			try {
				const params = new URLSearchParams();
				if (context) {
					params.set("context", context);
				}
				const response = await fetch(`/api/chat?${params.toString()}`);
				if (response.ok) {
					const data = await response.json();
					setSessionId(data.sessionId);
				}
			} catch (error) {
				console.warn("Failed to fetch session ID:", error);
			} finally {
				setIsLoading(false);
			}
		}

		fetchSessionId();
	}, [context]);

	// Forward cwd, model, persona, context, sessionId via transport body
	// HttpChatTransportInitOptions.body confirmed at node_modules/ai/dist/index.d.ts:4000
	const runtime = useChatRuntime({
		transport: new AssistantChatTransport({
			api: "/api/chat",
			body: { cwd, model, persona, context, sessionId },
		}),
	});

	if (isLoading) {
		return (
			<div className="flex flex-col h-full justify-center items-center">
				<div className="text-sm text-muted-foreground">Loading session...</div>
			</div>
		);
	}

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<div className="flex flex-col h-full">
				{/* ThreadPrimitive.Root — div wrapper, accepts standard div props */}
				<ThreadPrimitive.Root className="flex flex-col flex-1 overflow-hidden">
					{/* ThreadPrimitive.Viewport — scrollable message list */}
					<ThreadPrimitive.Viewport className="flex-1 overflow-y-auto p-4 space-y-2">
						{/* ThreadPrimitive.Messages — render function receives { message: MessageState } */}
						<ThreadPrimitive.Messages>
							{() => <MessageRenderer />}
						</ThreadPrimitive.Messages>
					</ThreadPrimitive.Viewport>

					{/* Composer at the bottom */}
					<ComposerPrimitive.Root className="border-t p-4 flex gap-2">
						<ComposerPrimitive.Input
							className="flex-1 resize-none rounded border p-2 text-sm"
							placeholder={
								sessionId
									? "Continue conversation..."
									: "Start a conversation..."
							}
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
