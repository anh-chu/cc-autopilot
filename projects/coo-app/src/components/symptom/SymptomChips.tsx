import { View, Pressable, Text } from "react-native";
import { PRESET_SYMPTOMS, type SymptomDefinition } from "@/constants/symptoms";

interface SymptomChipsProps {
  selected: string[];
  onToggle: (symptomId: string) => void;
}

export function SymptomChips({ selected, onToggle }: SymptomChipsProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {PRESET_SYMPTOMS.map((symptom) => {
        const isActive = selected.includes(symptom.id);
        return (
          <Pressable
            key={symptom.id}
            onPress={() => onToggle(symptom.id)}
            className={`px-3 py-2 rounded-md border-2 ${
              isActive
                ? "border-coo-primary bg-coo-primary/15"
                : "border-coo-divider dark:border-coo-divider-dark bg-coo-surface dark:bg-coo-surface-dark"
            }`}
          >
            <Text className="text-center text-body-lg">
              {symptom.emoji}
            </Text>
            <Text
              className={`text-caption-sm text-center mt-0.5 ${
                isActive
                  ? "text-coo-text-primary dark:text-coo-text-primary-dark font-medium"
                  : "text-coo-text-tertiary dark:text-coo-text-tertiary-dark"
              }`}
            >
              {symptom.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
