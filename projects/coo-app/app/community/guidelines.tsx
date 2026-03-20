import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COMMUNITY_GUIDELINES } from "@/constants/forum";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function GuidelinesScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();

  return (
    <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark">
      <View className="flex-row items-center px-base py-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text className="text-heading-lg text-coo-text-primary dark:text-coo-text-primary-dark font-semibold ml-4">
          Community Guidelines
        </Text>
      </View>

      <ScrollView className="flex-1 px-base">
        <View className="bg-coo-surface dark:bg-coo-surface-dark rounded-md p-base mb-4">
          <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark leading-6">
            {COMMUNITY_GUIDELINES}
          </Text>
        </View>
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
