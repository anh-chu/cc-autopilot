import { View, Text } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import type { HungryMeterResult } from "@/lib/hungryMeter";
import { Colors } from "@/constants/theme";
import { useThemeColors } from "@/hooks/useThemeColors";

interface HungryMeterGaugeProps {
  result: HungryMeterResult;
  size?: number;
}

const ZONE_COLORS = {
  green: Colors.status.fed,
  yellow: Colors.status.approaching,
  coral: Colors.status.overdue,
};

const ZONE_LABELS = {
  green: "Fed",
  yellow: "Getting hungry",
  coral: "May be hungry",
};

const ZONE_SHAPES = {
  green: "\u25CF",   // filled circle
  yellow: "\u25D0",  // half circle
  coral: "\u25CB",   // empty circle
};

const CONFIDENCE_DOTS = {
  low: "\u25CF\u25CB\u25CB",
  medium: "\u25CF\u25CF\u25CB",
  high: "\u25CF\u25CF\u25CF",
};

export function HungryMeterGauge({
  result,
  size = 160,
}: HungryMeterGaugeProps) {
  const { colors } = useThemeColors();
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fillAmount = circumference * (1 - result.fillLevel);
  const center = size / 2;
  const color = ZONE_COLORS[result.zone];

  return (
    <View className="items-center">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.divider}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Fill circle */}
          <G rotation="-90" origin={`${center}, ${center}`}>
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference}`}
              strokeDashoffset={fillAmount}
              strokeLinecap="round"
              fill="transparent"
            />
          </G>
        </Svg>

        {/* Center content */}
        <View
          className="absolute items-center justify-center"
          style={{ width: size, height: size }}
        >
          <Text className="text-meter font-semibold text-coo-text-primary dark:text-coo-text-primary-dark text-center">
            {result.label}
          </Text>
          <View className="flex-row items-center mt-1">
            <Text style={{ color, fontSize: 14 }}>
              {ZONE_SHAPES[result.zone]}
            </Text>
            <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark ml-1">
              {ZONE_LABELS[result.zone]}
            </Text>
          </View>
        </View>
      </View>

      {/* Confidence indicator */}
      <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark mt-2">
        Confidence: {CONFIDENCE_DOTS[result.confidence]} {result.confidence}
      </Text>
    </View>
  );
}
