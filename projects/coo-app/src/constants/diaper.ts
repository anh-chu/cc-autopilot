import type { DiaperContent } from "@/types/database";

export interface DiaperOption {
  id: DiaperContent;
  label: string;
  emoji: string;
}

export const DIAPER_CONTENT_OPTIONS: DiaperOption[] = [
  { id: "pee", label: "Wet", emoji: "\uD83D\uDCA7" },
  { id: "poop", label: "Dirty", emoji: "\uD83D\uDCA9" },
  { id: "both", label: "Wet+Dirty", emoji: "\uD83D\uDCA7\uD83D\uDCA9" },
  { id: "dry", label: "Dry", emoji: "\u2B55" },
];

export const DIAPER_COLOR = "#E8C96B";

export function diaperEmoji(content: DiaperContent): string {
  return DIAPER_CONTENT_OPTIONS.find((o) => o.id === content)?.emoji ?? "🧷";
}

export function diaperLabel(content: DiaperContent): string {
  return DIAPER_CONTENT_OPTIONS.find((o) => o.id === content)?.label ?? content;
}
