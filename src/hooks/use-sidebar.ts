"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { AgentDefinition, Task } from "@/lib/types";

interface SidebarData {
	tasks: Task[];
	agents: AgentDefinition[];
}

const POLL_INTERVAL = 10_000;

export function useSidebar() {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [agents, setAgents] = useState<AgentDefinition[]>([]);
	const [loading, setLoading] = useState(true);
	const initialLoadDone = useRef(false);

	const refetch = useCallback(async () => {
		try {
			if (!initialLoadDone.current) setLoading(true);
			const res = await apiFetch("/api/sidebar");
			if (!res.ok) throw new Error("Failed to fetch sidebar data");
			const json: SidebarData = await res.json();
			setTasks(json.tasks);
			setAgents(json.agents);
			initialLoadDone.current = true;
		} catch {
			// Silently fail on polls — sidebar badges are non-critical
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		refetch();

		const interval = setInterval(() => {
			if (document.visibilityState === "visible") refetch();
		}, POLL_INTERVAL);

		const onVisible = () => {
			if (document.visibilityState === "visible") refetch();
		};
		document.addEventListener("visibilitychange", onVisible);

		return () => {
			clearInterval(interval);
			document.removeEventListener("visibilitychange", onVisible);
		};
	}, [refetch]);

	return { tasks, agents, loading, refetch };
}
