import { NextResponse } from "next/server";
import { getTasks, getInbox, getDecisions, getAgents, getFieldTasks, getActions } from "@/lib/data";
import { applyWorkspaceContext } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function GET() {
  await applyWorkspaceContext();
  const [tasksData, inboxData, decisionsData, agentsData, fieldTasksData, actionsData] = await Promise.all([
    getTasks(),
    getInbox(),
    getDecisions(),
    getAgents(),
    getFieldTasks(),
    getActions(),
  ]);

  const tasks = tasksData.tasks.filter((t) => !t.deletedAt);
  const unreadInbox = inboxData.messages.filter((m) => m.status === "unread").length;
  const pendingDecisions = decisionsData.decisions.filter((d) => d.status === "pending").length;
  const agents = agentsData.agents;
  const pendingActionApprovals = actionsData.actions.filter((a) => a.status === "pending-approval").length;
  const pendingFieldApprovals = pendingActionApprovals;

  return NextResponse.json(
    { tasks, unreadInbox, pendingDecisions, pendingFieldApprovals, pendingActionApprovals, agents },
    { headers: { "Cache-Control": "private, max-age=2, stale-while-revalidate=5" } },
  );
}
