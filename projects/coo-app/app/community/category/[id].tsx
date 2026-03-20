import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useForumStore } from "@/stores/forumStore";
import { CATEGORY_MAP } from "@/constants/forum";
import { PostCard } from "@/components/community/PostCard";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { ForumCategoryId } from "@/types/database";

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useThemeColors();
  const categoryId = id as ForumCategoryId;
  const category = CATEGORY_MAP[categoryId];

  const profile = useForumStore((s) => s.profile);
  const getPostsByCategory = useForumStore((s) => s.getPostsByCategory);
  const toggleUpvotePost = useForumStore((s) => s.toggleUpvotePost);
  const toggleHelpfulPost = useForumStore((s) => s.toggleHelpfulPost);
  const isFollowing = useForumStore((s) => s.isFollowing);
  const followCategory = useForumStore((s) => s.followCategory);
  const unfollowCategory = useForumStore((s) => s.unfollowCategory);

  const posts = getPostsByCategory(categoryId);
  const following = isFollowing(categoryId);

  if (!category) {
    return (
      <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark justify-center items-center">
        <Text className="text-body text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
          Category not found
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark">
      {/* Header */}
      <View className="flex-row items-center justify-between px-base py-3">
        <View className="flex-row items-center flex-1">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
          </Pressable>
          <Text className="text-xl ml-3">{category.emoji}</Text>
          <Text className="text-heading-lg text-coo-text-primary dark:text-coo-text-primary-dark font-semibold ml-2 flex-1" numberOfLines={1}>
            {category.label}
          </Text>
        </View>
        <Pressable
          onPress={() =>
            following
              ? unfollowCategory(categoryId)
              : followCategory(categoryId)
          }
          hitSlop={8}
          className="ml-2"
        >
          <Ionicons
            name={following ? "notifications" : "notifications-outline"}
            size={22}
            color={following ? colors.primary : colors.textTertiary}
          />
        </Pressable>
      </View>

      <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark px-base mb-4">
        {category.description}
      </Text>

      <ScrollView className="flex-1 px-base">
        {posts.length === 0 ? (
          <View className="py-10 items-center">
            <Ionicons name="chatbubbles-outline" size={48} color={colors.textTertiary} />
            <Text className="text-body text-coo-text-tertiary dark:text-coo-text-tertiary-dark mt-3 text-center">
              No posts in this category yet.
            </Text>
          </View>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={profile?.id}
              onPress={() => router.push(`/community/post/${post.id}`)}
              onUpvote={() => toggleUpvotePost(post.id)}
              onHelpful={() => toggleHelpfulPost(post.id)}
            />
          ))
        )}
        <View className="h-6" />
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() =>
          router.push(`/community/new-post?category=${categoryId}`)
        }
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-coo-primary items-center justify-center"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </SafeAreaView>
  );
}
