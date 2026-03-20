import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SymptomLog, Severity } from "@/types/database";
import { generateId } from "@/lib/id";

interface SymptomStore {
  symptoms: SymptomLog[];

  addSymptom: (
    symptom: Omit<SymptomLog, "id" | "createdAt" | "updatedAt">
  ) => string;
  deleteSymptom: (id: string) => void;
  getSymptomsForBaby: (babyId: string) => SymptomLog[];
  getTodaySymptoms: (babyId: string) => SymptomLog[];
  getRecentSymptoms: (babyId: string, days: number) => SymptomLog[];
  getSymptomsByDateRange: (
    babyId: string,
    start: number,
    end: number
  ) => SymptomLog[];
}

export const useSymptomStore = create<SymptomStore>()(
  persist(
    (set, get) => ({
      symptoms: [],

      addSymptom: (data) => {
        const id = generateId();
        const now = Date.now();
        const symptom: SymptomLog = {
          id,
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ symptoms: [...s.symptoms, symptom] }));
        return id;
      },

      deleteSymptom: (id) => {
        set((s) => ({
          symptoms: s.symptoms.filter((s2) => s2.id !== id),
        }));
      },

      getSymptomsForBaby: (babyId) => {
        return get()
          .symptoms.filter((s) => s.babyId === babyId)
          .sort((a, b) => b.occurredAt - a.occurredAt);
      },

      getTodaySymptoms: (babyId) => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return get()
          .symptoms.filter(
            (s) => s.babyId === babyId && s.occurredAt >= todayStart.getTime()
          )
          .sort((a, b) => b.occurredAt - a.occurredAt);
      },

      getRecentSymptoms: (babyId, days) => {
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        return get()
          .symptoms.filter(
            (s) => s.babyId === babyId && s.occurredAt >= cutoff
          )
          .sort((a, b) => b.occurredAt - a.occurredAt);
      },

      getSymptomsByDateRange: (babyId, start, end) => {
        return get()
          .symptoms.filter(
            (s) =>
              s.babyId === babyId &&
              s.occurredAt >= start &&
              s.occurredAt <= end
          )
          .sort((a, b) => b.occurredAt - a.occurredAt);
      },
    }),
    {
      name: "coo-symptoms",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
