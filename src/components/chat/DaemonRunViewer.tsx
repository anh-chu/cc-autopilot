"use client";

import {
	Brain,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	Loader2,
	MessageSquare,
	Terminal,
	Wrench,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MarkdownContent } from "@/components/markdown-content";
import { Badge } from "@/components/ui/badge";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Types (copied from agent-console.tsx)
interface StreamLine {
	type: string;
	[key: string]: unknown;
}

interface TextBlock {
	type: "text";
	text: string;
}
interface ToolUseBlock {
	type: "tool_use";
	id: string;
	name: string;
	input: unknown;
}
interface ToolResultBlock {
	type: "tool_result";
	tool_use_id: string;
	content: unknown;
}
interface ThinkingBlock {
	type: "thinking";
	thinking?: string;
	text?: string;
}

type ContentBlock =
	| TextBlock
	| ToolUseBlock
	| ToolResultBlock
	| ThinkingBlock
	| { type: string; [key: string]: unknown };

interface ThinkingDisplayLine extends StreamLine {
	type: "merged_thinking";
	thinking: string;
}

interface TextDisplayLine extends StreamLine {
	type: "merged_text";
	text: string;
}

interface ToolUseGroupDisplayLine extends StreamLine {
	type: "merged_tool_use";
	entries: Array<
		| { type: "tool_use"; block: ToolUseBlock }
		| { type: "tool_result"; block: ToolResultBlock }
	>;
}

interface DaemonRunViewerProps {
	runId: string;
}

// Inline SSE hook (copied from use-agent-stream.ts)
function useInlineAgentStream(runId: string | null) {
	const [lines, setLines] = useState<StreamLine[]>([]);
	const [isConnected, setIsConnected] = useState(false);
	const [isDone, setIsDone] = useState(false);
	const eventSourceRef = useRef<EventSource | null>(null);

	const cleanup = useCallback(() => {
		if (eventSourceRef.current) {
			eventSourceRef.current.close();
			eventSourceRef.current = null;
		}
		setIsConnected(false);
	}, []);

	useEffect(() => {
		if (!runId) {
			cleanup();
			return;
		}

		// Reset state for new connection
		setLines([]);
		setIsDone(false);

		const es = new EventSource(
			`/api/runs/stream?runId=${encodeURIComponent(runId)}`,
		);
		eventSourceRef.current = es;

		es.onopen = () => {
			setIsConnected(true);
		};

		es.onmessage = (event) => {
			try {
				const parsed = JSON.parse(event.data) as StreamLine;
				setLines((prev) => [...prev, parsed]);
			} catch {
				// Non-JSON line — ignore
			}
		};

		es.addEventListener("done", () => {
			setIsDone(true);
			cleanup();
		});

		es.onerror = () => {
			setIsConnected(false);
		};

		return () => {
			cleanup();
		};
	}, [runId, cleanup]);

	return { lines, isConnected, isDone };
}

// Helper functions (copied from agent-console.tsx)
function getThinkingFromBlock(block: ContentBlock): string {
	if (block.type !== "thinking") return "";
	return (
		(typeof (block as ThinkingBlock).thinking === "string"
			? (block as ThinkingBlock).thinking
			: typeof (block as ThinkingBlock).text === "string"
				? (block as ThinkingBlock).text
				: "") ?? ""
	);
}

function prepareConsoleLines(
	lines: StreamLine[],
): (
	| StreamLine
	| ThinkingDisplayLine
	| TextDisplayLine
	| ToolUseGroupDisplayLine
)[] {
	const rendered: StreamLine[] = [];
	let thinking = "";

	for (const line of lines) {
		if (line.type === "stream_event") {
			const event = (line.event ?? {}) as Record<string, unknown>;
			if (event.type === "content_block_delta") {
				const delta = (event.delta ?? {}) as Record<string, unknown>;
				if (delta.type === "thinking_delta") {
					const chunk =
						(typeof delta.thinking === "string"
							? delta.thinking
							: typeof delta.text === "string"
								? delta.text
								: "") ?? "";
					if (chunk) thinking += chunk;
				}
			}
			continue;
		}

		if (line.type === "assistant") {
			const message =
				(line.message as { content?: ContentBlock[] } | undefined) ?? {};
			const blocks = message.content ?? [];
			const assistantThinking = blocks
				.filter((block) => block.type === "thinking")
				.map(getThinkingFromBlock)
				.join("");
			const nonThinkingBlocks = blocks.filter(
				(block) => block.type !== "thinking",
			);

			if (assistantThinking) {
				if (thinking && assistantThinking.startsWith(thinking)) {
					thinking = assistantThinking;
				} else if (!thinking.endsWith(assistantThinking)) {
					thinking += assistantThinking;
				}
			}

			if (nonThinkingBlocks.length > 0) {
				rendered.push({
					...line,
					message: {
						...(typeof line.message === "object" && line.message !== null
							? (line.message as Record<string, unknown>)
							: {}),
						content: nonThinkingBlocks,
					},
				});
			}
			continue;
		}

		rendered.push(line);
	}

	const withThinking: (StreamLine | ThinkingDisplayLine)[] = !thinking.trim()
		? rendered
		: (() => {
				const thinkingLine: ThinkingDisplayLine = {
					type: "merged_thinking",
					thinking,
				};
				let insertAt = -1;
				for (let i = rendered.length - 1; i >= 0; i--) {
					const l = rendered[i];
					if (l.type === "assistant") {
						const blocks =
							(l.message as { content?: ContentBlock[] } | undefined)
								?.content ?? [];
						if (blocks.some((b) => b.type === "text")) {
							insertAt = i;
							break;
						}
					}
				}
				if (insertAt === -1) {
					return [...rendered, thinkingLine];
				}
				return [
					...rendered.slice(0, insertAt),
					thinkingLine,
					...rendered.slice(insertAt),
				];
			})();

	const grouped: (
		| StreamLine
		| ThinkingDisplayLine
		| TextDisplayLine
		| ToolUseGroupDisplayLine
	)[] = [];
	let pendingToolEntries: ToolUseGroupDisplayLine["entries"] = [];
	let pendingText = "";

	const flushToolUses = () => {
		if (pendingToolEntries.length === 0) return;
		grouped.push({
			type: "merged_tool_use",
			entries: pendingToolEntries,
		});
		pendingToolEntries = [];
	};

	const flushText = () => {
		if (!pendingText.trim()) return;
		grouped.push({ type: "merged_text", text: pendingText });
		pendingText = "";
	};

	for (const line of withThinking) {
		if (
			line.type === "system" ||
			line.type === "rate_limit_event" ||
			line.type === "stream_event"
		) {
			continue;
		}
		if (line.type === "assistant") {
			const blocks =
				(line.message as { content?: ContentBlock[] } | undefined)?.content ??
				[];
			const onlyText =
				blocks.length > 0 && blocks.every((block) => block.type === "text");
			if (onlyText) {
				if (pendingToolEntries.length > 0) {
					flushText();
					flushToolUses();
				}
				pendingText += (blocks as TextBlock[])
					.map((block) => block.text)
					.join("");
				continue;
			}

			const onlyToolUses =
				blocks.length > 0 && blocks.every((block) => block.type === "tool_use");
			if (onlyToolUses) {
				flushText();
				pendingToolEntries.push(
					...(blocks as ToolUseBlock[]).map((block) => ({
						type: "tool_use" as const,
						block,
					})),
				);
				continue;
			}
		}

		if (line.type === "user") {
			const blocks =
				(line.message as { content?: ContentBlock[] } | undefined)?.content ??
				[];
			const toolResults = blocks.filter(
				(block) => block.type === "tool_result",
			) as ToolResultBlock[];
			if (toolResults.length > 0) {
				pendingToolEntries.push(
					...toolResults.map((block) => ({
						type: "tool_result" as const,
						block,
					})),
				);
				continue;
			}
		}

		if (line.type === "merged_thinking") {
			flushText();
			flushToolUses();
			grouped.push(line);
			continue;
		}

		flushText();
		flushToolUses();
		grouped.push(line);
	}

	flushText();
	flushToolUses();
	return grouped;
}

// UI Components (copied from agent-console.tsx)
function ResponseTextEntry({ text }: { text: string }) {
	return (
		<div className="flex gap-2 py-1.5 px-2">
			<MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent" />
			<MarkdownContent
				content={text}
				className="min-w-0 flex-1 text-xs text-foreground/90"
			/>
		</div>
	);
}

function ThinkingEntry({ thinking }: { thinking: string }) {
	const [open, setOpen] = useState(false);
	const preview = thinking.trim().replace(/\s+/g, " ");
	const hint = preview.length > 90 ? `${preview.slice(0, 90)}…` : preview;

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger className="flex items-start gap-1.5 py-1.5 px-2 w-full hover:bg-sunshine-700/10 rounded-sm text-left bg-sunshine-700/5">
				{open ? (
					<ChevronDown className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
				) : (
					<ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
				)}
				<Brain className="h-3.5 w-3.5 mt-0.5 shrink-0 text-warning-ink" />
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<span className="text-[10px] font-mono uppercase tracking-wide text-warning-ink">
							Thinking
						</span>
						{!open && hint && (
							<span className="text-[10px] text-warning-ink truncate">
								{hint}
							</span>
						)}
					</div>
				</div>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<pre className="text-xs text-warning-ink whitespace-pre-wrap break-words font-mono leading-relaxed px-7 py-1.5">
					{thinking}
				</pre>
			</CollapsibleContent>
		</Collapsible>
	);
}

function ToolUseEntry({ block }: { block: ToolUseBlock }) {
	const [open, setOpen] = useState(false);
	const inputStr = (() => {
		try {
			return JSON.stringify(block.input, null, 2);
		} catch {
			return String(block.input ?? "");
		}
	})();

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger className="flex items-start gap-1.5 py-1.5 px-2 w-full hover:bg-muted/50 rounded-sm text-left">
				{open ? (
					<ChevronDown className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
				) : (
					<ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
				)}
				<Wrench className="h-3.5 w-3.5 mt-0.5 shrink-0 text-info" />
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<span className="text-[10px] font-mono uppercase tracking-wide text-info">
							{block.name}
						</span>
						<Badge variant="outline" className="text-[9px] px-1 py-0">
							{block.id}
						</Badge>
					</div>
				</div>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words font-mono leading-relaxed px-7 py-1.5">
					{inputStr}
				</pre>
			</CollapsibleContent>
		</Collapsible>
	);
}

function ToolResultEntry({ block }: { block: ToolResultBlock }) {
	const [open, setOpen] = useState(true);
	const contentStr = (() => {
		try {
			return typeof block.content === "string"
				? block.content
				: JSON.stringify(block.content, null, 2);
		} catch {
			return String(block.content ?? "");
		}
	})();

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger className="flex items-start gap-1.5 py-1.5 px-2 w-full hover:bg-muted/50 rounded-sm text-left">
				{open ? (
					<ChevronDown className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
				) : (
					<ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
				)}
				<CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-success" />
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<span className="text-[10px] font-mono uppercase tracking-wide text-success">
							Result
						</span>
						<Badge variant="outline" className="text-[9px] px-1 py-0">
							{block.tool_use_id}
						</Badge>
					</div>
				</div>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words font-mono leading-relaxed px-7 py-1.5">
					{contentStr}
				</pre>
			</CollapsibleContent>
		</Collapsible>
	);
}

function ToolUseGroupEntry({
	entries,
}: { entries: ToolUseGroupDisplayLine["entries"] }) {
	return (
		<>
			{entries.map((entry, i) => {
				if (entry.type === "tool_use") {
					return <ToolUseEntry key={entry.block.id} block={entry.block} />;
				}
				if (entry.type === "tool_result") {
					return (
						<ToolResultEntry key={entry.block.tool_use_id} block={entry.block} />
					);
				}
				return null;
			})}
		</>
	);
}

function StreamEntry({ line }: { line: StreamLine }) {
	if (line.type === "merged_text") {
		const text = typeof line.text === "string" ? line.text : "";
		if (!text.trim()) return null;
		return <ResponseTextEntry text={text} />;
	}
	if (line.type === "merged_thinking") {
		const thinking = typeof line.thinking === "string" ? line.thinking : "";
		if (!thinking.trim()) return null;
		return <ThinkingEntry thinking={thinking} />;
	}
	if (line.type === "merged_tool_use") {
		const entries = Array.isArray(line.entries)
			? (line.entries as ToolUseGroupDisplayLine["entries"])
			: [];
		if (entries.length === 0) return null;
		return <ToolUseGroupEntry entries={entries} />;
	}

	if (line.type === "assistant") {
		const blocks =
			(line.message as { content?: ContentBlock[] })?.content ?? [];
		const rendered = blocks.flatMap((block, i) => {
			if (block.type === "text") {
				const text = (block as TextBlock).text;
				if (!text?.trim()) return [];
				return [<ResponseTextEntry key={`text_${i}`} text={text} />];
			}
			if (block.type === "tool_use") {
				const tb = block as ToolUseBlock;
				return [<ToolUseEntry key={tb.id} block={tb} />];
			}
			return [];
		});
		if (rendered.length === 0) return null;
		return <>{rendered}</>;
	}

	if (line.type === "user") {
		const blocks =
			(line.message as { content?: ContentBlock[] })?.content ?? [];
		const rendered = blocks.flatMap((block) => {
			if (block.type === "tool_result") {
				const rb = block as ToolResultBlock;
				return [<ToolResultEntry key={rb.tool_use_id} block={rb} />];
			}
			return [];
		});
		if (rendered.length === 0) return null;
		return <>{rendered}</>;
	}

	if (line.type === "stream_event") {
		return null;
	}
	if (line.type === "result") {
		const cost =
			typeof line.total_cost_usd === "number"
				? `$${line.total_cost_usd.toFixed(4)}`
				: null;
		const turns = typeof line.num_turns === "number" ? line.num_turns : null;
		return (
			<div className="flex items-center gap-2 py-1.5 px-2 bg-muted rounded-sm">
				<CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
				<span className="text-xs text-muted-foreground">
					Session complete
					{cost && <> &middot; {cost}</>}
					{turns != null && <> &middot; {turns} turns</>}
				</span>
			</div>
		);
	}

	if (line.type === "system" || line.type === "rate_limit_event") return null;

	// Unknown event fallback
	const unknownContent = JSON.stringify(line, null, 2);
	const unknownHint = (() => {
		for (const key of [
			"subtype",
			"message",
			"content",
			"text",
			"error",
			"summary",
		]) {
			const val = line[key];
			if (typeof val === "string" && val.trim()) {
				const s = val.trim().split("\n")[0] ?? "";
				return s.length > 80 ? `${s.slice(0, 80)}…` : s;
			}
		}
		return line.type;
	})();

	const [open, setOpen] = useState(false);
	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger className="flex items-start gap-1.5 py-1.5 px-2 w-full hover:bg-muted/50 rounded-sm text-left">
				{open ? (
					<ChevronDown className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
				) : (
					<ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
				)}
				<Terminal className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
				<span className="text-[10px] text-muted-foreground truncate">
					{unknownHint}
				</span>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words font-mono leading-relaxed px-7 py-1.5">
					{unknownContent}
				</pre>
			</CollapsibleContent>
		</Collapsible>
	);
}

export function DaemonRunViewer({ runId }: DaemonRunViewerProps) {
	const { lines, isConnected, isDone } = useInlineAgentStream(runId);
	const scrollRef = useRef<HTMLDivElement>(null);
	const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

	const displayLines = useMemo(() => prepareConsoleLines(lines), [lines]);

	const elapsed = useMemo(() => {
		const now = Date.now();
		const start = lines.find((line) => line.type === "system")?.timestamp;
		if (typeof start === "number") {
			return `${Math.floor((now - start) / 1000)}s`;
		}
		return "";
	}, [lines]);

	const handleScroll = useCallback(() => {
		const scrollEl = scrollRef.current;
		if (!scrollEl) return;
		const { scrollTop, scrollHeight, clientHeight } = scrollEl;
		const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
		setShouldAutoScroll(isNearBottom);
	}, []);

	useEffect(() => {
		if (shouldAutoScroll && scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [displayLines, shouldAutoScroll]);

	return (
		<div className="border rounded-lg bg-background">
			{/* Header */}
			<div className="flex items-center justify-between p-3 border-b bg-muted/30">
				<div className="flex items-center gap-2">
					<Terminal className="h-3.5 w-3.5 text-muted-foreground" />
					<span className="text-xs font-normal">Daemon Run</span>
					{isConnected && !isDone && (
						<Badge
							variant="outline"
							className="text-[10px] px-1.5 py-0 bg-accent-soft text-accent border-accent/40"
						>
							<Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
							streaming
						</Badge>
					)}
					{isDone && (
						<Badge variant="outline" className="text-[10px] px-1.5 py-0">
							done
						</Badge>
					)}
					<span className="text-[10px] text-muted-foreground">{elapsed}</span>
				</div>
			</div>

			{/* Stream output */}
			<div
				ref={scrollRef}
				onScroll={handleScroll}
				className="h-[300px] overflow-y-auto p-1 space-y-0.5"
			>
				{displayLines.length === 0 && !isDone && (
					<div className="flex items-center justify-center h-full text-xs text-muted-foreground">
						<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						Waiting for daemon output...
					</div>
				)}
				{displayLines.length === 0 && isDone && (
					<div className="flex items-center justify-center h-full text-xs text-muted-foreground">
						No output captured
					</div>
				)}
				{displayLines.map((line, i) => {
					return <StreamEntry key={`line_${i}_${line.type}`} line={line} />;
				})}
			</div>
		</div>
	);
}