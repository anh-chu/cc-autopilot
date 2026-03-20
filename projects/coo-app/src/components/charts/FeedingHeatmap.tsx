import { View, Text } from "react-native";
import Svg, { Rect } from "react-native-svg";
import type { FeedingLog } from "@/types/database";
import { format, startOfWeek, eachDayOfInterval, subDays } from "date-fns";

interface FeedingHeatmapProps {
  feedings: FeedingLog[];
  weeks: number;
}

const HOUR_LABELS = [
  "12a", "2a", "4a", "6a", "8a", "10a",
  "12p", "2p", "4p", "6p", "8p", "10p",
];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function FeedingHeatmap({ feedings, weeks }: FeedingHeatmapProps) {
  const cellSize = 22;
  const gap = 2;
  const labelOffsetX = 30;
  const labelOffsetY = 16;

  // Build grid: 12 rows (2-hour blocks) x 7 columns (days of week)
  const grid: number[][] = Array.from({ length: 12 }, () =>
    Array(7).fill(0)
  );

  const cutoff = Date.now() - weeks * 7 * 86400000;
  const relevantFeeds = feedings.filter((f) => f.startedAt >= cutoff);

  for (const f of relevantFeeds) {
    const date = new Date(f.startedAt);
    const hour = date.getHours();
    const row = Math.floor(hour / 2);
    const dayOfWeek = (date.getDay() + 6) % 7; // Monday=0
    grid[row][dayOfWeek]++;
  }

  const maxCount = Math.max(...grid.flat(), 1);

  function getOpacity(count: number): number {
    if (count === 0) return 0.1;
    return 0.2 + (count / maxCount) * 0.8;
  }

  const svgWidth = labelOffsetX + 7 * (cellSize + gap);
  const svgHeight = labelOffsetY + 12 * (cellSize + gap);

  return (
    <View>
      <Svg width={svgWidth} height={svgHeight}>
        {/* Day labels */}
        {DAY_LABELS.map((day, col) => (
          <Rect key={`label-${day}`} x={0} y={0} width={0} height={0}>
            {/* Labels rendered below as Text components */}
          </Rect>
        ))}

        {/* Cells */}
        {grid.map((row, rowIdx) =>
          row.map((count, colIdx) => (
            <Rect
              key={`${rowIdx}-${colIdx}`}
              x={labelOffsetX + colIdx * (cellSize + gap)}
              y={labelOffsetY + rowIdx * (cellSize + gap)}
              width={cellSize}
              height={cellSize}
              rx={4}
              fill="#7BAE8E"
              opacity={getOpacity(count)}
            />
          ))
        )}
      </Svg>

      {/* Day labels overlay */}
      <View
        className="absolute flex-row"
        style={{ left: labelOffsetX, top: 0 }}
      >
        {DAY_LABELS.map((day, i) => (
          <Text
            key={day}
            className="text-[9px] text-coo-text-tertiary dark:text-coo-text-tertiary-dark text-center"
            style={{ width: cellSize + gap }}
          >
            {day.charAt(0) + day.charAt(1)}
          </Text>
        ))}
      </View>

      {/* Hour labels overlay */}
      <View className="absolute" style={{ top: labelOffsetY }}>
        {HOUR_LABELS.map((label, i) => (
          <Text
            key={label}
            className="text-[9px] text-coo-text-tertiary dark:text-coo-text-tertiary-dark"
            style={{ height: cellSize + gap, lineHeight: cellSize + gap }}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}
