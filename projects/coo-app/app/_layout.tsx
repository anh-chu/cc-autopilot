import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, View } from "react-native";
import { useColorScheme } from "nativewind";
import { useColorScheme as useSystemColorScheme } from "react-native";
import { useSettingsStore } from "@/stores/settingsStore";
import { useEffect } from "react";

// GestureHandlerRootView is only needed on native (reanimated crashes on web)
let GestureWrapper: React.ComponentType<{ style?: object; children: React.ReactNode }>;
if (Platform.OS !== "web") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  GestureWrapper = require("react-native-gesture-handler").GestureHandlerRootView;
} else {
  GestureWrapper = View as unknown as typeof GestureWrapper;
}

export default function RootLayout() {
  const darkMode = useSettingsStore((s) => s.darkMode);
  const systemScheme = useSystemColorScheme();
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    if (darkMode === "auto") {
      setColorScheme(systemScheme === "light" ? "light" : "dark");
    } else {
      setColorScheme(darkMode);
    }
  }, [darkMode, systemScheme, setColorScheme]);

  return (
    <GestureWrapper style={{ flex: 1 }}>
      <View className="flex-1 bg-coo-bg dark:bg-coo-bg-dark">
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
            animation: "slide_from_right",
          }}
        />
      </View>
    </GestureWrapper>
  );
}
