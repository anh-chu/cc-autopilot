import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useForumStore } from "@/stores/forumStore";
import { FORUM_CATEGORIES } from "@/constants/forum";
import { CategoryChip } from "@/components/community/CategoryChip";
import { PostCard } from "@/components/community/PostCard";

export default function CommunityScreen() {
  const { colors } = useThemeColors();
  const router = useRouter();
  const profile = useForumStore((s) => s.profile);
  const guidelinesAccepted = useForumStore((s) => s.guidelinesAccepted);
  const getFeedPosts = useForumStore((s) => s.getFeedPosts);
  const toggleUpvotePost = useForumStore((s) => s.toggleUpvotePost);
  const toggleHelpfulPost = useForumStore((s) => s.toggleHelpfulPost);
  const isFollowing = useForumStore((s) => s.isFollowing);
  const followCategory = useForumStore((s) => s.followCategory);
  const unfollowCategory = useForumStore((s) => s.unfollowCategory);

  const feedPosts = getFeedPosts();

  // Profile setup prompt
  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark justify-center px-base">
        <View className="items-center">
          <View className="w-16 h-16 rounded-full bg-coo-primary/20 items-center justify-center mb-lg">
            <Ionicons name="people" size={32} color={colors.primary} />
          </View>
          <Text className="text-heading-lg text-coo-text-primary dark:text-coo-text-primary-dark font-semibold text-center mb-2">
            Join the Community
          </Text>
          <Text className="text-body text-coo-text-secondary dark:text-coo-text-secondary-dark text-center mb-lg">
            Connect with other parents, ask questions, and share your feeding
            journey.
          </Text>
          <Pressable
            onPress={() => router.push("/community/setup-profile")}
            className="bg-coo-primary active:bg-coo-primary-pressed rounded-lg py-4 px-8"
          >
            <Text className="text-body-lg text-white font-semibold">
              Set Up Profile
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark">
      {/* Header */}
      <View className="flex-row items-center justify-between px-base py-3">
        <Text className="text-heading-lg text-coo-text-primary dark:text-coo-text-primary-dark font-bold">
          Community
        </Text>
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => router.push("/community/local-groups")}
            hitSlop={8}
          >
            <Ionicons name="location-outline" size={22} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/community/profile")}
            hitSlop={8}
          >
            <Ionicons name="person-circle-outline" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1 px-base">
        {/* Categories */}
        <Text className="text-body text-coo-text-secondary dark:text-coo-text-secondary-dark font-medium mb-2">
          Topics
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          {FORUM_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() =>
                router.push(`/community/category/${cat.id}`)
              }
              className="mr-2 px-3 py-2 rounded-md flex-row items-center"
              style={{ backgroundColor: cat.color + "20" }}
            >
              <Text className="text-sm mr-1">{cat.emoji}</Text>
              <Text className="text-caption" style={{ color: cat.color }}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Browse all categories */}
        <Pressable
          onPress={() => router.push("/community/categories")}
          className="flex-row items-center justify-between bg-coo-surface dark:bg-coo-surface-dark rounded-md p-3 mb-4"
        >
          <View className="flex-row items-center">
            <Ionicons name="grid-outline" size={18} color={colors.primary} />
            <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark ml-3">
              Browse All Categories
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </Pressable>

        {/* Feed */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-body text-coo-text-secondary dark:text-coo-text-secondary-dark font-medium">
            Recent Posts
          </Text>
          <Pressable
            onPress={() => router.push("/community/new-post")}
            className="flex-row items-center bg-coo-primary rounded-md px-3 py-2"
          >
            <Ionicons name="add" size={16} color="white" />
            <Text className="text-caption text-white ml-1 font-medium">
              New Post
            </Text>
          </Pressable>
        </View>

        {feedPosts.length === 0 ? (
          <View className="py-10 items-center">
            <Ionicons name="chatbubbles-outline" size={48} color={colors.textTertiary} />
            <Text className="text-body text-coo-text-tertiary dark:text-coo-text-tertiary-dark mt-3 text-center">
              No posts yet. Be the first to start a conversation!
            </Text>
          </View>
        ) : (
          feedPosts.map((post) => (
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
    </SafeAreaView>
  );
}
