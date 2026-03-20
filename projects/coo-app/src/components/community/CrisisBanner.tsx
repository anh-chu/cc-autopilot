import { View, Text, Pressable, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/useThemeColors";

interface CrisisBannerProps {
  onDismiss?: () => void;
}

export function CrisisBanner({ onDismiss }: CrisisBannerProps) {
  const { colors } = useThemeColors();
  return (
    <View className="bg-coo-info/20 border border-coo-info rounded-md p-base mb-4">
      <View className="flex-row items-start">
        <Ionicons name="heart" size={20} color="#6BA3C7" />
        <View className="flex-1 ml-3">
          <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark font-semibold mb-1">
            You're not alone
          </Text>
          <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mb-2">
            If you or someone you know is struggling, help is available right
            now.
          </Text>

          <Pressable
            onPress={() => Linking.openURL("tel:988")}
            className="flex-row items-center mb-1"
          >
            <Ionicons name="call-outline" size={14} color={colors.primary} />
            <Text className="text-caption text-coo-primary ml-2">
              988 Suicide & Crisis Lifeline
            </Text>
          </Pressable>

          <Pressable
            onPress={() => Linking.openURL("tel:18009444773")}
            className="flex-row items-center"
          >
            <Ionicons name="call-outline" size={14} color={colors.primary} />
            <Text className="text-caption text-coo-primary ml-2">
              Postpartum Support International (1-800-944-4773)
            </Text>
          </Pressable>
        </View>
        {onDismiss && (
          <Pressable onPress={onDismiss} hitSlop={8}>
            <Ionicons name="close" size={18} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
