"use client";

import { BarChart3, Bot, Code, Megaphone, Search, User } from "lucide-react";
import { useMemo, useState } from "react";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivityLog } from "@/hooks/use-data";
import type { ActivityEvent, EventType } from "@/lib/types";

type Actor = string;

type IconMap = Record<string, typeof User>;
type LabelMap = Record<string, string>;

const ACTOR_ICONS: IconMap = {
	me: User,
	researcher: Search,
	developer: Code,
	marketer: Megaphone,
	"business-analyst": BarChart3,
	system: Bot,
} as const;

const ACTOR_LABELS: LabelMap = {
	me: "Me",
	researcher: "Researcher",
	developer: "Developer",
	marketer: "Marketer",
	"business-analyst": "Business Analyst",
	system: "System",
} as const;

type EventMeta = { label: string; color: string };
type EventMetaMap = Record<string, EventMeta>;

const EVENT_META: EventMetaMap = {
	task_created: {
		label: "Task Created",
		color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
	},
	task_updated: {
		label: "Task Updated",
		color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
	},
	task_completed: {
		label: "Task Completed",
		color: "bg-green-500/10 text-green-400 border-green-500/20",
	},
	task_delegated: {
		label: "Task Delegated",
		color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
	},
	task_failed: {
		label: "Task Failed",
		color: "bg-red-500/10 text-red-400 border-red-500/20",
	},
	message_sent: {
		label: "Message Sent",
		color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
	},
	decision_requested: {
		label: "Decision Requested",
		color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
	},
	decision_answered: {
		label: "Decision Answered",
		color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
	},
	brain_dump_triaged: {
		label: "Quick Capture Processed",
		color: "bg-pink-500/10 text-pink-400 border-pink-500/20",
	},
	milestone_completed: {
		label: "Milestone Completed",
		color: "bg-green-500/10 text-green-400 border-green-500/20",
	},
	agent_checkin: {
		label: "Agent Check-in",
		color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
	},
} as const;

const ALL_TYPES = Object.keys(EVENT_META) as EventType[];

function formatTime(iso: string): string {
	return new Date(iso).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});
}

function dayKey(iso: string): string {
	return new Date(iso).toDateString();
}

function dayLabel(key: string): string {
	const today = new Date().toDateString();
	const yesterday = new Date(Date.now() - 86_400_000).toDateString();
	if (key === today) return "Today";
	if (key === yesterday) return "Yesterday";
	return new Date(key).toLocaleDateString([], {
		weekday: "long",
		month: "short",
		day: "numeric",
	});
}

function EventRow({ event }: { event: ActivityEvent }) {
	const meta = EVENT_META[event.type];
	const Icon = ACTOR_ICONS[event.actor] ?? Bot;

	return (
		<div className="flex gap-3 py-2.5 px-3 rounded-lg hover:bg-accent/30 transition-colors">
			<div className="mt-0.5 shrink-0">
				<div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
					<Icon className="h-3.5 w-3.5 text-muted-foreground" />
				</div>
			</div>
			<div className="flex-1 min-w-0 space-y-1">
				<div className="flex items-center gap-2 flex-wrap">
					<span className="text-xs font-medium text-foreground">
						{ACTOR_LABELS[event.actor] ?? event.actor}
					</span>
					{meta && (
						<Badge
							variant="outline"
							className={`text-[10px] px-1.5 py-0 border ${meta.color}`}
						>
							{meta.label}
						</Badge>
					)}
					<span className="text-[11px] text-muted-foreground ml-auto tabular-nums shrink-0">
						{formatTime(event.timestamp)}
					</span>
				</div>
				<p className="text-xs text-muted-foreground leading-snug">
					{event.summary}
				</p>
				{event.details && (
					<p className="text-[11px] text-muted-foreground/70 leading-snug line-clamp-2">
						{event.details}
					</p>
				)}
			</div>
		</div>
	);
}

function FeedSkeleton() {
	return (
		<div className="space-y-1">
			{Array.from({ length: 8 }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
				<div key={i} className="flex gap-3 py-2.5 px-3">
					<Skeleton className="h-7 w-7 rounded-full shrink-0" />
					<div className="flex-1 space-y-1.5">
						<div className="flex gap-2">
							<Skeleton className="h-3.5 w-20" />
							<Skeleton className="h-3.5 w-24" />
						</div>
						<Skeleton className="h-3 w-3/4" />
					</div>
				</div>
			))}
		</div>
	);
}

export default function ActivityPage() {
	const { events, loading, error, refetch } = useActivityLog();

	const [actorFilter, setActorFilter] = useState<Actor | "all">("all");
	const [typeFilter, setTypeFilter] = useState<EventType | "all">("all");
	const [search, setSearch] = useState("");

	const filtered = useMemo(() => {
		const q = search.toLowerCase().trim();
		return [...events]
			.sort(
				(a, b) =>
					new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
			)
			.filter((e) => {
				if (actorFilter !== "all" && e.actor !== actorFilter) return false;
				if (typeFilter !== "all" && e.type !== typeFilter) return false;
				if (
					q &&
					!e.summary.toLowerCase().includes(q) &&
					!e.details?.toLowerCase().includes(q)
				)
					return false;
				return true;
			});
	}, [events, actorFilter, typeFilter, search]);

	const grouped = useMemo(() => {
		const groups = new Map<string, ActivityEvent[]>();
		for (const e of filtered) {
			const key = dayKey(e.timestamp);
			const arr = groups.get(key) ?? [];
			arr.push(e);
			groups.set(key, arr);
		}
		return groups;
	}, [filtered]);

	const actors = useMemo(() => {
		return Array.from(new Set(events.map((e) => e.actor))).sort();
	}, [events]);

	return (
		<div className="space-y-4">
			<BreadcrumbNav items={[{ label: "Activity" }]} />

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<Input
					placeholder="Search activity..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="h-8 text-sm sm:max-w-xs"
				/>
				<div className="flex items-center gap-2 flex-wrap">
					<select
						value={actorFilter}
						onChange={(e) => setActorFilter(e.target.value as Actor | "all")}
						className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
					>
						<option value="all">All actors</option>
						{actors.map((a) => (
							<option key={a} value={a}>
								{ACTOR_LABELS[a] ?? a}
							</option>
						))}
					</select>
					<select
						value={typeFilter}
						onChange={(e) => setTypeFilter(e.target.value as EventType | "all")}
						className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
					>
						<option value="all">All types</option>
						{ALL_TYPES.map((t) => (
							<option key={t} value={t}>
								{EVENT_META[t]?.label ?? t}
							</option>
						))}
					</select>
					{(actorFilter !== "all" || typeFilter !== "all" || search) && (
						<Button
							size="sm"
							variant="ghost"
							className="h-8 text-xs text-muted-foreground"
							onClick={() => {
								setActorFilter("all");
								setTypeFilter("all");
								setSearch("");
							}}
						>
							Clear
						</Button>
					)}
				</div>
			</div>

			{error ? (
				<ErrorState message={error} onRetry={refetch} />
			) : loading ? (
				<Card>
					<CardContent className="p-2">
						<FeedSkeleton />
					</CardContent>
				</Card>
			) : filtered.length === 0 ? (
				<EmptyState
					icon={User}
					title="No activity"
					description={
						search || actorFilter !== "all" || typeFilter !== "all"
							? "No events match filters"
							: "No agent events recorded yet"
					}
					compact
				/>
			) : (
				<div className="space-y-4">
					{Array.from(grouped.entries()).map(([key, dayEvents]) => (
						<div key={key}>
							<div className="flex items-center gap-2 mb-1 px-1">
								<span className="text-xs font-semibold text-muted-foreground">
									{dayLabel(key)}
								</span>
								<div className="flex-1 h-px bg-border/50" />
								<span className="text-[10px] text-muted-foreground tabular-nums">
									{dayEvents.length}
								</span>
							</div>
							<Card>
								<CardContent className="p-2 divide-y divide-border/30">
									{dayEvents.map((event) => (
										<EventRow key={event.id} event={event} />
									))}
								</CardContent>
							</Card>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
