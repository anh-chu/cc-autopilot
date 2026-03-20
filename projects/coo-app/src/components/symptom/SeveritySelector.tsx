import { View, Pressable, Text } from "react-native";
import type { Severity } from "@/types/database";

interface SeveritySelectorProps {
  selected: Severity;
  onSelect: (severity: Severity) => void;
}

const SEVERITIES: { value: Severity; label: string; dots: string }[] = [
  { value: "mild", label: "Mild", dots: "\u00B7" },
  { value: "moderate", label: "Moderate", dots: "\u00B7\u00B7" },
  { value: "severe", label: "Severe", dots: "\u00B7\u00B7\u00B7" },
];

export function SeveritySelector({
  selected,
  onSelect,
}: SeveritySelectorProps) {
  return (
    <View className="flex-row gap-2">
      {SEVERITIES.map(({ value, label, dots }) => {
        const isActive = value === selected;
        return (
          <Pressable
            key={value}
            onPress={() => onSelect(value)}
            className={`flex-1 items-center py-3 rounded-md border-2 ${
              isActive
                ? "border-coo-primary bg-coo-primary/15"
                : "border-coo-divider dark:border-coo-divider-dark bg-coo-surface dark:bg-coo-surface-dark"
            }`}
          >
            <Text
              className={`text-body font-medium ${
                isActive
                  ? "text-coo-text-primary dark:text-coo-text-primary-dark"
                  : "text-coo-text-tertiary dark:text-coo-text-tertiary-dark"
              }`}
            >
              {label}
            </Text>
            <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
              {dots}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
