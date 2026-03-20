import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { useCallback, useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useBabyStore } from "@/stores/babyStore";
import { useSymptomStore } from "@/stores/symptomStore";
import { useFeedingStore } from "@/stores/feedingStore";
import { SymptomChips } from "@/components/symptom/SymptomChips";
import { SeveritySelector } from "@/components/symptom/SeveritySelector";
import { TimePicker } from "@/components/feed/TimePicker";
import { PRESET_SYMPTOMS } from "@/constants/symptoms";
import { FeedingTypeLabels, FeedingTypeColors } from "@/constants/theme";
import { formatDate, formatTime, formatDuration, timeAgo } from "@/lib/dates";
import { formatVolume } from "@/lib/units";
import { useSettingsStore } from "@/stores/settingsStore";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Card } from "@/components/ui/Card";
import type { Severity, FeedingLog } from "@/types/database";

export default function SymptomLogScreen() {
  const { colors } = useThemeColors();
  const router = useRouter();
  const baby = useBabyStore((s) => s.getActiveBaby());
  const addSymptom = useSymptomStore((s) => s.addSymptom);
  const getRecentSymptoms = useSymptomStore((s) => s.getRecentSymptoms);
  const getRecentFeedings = useFeedingStore((s) => s.getRecentFeedings);
  const unitVolume = useSettingsStore((s) => s.unitVolume);
  const timeFormat = useSettingsStore((s) => s.timeFormat);

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState<Severity>("mild");
  const [notes, setNotes] = useState("");
  const [linkedFeedingId, setLinkedFeedingId] = useState<string | null>(null);

  // Time selection state
  const [eventTime, setEventTime] = useState<Date>(new Date());
  const [activePreset, setActivePreset] = useState<string | null>("0");
  const [showTimePicker, setShowTimePicker] = useState(false);

  const recentFeedings = baby ? getRecentFeedings(baby.id, 1) : [];

  // Find nearest feedings (within 8 hours before now)
  const nearestFeedings = useMemo(() => {
    const eightHoursAgo = Date.now() - 8 * 3600000;
    return recentFeedings
      .filter((f) => f.startedAt >= eightHoursAgo)
      .slice(0, 5);
  }, [recentFeedings]);

  const selectPreset = (val: string) => {
    const hoursBack = parseFloat(val) || 0;
    setEventTime(new Date(Date.now() - hoursBack * 3600000));
    setActivePreset(val);
    setShowTimePicker(false);
  };

  const handleTimePickerChange = (date: Date) => {
    setEventTime(date);
    setActivePreset(null);
  };

  const handleToggle = useCallback((id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

  const handleSave = useCallback(() => {
    if (!baby || selectedSymptoms.length === 0) return;

    const now = eventTime.getTime();
    for (const symptomType of selectedSymptoms) {
      addSymptom({
        babyId: baby.id,
        loggedBy: "me",
        symptomType,
        severity,
        feedingId: linkedFeedingId ?? undefined,
        notes: notes || undefined,
        occurredAt: now,
      });
    }

    router.back();
  }, [baby, selectedSymptoms, severity, linkedFeedingId, notes, eventTime, addSymptom, router]);

  if (!baby) {
    router.back();
    return null;
  }

  // Recent symptom history
  const recentSymptoms = getRecentSymptoms(baby.id, 7);

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
          Log Symptom
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView className="flex-1 px-base" contentContainerClassName="pb-lg">
        {/* When? */}
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
            <TimePicker value={eventTime} onChange={handleTimePickerChange} />
          )}

          {/* Time confirmation */}
          <View className="mt-2 flex-row items-center justify-center">
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark ml-1">
              {formatDate(eventTime)}, {formatTime(eventTime, timeFormat === "24h")}
            </Text>
          </View>
        </View>

        {/* Symptom Selection */}
        <View className="mt-lg">
          <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mb-2 font-medium">
            What's happening?
          </Text>
          <SymptomChips selected={selectedSymptoms} onToggle={handleToggle} />
        </View>

        {/* Severity */}
        <View className="mt-lg">
          <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mb-2 font-medium">
            How severe?
          </Text>
          <SeveritySelector selected={severity} onSelect={setSeverity} />
        </View>

        {/* Notes */}
        <View className="mt-lg">
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder='e.g., "Started after bottle feed"'
            placeholderTextColor={colors.textTertiary}
            multiline
            className="bg-coo-surface dark:bg-coo-surface-dark border border-coo-divider dark:border-coo-divider-dark rounded-md px-3 py-2 text-body text-coo-text-primary dark:text-coo-text-primary-dark min-h-[60px]"
          />
        </View>

        {/* Link to Feeding (optional) */}
        {nearestFeedings.length > 0 && (
          <View className="mt-lg">
            <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mb-2 font-medium">
              Link to a feeding (optional)
            </Text>
            {nearestFeedings.map((f) => {
              const isSelected = linkedFeedingId === f.id;
              return (
                <Pressable
                  key={f.id}
                  onPress={() =>
                    setLinkedFeedingId(isSelected ? null : f.id)
                  }
                  className={`flex-row items-center py-2.5 px-2 rounded-md mb-1 ${
                    isSelected
                      ? "bg-coo-primary/10 border border-coo-primary"
                      : "border border-transparent"
                  }`}
                >
                  <View
                    className="w-2.5 h-2.5 rounded-full mr-2"
                    style={{
                      backgroundColor: FeedingTypeColors[f.feedingType],
                    }}
                  />
                  <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark flex-1">
                    {formatTime(f.startedAt, timeFormat === "24h")} ·{" "}
                    {FeedingTypeLabels[f.feedingType]}
                    {f.amountMl ? ` · ${formatVolume(f.amountMl, unitVolume)}` : ""}
                  </Text>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  ) : (
                    <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
                      {timeAgo(f.startedAt)}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Recent Symptoms */}
        {recentSymptoms.length > 0 && (
          <Card className="mt-lg">
            <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mb-2 font-medium">
              This week's symptoms
            </Text>
            {recentSymptoms.slice(0, 5).map((s) => {
              const symptomDef = PRESET_SYMPTOMS.find(
                (ps) => ps.id === s.symptomType
              );
              return (
                <View
                  key={s.id}
                  className="flex-row items-center py-1.5"
                >
                  <Text className="text-body mr-2">
                    {symptomDef?.emoji ?? "?"}
                  </Text>
                  <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark flex-1">
                    {symptomDef?.label ?? s.symptomType} · {s.severity}
                  </Text>
                  <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
                    {timeAgo(s.occurredAt)}
                  </Text>
                </View>
              );
            })}
          </Card>
        )}
      </ScrollView>

      {/* Save Button */}
      <View className="px-base pb-base">
        <Pressable
          onPress={handleSave}
          disabled={selectedSymptoms.length === 0}
          className={`rounded-lg py-4 items-center flex-row justify-center ${
            selectedSymptoms.length === 0
              ? "bg-coo-surface-elevated dark:bg-coo-surface-elevated-dark"
              : "bg-coo-primary active:bg-coo-primary-pressed"
          }`}
        >
          <Ionicons
            name="checkmark"
            size={22}
            color={selectedSymptoms.length === 0 ? colors.textTertiary : "white"}
          />
          <Text
            className={`text-body-lg font-semibold ml-2 ${
              selectedSymptoms.length === 0
                ? "text-coo-text-tertiary dark:text-coo-text-tertiary-dark"
                : "text-white"
            }`}
          >
            Log Symptom
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
