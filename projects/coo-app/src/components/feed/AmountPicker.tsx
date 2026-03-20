import { View, Pressable, Text, TextInput } from "react-native";
import { useState } from "react";
import type { VolumeUnit } from "@/types/database";
import { toCanonicalMl, fromCanonicalMl } from "@/lib/units";
import { useThemeColors } from "@/hooks/useThemeColors";

interface AmountPickerProps {
  amountMl: number | null;
  onAmountChange: (amountMl: number | null) => void;
  unit: VolumeUnit;
  onUnitToggle: () => void;
}

const QUICK_AMOUNTS_OZ = [1, 2, 3, 4, 5, 6];
const QUICK_AMOUNTS_ML = [30, 60, 90, 120, 150, 180];

export function AmountPicker({
  amountMl,
  onAmountChange,
  unit,
  onUnitToggle,
}: AmountPickerProps) {
  const { colors } = useThemeColors();
  const [customInput, setCustomInput] = useState("");
  const quickAmounts = unit === "oz" ? QUICK_AMOUNTS_OZ : QUICK_AMOUNTS_ML;

  const currentDisplayValue =
    amountMl !== null ? fromCanonicalMl(amountMl, unit) : null;

  function selectQuick(displayVal: number) {
    const ml = toCanonicalMl(displayVal, unit);
    if (amountMl !== null && Math.abs(amountMl - ml) < 1) {
      onAmountChange(null); // Deselect
    } else {
      onAmountChange(ml);
    }
    setCustomInput("");
  }

  function handleCustomSubmit() {
    const val = parseFloat(customInput);
    if (!isNaN(val) && val > 0) {
      onAmountChange(toCanonicalMl(val, unit));
    }
  }

  return (
    <View>
      <View className="flex-row flex-wrap gap-2">
        {quickAmounts.map((val) => {
          const isActive =
            currentDisplayValue !== null &&
            Math.abs(currentDisplayValue - val) < 0.5;
          return (
            <Pressable
              key={val}
              onPress={() => selectQuick(val)}
              className={`w-[48px] h-[48px] items-center justify-center rounded-md border-2 ${
                isActive
                  ? "border-coo-primary bg-coo-primary/15"
                  : "border-coo-divider dark:border-coo-divider-dark bg-coo-surface dark:bg-coo-surface-dark"
              }`}
            >
              <Text
                className={`text-body font-medium ${
                  isActive
                    ? "text-coo-text-primary dark:text-coo-text-primary-dark"
                    : "text-coo-text-secondary dark:text-coo-text-secondary-dark"
                }`}
              >
                {val}
              </Text>
              <Text className="text-[10px] text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
                {unit}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row items-center mt-3 gap-2">
        <TextInput
          value={customInput}
          onChangeText={setCustomInput}
          onSubmitEditing={handleCustomSubmit}
          placeholder="Custom"
          placeholderTextColor={colors.textTertiary}
          keyboardType="decimal-pad"
          returnKeyType="done"
          className="flex-1 bg-coo-surface dark:bg-coo-surface-dark border border-coo-divider dark:border-coo-divider-dark rounded-md px-3 py-2 text-body text-coo-text-primary dark:text-coo-text-primary-dark"
        />
        <Pressable
          onPress={onUnitToggle}
          className="bg-coo-surface-elevated dark:bg-coo-surface-elevated-dark px-3 py-2 rounded-md"
        >
          <Text className="text-body text-coo-info">
            {unit === "oz" ? "oz \u21C4 ml" : "ml \u21C4 oz"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
