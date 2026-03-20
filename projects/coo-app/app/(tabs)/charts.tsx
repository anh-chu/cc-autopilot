import { View, Text, ScrollView, Pressable } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBabyStore } from "@/stores/babyStore";
import { useFeedingStore } from "@/stores/feedingStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { VolumeChart } from "@/components/charts/VolumeChart";
import { FeedCountChart } from "@/components/charts/FeedCountChart";
import { SideDistribution } from "@/components/charts/SideDistribution";
import { FeedingHeatmap } from "@/components/charts/FeedingHeatmap";
import { Card } from "@/components/ui/Card";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/useThemeColors";

type TimeRange = "day" | "week" | "month";

const RANGE_DAYS: Record<TimeRange, number> = {
  day: 1,
  week: 7,
  month: 30,
};

export default function ChartsScreen() {
  const { colors } = useThemeColors();
  const [range, setRange] = useState<TimeRange>("week");
  const baby = useBabyStore((s) => s.getActiveBaby());
  const getRecentFeedings = useFeedingStore((s) => s.getRecentFeedings);
  const unitVolume = useSettingsStore((s) => s.unitVolume);

  if (!baby) {
    return (
      <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark items-center justify-center">
        <Text className="text-body text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
          Add a baby to see charts
        </Text>
      </SafeAreaView>
    );
  }

  const days = RANGE_DAYS[range];
  const feedings = getRecentFeedings(baby.id, days);

  const ranges: { value: TimeRange; label: string }[] = [
    { value: "day", label: "Day" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
  ];

  const hasData = feedings.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark">
      {/* Header */}
      <View className="flex-row items-center justify-between px-base pt-base pb-2">
        <Text className="text-heading-lg text-coo-text-primary dark:text-coo-text-primary-dark font-semibold">
          Charts
        </Text>
        <View className="flex-row bg-coo-surface dark:bg-coo-surface-dark rounded-md overflow-hidden">
          {ranges.map(({ value, label }) => (
            <Pressable
              key={value}
              onPress={() => setRange(value)}
              className={`px-4 py-1.5 ${
                range === value ? "bg-coo-primary" : ""
              }`}
            >
              <Text
                className={`text-caption font-medium ${
                  range === value
                    ? "text-white"
                    : "text-coo-text-secondary dark:text-coo-text-secondary-dark"
                }`}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1 px-base" contentContainerClassName="pb-lg">
        {!hasData ? (
          <View className="items-center justify-center py-2xl">
            <Ionicons name="bar-chart-outline" size={48} color={colors.textTertiary} />
            <Text className="text-body text-coo-text-tertiary dark:text-coo-text-tertiary-dark mt-base text-center">
              Log feeds for {days}+ days{"\n"}to see trends here
            </Text>
          </View>
        ) : (
          <>
            {/* Feeding Volume */}
            <Card className="mt-base">
              <Text className="text-body text-coo-text-secondary dark:text-coo-text-secondary-dark font-medium mb-3">
                Feeding Volume
              </Text>
              <VolumeChart
                feedings={feedings}
                days={days}
                unit={unitVolume}
              />
            </Card>

            {/* Feed Count */}
            <Card className="mt-base">
              <Text className="text-body text-coo-text-secondary dark:text-coo-text-secondary-dark font-medium mb-3">
                Feed Count
              </Text>
              <FeedCountChart feedings={feedings} days={days} />
            </Card>

            {/* Feeding Heatmap (week/month only) */}
            {range !== "day" && (
              <Card className="mt-base">
                <Text className="text-body text-coo-text-secondary dark:text-coo-text-secondary-dark font-medium mb-3">
                  Feeding Pattern
                </Text>
                <FeedingHeatmap
                  feedings={feedings}
                  weeks={range === "week" ? 1 : 4}
                />
              </Card>
            )}

            {/* Side Distribution */}
            <Card className="mt-base">
              <Text className="text-body text-coo-text-secondary dark:text-coo-text-secondary-dark font-medium mb-3">
                Breast Side Balance
              </Text>
              <SideDistribution feedings={feedings} />
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
