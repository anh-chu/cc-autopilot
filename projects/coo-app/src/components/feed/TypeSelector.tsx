import { View, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { FeedingType } from "@/types/database";
import { FeedingTypeColors, FeedingTypeLabels } from "@/constants/theme";
import { useThemeColors } from "@/hooks/useThemeColors";

interface TypeSelectorProps {
  selected: FeedingType;
  onSelect: (type: FeedingType) => void;
}

const TYPES: FeedingType[] = ["breast", "bottle", "solid", "pump"];
const ICONS: Record<FeedingType, keyof typeof Ionicons.glyphMap> = {
  breast: "water-outline",
  bottle: "flask-outline",
  solid: "restaurant-outline",
  pump: "funnel-outline",
};

export function TypeSelector({ selected, onSelect }: TypeSelectorProps) {
  const { colors } = useThemeColors();
  return (
    <View className="flex-row gap-2">
      {TYPES.map((type) => {
        const isActive = type === selected;
        return (
          <Pressable
            key={type}
            onPress={() => onSelect(type)}
            className={`flex-1 items-center py-3 rounded-md border-2 ${
              isActive
                ? "border-coo-primary bg-coo-primary/15"
                : "border-coo-divider dark:border-coo-divider-dark bg-coo-surface dark:bg-coo-surface-dark"
            }`}
          >
            <Ionicons
              name={ICONS[type]}
              size={22}
              color={isActive ? FeedingTypeColors[type] : colors.textTertiary}
            />
            <Text
              className={`mt-1 text-caption-sm ${
                isActive
                  ? "text-coo-text-primary dark:text-coo-text-primary-dark font-medium"
                  : "text-coo-text-tertiary dark:text-coo-text-tertiary-dark"
              }`}
            >
              {FeedingTypeLabels[type]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
