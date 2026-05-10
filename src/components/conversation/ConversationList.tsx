"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { Conversation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ConversationStatusBadge } from "./ConversationStatusBadge";

interface ConversationListProps {
	currentId?: string | null;
	onSelect: (id: string) => void;
	taskId?: string | null;
	source?: string | null;
	onConversationsChange?: (convs: Conversation[]) => void;
	onConversationDeleted?: (id: string) => void;
}

export function ConversationList({
	currentId,
	onSelect,
	taskId,
	source,
	onConversationsChange,
	onConversationDeleted,
}: ConversationListProps) {
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	useEffect(() => {
		const fetchConversations = async () => {
			setIsLoading(true);
			try {
				const params = new URLSearchParams();
				if (taskId) params.set("taskId", taskId);
				if (source) params.set("source", source);
				const qs = params.toString();
				const url = qs ? `/api/conversations?${qs}` : `/api/conversations`;
				const res = await apiFetch(url);
				if (res.ok) {
					const data = await res.json();
					const list = data.conversations || [];
					setConversations(list);
					onConversationsChange?.(list);
				}
			} catch (err) {
				console.error("Failed to fetch conversations", err);
			} finally {
				setIsLoading(false);
			}
		};

		fetchConversations();
	}, [taskId, source, onConversationsChange]);

	const handleDelete = async (e: React.MouseEvent, id: string) => {
		e.stopPropagation();
		setDeletingId(id);
		try {
			const res = await apiFetch(`/api/conversations/${id}`, {
				method: "DELETE",
			});
			if (res.ok) {
				const next = conversations.filter((c) => c.id !== id);
				setConversations(next);
				onConversationsChange?.(next);
				onConversationDeleted?.(id);
			}
		} catch (err) {
			console.error("Failed to delete conversation", err);
		} finally {
			setDeletingId(null);
		}
	};

	const formatDate = (iso: string) => {
		const d = new Date(iso);
		const now = new Date();
		const diffMs = now.getTime() - d.getTime();
		const diffHrs = diffMs / (1000 * 60 * 60);
		if (diffHrs < 1) return `${Math.round(diffMs / 60000)}m ago`;
		if (diffHrs < 24) return `${Math.round(diffHrs)}h ago`;
		return d.toLocaleDateString();
	};

	return (
		<div className="flex flex-col h-full border-r">
			<div className="flex-1 overflow-y-auto">
				{isLoading ? (
					<div className="p-4 text-xs text-muted-foreground text-center">
						Loading...
					</div>
				) : conversations.length === 0 ? (
					<div className="p-4 text-xs text-muted-foreground text-center">
						No conversations
					</div>
				) : (
					conversations.map((conv) => (
						<div
							key={conv.id}
							onClick={() => onSelect(conv.id)}
							className={cn(
								"group relative p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors",
								currentId === conv.id && "bg-muted",
							)}
						>
							<div className="flex items-start justify-between gap-2 mb-1">
								<span className="text-sm font-medium truncate flex-1">
									{conv.title || "Untitled"}
								</span>
								<div className="flex items-center gap-1 shrink-0">
									<span className="text-[10px] text-muted-foreground whitespace-nowrap">
										{formatDate(conv.updatedAt)}
									</span>
									<button
										type="button"
										onClick={(e) => handleDelete(e, conv.id)}
										disabled={deletingId === conv.id}
										className="opacity-0 group-hover:opacity-100 p-0.5 rounded-sm text-muted-foreground hover:text-destructive transition-all"
										title="Delete conversation"
									>
										<Trash2 className="h-3 w-3" />
									</button>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<ConversationStatusBadge status={conv.status} />
								<span className="text-[10px] text-muted-foreground">
									{conv.turnCount} turns
								</span>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
