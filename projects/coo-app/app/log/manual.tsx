import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useBabyStore } from "@/stores/babyStore";
import { useFeedingStore } from "@/stores/feedingStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { TypeSelector } from "@/components/feed/TypeSelector";
import { SideSelector } from "@/components/feed/SideSelector";
import { AmountPicker } from "@/components/feed/AmountPicker";
import { TimePicker } from "@/components/feed/TimePicker";
import type { FeedingType, BreastSide, BottleContent } from "@/types/database";
import { useThemeColors } from "@/hooks/useThemeColors";
import { formatDate, formatTime } from "@/lib/dates";

export default function ManualEntryScreen() {
  const { colors } = useThemeColors();
  const router = useRouter();
  const baby = useBabyStore((s) => s.getActiveBaby());
  const addFeeding = useFeedingStore((s) => s.addFeeding);
  const getLastSide = useFeedingStore((s) => s.getLastSide);
  const unitVolume = useSettingsStore((s) => s.unitVolume);
  const timeFormat = useSettingsStore((s) => s.timeFormat);

  const [feedingType, setFeedingType] = useState<FeedingType>("breast");
  const [side, setSide] = useState<BreastSide | null>(null);
  const [amountMl, setAmountMl] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState("15");
  const [notes, setNotes] = useState("");
  const [bottleContent, setBottleContent] = useState<BottleContent>("formula");
  const [formulaBrand, setFormulaBrand] = useState("");
  const [solidDescription, setSolidDescription] = useState("");
  const [unit, setUnit] = useState(unitVolume);

  // Time selection state
  const [feedTime, setFeedTime] = useState<Date>(new Date());
  const [activePreset, setActivePreset] = useState<string | null>("0");
  const [showTimePicker, setShowTimePicker] = useState(false);

  const lastSide = baby ? getLastSide(baby.id) : null;
  const showSide = feedingType === "breast" || feedingType === "pump";
  const showAmount = feedingType !== "solid";
  const showBottleContent = feedingType === "bottle";
  const showSolidDesc = feedingType === "solid";

  const selectPreset = (val: string) => {
    const hoursBack = parseFloat(val) || 0;
    setFeedTime(new Date(Date.now() - hoursBack * 3600000));
    setActivePreset(val);
    setShowTimePicker(false);
  };

  const handleTimePickerChange = (date: Date) => {
    setFeedTime(date);
    setActivePreset(null); // deselect presets when using custom picker
  };

  const handleSave = useCallback(() => {
    if (!baby) return;

    const startedAt = feedTime.getTime();
    const dur = parseInt(durationMin) || 0;
    const endedAt = startedAt + dur * 60000;

    addFeeding({
      babyId: baby.id,
      loggedBy: "me",
      feedingType,
      side: showSide ? side ?? undefined : undefined,
      amountMl: amountMl ?? undefined,
      durationSeconds: dur * 60 || undefined,
      startedAt,
      endedAt,
      bottleContent: showBottleContent ? bottleContent : undefined,
      formulaBrand:
        showBottleContent && bottleContent === "formula"
          ? formulaBrand || undefined
          : undefined,
      solidDescription: showSolidDesc
        ? solidDescription || undefined
        : undefined,
      notes: notes || undefined,
      isTimer: false,
    });

    router.back();
  }, [
    baby,
    feedingType,
    side,
    amountMl,
    durationMin,
    feedTime,
    notes,
    bottleContent,
    formulaBrand,
    solidDescription,
    showSide,
    showBottleContent,
    showSolidDesc,
    addFeeding,
    router,
  ]);

  if (!baby) {
    router.back();
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark">
      {/* Header */}
      <View className="flex-row items-center justify-between px-base pt-base">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark ml-1">
            Back
          </Text>
        </Pressable>
        <Text className="text-heading-md text-coo-text-primary dark:text-coo-text-primary-dark font-semibold">
          Add Past Feed
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView className="flex-1 px-base" contentContainerClassName="pb-lg">
        {/* When */}
        <View className="mt-lg">
          <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mb-2 font-medium">
            When?
          </Text>
          <View className="flex-row gap-2">
            {["0", "0.5", "1", "2", "3", "4"].map((val) => (
              <Pressable
                key={val}
                onPress={() => selectPreset(val)}
                className={`flex-1 items-center py-2 rounded-md border-2 ${
                  activePreset === val
                    ? "border-coo-primary bg-coo-primary/15"
                    : "border-coo-divider dark:border-coo-divider-dark bg-coo-surface dark:bg-coo-surface-dark"
                }`}
              >
                <Text
                  className={`text-caption ${
                    activePreset === val
                      ? "text-coo-text-primary dark:text-coo-text-primary-dark font-medium"
                      : "text-coo-text-tertiary dark:text-coo-text-tertiary-dark"
                  }`}
                >
                  {val === "0"
                    ? "Now"
                    : val === "0.5"
                      ? "30m"
                      : `${val}h`}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Pick exact time toggle */}
          <Pressable
            onPress={() => {
              setShowTimePicker(!showTimePicker);
              if (!showTimePicker) setActivePreset(null);
            }}
            className={`mt-3 flex-row items-center justify-center py-2.5 rounded-md border ${
              showTimePicker
                ? "border-coo-primary bg-coo-primary/10"
                : "border-coo-divider dark:border-coo-divider-dark bg-coo-surface dark:bg-coo-surface-dark"
            }`}
          >
            <Ionicons
              name="time-outline"
              size={16}
              color={showTimePicker ? colors.primary : "#6BA3C7"}
            />
            <Text
              className={`text-caption ml-1.5 font-medium ${
                showTimePicker ? "text-coo-primary" : "text-coo-info"
              }`}
            >
              Pick exact time
            </Text>
          </Pressable>

          {/* Expandable time picker */}
          {showTimePicker && (
            <TimePicker value={feedTime} onChange={handleTimePickerChange} />
          )}

          {/* Feed time confirmation */}
          <View className="mt-2 flex-row items-center justify-center">
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark ml-1">
              {formatDate(feedTime)}, {formatTime(feedTime, timeFormat === "24h")}
            </Text>
          </View>
        </View>

        {/* Feeding Type */}
        <View className="mt-lg">
          <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mb-2 font-medium">
            Feeding Type
          </Text>
          <TypeSelector selected={feedingType} onSelect={setFeedingType} />
        </View>

        {/* Duration */}
        <View className="mt-lg">
          <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mb-2 font-medium">
            Duration
          </Text>
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() =>
                setDurationMin((d) =>
                  String(Math.max(0, parseInt(d) - 5))
                )
              }
              className="w-[48px] h-[48px] bg-coo-surface-elevated dark:bg-coo-surface-elevated-dark rounded-md items-center justify-center"
            >
              <Ionicons name="remove" size={24} color={colors.textPrimary} />
            </Pressable>
            <View className="bg-coo-surface dark:bg-coo-surface-dark rounded-md px-4 py-2 min-w-[80px] items-center">
              <Text className="text-heading-md text-coo-text-primary dark:text-coo-text-primary-dark font-semibold">
                {durationMin} min
              </Text>
            </View>
            <Pressable
              onPress={() =>
                setDurationMin((d) => String(parseInt(d) + 5))
              }
              className="w-[48px] h-[48px] bg-coo-surface-elevated dark:bg-coo-surface-elevated-dark rounded-md items-center justify-center"
            >
              <Ionicons name="add" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* Side */}
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
