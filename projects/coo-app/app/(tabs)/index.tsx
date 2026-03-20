import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useBabyStore } from "@/stores/babyStore";
import { useFeedingStore } from "@/stores/feedingStore";
import { useDiaperStore } from "@/stores/diaperStore";
import { useSymptomStore } from "@/stores/symptomStore";
import { useTimerStore } from "@/stores/timerStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { calculateHungryMeter } from "@/lib/hungryMeter";
import { babyAgeDisplay, babyAgeWeeks, timeAgo, formatDuration, formatTimerDisplay } from "@/lib/dates";
import { formatVolume } from "@/lib/units";
import { FeedingTypeColors, FeedingTypeLabels } from "@/constants/theme";
import { useThemeColors } from "@/hooks/useThemeColors";
import { HungryMeterGauge } from "@/components/charts/HungryMeterGauge";
import { DailyTimeline } from "@/components/charts/DailyTimeline";
import { Card } from "@/components/ui/Card";

export default function HomeScreen() {
  const { colors } = useThemeColors();
  const router = useRouter();
  const baby = useBabyStore((s) => s.getActiveBaby());
  const getLastFeeding = useFeedingStore((s) => s.getLastFeeding);
  const getRecentFeedings = useFeedingStore((s) => s.getRecentFeedings);
  const getTodayFeedings = useFeedingStore((s) => s.getTodayFeedings);
  const getLastSide = useFeedingStore((s) => s.getLastSide);
  const addFeeding = useFeedingStore((s) => s.addFeeding);
  const getTodayDiapers = useDiaperStore((s) => s.getTodayDiapers);
  const getTodaySymptoms = useSymptomStore((s) => s.getTodaySymptoms);
  const timerIsRunning = useTimerStore((s) => s.isRunning);
  const timerIsPaused = useTimerStore((s) => s.isPaused);
  const timerFeedingType = useTimerStore((s) => s.feedingType);
  const timerSide = useTimerStore((s) => s.side);
  const getElapsedMs = useTimerStore((s) => s.getElapsedMs);
  const pauseTimer = useTimerStore((s) => s.pauseTimer);
  const resumeTimer = useTimerStore((s) => s.resumeTimer);
  const stopTimer = useTimerStore((s) => s.stopTimer);
  const resetTimer = useTimerStore((s) => s.resetTimer);
  const unitVolume = useSettingsStore((s) => s.unitVolume);

  const [now, setNow] = useState(Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);

  // Refresh timer display every second when running, or every 60s for hungry meter
  useEffect(() => {
    if (timerIsRunning) {
      const update = () => setElapsedMs(getElapsedMs());
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    } else {
      const interval = setInterval(() => setNow(Date.now()), 60000);
      return () => clearInterval(interval);
    }
  }, [timerIsRunning, timerIsPaused, getElapsedMs]);

  const handleTogglePause = useCallback(() => {
    if (timerIsPaused) {
      resumeTimer();
    } else {
      pauseTimer();
    }
  }, [timerIsPaused, pauseTimer, resumeTimer]);

  const handleQuickSave = useCallback(() => {
    const result = stopTimer();
    if (result) {
      addFeeding({
        babyId: result.babyId,
        loggedBy: "me",
        feedingType: result.feedingType,
        side: result.side ?? undefined,
        durationSeconds: result.durationSeconds || undefined,
        startedAt: result.startedAt,
        endedAt: result.endedAt,
        isTimer: true,
      });
    }
  }, [stopTimer, addFeeding]);

  if (!baby) {
    return (
      <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark items-center justify-center">
        <Text className="text-display text-coo-text-primary dark:text-coo-text-primary-dark">
          No baby yet
        </Text>
      </SafeAreaView>
    );
  }

  const lastFeed = getLastFeeding(baby.id);
  const recentFeeds = getRecentFeedings(baby.id, 7);
  const todayFeeds = getTodayFeedings(baby.id);
  const lastSide = getLastSide(baby.id);
  const todayDiapers = getTodayDiapers(baby.id);
  const todaySymptoms = getTodaySymptoms(baby.id);

  const hungryMeter = calculateHungryMeter(
    lastFeed
      ? {
          endedAt: lastFeed.endedAt ?? lastFeed.startedAt,
          amountMl: lastFeed.amountMl ?? null,
          type: lastFeed.feedingType,
        }
      : null,
    recentFeeds.map((f) => ({
      startedAt: f.startedAt,
      endedAt: f.endedAt ?? f.startedAt,
      amountMl: f.amountMl ?? null,
    })),
    babyAgeWeeks(baby.birthDate),
    now
  );

  // Today's stats
  const todayCount = todayFeeds.length;
  const todayVolume = todayFeeds.reduce((s, f) => s + (f.amountMl ?? 0), 0);
  const breastCount = todayFeeds.filter(
    (f) => f.feedingType === "breast"
  ).length;
  const bottleCount = todayFeeds.filter(
    (f) => f.feedingType === "bottle"
  ).length;

  // Diaper stats
  const diaperCount = todayDiapers.length;
  const wetCount = todayDiapers.filter(
    (d) => d.content === "pee" || d.content === "both"
  ).length;
  const dirtyCount = todayDiapers.filter(
    (d) => d.content === "poop" || d.content === "both"
  ).length;

  // Symptom stats
  const symptomCount = todaySymptoms.length;

  // Timer label
  const timerTypeLabel = FeedingTypeLabels[timerFeedingType] ?? "Feed";
  const timerSideLabel =
    timerSide && timerSide !== "both"
      ? ` (${timerSide.charAt(0).toUpperCase() + timerSide.slice(1)})`
      : timerSide === "both"
        ? " (Both)"
        : "";

  return (
    <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark">
      <ScrollView className="flex-1" contentContainerClassName="pb-6">
        {/* Header */}
        <View className="flex-row items-center justify-between px-base pt-base">
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-coo-primary/30 items-center justify-center mr-2">
              <Text className="text-body-lg">
                {baby.name.charAt(0)}
              </Text>
            </View>
            <View>
              <Text className="text-heading-md text-coo-text-primary dark:text-coo-text-primary-dark font-semibold">
                {baby.name}
              </Text>
              <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
                {babyAgeDisplay(baby.birthDate)}
              </Text>
            </View>
          </View>
        </View>

        {/* Active Timer OR Hungry Meter */}
        {timerIsRunning ? (
          <View className="items-center mt-lg px-base">
            {/* Feeding type label */}
            <View className="flex-row items-center mb-2">
              <View
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: FeedingTypeColors[timerFeedingType] }}
              />
              <Text className="text-body text-coo-text-secondary dark:text-coo-text-secondary-dark">
                {timerTypeLabel}{timerSideLabel}
              </Text>
            </View>

            {/* Large timer display */}
            <Text className="text-timer text-coo-text-primary dark:text-coo-text-primary-dark font-bold tracking-tighter">
              {formatTimerDisplay(elapsedMs)}
            </Text>

            {timerIsPaused && (
              <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark mt-1">
                Paused
              </Text>
            )}

            {/* Timer action buttons */}
            <View className="flex-row gap-3 mt-4 w-full">
              <Pressable
                onPress={resetTimer}
                className="items-center justify-center py-3 px-3 rounded-lg border border-coo-divider dark:border-coo-divider-dark bg-coo-surface-elevated dark:bg-coo-surface-elevated-dark"
              >
                <Ionicons name="close" size={18} color="#D4685A" />
              </Pressable>
              <Pressable
                onPress={handleTogglePause}
                className={`flex-1 flex-row items-center justify-center py-3 rounded-lg border ${
                  timerIsPaused
                    ? "border-coo-primary bg-coo-primary/10"
                    : "border-coo-divider dark:border-coo-divider-dark bg-coo-surface-elevated dark:bg-coo-surface-elevated-dark"
                }`}
              >
                <Ionicons
                  name={timerIsPaused ? "play" : "pause"}
                  size={18}
                  color={timerIsPaused ? colors.primary : colors.textPrimary}
                />
                <Text
                  className={`text-body font-medium ml-1.5 ${
                    timerIsPaused ? "text-coo-primary" : "text-coo-text-primary dark:text-coo-text-primary-dark"
                  }`}
                >
                  {timerIsPaused ? "Resume" : "Pause"}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleQuickSave}
                className="flex-1 flex-row items-center justify-center py-3 rounded-lg bg-coo-primary active:bg-coo-primary-pressed"
              >
                <Ionicons name="checkmark" size={18} color="white" />
                <Text className="text-body text-white font-medium ml-1.5">
                  Save Feed
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="items-center mt-lg">
            <HungryMeterGauge result={hungryMeter} />
          </View>
        )}

        {/* Last Feed Card */}
        {lastFeed && (
          <Card className="mx-base mt-lg">
            <View className="flex-row items-center justify-between">
              <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark">
                Last feed
              </Text>
              <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
                {timeAgo(lastFeed.startedAt)}
              </Text>
            </View>
            <View className="flex-row items-center mt-2">
              <View
                className="w-3 h-3 rounded-full mr-2"
                style={{
                  backgroundColor:
                    FeedingTypeColors[lastFeed.feedingType],
                }}
              />
              <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark font-medium">
                {FeedingTypeLabels[lastFeed.feedingType]}
                {lastFeed.side
                  ? ` (${lastFeed.side.charAt(0).toUpperCase() + lastFeed.side.slice(1)})`
                  : ""}
              </Text>
              {lastFeed.durationSeconds && (
                <Text className="text-body text-coo-text-secondary dark:text-coo-text-secondary-dark ml-2">
                  {formatDuration(lastFeed.durationSeconds)}
                </Text>
              )}
              {lastFeed.amountMl && (
                <Text className="text-body text-coo-text-secondary dark:text-coo-text-secondary-dark ml-2">
                  {formatVolume(lastFeed.amountMl, unitVolume)}
                </Text>
              )}
            </View>
            {lastSide && lastSide !== "both" && (
              <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark mt-1">
                Next suggested: {lastSide === "left" ? "Right" : "Left"}
              </Text>
            )}
          </Card>
        )}

        {/* Today's Summary */}
        <Card className="mx-base mt-base">
          <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mb-2">
            Today's Summary
          </Text>
          <View className="flex-row">
            <View className="flex-1">
              <Text className="text-heading-md text-coo-text-primary dark:text-coo-text-primary-dark font-semibold">
                {todayCount}
              </Text>
              <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
                feeds
              </Text>
            </View>
            {todayVolume > 0 && (
              <View className="flex-1">
                <Text className="text-heading-md text-coo-text-primary dark:text-coo-text-primary-dark font-semibold">
                  {formatVolume(todayVolume, unitVolume)}
                </Text>
                <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
                  total
                </Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark">
                {breastCount} breast
              </Text>
              <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark">
                {bottleCount} bottle
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-heading-md text-coo-text-primary dark:text-coo-text-primary-dark font-semibold">
                {diaperCount}
              </Text>
              <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
                {wetCount > 0 || dirtyCount > 0
                  ? `${wetCount} wet · ${dirtyCount} dirty`
                  : "diapers"}
              </Text>
            </View>
            {symptomCount > 0 && (
              <View className="flex-1">
                <Text className="text-heading-md text-coo-text-primary dark:text-coo-text-primary-dark font-semibold">
                  {symptomCount}
                </Text>
                <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
                  {symptomCount === 1 ? "symptom" : "symptoms"}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Mini Timeline — tap to go to Timeline tab */}
        <Pressable onPress={() => router.push("/(tabs)/timeline")}>
          <Card className="mx-base mt-base">
            <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mb-2">
              Today's Timeline
            </Text>
            <DailyTimeline
              feedings={todayFeeds}
              diapers={todayDiapers}
              symptoms={todaySymptoms}
              date={new Date()}
            />
          </Card>
        </Pressable>
      </ScrollView>

      {/* Action Buttons */}
      <View className="px-base pb-base">
        {/* Primary: Log Feed — full width */}
        <Pressable
          onPress={() => router.push("/log/timer")}
          className="bg-coo-primary active:bg-coo-primary-pressed rounded-lg py-4 items-center flex-row justify-center mb-2"
        >
          <Ionicons name="add" size={22} color="white" />
          <Text className="text-body-lg text-white font-semibold ml-2">
            {timerIsRunning ? "View Timer" : "Log Feed"}
          </Text>
        </Pressable>

        {/* Secondary row: Symptom + Diaper */}
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => router.push("/symptom/log")}
            className="flex-1 bg-coo-surface-elevated dark:bg-coo-surface-elevated-dark border border-coo-divider dark:border-coo-divider-dark rounded-lg py-3 items-center flex-row justify-center"
          >
            <Ionicons name="add" size={20} color={colors.textPrimary} />
            <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark font-medium ml-1.5">
              Symptom
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/diaper/log")}
            className="flex-1 bg-coo-surface-elevated dark:bg-coo-surface-elevated-dark border border-coo-divider dark:border-coo-divider-dark rounded-lg py-3 items-center flex-row justify-center"
          >
            <Ionicons name="add" size={20} color={colors.textPrimary} />
            <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark font-medium ml-1.5">
              Diaper
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
