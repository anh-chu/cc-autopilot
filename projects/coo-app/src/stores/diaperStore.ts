import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DiaperLog } from "@/types/database";
import { generateId } from "@/lib/id";

interface DiaperStore {
  diapers: DiaperLog[];

  addDiaper: (
    data: Omit<DiaperLog, "id" | "createdAt" | "updatedAt">
  ) => string;
  deleteDiaper: (id: string) => void;
  getDiapersForBaby: (babyId: string) => DiaperLog[];
  getTodayDiapers: (babyId: string) => DiaperLog[];
  getRecentDiapers: (babyId: string, days: number) => DiaperLog[];
  getDiapersByDateRange: (
    babyId: string,
    start: number,
    end: number
  ) => DiaperLog[];
}

export const useDiaperStore = create<DiaperStore>()(
  persist(
    (set, get) => ({
      diapers: [],

      addDiaper: (data) => {
        const id = generateId();
        const now = Date.now();
        const diaper: DiaperLog = {
          id,
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ diapers: [...s.diapers, diaper] }));
        return id;
      },

      deleteDiaper: (id) => {
        set((s) => ({
          diapers: s.diapers.filter((d) => d.id !== id),
        }));
      },

      getDiapersForBaby: (babyId) => {
        return get()
          .diapers.filter((d) => d.babyId === babyId)
          .sort((a, b) => b.occurredAt - a.occurredAt);
      },

      getTodayDiapers: (babyId) => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return get()
          .diapers.filter(
            (d) => d.babyId === babyId && d.occurredAt >= todayStart.getTime()
          )
          .sort((a, b) => b.occurredAt - a.occurredAt);
      },

      getRecentDiapers: (babyId, days) => {
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        return get()
          .diapers.filter(
            (d) => d.babyId === babyId && d.occurredAt >= cutoff
          )
          .sort((a, b) => b.occurredAt - a.occurredAt);
      },

      getDiapersByDateRange: (babyId, start, end) => {
        return get()
          .diapers.filter(
            (d) =>
              d.babyId === babyId &&
              d.occurredAt >= start &&
              d.occurredAt <= end
          )
          .sort((a, b) => b.occurredAt - a.occurredAt);
      },
    }),
    {
      name: "coo-diapers",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
