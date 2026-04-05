import type { Action, Initiative, Workspace, AutonomyLevel } from "./types";

// Cascade: action.autonomyOverride > initiative.autonomyLevel > workspace.settings.autonomyLevel
export function resolveAutonomyLevel(
  action: Pick<Action, "autonomyOverride">,
  initiative: Pick<Initiative, "autonomyLevel"> | null,
  workspace: Pick<Workspace["settings"], "autonomyLevel">
): AutonomyLevel {
  if (action.autonomyOverride !== null) return action.autonomyOverride;
  if (initiative?.autonomyLevel !== null && initiative?.autonomyLevel !== undefined) {
    return initiative.autonomyLevel;
  }
  return workspace.autonomyLevel;
}
