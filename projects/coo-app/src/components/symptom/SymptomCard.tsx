import { View, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SymptomLog } from "@/types/database";
import { SYMPTOM_COLOR, symptomEmoji, symptomLabel } from "@/constants/symptoms";
import { formatTime } from "@/lib/dates";
import { useBabyStore } from "@/stores/babyStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useThemeColors } from "@/hooks/useThemeColors";

interface SymptomCardProps {
  symptom: SymptomLog;
  onPress?: () => void;
}

export function SymptomCard({ symptom, onPress }: SymptomCardProps) {
  const { colors } = useThemeColors();
  const caregivers = useBabyStore((s) => s.caregivers);
  const timeFormat = useSettingsStore((s) => s.timeFormat);

  const caregiver = caregivers.find((c) => c.id === symptom.loggedBy);

  const severityText =
    symptom.severity === "mild"
      ? "Mild"
      : symptom.severity === "moderate"
        ? "Moderate"
        : "Severe";

  return (
    <Pressable
      onPress={onPress}
      className="bg-coo-surface dark:bg-coo-surface-dark rounded-md p-base flex-row"
    >
      {/* Coral left accent */}
      <View
        className="w-1 rounded-full mr-3 self-stretch"
        style={{ backgroundColor: SYMPTOM_COLOR }}
      />
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="text-body mr-1.5">
            {symptomEmoji(symptom.symptomType)}
          </Text>
          <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark flex-1">
            {formatTime(symptom.occurredAt, timeFormat === "24h")}{" "}
            <Text className="font-medium">
              {symptomLabel(symptom.symptomType)}
            </Text>
          </Text>
        </View>

        <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mt-1 ml-5">
          {severityText}
        </Text>

        <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark mt-1 ml-5">
          Logged by {caregiver?.name ?? "Unknown"}
        </Text>

        {symptom.notes && (
          <View className="flex-row items-start mt-1 ml-5">
            <Ionicons
              name="document-text-outline"
              size={12}
              color={colors.textTertiary}
            />
            <Text
              className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark ml-1 flex-1"
              numberOfLines={1}
            >
              {symptom.notes}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
