import { View, Text, ScrollView, Pressable } from "react-native";
import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useBabyStore } from "@/stores/babyStore";
import { useFeedingStore } from "@/stores/feedingStore";
import { useDiaperStore } from "@/stores/diaperStore";
import { useSymptomStore } from "@/stores/symptomStore";
import { ActivityRow } from "@/components/timeline/ActivityRow";
import { DaySummaryHeader } from "@/components/timeline/DaySummaryHeader";
import { Card } from "@/components/ui/Card";
import { format } from "date-fns";
import type { FeedingLog, DiaperLog, SymptomLog } from "@/types/database";

type FilterType = "all" | "feeds" | "diapers" | "symptoms";

type TimelineEvent =
  | { type: "feeding"; data: FeedingLog; timestamp: number }
  | { type: "diaper"; data: DiaperLog; timestamp: number }
  | { type: "symptom"; data: SymptomLog; timestamp: number };

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "feeds", label: "Feeds" },
  { value: "diapers", label: "Diapers" },
  { value: "symptoms", label: "Symptoms" },
];

export default function TimelineScreen() {
  const { colors } = useThemeColors();
  const router = useRouter();
  const baby = useBabyStore((s) => s.getActiveBaby());
  const getFeedingsForBaby = useFeedingStore((s) => s.getFeedingsForBaby);
  const getDiapersForBaby = useDiaperStore((s) => s.getDiapersForBaby);
  const getSymptomsForBaby = useSymptomStore((s) => s.getSymptomsForBaby);
  const [filter, setFilter] = useState<FilterType>("all");

  const allFeedings = baby ? getFeedingsForBaby(baby.id) : [];
  const allDiapers = baby ? getDiapersForBaby(baby.id) : [];
  const allSymptoms = baby ? getSymptomsForBaby(baby.id) : [];

  // Lookup maps for linked events (feedingId -> items[])
  const symptomsByFeeding = useMemo(() => {
    const map = new Map<string, SymptomLog[]>();
    for (const s of allSymptoms) {
      if (s.feedingId) {
        const list = map.get(s.feedingId) ?? [];
        list.push(s);
        map.set(s.feedingId, list);
      }
    }
    return map;
  }, [allSymptoms]);

  const diapersByFeeding = useMemo(() => {
    const map = new Map<string, DiaperLog[]>();
    for (const d of allDiapers) {
      if (d.feedingId) {
        const list = map.get(d.feedingId) ?? [];
        list.push(d);
        map.set(d.feedingId, list);
      }
    }
    return map;
  }, [allDiapers]);

  // Full day counts (unfiltered, for summary headers)
  const feedCountByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of allFeedings) {
      const key = format(new Date(f.startedAt), "yyyy-MM-dd");
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [allFeedings]);

  const diaperCountByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of allDiapers) {
      const key = format(new Date(d.occurredAt), "yyyy-MM-dd");
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [allDiapers]);

  const symptomCountByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of allSymptoms) {
      const key = format(new Date(s.occurredAt), "yyyy-MM-dd");
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [allSymptoms]);

  // Build filtered event list
  const events = useMemo(() => {
    const feedingEvents: TimelineEvent[] = allFeedings.map((f) => ({
      type: "feeding" as const,
      data: f,
      timestamp: f.startedAt,
    }));

    // For "all" filter: only standalone diapers/symptoms (linked ones show as sub-rows)
    // For specific filters: show ALL of that type
    const standaloneDiapers: TimelineEvent[] = allDiapers
      .filter((d) => filter === "diapers" || !d.feedingId)
      .map((d) => ({
        type: "diaper" as const,
        data: d,
        timestamp: d.occurredAt,
      }));

    const standaloneSymptoms: TimelineEvent[] = allSymptoms
      .filter((s) => filter === "symptoms" || !s.feedingId)
      .map((s) => ({
        type: "symptom" as const,
        data: s,
        timestamp: s.occurredAt,
      }));

    if (filter === "feeds") {
      return feedingEvents.sort((a, b) => b.timestamp - a.timestamp);
    }
    if (filter === "diapers") {
      return standaloneDiapers.sort((a, b) => b.timestamp - a.timestamp);
    }
    if (filter === "symptoms") {
      return standaloneSymptoms.sort((a, b) => b.timestamp - a.timestamp);
    }

    // "all": merge feedings + standalone diapers + standalone symptoms
    return [...feedingEvents, ...standaloneDiapers, ...standaloneSymptoms].sort(
      (a, b) => b.timestamp - a.timestamp
    );
  }, [allFeedings, allDiapers, allSymptoms, filter]);

  // Group by day
  const grouped = useMemo(() => {
    const groups: { date: string; events: TimelineEvent[] }[] = [];
    let currentDate = "";
    let currentGroup: TimelineEvent[] = [];

    for (const event of events) {
      const dateKey = format(new Date(event.timestamp), "yyyy-MM-dd");
      if (dateKey !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, events: currentGroup });
        }
        currentDate = dateKey;
        currentGroup = [event];
      } else {
        currentGroup.push(event);
      }
    }
    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, events: currentGroup });
    }

    return groups;
  }, [events]);

  return (
    <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark">
      {/* Header */}
      <View className="px-base pt-base pb-2">
        <Text className="text-heading-lg text-coo-text-primary dark:text-coo-text-primary-dark font-semibold">
          Timeline
        </Text>
      </View>

      {/* Always-visible filter pills */}
      <View className="flex-row px-base pb-3 gap-2">
        {FILTERS.map(({ value, label }) => (
          <Pressable
            key={value}
            onPress={() => setFilter(value)}
            className={`px-4 py-1.5 rounded-full ${
              filter === value
                ? "bg-coo-primary"
                : "bg-coo-surface dark:bg-coo-surface-dark"
            }`}
          >
            <Text
              className={`text-caption ${
                filter === value
                  ? "text-white font-medium"
                  : "text-coo-text-secondary dark:text-coo-text-secondary-dark"
              }`}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Event list */}
      <ScrollView className="flex-1 px-base" contentContainerClassName="pb-xl">
        {grouped.length === 0 && (
          <View className="items-center justify-center py-2xl">
            <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
            <Text className="text-body text-coo-text-tertiary dark:text-coo-text-tertiary-dark mt-base text-center">
              No entries logged yet
            </Text>
            <Pressable
              onPress={() => router.push("/log/timer")}
              className="mt-base bg-coo-primary px-6 py-3 rounded-lg"
            >
              <Text className="text-body text-white font-medium">
                Log your first feed
              </Text>
            </Pressable>
          </View>
        )}

        {grouped.map((group) => (
          <View key={group.date} className="mb-lg">
            {/* Day summary header */}
            <DaySummaryHeader
              date={new Date(group.date)}
              feedCount={feedCountByDay.get(group.date) ?? 0}
              diaperCount={diaperCountByDay.get(group.date) ?? 0}
              symptomCount={symptomCountByDay.get(group.date) ?? 0}
            />

            {/* Day events card */}
            <Card>
              {group.events.map((event, index) => (
                <ActivityRow
                  key={event.data.id}
                  event={event.data}
                  type={event.type}
                  linkedSymptoms={
                    event.type === "feeding"
                      ? symptomsByFeeding.get(event.data.id)
                      : undefined
                  }
                  linkedDiapers={
                    event.type === "feeding"
                      ? diapersByFeeding.get(event.data.id)
                      : undefined
                  }
                  isLast={index === group.events.length - 1}
                  onPress={
                    event.type === "feeding"
                      ? () => router.push(`/log/edit/${event.data.id}`)
                      : undefined
                  }
                />
              ))}
            </Card>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
