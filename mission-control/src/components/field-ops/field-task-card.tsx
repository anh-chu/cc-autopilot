"use client";

import {
  MessageSquare,
  Mail,
  Megaphone,
  CreditCard,
  Globe,
  Palette,
  Wrench,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Shield,
  Clock,
  Wallet,
  Link2,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { FieldTask, FieldTaskType, FieldOpsService } from "@/lib/types";
import {
  computeTaskRisk,
  RISK_BADGE_STYLES,
  TASK_STATUS_STYLES,
  TASK_TYPE_INFO,
  isValidTransition,
  type RiskLevel,
} from "@/lib/field-ops-security";
import { ExecutionResultPanel } from "./execution-result-panel";
import { SignTransactionButton } from "./sign-transaction-button";

// ─── Icon lookup ────────────────────────────────────────────────────────────

const TASK_TYPE_ICONS: Record<string, typeof MessageSquare> = {
  MessageSquare,
  Mail,
  Megaphone,
  CreditCard,
  Globe,
  Palette,
  Wrench,
  Wallet,
};

const TASK_TYPE_COLORS: Record<FieldTaskType, string> = {
  "social-post": "text-blue-400",
  "email-campaign": "text-purple-400",
  "ad-campaign": "text-orange-400",
  payment: "text-green-400",
  publish: "text-teal-400",
  design: "text-pink-400",
  "crypto-transfer": "text-amber-400",
  custom: "text-zinc-400",
};

// ─── Props ──────────────────────────────────────────────────────────────────

interface FieldTaskCardProps {
  task: FieldTask;
  services: FieldOpsService[];
  onStatusChange: (taskId: string, status: string) => void;
  onEdit: (task: FieldTask) => void;
  onDelete: (taskId: string) => void;
  onReject: (task: FieldTask) => void;
  /** Called when "Execute" is clicked on an approved task. Triggers vault unlock + API call. */
  onExecute?: (task: FieldTask) => void;
  /** Whether execution is currently in progress for this specific task. */
  executing?: boolean;
  /** Called when "Test" (dry run) is clicked on an approved task. */
  onDryRun?: (task: FieldTask) => void;
  /** Whether a dry run is currently in progress for this specific task. */
  dryRunning?: boolean;
  /** Called after a wallet signature completes to refresh task data. */
  onRefresh?: () => void;
}

export function FieldTaskCard({
  task,
  services,
  onStatusChange,
  onEdit,
  onDelete,
  onReject,
  onExecute,
  executing,
  onDryRun,
  dryRunning,
  onRefresh,
}: FieldTaskCardProps) {
  const service = services.find((s) => s.id === task.serviceId);
  const risk: RiskLevel = computeTaskRisk(task.type, service?.riskLevel ?? "low");
  const typeInfo = TASK_TYPE_INFO[task.type];
  const statusStyle = TASK_STATUS_STYLES[task.status];
  const riskStyle = RISK_BADGE_STYLES[risk];
  const TypeIcon = TASK_TYPE_ICONS[typeInfo.icon] ?? Wrench;

  const isPending = task.status === "pending-approval";
  const isAwaitingSignature = task.status === "awaiting-signature";
  const hasResult = Object.keys(task.result ?? {}).length > 0;
  const isTerminal = task.status === "completed" || task.status === "failed";

  return (
    <Card className={cn(
      "transition-all",
      isPending && "ring-1 ring-amber-500/40 bg-amber-500/5",
      isAwaitingSignature && "ring-1 ring-purple-500/40 bg-purple-500/5",
    )}>
      <CardContent className="p-4 space-y-3">
        {/* Top row: type icon + title + badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <TypeIcon className={cn("h-4 w-4 mt-0.5 shrink-0", TASK_TYPE_COLORS[task.type])} />
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm truncate">{task.title}</h4>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Badge className={cn("text-[10px] px-1.5 py-0", riskStyle.classes)}>
              <Shield className="h-2.5 w-2.5 mr-0.5" />
              {riskStyle.label}
            </Badge>
            <Badge className={cn("text-[10px] px-1.5 py-0", statusStyle.classes)}>
              {(task.status === "executing" || executing) && <Loader2 className="h-2.5 w-2.5 mr-0.5 animate-spin" />}
              {isPending && <Clock className="h-2.5 w-2.5 mr-0.5 animate-pulse" />}
              {isAwaitingSignature && <Wallet className="h-2.5 w-2.5 mr-0.5 animate-pulse" />}
              {statusStyle.label}
            </Badge>
          </div>
        </div>

        {/* Meta row: type + service */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{typeInfo.label}</span>
          {service && (
            <>
              <span className="text-border">|</span>
              <span>{service.name}</span>
            </>
          )}
          {task.completedAt && (
            <>
              <span className="text-border">|</span>
              <span>Completed {new Date(task.completedAt).toLocaleDateString()}</span>
            </>
          )}
          {task.rejectionFeedback && (
            <>
              <span className="text-border">|</span>
              <span className="text-orange-400 italic truncate">
                Feedback: {task.rejectionFeedback}
              </span>
            </>
          )}
          {task.linkedTaskId && (
            <>
              <span className="text-border">|</span>
              <span className="text-indigo-400 flex items-center gap-0.5">
                <Link2 className="h-3 w-3" />
                Linked task
              </span>
            </>
          )}
        </div>

        {/* Approval context panel for pending tasks */}
        {isPending && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs space-y-1">
            <div className="flex items-center gap-1 font-medium text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              Awaiting Approval
            </div>
            <p className="text-muted-foreground">
              {risk === "high"
                ? "This is a HIGH risk task. Review carefully before approving."
                : "Review the task details and approve or reject."}
            </p>
          </div>
        )}

        {/* Wallet signature context panel for awaiting-signature tasks */}
        {isAwaitingSignature && (
          <div className="rounded-md border border-purple-500/30 bg-purple-500/5 p-2.5 text-xs space-y-1">
            <div className="flex items-center gap-1 font-medium text-purple-400">
              <Wallet className="h-3 w-3" />
              Awaiting Wallet Signature
            </div>
            <p className="text-muted-foreground">
              This task requires you to sign a transaction in your browser wallet (e.g. MetaMask).
            </p>
          </div>
        )}

        {/* Execution result panel — shown for completed/failed tasks with results */}
        {isTerminal && hasResult && (
          <ExecutionResultPanel
            result={task.result}
            success={task.status === "completed"}
          />
        )}

        {/* Action buttons — only valid transitions shown */}
        <div className="flex items-center gap-2 pt-1">
          {/* Draft → Submit for Approval */}
          {task.status === "draft" && isValidTransition("draft", "pending-approval") && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-xs h-7"
              onClick={() => onStatusChange(task.id, "pending-approval")}
            >
              <Shield className="h-3 w-3" />
              Submit for Approval
            </Button>
          )}

          {/* Pending → Approve */}
          {isPending && (
            <Button
              size="sm"
              className="gap-1 text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => onStatusChange(task.id, "approved")}
            >
              <CheckCircle2 className="h-3 w-3" />
              Approve
            </Button>
          )}

          {/* Pending → Reject */}
          {isPending && (
            <Button
              size="sm"
              variant="destructive"
              className="gap-1 text-xs h-7"
              onClick={() => onReject(task)}
            >
              <XCircle className="h-3 w-3" />
              Reject
            </Button>
          )}

          {/* Approved → Test (dry run) */}
          {task.status === "approved" && onDryRun && (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1 text-xs h-7 text-indigo-400 hover:text-indigo-300"
              disabled={dryRunning || executing}
              onClick={() => onDryRun(task)}
            >
              {dryRunning ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <FlaskConical className="h-3 w-3" />
                  Test
                </>
              )}
            </Button>
          )}

          {/* Approved → Execute (via adapter) or Start (manual fallback) */}
          {task.status === "approved" && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-xs h-7"
              disabled={executing || dryRunning}
              onClick={() => {
                if (onExecute) {
                  onExecute(task);
                } else {
                  onStatusChange(task.id, "executing");
                }
              }}
            >
              {executing ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  Execute
                </>
              )}
            </Button>
          )}

          {/* Executing — show spinner, no manual controls */}
          {task.status === "executing" && (
            <div className="flex items-center gap-1.5 text-xs text-indigo-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Executing...</span>
            </div>
          )}

          {/* Awaiting Signature — sign with browser wallet */}
          {isAwaitingSignature && (
            <SignTransactionButton taskId={task.id} onComplete={onRefresh} />
          )}

          {/* Failed / Rejected → Resubmit as Draft */}
          {(task.status === "failed" || task.status === "rejected") && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-xs h-7"
              onClick={() => onStatusChange(task.id, "draft")}
            >
              <RotateCcw className="h-3 w-3" />
              Resubmit as Draft
            </Button>
          )}

          <div className="flex-1" />

          {/* Edit/Delete dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-400"
                onClick={() => onDelete(task.id)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
