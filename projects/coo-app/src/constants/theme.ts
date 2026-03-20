import type { FeedingType } from "@/types/database";

export const Colors = {
  dark: {
    background: "#0D2B2E",
    surface: "#162F32",
    surfaceElevated: "#1D3A3E",
    divider: "#243F42",
    textPrimary: "#E8E4DF",
    textSecondary: "#9BAFB3",
    textTertiary: "#6B8B8F",
    primary: "#7BAE8E",
    primaryPressed: "#5E9474",
    secondary: "#F4A88C",
  },
  light: {
    background: "#FFF8F0",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    divider: "#E8E4DF",
    textPrimary: "#1A2E30",
    textSecondary: "#5A6B6D",
    textTertiary: "#8A9A9C",
    primary: "#5E9474",
    primaryPressed: "#4A7D5E",
    secondary: "#F4A88C",
    shadowCard: {
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
    shadowElevated: {
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
  },
  status: {
    fed: "#5CB07A",
    approaching: "#E8A545",
    overdue: "#E07A6B",
    info: "#6BA3C7",
    error: "#D4685A",
  },
} as const;

export const FeedingTypeColors: Record<FeedingType, string> = {
  breast: "#7BAE8E",
  bottle: "#6BA3C7",
  solid: "#F4A88C",
  pump: "#A89BC7",
};

export const FeedingTypeLabels: Record<FeedingType, string> = {
  breast: "Breast",
  bottle: "Bottle",
  solid: "Solid",
  pump: "Pump",
};

export const FeedingTypeIcons: Record<FeedingType, string> = {
  breast: "water-outline",     // Ionicons
  bottle: "flask-outline",
  solid: "restaurant-outline",
  pump: "funnel-outline",
};
