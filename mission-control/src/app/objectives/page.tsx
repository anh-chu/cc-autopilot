"use client";

import { useState } from "react";
import { Plus, Target, Pencil, Trash2, Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { CreateGoalDialog } from "@/components/create-goal-dialog";
import { EditGoalDialog } from "@/components/edit-goal-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useGoals, useTasks, useInitiatives } from "@/hooks/use-data";
import { GoalCardSkeleton } from "@/components/skeletons";
import { ErrorState } from "@/components/error-state";
import { Tip } from "@/components/ui/tip";
import { showSuccess, showError } from "@/lib/toast";
import { apiFetch } from "@/lib/api-client";
import type { Goal, Task, GoalType, GoalStatus, Initiative } from "@/lib/types";

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function InitiativeCard({ initiative, tasks }: { initiative: Initiative; tasks: Task[] }) {
  const linkedTasks = tasks.filter((t) => t.initiativeId === initiative.id);
  const completedCount = linkedTasks.filter((t) => t.kanban === "done").length;
  const progress = linkedTasks.length > 0 ? (completedCount / linkedTasks.length) * 100 : 0;

  const statusColors: Record<string, string> = {
    "active": "text-status-in-progress",
    "paused": "text-muted-foreground",
    "completed": "text-status-done",
    "archived": "text-muted-foreground",
  };

  return (
    <div className="ml-4 rounded-lg border bg-card/50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {initiative.color && (
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: initiative.color }} />
          )}
          <h4 className="font-medium text-sm">{initiative.title}</h4>
        </div>
        <Badge variant="outline" className={`text-xs capitalize ${statusColors[initiative.status] ?? ""}`}>
          {initiative.status}
        </Badge>
      </div>
      {linkedTasks.length > 0 && (
        <>
          <div className="flex items-center gap-3">
            <ProgressBar value={progress} />
            <span className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">{completedCount}/{linkedTasks.length}</span>
          </div>
          <div className="space-y-0.5 pt-1">
            {linkedTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-2 text-xs">
                <span className={task.kanban === "done" ? "text-status-done" : "text-muted-foreground"}>
                  {task.kanban === "done" ? "✓" : "○"}
                </span>
                <span className={task.kanban === "done" ? "line-through text-muted-foreground" : ""}>{task.title}</span>
                {task.kanban === "in-progress" && <Badge variant="secondary" className="ml-auto text-xs h-4 px-1">active</Badge>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function GoalsPage() {
  const { goals, loading: loadingGoals, create: createGoal, update: updateGoal, remove: deleteGoal, error: goalsError, refetch: refetchGoals } = useGoals();
  const { tasks, loading: loadingTasks } = useTasks();
  const { initiatives, loading: loadingInitiatives, refetch: refetchInitiatives } = useInitiatives();

  const loading = loadingGoals || loadingTasks || loadingInitiatives;
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [addingInitiativeForGoalId, setAddingInitiativeForGoalId] = useState<string | null>(null);
  const [newInitTitle, setNewInitTitle] = useState("");
  const [newInitDesc, setNewInitDesc] = useState("");
  const [newInitSaving, setNewInitSaving] = useState(false);

  const longTermGoals = goals.filter((g) => g.type === "long-term");
  const activeInitiatives = initiatives.filter((i) => !i.deletedAt);

  const handleCreateGoal = async (data: { title: string; type: GoalType; timeframe: string; projectId: string | null; parentGoalId: string | null }) => {
    await createGoal({
      title: data.title,
      type: data.type,
      timeframe: data.timeframe,
      parentGoalId: data.parentGoalId,
      projectId: data.projectId,
      status: "not-started",
      milestones: [],
      tasks: [],
    });
  };

  const handleEditGoal = async (data: { title: string; type: GoalType; timeframe: string; status: GoalStatus; projectId: string | null; parentGoalId: string | null }) => {
    if (!editingGoal) return;
    await updateGoal(editingGoal.id, data);
    setEditingGoal(null);
  };

  const handleDeleteGoal = async () => {
    if (!deletingGoalId) return;
    await deleteGoal(deletingGoalId);
    setDeletingGoalId(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <BreadcrumbNav items={[{ label: "Objectives" }]} />
        <div className="grid gap-3 sm:grid-cols-2">
          <GoalCardSkeleton />
          <GoalCardSkeleton />
          <GoalCardSkeleton />
        </div>
      </div>
    );
  }

  if (goalsError) {
    return (
      <div className="space-y-6">
        <BreadcrumbNav items={[{ label: "Objectives" }]} />
        <ErrorState message={goalsError} onRetry={refetchGoals} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[{ label: "Objectives" }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Objectives</h1>
          <p className="text-sm text-muted-foreground">Long-term objectives broken down into initiatives</p>
        </div>
        <Tip content="Create a new objective">
          <Button size="sm" onClick={() => setShowCreateGoal(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New Objective
          </Button>
        </Tip>
      </div>

      {longTermGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No objectives yet"
          description="Set long-term objectives and break them into initiatives to track your progress."
          actionLabel="Create an objective"
          onAction={() => setShowCreateGoal(true)}
        />
      ) : (
        longTermGoals.map((goal) => {
          const goalInitiatives = activeInitiatives.filter((i) => i.parentGoalId === goal.id);
          const goalTasks = tasks.filter((t) => t.initiativeId && goalInitiatives.some((i) => i.id === t.initiativeId));
          const completedTasks = goalTasks.filter((t) => t.kanban === "done").length;
          const overallProgress = goalTasks.length > 0 ? (completedTasks / goalTasks.length) * 100 : 0;

          return (
            <Card key={goal.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{goal.title}</CardTitle>
                    <Tip content="Edit objective">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => setEditingGoal(goal)}
                        aria-label="Edit objective"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </Tip>
                    <Tip content="Delete objective">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeletingGoalId(goal.id)}
                        aria-label="Delete objective"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </Tip>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tip content="Add initiative to this objective">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 gap-1 text-xs px-2"
                        onClick={() => { setNewInitTitle(""); setNewInitDesc(""); setAddingInitiativeForGoalId(goal.id); }}
                      >
                        <Rocket className="h-3 w-3" />
                        Add Initiative
                      </Button>
                    </Tip>
                    <Badge variant="outline" className={`text-xs capitalize ${goal.status === "completed" ? "text-status-done" : goal.status === "in-progress" ? "text-status-in-progress" : "text-muted-foreground"}`}>
                      {goal.status.replace("-", " ")}
                    </Badge>
                  </div>
                </div>
                {goal.timeframe && <p className="text-xs text-muted-foreground mt-1">Timeframe: {goal.timeframe}</p>}
                {goalTasks.length > 0 && (
                  <div className="flex items-center gap-3 pt-2">
                    <ProgressBar value={overallProgress} />
                    <span className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">{Math.round(overallProgress)}%</span>
                  </div>
                )}
              </CardHeader>
              {goalInitiatives.length > 0 && (
                <CardContent>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
                    Initiatives ({goalInitiatives.length})
                  </p>
                  <div className="space-y-2">
                    {goalInitiatives.map((initiative) => (
                      <InitiativeCard key={initiative.id} initiative={initiative} tasks={tasks} />
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })
      )}

      <Dialog open={!!addingInitiativeForGoalId} onOpenChange={(open) => { if (!open) setAddingInitiativeForGoalId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Initiative</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newInitTitle.trim() || !addingInitiativeForGoalId) return;
              setNewInitSaving(true);
              try {
                const res = await apiFetch("/api/initiatives", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: newInitTitle.trim(),
                    description: newInitDesc.trim(),
                    parentGoalId: addingInitiativeForGoalId,
                    status: "active",
                    autonomyLevel: null,
                  }),
                });
                if (!res.ok) {
                  const err = await res.json().catch(() => ({}));
                  throw new Error((err as { error?: string }).error ?? "Failed to create initiative");
                }
                showSuccess("Initiative created");
                setAddingInitiativeForGoalId(null);
                await refetchInitiatives();
              } catch (err) {
                showError(err instanceof Error ? err.message : "Failed to create initiative");
              } finally {
                setNewInitSaving(false);
              }
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="new-init-title">Title <span className="text-destructive">*</span></Label>
              <Input id="new-init-title" value={newInitTitle} onChange={(e) => setNewInitTitle(e.target.value)} required autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-init-desc">Description</Label>
              <Textarea id="new-init-desc" value={newInitDesc} onChange={(e) => setNewInitDesc(e.target.value)} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddingInitiativeForGoalId(null)}>Cancel</Button>
              <Button type="submit" disabled={newInitSaving || !newInitTitle.trim()}>{newInitSaving ? "Creating..." : "Create Initiative"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CreateGoalDialog
        open={showCreateGoal}
        onOpenChange={setShowCreateGoal}
        projects={[]}
        goals={goals}
        onSubmit={handleCreateGoal}
      />

      {editingGoal && (
        <EditGoalDialog
          open={!!editingGoal}
          onOpenChange={(open) => { if (!open) setEditingGoal(null); }}
          goal={editingGoal}
          projects={[]}
          goals={goals}
          onSubmit={handleEditGoal}
        />
      )}

      <ConfirmDialog
        open={!!deletingGoalId}
        onOpenChange={(open) => { if (!open) setDeletingGoalId(null); }}
        title="Delete objective"
        description="This will permanently delete this objective and its milestones. Linked tasks will not be deleted. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteGoal}
      />
    </div>
  );
}
