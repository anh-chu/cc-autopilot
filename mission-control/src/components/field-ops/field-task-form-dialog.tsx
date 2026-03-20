"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { FieldTask, FieldTaskType, FieldOpsService, AutonomyLevel } from "@/lib/types";
import {
  computeTaskRisk,
  requiresApproval,
  RISK_BADGE_STYLES,
  TASK_TYPE_INFO,
} from "@/lib/field-ops-security";

const TASK_TYPES: FieldTaskType[] = [
  "social-post",
  "email-campaign",
  "ad-campaign",
  "payment",
  "publish",
  "design",
  "crypto-transfer",
  "custom",
];

interface FieldTaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: FieldTask | null;
  missionId: string;
  missionAutonomy: AutonomyLevel;
  services: FieldOpsService[];
  onSubmit: (data: {
    title: string;
    description: string;
    type: FieldTaskType;
    serviceId: string | null;
    approvalRequired: boolean;
    payload?: Record<string, unknown>;
  }) => Promise<void>;
}

export function FieldTaskFormDialog({
  open,
  onOpenChange,
  task,
  missionId,
  missionAutonomy,
  services,
  onSubmit,
}: FieldTaskFormDialogProps) {
  const isEdit = !!task;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<FieldTaskType>("social-post");
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [approvalOverride, setApprovalOverride] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Crypto-transfer specific fields
  const [cryptoOperation, setCryptoOperation] = useState<"send-usdc" | "send-eth">("send-usdc");
  const [cryptoTo, setCryptoTo] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? "");
      setDescription(task?.description ?? "");
      setType(task?.type ?? "social-post");
      setServiceId(task?.serviceId ?? null);
      setApprovalOverride(task?.approvalRequired ?? false);
      // Crypto fields
      setCryptoOperation((task?.payload?.operation as "send-usdc" | "send-eth") ?? "send-usdc");
      setCryptoTo((task?.payload?.to as string) ?? "");
      setCryptoAmount(task?.payload?.amount ? String(task.payload.amount) : "");
    }
  }, [open, task]);

  // Compute risk for selected type + service
  const selectedService = services.find((s) => s.id === serviceId);
  const risk = computeTaskRisk(type, selectedService?.riskLevel ?? "low");
  const riskStyle = RISK_BADGE_STYLES[risk];
  const autoRequiresApproval = requiresApproval(type, selectedService?.riskLevel ?? "low", missionAutonomy);
  const finalApprovalRequired = autoRequiresApproval || approvalOverride;

  // Filter to usable services (saved or connected)
  const availableServices = services.filter(
    (s) => s.status === "saved" || s.status === "connected",
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      // Build payload based on task type
      let payload: Record<string, unknown> = {};
      if (type === "crypto-transfer") {
        payload = {
          operation: cryptoOperation,
          to: cryptoTo.trim(),
          amount: cryptoAmount.trim(),
        };
      }

      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        type,
        serviceId,
        approvalRequired: finalApprovalRequired,
        payload,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  // Suppress unused variable — missionId is used for context/association
  void missionId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Task" : "Add Task"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update task details and configuration."
                : "Add a new field task to this mission."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Post launch announcement on Twitter"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="task-desc">Description</Label>
              <Textarea
                id="task-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What should this task do?"
                rows={2}
              />
            </div>

            {/* Task Type + Risk */}
            <div className="space-y-2">
              <Label>Task Type</Label>
              <div className="flex items-center gap-2">
                <Select value={type} onValueChange={(v) => setType(v as FieldTaskType)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TASK_TYPE_INFO[t].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge className={riskStyle.classes}>
                  <Shield className="h-3 w-3 mr-1" />
                  {riskStyle.label}
                </Badge>
              </div>
              {risk === "high" && (
                <div className="flex items-center gap-1.5 text-xs text-red-400">
                  <AlertTriangle className="h-3 w-3" />
                  This task type has financial impact and will always require approval.
                </div>
              )}
            </div>

            {/* Service */}
            <div className="space-y-2">
              <Label>Service (optional)</Label>
              <Select
                value={serviceId ?? "none"}
                onValueChange={(v) => setServiceId(v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No service</SelectItem>
                  {availableServices.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Crypto-transfer payload fields */}
            {type === "crypto-transfer" && (
              <div className="space-y-3 rounded-md border border-amber-500/20 bg-amber-500/5 p-3">
                <Label className="text-xs font-medium text-amber-400">Crypto Transfer Details</Label>

                {/* Operation */}
                <div className="space-y-1.5">
                  <Label htmlFor="crypto-op" className="text-xs">Operation</Label>
                  <Select
                    value={cryptoOperation}
                    onValueChange={(v) => setCryptoOperation(v as "send-usdc" | "send-eth")}
                  >
                    <SelectTrigger id="crypto-op">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="send-usdc">Send USDC</SelectItem>
                      <SelectItem value="send-eth">Send ETH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* To address */}
                <div className="space-y-1.5">
                  <Label htmlFor="crypto-to" className="text-xs">Recipient Address</Label>
                  <Input
                    id="crypto-to"
                    value={cryptoTo}
                    onChange={(e) => setCryptoTo(e.target.value)}
                    placeholder="0x..."
                    className="font-mono text-xs"
                  />
                  {cryptoTo.trim() !== "" && (!/^0x[a-fA-F0-9]{40}$/.test(cryptoTo.trim())) && (
                    <p className="text-[10px] text-red-400">
                      Address must start with 0x and be 42 characters (20 bytes hex)
                    </p>
                  )}
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <Label htmlFor="crypto-amount" className="text-xs">
                    Amount ({cryptoOperation === "send-usdc" ? "USDC" : "ETH"})
                  </Label>
                  <Input
                    id="crypto-amount"
                    type="number"
                    step="any"
                    min="0"
                    value={cryptoAmount}
                    onChange={(e) => setCryptoAmount(e.target.value)}
                    placeholder="0.00"
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            )}

            {/* Approval override */}
            {!autoRequiresApproval && (
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="approval-switch" className="text-sm">
                    Always require approval
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Override autonomy settings for this specific task
                  </p>
                </div>
                <Switch
                  id="approval-switch"
                  checked={approvalOverride}
                  onCheckedChange={setApprovalOverride}
                />
              </div>
            )}

            {/* Approval summary */}
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
              {finalApprovalRequired
                ? "This task will require your approval before execution."
                : "This task will be auto-approved based on current autonomy settings."}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || submitting}>
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
