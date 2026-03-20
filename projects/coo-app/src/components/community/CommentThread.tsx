import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { ForumComment } from "@/types/database";

interface CommentItemProps {
  comment: ForumComment;
  replies: ForumComment[];
  allComments: ForumComment[];
  currentUserId: string | undefined;
  isPostAuthor: boolean;
  depth: number;
  onUpvote: (commentId: string) => void;
  onMarkHelpful: (commentId: string) => void;
  onReply: (parentCommentId: string, body: string) => void;
  onReport: (commentId: string) => void;
}

function CommentItem({
  comment,
  replies,
  allComments,
  currentUserId,
  isPostAuthor,
  depth,
  onUpvote,
  onMarkHelpful,
  onReply,
  onReport,
}: CommentItemProps) {
  const { colors } = useThemeColors();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");

  const isUpvoted = currentUserId
    ? comment.upvotes.includes(currentUserId)
    : false;
  const timeAgo = formatDistanceToNow(comment.createdAt, { addSuffix: true });

  const handleSubmitReply = () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    onReply(comment.id, trimmed);
    setReplyText("");
    setShowReplyInput(false);
  };

  // Max nesting depth of 3
  const maxDepth = 3;

  return (
    <View style={{ marginLeft: depth > 0 ? 16 : 0 }}>
      <View className="bg-coo-surface dark:bg-coo-surface-dark rounded-md p-3 mb-2">
        {/* Author + time */}
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center">
            <Text className="text-caption text-coo-primary font-medium">
              {comment.authorName}
            </Text>
            {comment.isHelpful && (
              <View className="ml-2 flex-row items-center bg-coo-secondary/20 px-2 py-0.5 rounded-sm">
                <Ionicons name="checkmark-circle" size={12} color="#F4A88C" />
                <Text className="text-xs text-coo-secondary ml-1">
                  Helpful
                </Text>
              </View>
            )}
          </View>
          <Text className="text-xs text-coo-text-tertiary dark:text-coo-text-tertiary-dark">{timeAgo}</Text>
        </View>

        {/* Body */}
        <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark mb-2">
          {comment.body}
        </Text>

        {/* Actions */}
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={() => onUpvote(comment.id)}
            className="flex-row items-center"
            hitSlop={8}
          >
            <Ionicons
              name={isUpvoted ? "arrow-up-circle" : "arrow-up-circle-outline"}
              size={16}
              color={isUpvoted ? colors.primary : colors.textTertiary}
            />
            <Text
              className="text-xs ml-1"
              style={{ color: isUpvoted ? colors.primary : colors.textTertiary }}
            >
              {comment.upvotes.length}
            </Text>
          </Pressable>

          {depth < maxDepth && (
            <Pressable
              onPress={() => setShowReplyInput(!showReplyInput)}
              className="flex-row items-center"
              hitSlop={8}
            >
              <Ionicons name="return-down-forward" size={16} color={colors.textTertiary} />
              <Text className="text-xs text-coo-text-tertiary dark:text-coo-text-tertiary-dark ml-1">
                Reply
              </Text>
            </Pressable>
          )}

          {isPostAuthor && (
            <Pressable
              onPress={() => onMarkHelpful(comment.id)}
              className="flex-row items-center"
              hitSlop={8}
            >
              <Ionicons
                name={comment.isHelpful ? "checkmark-circle" : "checkmark-circle-outline"}
                size={16}
                color={comment.isHelpful ? "#F4A88C" : colors.textTertiary}
              />
              <Text
                className="text-xs ml-1"
                style={{ color: comment.isHelpful ? "#F4A88C" : colors.textTertiary }}
              >
                Helpful
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => onReport(comment.id)}
            className="flex-row items-center"
            hitSlop={8}
          >
            <Ionicons name="flag-outline" size={14} color={colors.textTertiary} />
          </Pressable>
        </View>

        {/* Reply input */}
        {showReplyInput && (
          <View className="mt-2 flex-row items-center gap-2">
            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Write a reply..."
              placeholderTextColor={colors.textTertiary}
              multiline
              className="flex-1 bg-coo-bg dark:bg-coo-bg-dark border border-coo-divider dark:border-coo-divider-dark rounded-md px-3 py-2 text-body text-coo-text-primary dark:text-coo-text-primary-dark"
            />
            <Pressable
              onPress={handleSubmitReply}
              className="bg-coo-primary rounded-md px-3 py-2"
            >
              <Ionicons name="send" size={16} color="white" />
            </Pressable>
          </View>
        )}
      </View>

      {/* Nested replies */}
      {replies.map((reply) => {
        const nestedReplies = allComments.filter(
          (c) => c.parentCommentId === reply.id
        );
        return (
          <CommentItem
            key={reply.id}
            comment={reply}
            replies={nestedReplies}
            allComments={allComments}
            currentUserId={currentUserId}
            isPostAuthor={isPostAuthor}
            depth={depth + 1}
            onUpvote={onUpvote}
            onMarkHelpful={onMarkHelpful}
            onReply={onReply}
            onReport={onReport}
          />
        );
      })}
    </View>
  );
}

interface CommentThreadProps {
  comments: ForumComment[];
  currentUserId: string | undefined;
  postAuthorId: string;
  onUpvote: (commentId: string) => void;
  onMarkHelpful: (commentId: string) => void;
  onReply: (parentCommentId: string, body: string) => void;
  onReport: (commentId: string) => void;
}

export function CommentThread({
  comments,
  currentUserId,
  postAuthorId,
  onUpvote,
  onMarkHelpful,
  onReply,
  onReport,
}: CommentThreadProps) {
  const { colors } = useThemeColors();
  const topLevel = comments.filter((c) => c.parentCommentId === null);
  const isPostAuthor = currentUserId === postAuthorId;

  if (topLevel.length === 0) {
    return (
      <View className="py-6 items-center">
        <Ionicons name="chatbubble-outline" size={32} color={colors.textTertiary} />
        <Text className="text-body text-coo-text-tertiary dark:text-coo-text-tertiary-dark mt-2">
          No comments yet. Be the first!
        </Text>
      </View>
    );
  }

  return (
    <View>
      {topLevel.map((comment) => {
        const replies = comments.filter(
          (c) => c.parentCommentId === comment.id
        );
        return (
          <CommentItem
            key={comment.id}
            comment={comment}
            replies={replies}
            allComments={comments}
            currentUserId={currentUserId}
            isPostAuthor={isPostAuthor}
            depth={0}
            onUpvote={onUpvote}
            onMarkHelpful={onMarkHelpful}
            onReply={onReply}
            onReport={onReport}
          />
        );
      })}
    </View>
  );
}
