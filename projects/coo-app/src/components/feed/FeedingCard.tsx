import { View, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { FeedingLog, SymptomLog, DiaperLog } from "@/types/database";
import { FeedingTypeColors, FeedingTypeLabels } from "@/constants/theme";
import { formatTime, formatDuration } from "@/lib/dates";
import { formatVolume } from "@/lib/units";
import { useBabyStore } from "@/stores/babyStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useThemeColors } from "@/hooks/useThemeColors";
import { LinkedEventBadges } from "./LinkedEventBadges";

interface FeedingCardProps {
  feeding: FeedingLog;
  linkedSymptoms?: SymptomLog[];
  linkedDiapers?: DiaperLog[];
  onPress?: () => void;
  showDate?: boolean;
}

export function FeedingCard({ feeding, linkedSymptoms, linkedDiapers, onPress, showDate }: FeedingCardProps) {
  const { colors } = useThemeColors();
  const caregivers = useBabyStore((s) => s.caregivers);
  const unitVolume = useSettingsStore((s) => s.unitVolume);
  const timeFormat = useSettingsStore((s) => s.timeFormat);

  const caregiver = caregivers.find((c) => c.id === feeding.loggedBy);
  const color = FeedingTypeColors[feeding.feedingType];

  const sideText =
    feeding.side && feeding.side !== "both"
      ? ` (${feeding.side.charAt(0).toUpperCase() + feeding.side.slice(1)})`
      : feeding.side === "both"
        ? " (Both)"
        : "";

  const details: string[] = [];
  if (feeding.durationSeconds) {
    details.push(formatDuration(feeding.durationSeconds));
  }
  if (feeding.amountMl) {
    details.push(formatVolume(feeding.amountMl, unitVolume));
  }
  if (feeding.formulaBrand) {
    details.push(feeding.formulaBrand);
  }
  if (feeding.solidDescription) {
    details.push(feeding.solidDescription);
  }

  return (
    <Pressable
      onPress={onPress}
      className="bg-coo-surface dark:bg-coo-surface-dark rounded-md p-base"
    >
      <View className="flex-row items-center">
        <View
          className="w-3 h-3 rounded-full mr-2"
          style={{ backgroundColor: color }}
        />
        <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark flex-1">
          {formatTime(feeding.startedAt, timeFormat === "24h")}{" "}
          <Text className="font-medium">
            {FeedingTypeLabels[feeding.feedingType]}
          </Text>
          {sideText}
        </Text>
      </View>

      {details.length > 0 && (
        <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mt-1 ml-5">
          {details.join(" \u00B7 ")}
        </Text>
      )}

      <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark mt-1 ml-5">
        Logged by {caregiver?.name ?? "Unknown"}
      </Text>

      {feeding.notes && (
        <View className="flex-row items-start mt-1 ml-5">
          <Ionicons name="document-text-outline" size={12} color={colors.textTertiary} />
          <Text
            className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark ml-1 flex-1"
            numberOfLines={1}
          >
            {feeding.notes}
          </Text>
        </View>
      )}

      <LinkedEventBadges
        symptoms={linkedSymptoms ?? []}
        diapers={linkedDiapers ?? []}
      />
    </Pressable>
  );
}
