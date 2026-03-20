import { View, Text, ScrollView, Pressable, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBabyStore } from "@/stores/babyStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { babyAgeDisplay } from "@/lib/dates";
import { Card } from "@/components/ui/Card";
import type { DarkMode, VolumeUnit, WeightUnit, TimeFormat } from "@/types/database";

export default function SettingsScreen() {
  const baby = useBabyStore((s) => s.getActiveBaby());
  const settings = useSettingsStore();

  function cycleVolume() {
    settings.updateSettings({
      unitVolume: settings.unitVolume === "oz" ? "ml" : "oz",
    });
  }

  function cycleWeight() {
    settings.updateSettings({
      unitWeight: settings.unitWeight === "lb" ? "kg" : "lb",
    });
  }

  function cycleTime() {
    settings.updateSettings({
      timeFormat: settings.timeFormat === "12h" ? "24h" : "12h",
    });
  }

  function cycleDarkMode() {
    const modes: DarkMode[] = ["dark", "light", "auto"];
    const idx = modes.indexOf(settings.darkMode);
    settings.setDarkMode(modes[(idx + 1) % modes.length]);
  }

  return (
    <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark">
      <ScrollView className="flex-1 px-base" contentContainerClassName="pb-lg">
        <Text className="text-heading-lg text-coo-text-primary dark:text-coo-text-primary-dark font-semibold pt-base pb-lg">
          Settings
        </Text>

        {/* Baby Profile */}
        {baby && (
          <Card className="mb-base">
            <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mb-2">
              Baby Profile
            </Text>
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-coo-primary/30 items-center justify-center mr-3">
                <Text className="text-heading-md">
                  {baby.name.charAt(0)}
                </Text>
              </View>
              <View>
                <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark font-medium">
                  {baby.name}
                </Text>
                <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
                  {babyAgeDisplay(baby.birthDate)} · Born{" "}
                  {new Date(baby.birthDate).toLocaleDateString()}
                </Text>
                <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
                  Primary method:{" "}
                  {baby.primaryFeedingMethod.charAt(0).toUpperCase() +
                    baby.primaryFeedingMethod.slice(1)}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Appearance */}
        <Card className="mb-base">
          <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mb-3">
            Appearance
          </Text>
          <Pressable
            onPress={cycleDarkMode}
            className="flex-row justify-between items-center py-2"
          >
            <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark">
              Theme
            </Text>
            <Text className="text-body text-coo-info">
              {settings.darkMode.charAt(0).toUpperCase() +
                settings.darkMode.slice(1)}
            </Text>
          </Pressable>
        </Card>

        {/* Units */}
        <Card className="mb-base">
          <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark mb-3">
            Units
          </Text>

          <Pressable
            onPress={cycleVolume}
            className="flex-row justify-between items-center py-2 border-b border-coo-divider dark:border-coo-divider-dark"
          >
            <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark">
              Volume
            </Text>
            <Text className="text-body text-coo-info">
              {settings.unitVolume}
            </Text>
          </Pressable>

          <Pressable
            onPress={cycleWeight}
            className="flex-row justify-between items-center py-2 border-b border-coo-divider dark:border-coo-divider-dark"
          >
            <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark">
              Weight
            </Text>
            <Text className="text-body text-coo-info">
              {settings.unitWeight}
            </Text>
          </Pressable>

          <Pressable
            onPress={cycleTime}
            className="flex-row justify-between items-center py-2"
          >
            <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark">
              Time
            </Text>
            <Text className="text-body text-coo-info">
              {settings.timeFormat}
            </Text>
          </Pressable>
        </Card>

        {/* App Info */}
        <View className="items-center mt-lg">
          <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
            Coo v1.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
