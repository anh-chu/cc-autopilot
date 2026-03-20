import { View, Text } from "react-native";
import Svg, { Rect } from "react-native-svg";
import type { FeedingLog } from "@/types/database";
import { useThemeColors } from "@/hooks/useThemeColors";

interface SideDistributionProps {
  feedings: FeedingLog[];
}

export function SideDistribution({ feedings }: SideDistributionProps) {
  const { colors } = useThemeColors();
  const breastFeeds = feedings.filter(
    (f) =>
      (f.feedingType === "breast" || f.feedingType === "pump") && f.side
  );

  let left = 0;
  let right = 0;
  for (const f of breastFeeds) {
    if (f.side === "left") left++;
    else if (f.side === "right") right++;
    else if (f.side === "both") {
      left++;
      right++;
    }
  }

  const total = left + right;
  if (total === 0) {
    return (
      <View className="items-center py-4">
        <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
          No breast/pump feeds logged yet
        </Text>
      </View>
    );
  }

  const leftPct = Math.round((left / total) * 100);
  const rightPct = 100 - leftPct;
  const barWidth = 280;

  const isBalanced = leftPct >= 40 && leftPct <= 60;
  const statusColor = isBalanced ? "#5CB07A" : "#E8A545";
  const statusText = isBalanced
    ? "Good balance"
    : leftPct > 60
      ? "Favoring left side"
      : "Favoring right side";

  return (
    <View>
      <View className="flex-row justify-between mb-1">
        <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark">
          Left {leftPct}%
        </Text>
        <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark">
          Right {rightPct}%
        </Text>
      </View>

      <Svg width={barWidth} height={16}>
        <Rect
          x={0}
          y={0}
          width={barWidth}
          height={16}
          rx={8}
          fill={colors.divider}
        />
        <Rect
          x={0}
          y={0}
          width={(leftPct / 100) * barWidth}
          height={16}
          rx={8}
          fill="#7BAE8E"
          opacity={0.9}
        />
      </Svg>

      <Text
        className="text-caption mt-1"
        style={{ color: statusColor }}
      >
        {statusText}
      </Text>
    </View>
  );
}
