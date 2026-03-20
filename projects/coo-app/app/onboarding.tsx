import { View, Text, Pressable, TextInput } from "react-native";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBabyStore } from "@/stores/babyStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { FeedingMethod } from "@/types/database";

type Step = "welcome" | "baby_info" | "feeding_method";

export default function OnboardingScreen() {
  const { colors } = useThemeColors();
  const router = useRouter();
  const addBaby = useBabyStore((s) => s.addBaby);
  const setOnboardingComplete = useSettingsStore(
    (s) => s.setOnboardingComplete
  );

  const [step, setStep] = useState<Step>("welcome");
  const [babyName, setBabyName] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const handleFeedingMethod = useCallback(
    (method: FeedingMethod) => {
      const name = babyName.trim() || "Baby";
      const date = birthDate || new Date().toISOString().split("T")[0];

      addBaby({
        name,
        birthDate: date,
        primaryFeedingMethod: method,
      });

      setOnboardingComplete(true);
      router.replace("/(tabs)");
    },
    [babyName, birthDate, addBaby, setOnboardingComplete, router]
  );

  if (step === "welcome") {
    return (
      <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark justify-center px-base">
        <View className="items-center mb-2xl">
          <View className="w-20 h-20 rounded-full bg-coo-primary/20 items-center justify-center mb-lg">
            <Text className="text-[40px]">{"\uD83D\uDC23"}</Text>
          </View>
          <Text className="text-display text-coo-text-primary dark:text-coo-text-primary-dark font-bold text-center">
            coo
          </Text>
          <View className="mt-lg">
            <Text className="text-body-lg text-coo-text-secondary dark:text-coo-text-secondary-dark text-center">
              Track feeds.
            </Text>
            <Text className="text-body-lg text-coo-text-secondary dark:text-coo-text-secondary-dark text-center">
              See patterns.
            </Text>
            <Text className="text-body-lg text-coo-text-secondary dark:text-coo-text-secondary-dark text-center">
              Breathe easier.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => setStep("baby_info")}
          className="bg-coo-primary active:bg-coo-primary-pressed rounded-lg py-4 items-center"
        >
          <Text className="text-body-lg text-white font-semibold">
            Get Started
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (step === "baby_info") {
    return (
      <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark justify-center px-base">
        <Text className="text-heading-lg text-coo-text-primary dark:text-coo-text-primary-dark font-semibold mb-lg">
          What's your baby's name?
        </Text>

        <TextInput
          value={babyName}
          onChangeText={setBabyName}
          placeholder="Baby's name"
          placeholderTextColor={colors.textTertiary}
          autoFocus
          className="bg-coo-surface dark:bg-coo-surface-dark border border-coo-divider dark:border-coo-divider-dark rounded-md px-4 py-3 text-body-lg text-coo-text-primary dark:text-coo-text-primary-dark mb-lg"
        />

        <Text className="text-body text-coo-text-secondary dark:text-coo-text-secondary-dark mb-2">
          When was {babyName || "baby"} born?
        </Text>
        <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark mb-2">
          (YYYY-MM-DD format, helps personalize predictions)
        </Text>
        <TextInput
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="2025-12-08"
          placeholderTextColor={colors.textTertiary}
          className="bg-coo-surface dark:bg-coo-surface-dark border border-coo-divider dark:border-coo-divider-dark rounded-md px-4 py-3 text-body-lg text-coo-text-primary dark:text-coo-text-primary-dark mb-lg"
        />

        <Pressable
          onPress={() => setStep("feeding_method")}
          className="bg-coo-primary active:bg-coo-primary-pressed rounded-lg py-4 items-center"
        >
          <Text className="text-body-lg text-white font-semibold">
            Next
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setStep("feeding_method")}
          className="mt-base items-center"
        >
          <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
            Skip for now
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // feeding_method step
  const methods: { value: FeedingMethod; emoji: string; label: string }[] = [
    { value: "breast", emoji: "\uD83E\uDD31", label: "Breastfeeding" },
    { value: "bottle", emoji: "\uD83C\uDF7C", label: "Bottle" },
    { value: "combo", emoji: "\uD83D\uDD04", label: "Combination" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark justify-center px-base">
      <Text className="text-heading-lg text-coo-text-primary dark:text-coo-text-primary-dark font-semibold mb-2">
        How does {babyName || "baby"} eat?
      </Text>
      <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark mb-lg">
        You can always change this later.
      </Text>

      <View className="gap-3">
        {methods.map(({ value, emoji, label }) => (
          <Pressable
            key={value}
            onPress={() => handleFeedingMethod(value)}
            className="bg-coo-surface dark:bg-coo-surface-dark active:bg-coo-surface-elevated dark:active:bg-coo-surface-elevated-dark border border-coo-divider dark:border-coo-divider-dark rounded-lg py-4 px-base flex-row items-center"
          >
            <Text className="text-heading-lg mr-3">{emoji}</Text>
            <Text className="text-body-lg text-coo-text-primary dark:text-coo-text-primary-dark font-medium">
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}
