import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserSettings, VolumeUnit, DarkMode } from "@/types/database";
import { DEFAULT_SETTINGS } from "@/types/database";

interface SettingsStore extends UserSettings {
  setUnitVolume: (unit: VolumeUnit) => void;
  setDarkMode: (mode: DarkMode) => void;
  setOnboardingComplete: (complete: boolean) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setUnitVolume: (unitVolume) => set({ unitVolume }),
      setDarkMode: (darkMode) => set({ darkMode }),
      setOnboardingComplete: (onboardingComplete) =>
        set({ onboardingComplete }),
      updateSettings: (settings) => set(settings),
    }),
    {
      name: "coo-settings",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
