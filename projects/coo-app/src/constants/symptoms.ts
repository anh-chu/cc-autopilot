export interface SymptomDefinition {
  id: string;
  label: string;
  emoji: string;
}

export const PRESET_SYMPTOMS: SymptomDefinition[] = [
  { id: "fussiness", label: "Fussiness", emoji: "\uD83D\uDE23" },
  { id: "gas", label: "Gas", emoji: "\uD83D\uDCA8" },
  { id: "spit_up", label: "Spit-up", emoji: "\uD83E\uDD22" },
  { id: "rash", label: "Rash", emoji: "\uD83D\uDD34" },
  { id: "diarrhea", label: "Diarrhea", emoji: "\uD83D\uDCA9" },
  { id: "congestion", label: "Congestion", emoji: "\uD83E\uDD27" },
  { id: "poor_latch", label: "Poor latch", emoji: "\uD83D\uDE29" },
  { id: "crying", label: "Crying", emoji: "\uD83D\uDE2D" },
  { id: "vomiting", label: "Vomiting", emoji: "\uD83E\uDD2E" },
  { id: "constipation", label: "Constipation", emoji: "\uD83D\uDEAB" },
  { id: "reflux", label: "Reflux", emoji: "\u2B06\uFE0F" },
  { id: "hiccups", label: "Hiccups", emoji: "\uD83D\uDE2F" },
];

export const SYMPTOM_COLOR = "#F4A88C";

export function symptomEmoji(symptomType: string): string {
  return PRESET_SYMPTOMS.find((s) => s.id === symptomType)?.emoji ?? "?";
}

export function symptomLabel(symptomType: string): string {
  return PRESET_SYMPTOMS.find((s) => s.id === symptomType)?.label ?? symptomType;
}
