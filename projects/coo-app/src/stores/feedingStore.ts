import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FeedingLog, FeedingType, BreastSide } from "@/types/database";
import { generateId } from "@/lib/id";

interface FeedingStore {
  feedings: FeedingLog[];

  addFeeding: (
    feeding: Omit<FeedingLog, "id" | "createdAt" | "updatedAt">
  ) => string;
  updateFeeding: (id: string, updates: Partial<FeedingLog>) => void;
  deleteFeeding: (id: string) => void;

  getFeedingsForBaby: (babyId: string) => FeedingLog[];
  getRecentFeedings: (babyId: string, days: number) => FeedingLog[];
  getLastFeeding: (babyId: string) => FeedingLog | null;
  getLastSide: (babyId: string) => BreastSide | null;
  getTodayFeedings: (babyId: string) => FeedingLog[];
  getFeedingsByDateRange: (
    babyId: string,
    start: number,
    end: number
  ) => FeedingLog[];
}

export const useFeedingStore = create<FeedingStore>()(
  persist(
    (set, get) => ({
      feedings: [],

      addFeeding: (data) => {
        const id = generateId();
        const now = Date.now();
        const feeding: FeedingLog = {
          id,
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ feedings: [...s.feedings, feeding] }));
        return id;
      },

      updateFeeding: (id, updates) => {
        set((s) => ({
          feedings: s.feedings.map((f) =>
            f.id === id ? { ...f, ...updates, updatedAt: Date.now() } : f
          ),
        }));
      },

      deleteFeeding: (id) => {
        set((s) => ({
          feedings: s.feedings.filter((f) => f.id !== id),
        }));
      },

      getFeedingsForBaby: (babyId) => {
        return get()
          .feedings.filter((f) => f.babyId === babyId)
          .sort((a, b) => b.startedAt - a.startedAt);
      },

      getRecentFeedings: (babyId, days) => {
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        return get()
          .feedings.filter((f) => f.babyId === babyId && f.startedAt >= cutoff)
          .sort((a, b) => b.startedAt - a.startedAt);
      },

      getLastFeeding: (babyId) => {
        const feeds = get().getFeedingsForBaby(babyId);
        return feeds[0] ?? null;
      },

      getLastSide: (babyId) => {
        const feeds = get().getFeedingsForBaby(babyId);
        for (const f of feeds) {
          if (f.side && f.side !== "both") return f.side;
        }
        return null;
      },

      getTodayFeedings: (babyId) => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return get()
          .feedings.filter(
            (f) => f.babyId === babyId && f.startedAt >= todayStart.getTime()
          )
          .sort((a, b) => b.startedAt - a.startedAt);
      },

      getFeedingsByDateRange: (babyId, start, end) => {
        return get()
          .feedings.filter(
            (f) =>
              f.babyId === babyId &&
              f.startedAt >= start &&
              f.startedAt <= end
          )
          .sort((a, b) => b.startedAt - a.startedAt);
      },
    }),
    {
      name: "coo-feedings",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
