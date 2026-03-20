import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { ForumCategory } from "@/types/database";

interface CategoryChipProps {
  category: ForumCategory;
  onPress: () => void;
  isFollowing?: boolean;
  onToggleFollow?: () => void;
  size?: "sm" | "md";
}

export function CategoryChip({
  category,
  onPress,
  isFollowing,
  onToggleFollow,
  size = "md",
}: CategoryChipProps) {
  const { colors } = useThemeColors();
  const paddingClass = size === "sm" ? "px-3 py-2" : "px-4 py-3";

  return (
    <Pressable
      onPress={onPress}
      className={`bg-coo-surface dark:bg-coo-surface-dark active:bg-coo-surface-elevated dark:active:bg-coo-surface-elevated-dark border border-coo-divider dark:border-coo-divider-dark rounded-md ${paddingClass} mb-2`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <Text className="text-xl mr-3">{category.emoji}</Text>
          <View className="flex-1">
            <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark font-medium">
              {category.label}
            </Text>
            {size === "md" && (
              <Text
                className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark mt-0.5"
                numberOfLines={1}
              >
                {category.description}
              </Text>
            )}
          </View>
        </View>
        {onToggleFollow !== undefined && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleFollow();
            }}
            hitSlop={8}
            className="ml-2"
          >
            <Ionicons
              name={isFollowing ? "notifications" : "notifications-outline"}
              size={20}
              color={isFollowing ? colors.primary : colors.textTertiary}
            />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}
