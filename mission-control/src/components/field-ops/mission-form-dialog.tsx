"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AutonomySelector } from "@/components/autonomy-selector";
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
import type { AutonomyLevel, FieldMission, Project } from "@/lib/types";

// ─── Props ──────────────────────────────────────────────────────────────────

interface MissionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mission?: FieldMission | null;
  projects: Project[];
  onSubmit: (data: {
    title: string;
    description: string;
    autonomyLevel: AutonomyLevel;
    linkedProjectId: string | null;
  }) => Promise<void>;
}

export function MissionFormDialog({
  open,
  onOpenChange,
  mission,
  projects,
  onSubmit,
}: MissionFormDialogProps) {
  const isEdit = !!mission;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>("approve-all");
  const [linkedProjectId, setLinkedProjectId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset form when dialog opens or mission changes
  useEffect(() => {
    if (open) {
      setTitle(mission?.title ?? "");
      setDescription(mission?.description ?? "");
      setAutonomyLevel(mission?.autonomyLevel ?? "approve-all");
      setLinkedProjectId(mission?.linkedProjectId ?? null);
    }
  }, [open, mission]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        autonomyLevel,
        linkedProjectId,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Initiative" : "New Initiative"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update initiative details and security settings."
                : "Create a new field operation initiative with tasks and approval controls."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="mission-title">Title</Label>
              <Input
                id="mission-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Launch social media campaign"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="mission-desc">Description</Label>
              <Textarea
                id="mission-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What should this initiative accomplish?"
                rows={3}
              />
            </div>

            {/* Autonomy Level */}
            <div className="space-y-2">
              <Label>Approval Level</Label>
              <AutonomySelector
                value={autonomyLevel}
                onChange={(v) => setAutonomyLevel(v ?? "approve-all")}
              />
              <p className="text-xs text-amber-400">
                Note: HIGH risk tasks (payments, ad campaigns) always require approval regardless of this setting.
              </p>
            </div>

            {/* Linked Project */}
            {projects.length > 0 && (
              <div className="space-y-2">
                <Label>Linked Project (optional)</Label>
                <Select
                  value={linkedProjectId ?? "none"}
                  onValueChange={(v) => setLinkedProjectId(v === "none" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || submitting}>
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Create Initiative"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
