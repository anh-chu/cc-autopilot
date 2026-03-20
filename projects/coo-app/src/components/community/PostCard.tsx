import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { CATEGORY_MAP } from "@/constants/forum";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { ForumPost } from "@/types/database";

interface PostCardProps {
  post: ForumPost;
  onPress: () => void;
  onUpvote: () => void;
  onHelpful: () => void;
  currentUserId: string | undefined;
}

export function PostCard({
  post,
  onPress,
  onUpvote,
  onHelpful,
  currentUserId,
}: PostCardProps) {
  const { colors } = useThemeColors();
  const category = CATEGORY_MAP[post.categoryId];
  const isUpvoted = currentUserId
    ? post.upvotes.includes(currentUserId)
    : false;
  const isMarkedHelpful = currentUserId
    ? post.helpfulMarks.includes(currentUserId)
    : false;
  const timeAgo = formatDistanceToNow(post.createdAt, { addSuffix: true });

  return (
    <Pressable
      onPress={onPress}
      className="bg-coo-surface dark:bg-coo-surface-dark rounded-md p-base mb-3 active:bg-coo-surface-elevated dark:active:bg-coo-surface-elevated-dark"
    >
      {/* Category badge + time */}
      <View className="flex-row items-center justify-between mb-2">
        <View
          className="flex-row items-center px-2 py-1 rounded-sm"
          style={{ backgroundColor: category.color + "20" }}
        >
          <Text className="text-xs mr-1">{category.emoji}</Text>
          <Text className="text-xs" style={{ color: category.color }}>
            {category.label}
          </Text>
        </View>
        <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
          {timeAgo}
        </Text>
      </View>

      {/* Title */}
      <Text className="text-body-lg text-coo-text-primary dark:text-coo-text-primary-dark font-semibold mb-1">
        {post.title}
      </Text>

      {/* Body preview */}
      <Text
        className="text-body text-coo-text-secondary dark:text-coo-text-secondary-dark mb-3"
        numberOfLines={2}
      >
        {post.body}
      </Text>

      {/* Author + stats */}
      <View className="flex-row items-center justify-between">
        <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
          {post.authorName}
        </Text>
        <View className="flex-row items-center gap-4">
          {/* Upvote */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onUpvote();
            }}
            className="flex-row items-center"
            hitSlop={8}
          >
            <Ionicons
              name={isUpvoted ? "arrow-up-circle" : "arrow-up-circle-outline"}
              size={18}
              color={isUpvoted ? colors.primary : colors.textTertiary}
            />
            <Text
              className="text-caption ml-1"
              style={{ color: isUpvoted ? colors.primary : colors.textTertiary }}
            >
              {post.upvotes.length}
            </Text>
          </Pressable>

          {/* Helpful */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onHelpful();
            }}
            className="flex-row items-center"
            hitSlop={8}
          >
            <Ionicons
              name={isMarkedHelpful ? "heart" : "heart-outline"}
              size={18}
              color={isMarkedHelpful ? "#F4A88C" : colors.textTertiary}
            />
            <Text
              className="text-caption ml-1"
              style={{ color: isMarkedHelpful ? "#F4A88C" : colors.textTertiary }}
            >
              {post.helpfulMarks.length}
            </Text>
          </Pressable>

          {/* Comments */}
          <View className="flex-row items-center">
            <Ionicons
              name="chatbubble-outline"
              size={16}
              color={colors.textTertiary}
            />
            <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark ml-1">
              {post.commentCount}
            </Text>
          </View>
        </View>
      </View>

      {/* Flagged indicator */}
      {post.status === "flagged" && (
        <View className="mt-2 flex-row items-center">
          <Ionicons name="alert-circle" size={14} color="#E8A545" />
          <Text className="text-xs text-coo-approaching ml-1">
            Under review
          </Text>
        </View>
      )}
    </Pressable>
  );
}
