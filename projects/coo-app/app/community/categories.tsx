import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useForumStore } from "@/stores/forumStore";
import { FORUM_CATEGORIES } from "@/constants/forum";
import { CategoryChip } from "@/components/community/CategoryChip";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function CategoriesScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const isFollowing = useForumStore((s) => s.isFollowing);
  const followCategory = useForumStore((s) => s.followCategory);
  const unfollowCategory = useForumStore((s) => s.unfollowCategory);

  return (
    <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark">
      <View className="flex-row items-center px-base py-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text className="text-heading-lg text-coo-text-primary dark:text-coo-text-primary-dark font-semibold ml-4">
          All Categories
        </Text>
      </View>

      <ScrollView className="flex-1 px-base">
        <Text className="text-body text-coo-text-secondary dark:text-coo-text-secondary-dark mb-4">
          Browse topics and follow the ones you care about. Tap the bell to get
          notified of new posts.
        </Text>

        {FORUM_CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat.id}
            category={cat}
            onPress={() =>
              router.push(`/community/category/${cat.id}`)
            }
            isFollowing={isFollowing(cat.id)}
            onToggleFollow={() =>
              isFollowing(cat.id)
                ? unfollowCategory(cat.id)
                : followCategory(cat.id)
            }
          />
        ))}

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
