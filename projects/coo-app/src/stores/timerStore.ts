import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FeedingType, BreastSide } from "@/types/database";

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  startedAt: number | null;
  pausedAt: number | null;
  pausedDuration: number; // Total ms spent paused
  babyId: string | null;
  feedingType: FeedingType;
  side: BreastSide | null;

  startTimer: (babyId: string, feedingType: FeedingType, side?: BreastSide) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => {
    startedAt: number;
    endedAt: number;
    durationSeconds: number;
    feedingType: FeedingType;
    side: BreastSide | null;
    babyId: string;
  } | null;
  resetTimer: () => void;
  setFeedingType: (type: FeedingType) => void;
  setSide: (side: BreastSide) => void;
  getElapsedMs: () => number;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      isRunning: false,
      isPaused: false,
      startedAt: null,
      pausedAt: null,
      pausedDuration: 0,
      babyId: null,
      feedingType: "breast" as FeedingType,
      side: null,

      startTimer: (babyId, feedingType, side) => {
        set({
          isRunning: true,
          isPaused: false,
          startedAt: Date.now(),
          pausedAt: null,
          pausedDuration: 0,
          babyId,
          feedingType,
          side: side ?? null,
        });
      },

      pauseTimer: () => {
        set({ isPaused: true, pausedAt: Date.now() });
      },

      resumeTimer: () => {
        const { pausedAt, pausedDuration } = get();
        if (pausedAt) {
          const additionalPause = Date.now() - pausedAt;
          set({
            isPaused: false,
            pausedAt: null,
            pausedDuration: pausedDuration + additionalPause,
          });
        }
      },

      stopTimer: () => {
        const { startedAt, babyId, feedingType, side, pausedDuration, isPaused, pausedAt } = get();
        if (!startedAt || !babyId) return null;

        const now = Date.now();
        let totalPaused = pausedDuration;
        if (isPaused && pausedAt) {
          totalPaused += now - pausedAt;
        }

        const durationMs = now - startedAt - totalPaused;
        const durationSeconds = Math.round(durationMs / 1000);

        const result = {
          startedAt,
          endedAt: now,
          durationSeconds,
          feedingType,
          side,
          babyId,
        };

        set({
          isRunning: false,
          isPaused: false,
          startedAt: null,
          pausedAt: null,
          pausedDuration: 0,
          babyId: null,
          side: null,
        });

        return result;
      },

      resetTimer: () => {
        set({
          isRunning: false,
          isPaused: false,
          startedAt: null,
          pausedAt: null,
          pausedDuration: 0,
          babyId: null,
          side: null,
        });
      },

      setFeedingType: (feedingType) => set({ feedingType }),
      setSide: (side) => set({ side }),

      getElapsedMs: () => {
        const { startedAt, pausedDuration, isPaused, pausedAt } = get();
        if (!startedAt) return 0;
        const now = Date.now();
        let totalPaused = pausedDuration;
        if (isPaused && pausedAt) {
          totalPaused += now - pausedAt;
        }
        return now - startedAt - totalPaused;
      },
    }),
    {
      name: "coo-timer",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
