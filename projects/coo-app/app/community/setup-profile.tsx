import { View, Text, Pressable, TextInput, ScrollView } from "react-native";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useForumStore } from "@/stores/forumStore";
import { useBabyStore } from "@/stores/babyStore";
import { COMMUNITY_GUIDELINES } from "@/constants/forum";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { FeedingMethod } from "@/types/database";

export default function SetupProfileScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const setupProfile = useForumStore((s) => s.setupProfile);
  const acceptGuidelines = useForumStore((s) => s.acceptGuidelines);
  const baby = useBabyStore((s) => s.getActiveBaby());

  const [step, setStep] = useState<"guidelines" | "profile">("guidelines");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");

  const babyAgeMonths = baby
    ? Math.floor(
        (Date.now() - new Date(baby.birthDate).getTime()) /
          (30.44 * 24 * 60 * 60 * 1000)
      )
    : undefined;

  const handleAcceptGuidelines = useCallback(() => {
    acceptGuidelines();
    setStep("profile");
  }, [acceptGuidelines]);

  const handleCreateProfile = useCallback(() => {
    const name = displayName.trim() || "Anonymous Parent";
    setupProfile({
      displayName: name,
      bio: bio.trim(),
      babyAgeMonths,
      feedingMethod: baby?.primaryFeedingMethod,
      location: location.trim() || undefined,
    });
    router.back();
  }, [displayName, bio, location, babyAgeMonths, baby, setupProfile, router]);

  if (step === "guidelines") {
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
        </ScrollView>

        <View className="px-base pb-6">
          <Pressable
            onPress={handleAcceptGuidelines}
            className="bg-coo-primary active:bg-coo-primary-pressed rounded-lg py-4 items-center"
          >
            <Text className="text-body-lg text-white font-semibold">
              I Agree — Continue
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark">
      <View className="flex-row items-center px-base py-3">
        <Pressable onPress={() => setStep("guidelines")} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text className="text-heading-lg text-coo-text-primary dark:text-coo-text-primary-dark font-semibold ml-4">
          Your Profile
        </Text>
      </View>

      <ScrollView className="flex-1 px-base">
        <Text className="text-body text-coo-text-secondary dark:text-coo-text-secondary-dark mb-4">
          This is how other parents will see you in the community.
        </Text>

        <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark mb-1">
          Display Name
        </Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="How should we call you?"
          placeholderTextColor={colors.textTertiary}
          autoFocus
          className="bg-coo-surface dark:bg-coo-surface-dark border border-coo-divider dark:border-coo-divider-dark rounded-md px-4 py-3 text-body text-coo-text-primary dark:text-coo-text-primary-dark mb-4"
        />

        <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark mb-1">
          Bio (optional)
        </Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="Tell us a bit about yourself..."
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={3}
          className="bg-coo-surface dark:bg-coo-surface-dark border border-coo-divider dark:border-coo-divider-dark rounded-md px-4 py-3 text-body text-coo-text-primary dark:text-coo-text-primary-dark mb-4"
          style={{ textAlignVertical: "top", minHeight: 80 }}
        />

        <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark mb-1">
          Location — city level only (optional)
        </Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="e.g., Portland, OR"
          placeholderTextColor={colors.textTertiary}
          className="bg-coo-surface dark:bg-coo-surface-dark border border-coo-divider dark:border-coo-divider-dark rounded-md px-4 py-3 text-body text-coo-text-primary dark:text-coo-text-primary-dark mb-4"
        />

        {baby && (
          <View className="bg-coo-surface dark:bg-coo-surface-dark rounded-md p-base mb-4">
            <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark mb-1">
              Auto-detected from your profile
            </Text>
            <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark">
              {baby.name} — {babyAgeMonths ?? 0} months old —{" "}
              {baby.primaryFeedingMethod} feeding
            </Text>
          </View>
        )}
      </ScrollView>

      <View className="px-base pb-6">
        <Pressable
          onPress={handleCreateProfile}
          className="bg-coo-primary active:bg-coo-primary-pressed rounded-lg py-4 items-center"
        >
          <Text className="text-body-lg text-white font-semibold">
            Join Community
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
