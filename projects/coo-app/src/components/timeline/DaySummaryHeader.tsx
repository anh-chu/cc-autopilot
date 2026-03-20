import { View, Text } from "react-native";
import { formatDate } from "@/lib/dates";
import { FeedingTypeColors } from "@/constants/theme";
import { DIAPER_COLOR } from "@/constants/diaper";
import { SYMPTOM_COLOR } from "@/constants/symptoms";

interface DaySummaryHeaderProps {
  date: Date;
  feedCount: number;
  diaperCount: number;
  symptomCount: number;
}

export function DaySummaryHeader({
  date,
  feedCount,
  diaperCount,
  symptomCount,
}: DaySummaryHeaderProps) {
  const summaryItems: { color: string; count: number }[] = [];
  if (feedCount > 0)
    summaryItems.push({ color: FeedingTypeColors.breast, count: feedCount });
  if (diaperCount > 0)
    summaryItems.push({ color: DIAPER_COLOR, count: diaperCount });
  if (symptomCount > 0)
    summaryItems.push({ color: SYMPTOM_COLOR, count: symptomCount });

  return (
    <View className="flex-row items-center justify-between mb-2 px-1">
      <Text className="text-heading-md text-coo-text-primary dark:text-coo-text-primary-dark font-semibold">
        {formatDate(date)}
      </Text>
      {summaryItems.length > 0 && (
        <View className="flex-row items-center gap-3">
          {summaryItems.map(({ color, count }, i) => (
            <View key={i} className="flex-row items-center gap-1">
              <View
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
                {count}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
