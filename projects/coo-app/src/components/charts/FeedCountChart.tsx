import { View, Text } from "react-native";
import Svg, { Circle, Polyline, Line } from "react-native-svg";
import type { FeedingLog } from "@/types/database";
import { format, startOfDay, eachDayOfInterval, subDays } from "date-fns";
import { useThemeColors } from "@/hooks/useThemeColors";

interface FeedCountChartProps {
  feedings: FeedingLog[];
  days: number;
}

export function FeedCountChart({ feedings, days }: FeedCountChartProps) {
  const { colors } = useThemeColors();
  const today = startOfDay(new Date());
  const startDate = subDays(today, days - 1);
  const dateRange = eachDayOfInterval({ start: startDate, end: today });

  const dailyCounts = dateRange.map((day) => {
    const dayStart = day.getTime();
    const dayEnd = dayStart + 86400000;
    const count = feedings.filter(
      (f) => f.startedAt >= dayStart && f.startedAt < dayEnd
    ).length;
    return { day, count, label: format(day, "EEE") };
  });

  const maxCount = Math.max(...dailyCounts.map((d) => d.count), 1);
  const chartWidth = 320;
  const chartHeight = 120;
  const padding = 10;

  const points = dailyCounts.map((d, i) => {
    const x = padding + (i / (dateRange.length - 1 || 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - (d.count / maxCount) * (chartHeight - padding * 2);
    return { x, y, count: d.count };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const avg =
    dailyCounts.reduce((s, d) => s + d.count, 0) / dailyCounts.length;

  return (
    <View>
      <Svg width={chartWidth} height={chartHeight}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((frac) => (
          <Line
            key={frac}
            x1={padding}
            y1={chartHeight - padding - frac * (chartHeight - padding * 2)}
            x2={chartWidth - padding}
            y2={chartHeight - padding - frac * (chartHeight - padding * 2)}
            stroke={colors.divider}
            strokeWidth={0.5}
          />
        ))}

        {/* Line */}
        {points.length > 1 && (
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke="#7BAE8E"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        )}

        {/* Dots */}
        {points.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="#7BAE8E"
            stroke={colors.background}
            strokeWidth={2}
          />
        ))}
      </Svg>

      {/* Day labels */}
      <View className="flex-row justify-between px-[10px]">
        {dailyCounts.map((d, i) => (
          <Text
            key={i}
            className="text-[10px] text-coo-text-tertiary dark:text-coo-text-tertiary-dark text-center"
          >
            {d.label}
          </Text>
        ))}
      </View>

      <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mt-2">
        Avg: {avg.toFixed(1)} feeds/day
      </Text>
    </View>
  );
}
