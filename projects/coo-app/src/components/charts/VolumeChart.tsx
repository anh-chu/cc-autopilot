import { View, Text } from "react-native";
import Svg, { Rect, G, Line } from "react-native-svg";
import type { FeedingLog } from "@/types/database";
import { FeedingTypeColors } from "@/constants/theme";
import { formatVolume, fromCanonicalMl } from "@/lib/units";
import { format, startOfDay, eachDayOfInterval, subDays } from "date-fns";
import type { VolumeUnit } from "@/types/database";
import { useThemeColors } from "@/hooks/useThemeColors";

interface VolumeChartProps {
  feedings: FeedingLog[];
  days: number;
  unit: VolumeUnit;
}

export function VolumeChart({ feedings, days, unit }: VolumeChartProps) {
  const { colors } = useThemeColors();
  const today = startOfDay(new Date());
  const startDate = subDays(today, days - 1);
  const dateRange = eachDayOfInterval({ start: startDate, end: today });

  // Aggregate volume per day per type
  const dailyData = dateRange.map((day) => {
    const dayStart = day.getTime();
    const dayEnd = dayStart + 86400000;
    const dayFeeds = feedings.filter(
      (f) => f.startedAt >= dayStart && f.startedAt < dayEnd
    );

    const byType = {
      breast: 0,
      bottle: 0,
      solid: 0,
      pump: 0,
    };

    for (const f of dayFeeds) {
      if (f.amountMl) {
        byType[f.feedingType] += f.amountMl;
      }
    }

    const total = Object.values(byType).reduce((s, v) => s + v, 0);
    return { day, byType, total, label: format(day, "EEE") };
  });

  const maxVolume = Math.max(...dailyData.map((d) => d.total), 1);

  const chartWidth = 320;
  const chartHeight = 160;
  const barWidth = (chartWidth / dateRange.length) * 0.7;
  const barGap = (chartWidth / dateRange.length) * 0.3;

  return (
    <View>
      <View className="flex-row items-end" style={{ height: chartHeight + 30 }}>
        <Svg width={chartWidth} height={chartHeight + 30}>
          {/* Horizontal grid lines */}
          {[0.25, 0.5, 0.75, 1.0].map((frac) => (
            <Line
              key={frac}
              x1={0}
              y1={chartHeight * (1 - frac)}
              x2={chartWidth}
              y2={chartHeight * (1 - frac)}
              stroke={colors.divider}
              strokeWidth={0.5}
            />
          ))}

          {dailyData.map((d, i) => {
            const x = i * (barWidth + barGap) + barGap / 2;
            let yOffset = 0;

            const types = ["breast", "bottle", "solid", "pump"] as const;
            return (
              <G key={i}>
                {types.map((type) => {
                  const val = d.byType[type];
                  if (val === 0) return null;
                  const height = (val / maxVolume) * chartHeight;
                  const y = chartHeight - yOffset - height;
                  yOffset += height;
                  return (
                    <Rect
                      key={type}
                      x={x}
                      y={y}
                      width={barWidth}
                      height={height}
                      rx={3}
                      fill={FeedingTypeColors[type]}
                      opacity={0.85}
                    />
                  );
                })}
              </G>
            );
          })}
        </Svg>
      </View>

      {/* Day labels */}
      <View className="flex-row mt-1">
        {dailyData.map((d, i) => (
          <Text
            key={i}
            className="text-[10px] text-coo-text-tertiary dark:text-coo-text-tertiary-dark text-center"
            style={{ width: barWidth + barGap }}
          >
            {d.label}
          </Text>
        ))}
      </View>

      {/* Average */}
      {dailyData.length > 0 && (
        <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mt-2">
          Avg:{" "}
          {formatVolume(
            dailyData.reduce((s, d) => s + d.total, 0) / dailyData.length,
            unit
          )}
          /day
        </Text>
      )}
    </View>
  );
}
