import { View, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BreastSide } from "@/types/database";
import { useThemeColors } from "@/hooks/useThemeColors";

interface SideSelectorProps {
  selected: BreastSide | null;
  onSelect: (side: BreastSide) => void;
  lastSide?: BreastSide | null;
}

export function SideSelector({
  selected,
  onSelect,
  lastSide,
}: SideSelectorProps) {
  const { colors } = useThemeColors();
  const sides: { value: BreastSide; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: "left", label: "Left", icon: "arrow-back" },
    { value: "right", label: "Right", icon: "arrow-forward" },
    { value: "both", label: "Both", icon: "swap-horizontal" },
  ];

  return (
    <View>
      <View className="flex-row gap-2">
        {sides.map(({ value, label, icon }) => {
          const isActive = value === selected;
          return (
            <Pressable
              key={value}
              onPress={() => onSelect(value)}
              className={`flex-1 flex-row items-center justify-center py-3 rounded-md border-2 ${
                isActive
                  ? "border-coo-primary bg-coo-primary/15"
                  : "border-coo-divider dark:border-coo-divider-dark bg-coo-surface dark:bg-coo-surface-dark"
              }`}
            >
              <Ionicons
                name={icon}
                size={18}
                color={isActive ? colors.primary : colors.textTertiary}
              />
              <Text
                className={`ml-1 text-body ${
                  isActive
                    ? "text-coo-text-primary dark:text-coo-text-primary-dark font-medium"
                    : "text-coo-text-tertiary dark:text-coo-text-tertiary-dark"
                }`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {lastSide && lastSide !== "both" && (
        <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark mt-1">
          Last side: {lastSide === "left" ? "Left" : "Right"} — next suggested:{" "}
          {lastSide === "left" ? "Right" : "Left"}
        </Text>
      )}
    </View>
  );
}
