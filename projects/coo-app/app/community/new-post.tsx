import { View, Text, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { useState, useCallback } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useForumStore } from "@/stores/forumStore";
import { FORUM_CATEGORIES, CATEGORY_MAP } from "@/constants/forum";
import { CrisisBanner } from "@/components/community/CrisisBanner";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { ForumCategoryId } from "@/types/database";

export default function NewPostScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const { category: preselectedCategory } = useLocalSearchParams<{
    category?: string;
  }>();

  const createPost = useForumStore((s) => s.createPost);
  const checkContentFlags = useForumStore((s) => s.checkContentFlags);
  const guidelinesAccepted = useForumStore((s) => s.guidelinesAccepted);

  const [categoryId, setCategoryId] = useState<ForumCategoryId | null>(
    (preselectedCategory as ForumCategoryId) ?? null
  );
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [showCrisis, setShowCrisis] = useState(false);

  const handleBodyChange = useCallback(
    (text: string) => {
      setBody(text);
      const flags = checkContentFlags(text);
      setShowCrisis(flags.hasCrisisKeywords);
    },
    [checkContentFlags]
  );

  const handleSubmit = useCallback(() => {
    if (!categoryId || !title.trim() || !body.trim()) {
      Alert.alert("Missing fields", "Please fill in category, title, and body.");
      return;
    }

    if (!guidelinesAccepted) {
      Alert.alert(
        "Community Guidelines",
        "Please accept the community guidelines before posting.",
        [
          { text: "View Guidelines", onPress: () => router.push("/community/setup-profile") },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }

    const fullText = `${title} ${body}`;
    const flags = checkContentFlags(fullText);

    if (flags.blocked) {
      Alert.alert(
        "Post Not Allowed",
        "Your post contains content that violates our community guidelines (commercial promotion). Please review and edit your post."
      );
      return;
    }

    const postId = createPost({
      categoryId,
      title: title.trim(),
      body: body.trim(),
    });

    if (postId) {
      if (flags.flaggedTerms.length > 0) {
        Alert.alert(
          "Post Under Review",
          "Your post has been submitted but flagged for review. It may take some time to appear."
        );
      }
      router.back();
    }
  }, [categoryId, title, body, guidelinesAccepted, createPost, checkContentFlags, router]);

  return (
    <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark">
      {/* Header */}
      <View className="flex-row items-center justify-between px-base py-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text className="text-heading-lg text-coo-text-primary dark:text-coo-text-primary-dark font-semibold">
          New Post
        </Text>
        <Pressable
          onPress={handleSubmit}
          className="bg-coo-primary rounded-md px-4 py-2"
        >
          <Text className="text-caption text-white font-semibold">Post</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-base">
        {showCrisis && <CrisisBanner onDismiss={() => setShowCrisis(false)} />}

        {/* Category picker */}
        <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark mb-2">
          Category
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          {FORUM_CATEGORIES.map((cat) => {
            const selected = categoryId === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setCategoryId(cat.id)}
                className={`mr-2 px-3 py-2 rounded-md flex-row items-center border ${
                  selected
                    ? "border-coo-primary"
                    : "border-coo-divider dark:border-coo-divider-dark"
                }`}
                style={
                  selected ? { backgroundColor: cat.color + "20" } : undefined
                }
              >
                <Text className="text-sm mr-1">{cat.emoji}</Text>
                <Text
                  className="text-caption"
                  style={{ color: selected ? cat.color : colors.textSecondary }}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Title */}
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Post title..."
          placeholderTextColor={colors.textTertiary}
          className="text-heading-lg text-coo-text-primary dark:text-coo-text-primary-dark font-semibold mb-2"
          maxLength={120}
        />

        {/* Body */}
        <TextInput
          value={body}
          onChangeText={handleBodyChange}
          placeholder="Share your experience, ask a question, or offer support..."
          placeholderTextColor={colors.textTertiary}
          multiline
          className="text-body text-coo-text-primary dark:text-coo-text-primary-dark flex-1"
          style={{ textAlignVertical: "top", minHeight: 200 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
