"use client";

import { ShieldCheck, ShieldAlert, ShieldOff, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { AutonomyLevel } from "@/lib/types";

const AUTONOMY_MODES = [
  {
    mode: "approve-all" as AutonomyLevel,
    label: "Manual Approval",
    icon: ShieldCheck,
    description: "Every action requires your explicit approval. Safest mode.",
    activeClasses: "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600",
  },
  {
    mode: "approve-high-risk" as AutonomyLevel,
    label: "Supervised",
    icon: ShieldAlert,
    description: "Only high and medium risk actions need approval. Low risk auto-approves.",
    activeClasses: "bg-amber-600 text-white hover:bg-amber-700 border-amber-600",
  },
  {
    mode: "full-autonomy" as AutonomyLevel,
    label: "Full Autonomy",
    icon: ShieldOff,
    description: "Only HIGH risk actions (payments, ads) still require approval.",
    activeClasses: "bg-red-600 text-white hover:bg-red-700 border-red-600",
  },
];

const INHERIT_MODE = {
  mode: null as null,
  label: "Inherit",
  icon: Building2,
  description: "Use workspace default setting.",
  activeClasses: "bg-muted text-foreground hover:bg-muted border-border",
};

interface AutonomySelectorProps {
  value: AutonomyLevel | null;
  onChange: (v: AutonomyLevel | null) => void;
  showInherit?: boolean;
}

export function AutonomySelector({ value, onChange, showInherit = false }: AutonomySelectorProps) {
  const modes = showInherit
    ? [INHERIT_MODE, ...AUTONOMY_MODES]
    : AUTONOMY_MODES;

  const currentMode = modes.find((m) => m.mode === value) ?? modes[0];

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {modes.map((modeInfo) => {
          const Icon = modeInfo.icon;
          const isActive = value === modeInfo.mode;
          return (
            <Button
              key={String(modeInfo.mode)}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(modeInfo.mode)}
              className={cn(
                "gap-1.5 flex-1 transition-all",
                isActive && modeInfo.activeClasses,
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs">{modeInfo.label}</span>
            </Button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">{currentMode.description}</p>
    </div>
  );
}
