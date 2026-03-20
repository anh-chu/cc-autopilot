import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { FeedingLog, DiaperLog, SymptomLog } from "@/types/database";
import { FeedingTypeColors, FeedingTypeLabels } from "@/constants/theme";
import { DIAPER_COLOR, diaperEmoji, diaperLabel } from "@/constants/diaper";
import { SYMPTOM_COLOR, symptomEmoji, symptomLabel } from "@/constants/symptoms";
import { formatTime, formatDuration } from "@/lib/dates";
import { formatVolume } from "@/lib/units";
import { useSettingsStore } from "@/stores/settingsStore";
import { useThemeColors } from "@/hooks/useThemeColors";

interface ActivityRowProps {
  event: FeedingLog | DiaperLog | SymptomLog;
  type: "feeding" | "diaper" | "symptom";
  linkedSymptoms?: SymptomLog[];
  linkedDiapers?: DiaperLog[];
  isLast?: boolean;
  onPress?: () => void;
}

export function ActivityRow({
  event,
  type,
  linkedSymptoms,
  linkedDiapers,
  isLast,
  onPress,
}: ActivityRowProps) {
  const { colors } = useThemeColors();
  const unitVolume = useSettingsStore((s) => s.unitVolume);
  const timeFormat = useSettingsStore((s) => s.timeFormat);
  const is24h = timeFormat === "24h";

  const timestamp =
    type === "feeding"
      ? (event as FeedingLog).startedAt
      : type === "diaper"
        ? (event as DiaperLog).occurredAt
        : (event as SymptomLog).occurredAt;

  return (
    <Pressable onPress={onPress} className="px-base">
      {/* Time label */}
      <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mb-1 mt-3">
        {formatTime(timestamp, is24h)}
      </Text>

      {/* Event line */}
      {type === "feeding" && <FeedingRow feeding={event as FeedingLog} is24h={is24h} unitVolume={unitVolume} />}
      {type === "diaper" && <DiaperRow diaper={event as DiaperLog} />}
      {type === "symptom" && <SymptomRow symptom={event as SymptomLog} />}

      {/* Notes indicator */}
      {event.notes && (
        <View className="flex-row items-center mt-1 ml-[22px]">
          <Ionicons name="document-text-outline" size={11} color={colors.textTertiary} />
          <Text
            className="text-caption-sm text-coo-text-tertiary dark:text-coo-text-tertiary-dark ml-1"
            numberOfLines={1}
          >
            {event.notes}
          </Text>
        </View>
      )}

      {/* Linked sub-events (only for feedings) */}
      {linkedDiapers && linkedDiapers.length > 0 && (
        <View className="ml-[22px] mt-1.5">
          {linkedDiapers.map((d) => (
            <View key={d.id} className="flex-row items-center mb-0.5">
              <View
                className="w-[6px] h-[6px] rounded-full mr-1.5"
                style={{ backgroundColor: DIAPER_COLOR }}
              />
              <Text className="text-caption-sm text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
                {diaperEmoji(d.content)} {diaperLabel(d.content)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {linkedSymptoms && linkedSymptoms.length > 0 && (
        <View className="ml-[22px] mt-1.5">
          {linkedSymptoms.map((s) => (
            <View key={s.id} className="flex-row items-center mb-0.5">
              <View
                className="w-[6px] h-[6px] rounded-full mr-1.5"
                style={{ backgroundColor: SYMPTOM_COLOR }}
              />
              <Text className="text-caption-sm text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
                {symptomEmoji(s.symptomType)} {symptomLabel(s.symptomType)}
                {s.severity !== "mild" ? ` (${s.severity})` : ""}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Divider */}
      {!isLast && (
        <View className="h-[1px] bg-coo-divider dark:bg-coo-divider-dark mt-3" />
      )}
      {isLast && <View className="h-3" />}
    </Pressable>
  );
}

// ─── Sub-components ─────────────────────────────────────────

function FeedingRow({
  feeding,
  is24h,
  unitVolume,
}: {
  feeding: FeedingLog;
  is24h: boolean;
  unitVolume: "oz" | "ml";
}) {
  const color = FeedingTypeColors[feeding.feedingType];
  const label = FeedingTypeLabels[feeding.feedingType];

  const sideText =
    feeding.side && feeding.side !== "both"
      ? ` (${feeding.side.charAt(0).toUpperCase() + feeding.side.slice(1)})`
      : feeding.side === "both"
        ? " (Both)"
        : "";

  const metrics: string[] = [];
  if (feeding.durationSeconds) metrics.push(formatDuration(feeding.durationSeconds));
  if (feeding.amountMl) metrics.push(formatVolume(feeding.amountMl, unitVolume));

  return (
    <View>
      <View className="flex-row items-center">
        <View
          className="w-[10px] h-[10px] rounded-full mr-3"
          style={{ backgroundColor: color }}
        />
        <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark font-medium flex-1">
          {label}
          {sideText}
        </Text>
        {metrics.length > 0 && (
          <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark">
            {metrics.join(" · ")}
          </Text>
        )}
      </View>

      {/* Detail sub-line: formula brand or solid description */}
      {(feeding.formulaBrand || feeding.solidDescription) && (
        <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark mt-0.5 ml-[22px]">
          {feeding.formulaBrand || feeding.solidDescription}
        </Text>
      )}
    </View>
  );
}

function DiaperRow({ diaper }: { diaper: DiaperLog }) {
  return (
    <View className="flex-row items-center">
      <View
        className="w-[10px] h-[10px] rounded-full mr-3"
        style={{ backgroundColor: DIAPER_COLOR }}
      />
      <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark font-medium">
        {diaperEmoji(diaper.content)} {diaperLabel(diaper.content)}
      </Text>
    </View>
  );
}

function SymptomRow({ symptom }: { symptom: SymptomLog }) {
  const severityText =
    symptom.severity === "mild"
      ? "Mild"
      : symptom.severity === "moderate"
        ? "Moderate"
        : "Severe";

  return (
    <View className="flex-row items-center">
      <View
        className="w-[10px] h-[10px] rounded-full mr-3"
        style={{ backgroundColor: SYMPTOM_COLOR }}
      />
      <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark font-medium flex-1">
        {symptomEmoji(symptom.symptomType)} {symptomLabel(symptom.symptomType)}
      </Text>
      <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark">
        {severityText}
      </Text>
    </View>
  );
}
