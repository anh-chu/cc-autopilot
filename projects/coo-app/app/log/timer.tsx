import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { useCallback, useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useBabyStore } from "@/stores/babyStore";
import { useFeedingStore } from "@/stores/feedingStore";
import { useTimerStore } from "@/stores/timerStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { TypeSelector } from "@/components/feed/TypeSelector";
import { SideSelector } from "@/components/feed/SideSelector";
import { AmountPicker } from "@/components/feed/AmountPicker";
import { TimerDisplay } from "@/components/feed/TimerDisplay";
import type { FeedingType, BreastSide, BottleContent } from "@/types/database";
import { useThemeColors } from "@/hooks/useThemeColors";
import { toCanonicalMl } from "@/lib/units";

export default function TimerScreen() {
  const { colors } = useThemeColors();
  const router = useRouter();
  const baby = useBabyStore((s) => s.getActiveBaby());
  const addFeeding = useFeedingStore((s) => s.addFeeding);
  const getLastSide = useFeedingStore((s) => s.getLastSide);
  const timerStore = useTimerStore();
  const unitVolume = useSettingsStore((s) => s.unitVolume);

  const [feedingType, setFeedingType] = useState<FeedingType>(
    timerStore.isRunning ? timerStore.feedingType : "breast"
  );
  const [side, setSide] = useState<BreastSide | null>(
    timerStore.isRunning ? timerStore.side : null
  );
  const [amountMl, setAmountMl] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [bottleContent, setBottleContent] = useState<BottleContent>("formula");
  const [formulaBrand, setFormulaBrand] = useState("");
  const [solidDescription, setSolidDescription] = useState("");
  const [unit, setUnit] = useState(unitVolume);

  const lastSide = baby ? getLastSide(baby.id) : null;

  // Set suggested side on mount (but don't auto-start the timer)
  useEffect(() => {
    if (!timerStore.isRunning && baby) {
      const suggestedSide: BreastSide | undefined =
        lastSide === "left"
          ? "right"
          : lastSide === "right"
            ? "left"
            : undefined;
      setSide(suggestedSide ?? "left");
    }
  }, []);

  const handleStart = useCallback(() => {
    if (!baby) return;
    timerStore.startTimer(baby.id, feedingType, side ?? "left");
  }, [baby, feedingType, side, timerStore]);

  // Sync type/side with timer store
  useEffect(() => {
    if (timerStore.isRunning) {
      timerStore.setFeedingType(feedingType);
    }
  }, [feedingType]);

  useEffect(() => {
    if (timerStore.isRunning && side) {
      timerStore.setSide(side);
    }
  }, [side]);

  const showSide = feedingType === "breast" || feedingType === "pump";
  const showAmount = feedingType !== "solid";
  const showBottleContent = feedingType === "bottle";
  const showSolidDesc = feedingType === "solid";
  const showTimer = feedingType !== "solid";

  const handleSave = useCallback(() => {
    if (!baby) return;

    const timerResult = timerStore.isRunning ? timerStore.stopTimer() : null;
    const now = Date.now();

    addFeeding({
      babyId: baby.id,
      loggedBy: "me",
      feedingType,
      side: showSide ? side ?? undefined : undefined,
      amountMl: amountMl ?? undefined,
      durationSeconds: timerResult?.durationSeconds ?? undefined,
      startedAt: timerResult?.startedAt ?? now,
      endedAt: timerResult?.endedAt ?? now,
      bottleContent: showBottleContent ? bottleContent : undefined,
      formulaBrand: showBottleContent && bottleContent === "formula" ? formulaBrand || undefined : undefined,
      solidDescription: showSolidDesc ? solidDescription || undefined : undefined,
      notes: notes || undefined,
      isTimer: !!timerResult,
    });

    router.back();
  }, [
    baby,
    feedingType,
    side,
    amountMl,
    notes,
    bottleContent,
    formulaBrand,
    solidDescription,
    showSide,
    showBottleContent,
    showSolidDesc,
    addFeeding,
    timerStore,
    router,
  ]);

  const handleCancel = useCallback(() => {
    timerStore.resetTimer();
    router.back();
  }, [timerStore, router]);

  if (!baby) {
    router.back();
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark">
      {/* Header */}
      <View className="flex-row items-center justify-between px-base pt-base">
        <Pressable onPress={() => router.back()} className="flex-row items-center">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark ml-1">
            Back
          </Text>
        </Pressable>
        <Pressable onPress={handleCancel}>
          <Text className="text-body text-coo-error">Cancel</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-base" contentContainerClassName="pb-lg">
        {/* Feeding Type */}
        <View className="mt-lg">
          <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mb-2 font-medium">
            Feeding Type
          </Text>
          <TypeSelector selected={feedingType} onSelect={setFeedingType} />
        </View>

        {/* Timer — show Start button if not running, otherwise show live timer */}
        {showTimer && (
          timerStore.isRunning ? (
            <TimerDisplay />
          ) : (
            <Pressable
              onPress={handleStart}
              className="items-center justify-center py-8 mt-lg"
            >
              <Ionicons name="play-circle" size={64} color={colors.primary} />
              <Text className="text-heading text-coo-primary font-semibold mt-3">
                Start Timer
              </Text>
            </Pressable>
          )
        )}

        {/* Side Selector */}
        {showSide && (
          <View className="mt-lg">
            <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mb-2 font-medium">
              Side
            </Text>
            <SideSelector
              selected={side}
              onSelect={setSide}
              lastSide={lastSide}
            />
          </View>
        )}

        {/* Bottle Content */}
        {showBottleContent && (
          <View className="mt-lg">
            <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mb-2 font-medium">
              Bottle Content
            </Text>
            <View className="flex-row gap-2">
              {(
                [
                  { value: "formula", label: "Formula" },
                  { value: "expressed_milk", label: "Expressed" },
                  { value: "donor_milk", label: "Donor" },
                ] as const
              ).map(({ value, label }) => (
                <Pressable
                  key={value}
                  onPress={() => setBottleContent(value)}
                  className={`flex-1 items-center py-2.5 rounded-md border-2 ${
                    bottleContent === value
                      ? "border-coo-primary bg-coo-primary/15"
                      : "border-coo-divider dark:border-coo-divider-dark bg-coo-surface dark:bg-coo-surface-dark"
                  }`}
                >
                  <Text
                    className={`text-caption ${
                      bottleContent === value
                        ? "text-coo-text-primary dark:text-coo-text-primary-dark font-medium"
                        : "text-coo-text-tertiary dark:text-coo-text-tertiary-dark"
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {bottleContent === "formula" && (
              <TextInput
                value={formulaBrand}
                onChangeText={setFormulaBrand}
                placeholder="Formula brand (optional)"
                placeholderTextColor={colors.textTertiary}
                className="mt-2 bg-coo-surface dark:bg-coo-surface-dark border border-coo-divider dark:border-coo-divider-dark rounded-md px-3 py-2 text-body text-coo-text-primary dark:text-coo-text-primary-dark"
              />
            )}
          </View>
        )}

        {/* Solid Description */}
        {showSolidDesc && (
          <View className="mt-lg">
            <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mb-2 font-medium">
              What did baby eat?
            </Text>
            <TextInput
              value={solidDescription}
              onChangeText={setSolidDescription}
              placeholder="e.g., Rice cereal, mashed banana"
              placeholderTextColor={colors.textTertiary}
              className="bg-coo-surface dark:bg-coo-surface-dark border border-coo-divider dark:border-coo-divider-dark rounded-md px-3 py-2 text-body text-coo-text-primary dark:text-coo-text-primary-dark"
            />
          </View>
        )}

        {/* Amount */}
        {showAmount && (
          <View className="mt-lg">
            <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mb-2 font-medium">
              Amount (optional)
            </Text>
            <AmountPicker
              amountMl={amountMl}
              onAmountChange={setAmountMl}
              unit={unit}
              onUnitToggle={() =>
                setUnit((u) => (u === "oz" ? "ml" : "oz"))
              }
            />
          </View>
        )}

        {/* Notes */}
        <View className="mt-lg">
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add note... (optional)"
            placeholderTextColor={colors.textTertiary}
            multiline
            className="bg-coo-surface dark:bg-coo-surface-dark border border-coo-divider dark:border-coo-divider-dark rounded-md px-3 py-2 text-body text-coo-text-primary dark:text-coo-text-primary-dark min-h-[60px]"
          />
        </View>

        {/* Manual Entry Link */}
        <Pressable
          onPress={() => {
            timerStore.resetTimer();
            router.replace("/log/manual");
          }}
          className="mt-lg flex-row items-center justify-center py-3 rounded-md border border-coo-divider dark:border-coo-divider-dark bg-coo-surface dark:bg-coo-surface-dark"
        >
          <Ionicons name="time-outline" size={18} color="#6BA3C7" />
          <Text className="text-body text-coo-info ml-2 font-medium">
            Add a past feed instead
          </Text>
        </Pressable>
      </ScrollView>

      {/* Save Button */}
      <View className="px-base pb-base">
        <Pressable
          onPress={handleSave}
          className="bg-coo-primary active:bg-coo-primary-pressed rounded-lg py-4 items-center flex-row justify-center"
        >
          <Ionicons name="checkmark" size={22} color="white" />
          <Text className="text-body-lg text-white font-semibold ml-2">
            Save Feed
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
