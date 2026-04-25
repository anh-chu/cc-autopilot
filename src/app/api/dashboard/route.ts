import { NextResponse } from "next/server";
import {
	getBrainDump,
	getDecisions,
	getInbox,
	getProjects,
	getTasks,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
	// Read all data files in parallel (reads are safe, no locking needed)
	const [tasksData, projectsData, brainDumpData, inboxData, decisionsData] =
		await Promise.all([
			getTasks(),
			getProjects(),
			getBrainDump(),
			getInbox(),
			getDecisions(),
		]);

	// Filter soft-deleted
	const tasks = tasksData.tasks.filter((t) => !t.deletedAt);
	const projects = projectsData.projects.filter((p) => !p.deletedAt);
	const entries = brainDumpData.entries;
	const messages = inboxData.messages;
	const decisions = decisionsData.decisions;

	// Stats
	const doneTasks = tasks.filter((t) => t.kanban === "done");
	const inProgressTasks = tasks.filter((t) => t.kanban === "in-progress");
	const unprocessedEntries = entries.filter((e) => !e.processed);
	const activeProjects = projects.filter((p) => p.status === "active");

	// Comms
	const unreadMessages = messages.filter((m) => m.status === "unread");
	const pendingDecisions = decisions.filter((d) => d.status === "pending");

	// Eisenhower counts
	const eisenhowerCounts = {
		do: tasks.filter(
			(t) =>
				t.importance === "important" &&
				t.urgency === "urgent" &&
				t.kanban !== "done",
		).length,
		schedule: tasks.filter(
			(t) =>
				t.importance === "important" &&
				t.urgency === "not-urgent" &&
				t.kanban !== "done",
		).length,
		delegate: tasks.filter(
			(t) =>
				t.importance === "not-important" &&
				t.urgency === "urgent" &&
				t.kanban !== "done",
		).length,
		eliminate: tasks.filter(
			(t) =>
				t.importance === "not-important" &&
				t.urgency === "not-urgent" &&
				t.kanban !== "done",
		).length,
	};

	// Attention items
	const doQuadrantMyTasks = tasks.filter(
		(t) =>
			t.importance === "important" &&
			t.urgency === "urgent" &&
			t.assignedTo === "me" &&
			t.kanban === "not-started",
	);
	const unreadReports = messages.filter(
		(m) => m.status === "unread" && m.type === "report",
	);

	return NextResponse.json(
		{
			stats: {
				totalTasks: tasks.length,
				inProgressTasks: inProgressTasks.length,
				doneTasks: doneTasks.length,
				activeProjects: activeProjects.length,
				unprocessedBrainDump: unprocessedEntries.length,
			},
			attention: {
				pendingDecisions: pendingDecisions.length,
				unreadReports: unreadReports.length,
				doQuadrantNotStarted: doQuadrantMyTasks.length,
			},
			eisenhowerCounts,
			unreadMessages: unreadMessages.slice(0, 5),
			pendingDecisionsList: pendingDecisions.slice(0, 5),
			tasks,
			projects,
			entries: unprocessedEntries.slice(0, 5),
			messages: unreadMessages,
			decisions: pendingDecisions,
		},
		{
			headers: {
				"Cache-Control": "private, max-age=2, stale-while-revalidate=5",
			},
		},
	);
}
