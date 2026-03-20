import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSettingsStore } from "@/stores/settingsStore";
import { formatDate } from "@/lib/dates";
import { useThemeColors } from "@/hooks/useThemeColors";

interface TimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const { colors } = useThemeColors();
  const timeFormat = useSettingsStore((s) => s.timeFormat);
  const is24h = timeFormat === "24h";

  const hours24 = value.getHours();
  const minutes = value.getMinutes();
  const isPM = hours24 >= 12;
  const displayHour = is24h ? hours24 : hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;

  const clampToNow = (d: Date): Date => {
    const now = new Date();
    return d.getTime() > now.getTime() ? now : d;
  };

  const changeDay = (delta: number) => {
    const next = new Date(value);
    next.setDate(next.getDate() + delta);
    onChange(clampToNow(next));
  };

  const changeHour = (delta: number) => {
    const next = new Date(value);
    next.setHours(next.getHours() + delta);
    onChange(clampToNow(next));
  };

  const changeMinute = (delta: number) => {
    const next = new Date(value);
    next.setMinutes(next.getMinutes() + delta);
    onChange(clampToNow(next));
  };

  const togglePeriod = () => {
    const next = new Date(value);
    if (isPM) {
      next.setHours(next.getHours() - 12);
    } else {
      next.setHours(next.getHours() + 12);
    }
    onChange(clampToNow(next));
  };

  const canGoForward = (() => {
    const tomorrow = new Date(value);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.getTime() <= new Date().getTime();
  })();

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <View className="bg-coo-surface-elevated dark:bg-coo-surface-elevated-dark rounded-lg p-4 mt-3">
      {/* Date row */}
      <View className="flex-row items-center justify-center gap-4 mb-4">
        <Pressable
          onPress={() => changeDay(-1)}
          className="w-[44px] h-[44px] items-center justify-center rounded-md bg-coo-surface dark:bg-coo-surface-dark"
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark font-medium min-w-[120px] text-center">
          {formatDate(value)}
        </Text>
        <Pressable
          onPress={() => changeDay(1)}
          disabled={!canGoForward}
          className={`w-[44px] h-[44px] items-center justify-center rounded-md ${
            canGoForward ? "bg-coo-surface dark:bg-coo-surface-dark" : "bg-coo-surface dark:bg-coo-surface-dark opacity-30"
          }`}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Hour row */}
      <View className="flex-row items-center justify-center gap-3 mb-3">
        <Pressable
          onPress={() => changeHour(-1)}
          className="w-[48px] h-[48px] bg-coo-surface dark:bg-coo-surface-dark rounded-md items-center justify-center"
        >
          <Ionicons name="remove" size={24} color={colors.textPrimary} />
        </Pressable>
        <View className="bg-coo-surface dark:bg-coo-surface-dark rounded-md px-4 py-2 min-w-[60px] items-center">
          <Text className="text-heading-md text-coo-text-primary dark:text-coo-text-primary-dark font-semibold">
            {displayHour}
          </Text>
        </View>
        <Text className="text-heading-md text-coo-text-tertiary dark:text-coo-text-tertiary-dark font-semibold">:</Text>
        <View className="bg-coo-surface dark:bg-coo-surface-dark rounded-md px-4 py-2 min-w-[60px] items-center">
          <Text className="text-heading-md text-coo-text-primary dark:text-coo-text-primary-dark font-semibold">
            {pad(minutes)}
          </Text>
        </View>
        <Pressable
          onPress={() => changeHour(1)}
          className="w-[48px] h-[48px] bg-coo-surface dark:bg-coo-surface-dark rounded-md items-center justify-center"
        >
          <Ionicons name="add" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Minute row */}
      <View className="flex-row items-center justify-center gap-3 mb-3">
        <Pressable
          onPress={() => changeMinute(-5)}
          className="w-[48px] h-[48px] bg-coo-surface dark:bg-coo-surface-dark rounded-md items-center justify-center"
        >
          <Ionicons name="remove" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark">
          Minutes (5 min steps)
        </Text>
        <Pressable
          onPress={() => changeMinute(5)}
          className="w-[48px] h-[48px] bg-coo-surface dark:bg-coo-surface-dark rounded-md items-center justify-center"
        >
          <Ionicons name="add" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* AM/PM toggle (12h only) */}
      {!is24h && (
        <View className="flex-row items-center justify-center gap-2">
          <Pressable
            onPress={() => { if (isPM) togglePeriod(); }}
            className={`px-5 py-2.5 rounded-md border-2 ${
              !isPM
                ? "border-coo-primary bg-coo-primary/15"
                : "border-coo-divider dark:border-coo-divider-dark bg-coo-surface dark:bg-coo-surface-dark"
            }`}
          >
            <Text
              className={`text-body font-medium ${
                !isPM ? "text-coo-text-primary dark:text-coo-text-primary-dark" : "text-coo-text-tertiary dark:text-coo-text-tertiary-dark"
              }`}
            >
              AM
            </Text>
          </Pressable>
          <Pressable
            onPress={() => { if (!isPM) togglePeriod(); }}
            className={`px-5 py-2.5 rounded-md border-2 ${
              isPM
                ? "border-coo-primary bg-coo-primary/15"
                : "border-coo-divider dark:border-coo-divider-dark bg-coo-surface dark:bg-coo-surface-dark"
            }`}
          >
            <Text
              className={`text-body font-medium ${
                isPM ? "text-coo-text-primary dark:text-coo-text-primary-dark" : "text-coo-text-tertiary dark:text-coo-text-tertiary-dark"
              }`}
            >
              PM
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
