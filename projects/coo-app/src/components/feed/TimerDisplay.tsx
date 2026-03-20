import { View, Pressable, Text } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTimerStore } from "@/stores/timerStore";
import { formatTimerDisplay } from "@/lib/dates";
import { useThemeColors } from "@/hooks/useThemeColors";

export function TimerDisplay() {
  const { colors } = useThemeColors();
  const {
    isRunning,
    isPaused,
    getElapsedMs,
    pauseTimer,
    resumeTimer,
  } = useTimerStore();

  const [displayMs, setDisplayMs] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const update = () => setDisplayMs(getElapsedMs());
    update();

    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isRunning, isPaused, getElapsedMs]);

  const handleTogglePause = useCallback(() => {
    if (isPaused) {
      resumeTimer();
    } else {
      pauseTimer();
    }
  }, [isPaused, pauseTimer, resumeTimer]);

  if (!isRunning) return null;

  return (
    <Pressable
      onPress={handleTogglePause}
      className="items-center justify-center py-6"
    >
      <Text className="text-timer text-coo-text-primary dark:text-coo-text-primary-dark font-bold tracking-tighter">
        {formatTimerDisplay(displayMs)}
      </Text>
      <View className="flex-row items-center mt-2">
        <Ionicons
          name={isPaused ? "play" : "pause"}
          size={16}
          color={colors.textSecondary}
        />
        <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark ml-1">
          {isPaused ? "Tap to resume" : "Tap to pause"}
        </Text>
      </View>
    </Pressable>
  );
}
