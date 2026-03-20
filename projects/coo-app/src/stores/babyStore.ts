import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Baby, Caregiver } from "@/types/database";
import { generateId } from "@/lib/id";

interface BabyStore {
  babies: Baby[];
  activeBabyId: string | null;
  caregivers: Caregiver[];

  getActiveBaby: () => Baby | null;
  addBaby: (baby: Omit<Baby, "id" | "createdAt" | "updatedAt">) => string;
  updateBaby: (id: string, updates: Partial<Baby>) => void;
  setActiveBaby: (id: string) => void;
  addCaregiver: (caregiver: Omit<Caregiver, "id">) => string;
}

export const useBabyStore = create<BabyStore>()(
  persist(
    (set, get) => ({
      babies: [],
      activeBabyId: null,
      caregivers: [{ id: "me", name: "Me", role: "parent" }],

      getActiveBaby: () => {
        const { babies, activeBabyId } = get();
        return babies.find((b) => b.id === activeBabyId) ?? babies[0] ?? null;
      },

      addBaby: (data) => {
        const id = generateId();
        const now = Date.now();
        const baby: Baby = { id, ...data, createdAt: now, updatedAt: now };
        set((s) => ({
          babies: [...s.babies, baby],
          activeBabyId: s.activeBabyId ?? id,
        }));
        return id;
      },

      updateBaby: (id, updates) => {
        set((s) => ({
          babies: s.babies.map((b) =>
            b.id === id ? { ...b, ...updates, updatedAt: Date.now() } : b
          ),
        }));
      },

      setActiveBaby: (id) => set({ activeBabyId: id }),

      addCaregiver: (data) => {
        const id = generateId();
        set((s) => ({
          caregivers: [...s.caregivers, { id, ...data }],
        }));
        return id;
      },
    }),
    {
      name: "coo-babies",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
