import { View, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { DiaperLog } from "@/types/database";
import { diaperEmoji, diaperLabel, DIAPER_COLOR } from "@/constants/diaper";
import { formatTime } from "@/lib/dates";
import { useBabyStore } from "@/stores/babyStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useThemeColors } from "@/hooks/useThemeColors";

interface DiaperCardProps {
  diaper: DiaperLog;
  onPress?: () => void;
}

export function DiaperCard({ diaper, onPress }: DiaperCardProps) {
  const { colors } = useThemeColors();
  const caregivers = useBabyStore((s) => s.caregivers);
  const timeFormat = useSettingsStore((s) => s.timeFormat);

  const caregiver = caregivers.find((c) => c.id === diaper.loggedBy);

  return (
    <Pressable
      onPress={onPress}
      className="bg-coo-surface dark:bg-coo-surface-dark rounded-md p-base flex-row"
    >
      {/* Yellow left accent */}
      <View
        className="w-1 rounded-full mr-3 self-stretch"
        style={{ backgroundColor: DIAPER_COLOR }}
      />
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="text-body mr-1.5">{diaperEmoji(diaper.content)}</Text>
          <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark flex-1">
            {formatTime(diaper.occurredAt, timeFormat === "24h")}{" "}
            <Text className="font-medium">{diaperLabel(diaper.content)}</Text>
          </Text>
        </View>

        <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark mt-1">
          Logged by {caregiver?.name ?? "Unknown"}
        </Text>

        {diaper.notes && (
          <View className="flex-row items-start mt-1">
            <Ionicons name="document-text-outline" size={12} color={colors.textTertiary} />
            <Text
              className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark ml-1 flex-1"
              numberOfLines={1}
            >
              {diaper.notes}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
