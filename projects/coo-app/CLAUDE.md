# Coo — Infant Feeding Companion App

## Tech Stack
- Expo SDK 53 + Expo Router v4 (file-based routing)
- TypeScript strict mode
- NativeWind v4 (Tailwind CSS for React Native)
- Zustand v5 + AsyncStorage persistence (offline-first)
- react-native-svg (custom chart components)
- @expo/vector-icons (Ionicons)
- date-fns (date utilities)

## Project Structure
```
app/                    # Expo Router screens
  (tabs)/               # Bottom tab navigator
    index.tsx           # Home dashboard + hungry meter
    timeline.tsx        # Feeding history list
    charts.tsx          # Charts & trends
    settings.tsx        # App settings
  log/                  # Feeding log screens
    timer.tsx           # Active timer mode
    manual.tsx          # Manual/past entry
    edit/[id].tsx       # Edit existing feed
  symptom/              # Symptom tracking
    log.tsx             # Log symptom screen
  onboarding.tsx        # First-time setup
src/
  components/           # Reusable UI components
  stores/               # Zustand state stores
  hooks/                # Custom React hooks
  lib/                  # Pure utility functions
  constants/            # Theme, symptoms, etc.
  types/                # TypeScript type definitions
```

## Design System
- Dark mode default (Midnight Teal #0D2B2E)
- Primary accent: Soft Sage #7BAE8E
- All interactive elements >= 48x48dp
- Designed for 3 AM one-handed use

## Commands
- Dev: `pnpm start` or `npx expo start`
- Typecheck: `pnpm tsc`
- Install: `pnpm install`

## Key Patterns
- All data persisted via Zustand + AsyncStorage (offline-first)
- Timer state persists through app backgrounding
- Hungry meter recalculates every 60 seconds
- FeedingType colors: breast=#7BAE8E, bottle=#6BA3C7, solid=#F4A88C, pump=#A89BC7
