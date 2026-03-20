import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { useForumStore } from "@/stores/forumStore";
import { CATEGORY_MAP } from "@/constants/forum";
import { CommentThread } from "@/components/community/CommentThread";
import { ReportModal } from "@/components/community/ReportModal";
import { CrisisBanner } from "@/components/community/CrisisBanner";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useThemeColors();

  const profile = useForumStore((s) => s.profile);
  const getPostById = useForumStore((s) => s.getPostById);
  const getCommentsForPost = useForumStore((s) => s.getCommentsForPost);
  const toggleUpvotePost = useForumStore((s) => s.toggleUpvotePost);
  const toggleHelpfulPost = useForumStore((s) => s.toggleHelpfulPost);
  const addComment = useForumStore((s) => s.addComment);
  const toggleUpvoteComment = useForumStore((s) => s.toggleUpvoteComment);
  const markCommentHelpful = useForumStore((s) => s.markCommentHelpful);
  const reportPost = useForumStore((s) => s.reportPost);
  const reportComment = useForumStore((s) => s.reportComment);
  const checkContentFlags = useForumStore((s) => s.checkContentFlags);

  const post = getPostById(id ?? "");
  const comments = getCommentsForPost(id ?? "");

  const [commentText, setCommentText] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: "post" | "comment";
    id: string;
  } | null>(null);
  const [showCrisis, setShowCrisis] = useState(false);

  const handleCommentChange = useCallback(
    (text: string) => {
      setCommentText(text);
      const flags = checkContentFlags(text);
      setShowCrisis(flags.hasCrisisKeywords);
    },
    [checkContentFlags]
  );

  const handleSubmitComment = useCallback(() => {
    if (!post || !commentText.trim()) return;

    const flags = checkContentFlags(commentText);
    if (flags.blocked) {
      Alert.alert(
        "Comment Not Allowed",
        "Your comment contains content that violates community guidelines."
      );
      return;
    }

    const result = addComment({
      postId: post.id,
      body: commentText.trim(),
    });

    if (result) {
      setCommentText("");
      setShowCrisis(false);
    }
  }, [post, commentText, addComment, checkContentFlags]);

  const handleReply = useCallback(
    (parentCommentId: string, body: string) => {
      if (!post) return;
      const flags = checkContentFlags(body);
      if (flags.blocked) {
        Alert.alert(
          "Reply Not Allowed",
          "Your reply contains content that violates community guidelines."
        );
        return;
      }
      addComment({ postId: post.id, parentCommentId, body });
    },
    [post, addComment, checkContentFlags]
  );

  const handleReport = useCallback((type: "post" | "comment", targetId: string) => {
    setReportTarget({ type, id: targetId });
    setShowReportModal(true);
  }, []);

  const handleSubmitReport = useCallback(
    (reason: string) => {
      if (!reportTarget) return;
      if (reportTarget.type === "post") {
        reportPost(reportTarget.id, reason);
      } else {
        reportComment(reportTarget.id, reason);
      }
      Alert.alert("Report Submitted", "Thank you. We'll review this content.");
    },
    [reportTarget, reportPost, reportComment]
  );

  if (!post) {
    return (
      <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark justify-center items-center">
        <Text className="text-body text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
          Post not found
        </Text>
      </SafeAreaView>
    );
  }

  const category = CATEGORY_MAP[post.categoryId];
  const timeAgo = formatDistanceToNow(post.createdAt, { addSuffix: true });
  const isUpvoted = profile ? post.upvotes.includes(profile.id) : false;
  const isMarkedHelpful = profile
    ? post.helpfulMarks.includes(profile.id)
    : false;

  return (
    <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark">
      {/* Header */}
      <View className="flex-row items-center px-base py-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </Pressable>
        <View
          className="flex-row items-center ml-3 px-2 py-1 rounded-sm"
          style={{ backgroundColor: category.color + "20" }}
        >
          <Text className="text-xs mr-1">{category.emoji}</Text>
          <Text className="text-xs" style={{ color: category.color }}>
            {category.label}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView className="flex-1 px-base">
          {/* Post content */}
          <Text className="text-heading-lg text-coo-text-primary dark:text-coo-text-primary-dark font-bold mb-2">
            {post.title}
          </Text>

          <View className="flex-row items-center mb-3">
            <Text className="text-caption text-coo-primary font-medium">
              {post.authorName}
            </Text>
            <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark mx-2">
              {"\u00B7"}
            </Text>
            <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
              {timeAgo}
            </Text>
          </View>

          <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark leading-6 mb-4">
            {post.body}
          </Text>

          {/* Post actions */}
          <View className="flex-row items-center justify-between border-t border-b border-coo-divider dark:border-coo-divider-dark py-3 mb-4">
            <View className="flex-row items-center gap-5">
              <Pressable
                onPress={() => toggleUpvotePost(post.id)}
                className="flex-row items-center"
                hitSlop={8}
              >
                <Ionicons
                  name={
                    isUpvoted
                      ? "arrow-up-circle"
                      : "arrow-up-circle-outline"
                  }
                  size={22}
                  color={isUpvoted ? colors.primary : colors.textTertiary}
                />
                <Text
                  className="text-body ml-1"
                  style={{ color: isUpvoted ? colors.primary : colors.textTertiary }}
                >
                  {post.upvotes.length}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => toggleHelpfulPost(post.id)}
                className="flex-row items-center"
                hitSlop={8}
              >
                <Ionicons
                  name={isMarkedHelpful ? "heart" : "heart-outline"}
                  size={22}
                  color={isMarkedHelpful ? "#F4A88C" : colors.textTertiary}
                />
                <Text
                  className="text-body ml-1"
                  style={{ color: isMarkedHelpful ? "#F4A88C" : colors.textTertiary }}
                >
                  {post.helpfulMarks.length}
                </Text>
              </Pressable>

              <View className="flex-row items-center">
                <Ionicons
                  name="chatbubble-outline"
                  size={20}
                  color={colors.textTertiary}
                />
                <Text className="text-body text-coo-text-tertiary dark:text-coo-text-tertiary-dark ml-1">
                  {post.commentCount}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => handleReport("post", post.id)}
              hitSlop={8}
            >
              <Ionicons name="flag-outline" size={20} color={colors.textTertiary} />
            </Pressable>
          </View>

          {/* Comments */}
          <Text className="text-body text-coo-text-secondary dark:text-coo-text-secondary-dark font-medium mb-3">
            Comments
          </Text>

          <CommentThread
            comments={comments}
            currentUserId={profile?.id}
            postAuthorId={post.authorId}
            onUpvote={toggleUpvoteComment}
            onMarkHelpful={(commentId) =>
              markCommentHelpful(commentId, post.id)
            }
            onReply={handleReply}
            onReport={(commentId) => handleReport("comment", commentId)}
          />

          <View className="h-20" />
        </ScrollView>

        {/* Comment input */}
        <View className="px-base py-3 border-t border-coo-divider dark:border-coo-divider-dark bg-coo-bg dark:bg-coo-bg-dark">
          {showCrisis && (
            <CrisisBanner onDismiss={() => setShowCrisis(false)} />
          )}
          <View className="flex-row items-center gap-2">
            <TextInput
              value={commentText}
              onChangeText={handleCommentChange}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textTertiary}
              multiline
              className="flex-1 bg-coo-surface dark:bg-coo-surface-dark border border-coo-divider dark:border-coo-divider-dark rounded-md px-3 py-2 text-body text-coo-text-primary dark:text-coo-text-primary-dark"
              style={{ maxHeight: 100 }}
            />
            <Pressable
              onPress={handleSubmitComment}
              disabled={!commentText.trim()}
              className={`rounded-md p-3 ${
                commentText.trim()
                  ? "bg-coo-primary"
                  : "bg-coo-divider dark:bg-coo-divider-dark"
              }`}
            >
              <Ionicons
                name="send"
                size={18}
                color={commentText.trim() ? "white" : colors.textTertiary}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ReportModal
        visible={showReportModal}
        contentType={reportTarget?.type ?? "post"}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleSubmitReport}
      />
    </SafeAreaView>
  );
}
