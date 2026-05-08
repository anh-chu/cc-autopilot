"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FilterBar } from "@/components/filter-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActiveRun, RunStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<
	RunStatus,
	{
		variant: "default" | "secondary" | "destructive" | "outline" | "accent";
		dot: string;
	}
> = {
	running: { variant: "accent", dot: "bg-amber-500" },
	completed: { variant: "default", dot: "bg-green-500" },
	failed: { variant: "destructive", dot: "bg-red-500" },
	timeout: { variant: "outline", dot: "bg-yellow-500" },
	stopped: { variant: "secondary", dot: "bg-gray-400" },
};

const SOURCE_LABELS: Record<string, string> = {
	manual: "Manual",
	"project-run": "Project",
	"mission-chain": "Mission",
	scheduled: "Scheduled",
	webhook: "Webhook",
	"inbox-respond": "Inbox",
	comment: "Comment",
	wiki: "Wiki",
};

function formatRelativeTime(iso: string): string {
	const now = Date.now();
	const then = new Date(iso).getTime();
	const diffMs = now - then;
	const seconds = Math.floor(diffMs / 1000);

	if (seconds < 5) return "just now";
	if (seconds < 60) return `${seconds}s ago`;

	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;

	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;

	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;

	return new Date(iso).toLocaleDateString();
}

function formatDuration(startedAt: string, completedAt: string | null): string {
	if (!completedAt) return "—";
	const start = new Date(startedAt).getTime();
	const end = new Date(completedAt).getTime();
	const ms = end - start;
	if (ms < 0) return "—";

	const seconds = Math.floor(ms / 1000);
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
	const hours = Math.floor(minutes / 60);
	return `${hours}h ${minutes % 60}m`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RunsFeed() {
	const [runs, setRuns] = useState<ActiveRun[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	// Fetch runs
	const fetchRuns = useCallback(async () => {
		try {
			const res = await fetch("/api/runs");
			if (!res.ok) return;
			const json = await res.json();
			setRuns(json.runs ?? []);
		} catch {
			// Ignore fetch errors
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchRuns();
		const interval = setInterval(fetchRuns, 10_000);
		return () => clearInterval(interval);
	}, [fetchRuns]);

	// Client-side filtering
	const filtered = useMemo(() => {
		let result = [...runs];

		// Status filter
		if (statusFilter !== "all") {
			result = result.filter((r) => r.status === statusFilter);
		}

		// Search (by taskId or agentId)
		if (search.trim()) {
			const q = search.trim().toLowerCase();
			result = result.filter(
				(r) =>
					r.taskId.toLowerCase().includes(q) ||
					r.agentId.toLowerCase().includes(q),
			);
		}

		// Sort: startedAt descending
		result.sort(
			(a, b) =>
				new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
		);

		return result;
	}, [runs, statusFilter, search]);

	const handleClear = useCallback(() => {
		setSearch("");
		setStatusFilter("all");
	}, []);

	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle>Runs</CardTitle>
					{!loading && (
						<span className="text-xs text-muted-foreground">
							{runs.length} run{runs.length !== 1 ? "s" : ""}
						</span>
					)}
				</div>
				<FilterBar
					className="mt-2"
					search={{
						value: search,
						onChange: setSearch,
						placeholder: "Search by task ID or agent ID…",
					}}
					filters={[
						{
							id: "status",
							label: "Status",
							value: statusFilter,
							onChange: setStatusFilter,
							options: [
								{ value: "all", label: "All" },
								{ value: "running", label: "Running" },
								{ value: "completed", label: "Completed" },
								{ value: "failed", label: "Failed" },
								{ value: "timeout", label: "Timeout" },
								{ value: "stopped", label: "Stopped" },
							],
						},
					]}
					onClear={handleClear}
				/>
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className="flex items-center justify-center py-12">
						<p className="text-sm text-muted-foreground">Loading runs…</p>
					</div>
				) : filtered.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<p className="text-sm text-muted-foreground">
							{runs.length === 0
								? "No runs yet. Runs are created when a task is executed."
								: "No runs match your filter criteria."}
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border text-xs text-muted-foreground">
									<th className="text-left font-medium pb-2 pr-3">Status</th>
									<th className="text-left font-medium pb-2 pr-3">Agent</th>
									<th className="text-left font-medium pb-2 pr-3">Task</th>
									<th className="text-left font-medium pb-2 pr-3">Source</th>
									<th className="text-left font-medium pb-2 pr-3">Started</th>
									<th className="text-left font-medium pb-2 pr-3">Duration</th>
									<th className="text-left font-medium pb-2">Error</th>
								</tr>
							</thead>
							<tbody>
								{filtered.map((run) => {
									const meta = STATUS_META[run.status] ?? STATUS_META.stopped;
									return (
										<tr
											key={run.id}
											className="border-b border-border/50 last:border-b-0 hover:bg-muted/30 transition-colors"
										>
											<td className="py-2 pr-3">
												<Badge variant={meta.variant} className="gap-1.5">
													<span
														className={cn(
															"h-1.5 w-1.5 rounded-full",
															meta.dot,
															run.status === "running" && "animate-pulse",
														)}
													/>
													{run.status}
												</Badge>
											</td>
											<td className="py-2 pr-3 font-mono text-xs max-w-[120px] truncate">
												{run.agentId}
											</td>
											<td className="py-2 pr-3">
												<Link
													href={`/tasks/${run.taskId}`}
													className="text-primary hover:underline font-mono text-xs"
												>
													{run.taskId}
												</Link>
											</td>
											<td className="py-2 pr-3">
												{run.source ? (
													<Badge variant="secondary" className="text-[10px]">
														{SOURCE_LABELS[run.source] ?? run.source}
													</Badge>
												) : (
													<span className="text-muted-foreground">—</span>
												)}
											</td>
											<td className="py-2 pr-3 text-muted-foreground whitespace-nowrap text-xs">
												{formatRelativeTime(run.startedAt)}
											</td>
											<td className="py-2 pr-3 whitespace-nowrap text-xs">
												{formatDuration(run.startedAt, run.completedAt)}
											</td>
											<td className="py-2 text-xs max-w-[200px]">
												{run.status === "failed" && run.error ? (
													<span className="text-destructive block truncate">
														{run.error.length > 80
															? `${run.error.slice(0, 80)}…`
															: run.error}
													</span>
												) : run.status === "timeout" && run.error ? (
													<span className="text-yellow-600 block truncate">
														{run.error.length > 80
															? `${run.error.slice(0, 80)}…`
															: run.error}
													</span>
												) : (
													<span className="text-muted-foreground">—</span>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
