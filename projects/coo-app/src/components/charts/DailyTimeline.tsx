import React, { useState } from "react";
import { View } from "react-native";
import Svg, { Circle, Line, Rect, Text as SvgText, Polygon } from "react-native-svg";
import type { FeedingLog, DiaperLog, SymptomLog } from "@/types/database";
import { FeedingTypeColors } from "@/constants/theme";
import { DIAPER_COLOR } from "@/constants/diaper";
import { SYMPTOM_COLOR } from "@/constants/symptoms";
import { useThemeColors } from "@/hooks/useThemeColors";

interface DailyTimelineProps {
  feedings: FeedingLog[];
  diapers?: DiaperLog[];
  symptoms?: SymptomLog[];
  date: Date;
}

const BAR_HEIGHT = 48;
const LABEL_AREA = 18;
const SVG_HEIGHT = BAR_HEIGHT + LABEL_AREA + 8;
const BAR_ROUNDING = 10;
const BAR_TOP = 6;
const MIN_BAR_H = 8;
const MAX_BAR_H = BAR_HEIGHT - 8;
const BAR_W = 10;

function getMagnitude(f: FeedingLog): number {
  if (f.amountMl != null && f.amountMl > 0) return f.amountMl;
  if (f.durationSeconds != null && f.durationSeconds > 0) return f.durationSeconds / 60;
  return 30;
}

function getHourFrac(timestamp: number): number {
  const d = new Date(timestamp);
  return d.getHours() + d.getMinutes() / 60;
}

export function DailyTimeline({
  feedings,
  diapers = [],
  symptoms = [],
  date,
}: DailyTimelineProps) {
  const { colors } = useThemeColors();
  const [barWidth, setBarWidth] = useState(0);

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const currentHourFrac = isToday
    ? now.getHours() + now.getMinutes() / 60
    : -1;

  const magnitudes = feedings.map(getMagnitude);
  const maxMag = Math.max(120, ...magnitudes);

  // 6-hour grid lines only
  const gridHours = [6, 12, 18];
  const labelHours = [0, 6, 12, 18];

  return (
    <View onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}>
      {barWidth > 0 && (
        <Svg width={barWidth} height={SVG_HEIGHT}>
          {/* Background bar */}
          <Rect
            x={0}
            y={BAR_TOP}
            width={barWidth}
            height={BAR_HEIGHT}
            rx={BAR_ROUNDING}
            fill={colors.surface}
          />

          {/* Subtle 6-hour grid lines */}
          {gridHours.map((h) => {
            const x = (h / 24) * barWidth;
            return (
              <Line
                key={h}
                x1={x}
                y1={BAR_TOP + 4}
                x2={x}
                y2={BAR_TOP + BAR_HEIGHT - 4}
                stroke={colors.divider}
                strokeWidth={0.5}
                opacity={0.6}
              />
            );
          })}

          {/* Feeding bars (proportional height) */}
          {feedings.map((f, i) => {
            const hourFrac = getHourFrac(f.startedAt);
            const x = (hourFrac / 24) * barWidth;

            const ratio = magnitudes[i] / maxMag;
            const barH = Math.max(MIN_BAR_H, Math.round(ratio * MAX_BAR_H));
            const barY = BAR_TOP + (BAR_HEIGHT - barH) / 2;

            return (
              <Rect
                key={f.id}
                x={x - BAR_W / 2}
                y={barY}
                width={BAR_W}
                height={barH}
                rx={3}
                fill={FeedingTypeColors[f.feedingType]}
                opacity={0.85}
              />
            );
          })}

          {/* Diaper markers (bottom edge) */}
          {diapers.map((d) => {
            const hourFrac = getHourFrac(d.occurredAt);
            const cx = (hourFrac / 24) * barWidth;
            return (
              <Circle
                key={`diaper-${d.id}`}
                cx={cx}
                cy={BAR_TOP + BAR_HEIGHT - 7}
                r={5}
                fill={DIAPER_COLOR}
                opacity={0.8}
              />
            );
          })}

          {/* Symptom markers (top edge) */}
          {symptoms.map((s) => {
            const hourFrac = getHourFrac(s.occurredAt);
            const cx = (hourFrac / 24) * barWidth;
            return (
              <Circle
                key={`symptom-${s.id}`}
                cx={cx}
                cy={BAR_TOP + 7}
                r={5}
                fill={SYMPTOM_COLOR}
                opacity={0.8}
              />
            );
          })}

          {/* Current time marker — solid line with triangle */}
          {currentHourFrac >= 0 && (() => {
            const x = (currentHourFrac / 24) * barWidth;
            return (
              <React.Fragment>
                <Line
                  x1={x}
                  y1={BAR_TOP}
                  x2={x}
                  y2={BAR_TOP + BAR_HEIGHT}
                  stroke={colors.textPrimary}
                  strokeWidth={1.5}
                  opacity={0.7}
                />
                <Polygon
                  points={`${x - 4},${BAR_TOP} ${x + 4},${BAR_TOP} ${x},${BAR_TOP + 5}`}
                  fill={colors.textPrimary}
                  opacity={0.7}
                />
              </React.Fragment>
            );
          })()}

          {/* Hour labels — only 4 labels for clean look */}
          {labelHours.map((h) => {
            const x = h === 0 ? 8 : (h / 24) * barWidth;
            const anchor = h === 0 ? "start" : "middle";
            const label =
              h === 0 ? "12a" : h === 6 ? "6a" : h === 12 ? "12p" : "6p";
            return (
              <SvgText
                key={`label-${h}`}
                x={x}
                y={BAR_TOP + BAR_HEIGHT + LABEL_AREA - 2}
                fontSize={11}
                fill={colors.textTertiary}
                textAnchor={anchor}
                opacity={0.7}
              >
                {label}
              </SvgText>
            );
          })}
        </Svg>
      )}
    </View>
  );
}
