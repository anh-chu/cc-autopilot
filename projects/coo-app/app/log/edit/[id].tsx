import { View, Text, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { useCallback, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFeedingStore } from "@/stores/feedingStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { TypeSelector } from "@/components/feed/TypeSelector";
import { SideSelector } from "@/components/feed/SideSelector";
import { AmountPicker } from "@/components/feed/AmountPicker";
import { formatTime, formatDuration } from "@/lib/dates";
import { formatVolume } from "@/lib/units";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { FeedingType, BreastSide, BottleContent } from "@/types/database";

export default function EditFeedingScreen() {
  const { colors } = useThemeColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const feedings = useFeedingStore((s) => s.feedings);
  const updateFeeding = useFeedingStore((s) => s.updateFeeding);
  const deleteFeeding = useFeedingStore((s) => s.deleteFeeding);
  const unitVolume = useSettingsStore((s) => s.unitVolume);
  const timeFormat = useSettingsStore((s) => s.timeFormat);

  const feeding = feedings.find((f) => f.id === id);

  const [feedingType, setFeedingType] = useState<FeedingType>(
    feeding?.feedingType ?? "breast"
  );
  const [side, setSide] = useState<BreastSide | null>(
    feeding?.side ?? null
  );
  const [amountMl, setAmountMl] = useState<number | null>(
    feeding?.amountMl ?? null
  );
  const [notes, setNotes] = useState(feeding?.notes ?? "");
  const [unit, setUnit] = useState(unitVolume);

  if (!feeding) {
    return (
      <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark items-center justify-center">
        <Text className="text-body text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
          Feed not found
        </Text>
        <Pressable onPress={() => router.back()} className="mt-base">
          <Text className="text-body text-coo-primary">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const showSide = feedingType === "breast" || feedingType === "pump";
  const showAmount = feedingType !== "solid";

  const handleSave = useCallback(() => {
    updateFeeding(id, {
      feedingType,
      side: showSide ? side ?? undefined : undefined,
      amountMl: amountMl ?? undefined,
      notes: notes || undefined,
    });
    router.back();
  }, [id, feedingType, side, amountMl, notes, showSide, updateFeeding, router]);

  const handleDelete = useCallback(() => {
    Alert.alert("Delete Feed", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteFeeding(id);
          router.back();
        },
      },
    ]);
  }, [id, deleteFeeding, router]);

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
          Edit Feed
        </Text>
        <Pressable onPress={handleDelete}>
          <Ionicons name="trash-outline" size={22} color="#D4685A" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-base" contentContainerClassName="pb-lg">
        {/* Feed time info */}
        <View className="mt-lg bg-coo-surface dark:bg-coo-surface-dark rounded-md p-base">
          <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark">
            {formatTime(feeding.startedAt, timeFormat === "24h")}
            {feeding.durationSeconds
              ? ` \u00B7 ${formatDuration(feeding.durationSeconds)}`
              : ""}
            {feeding.amountMl
              ? ` \u00B7 ${formatVolume(feeding.amountMl, unitVolume)}`
              : ""}
          </Text>
        </View>

        {/* Feeding Type */}
        <View className="mt-lg">
          <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mb-2 font-medium">
            Feeding Type
          </Text>
          <TypeSelector selected={feedingType} onSelect={setFeedingType} />
        </View>

        {/* Side */}
        {showSide && (
          <View className="mt-lg">
            <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mb-2 font-medium">
              Side
            </Text>
            <SideSelector selected={side} onSelect={setSide} />
          </View>
        )}

        {/* Amount */}
        {showAmount && (
          <View className="mt-lg">
            <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mb-2 font-medium">
              Amount
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
            placeholder="Notes..."
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
            Save Changes
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
