import { View, Text } from "react-native";
import type { SymptomLog, DiaperLog } from "@/types/database";
import { symptomEmoji, symptomLabel, SYMPTOM_COLOR } from "@/constants/symptoms";
import { diaperEmoji, diaperLabel, DIAPER_COLOR } from "@/constants/diaper";

interface LinkedEventBadgesProps {
  symptoms: SymptomLog[];
  diapers: DiaperLog[];
}

export function LinkedEventBadges({ symptoms, diapers }: LinkedEventBadgesProps) {
  if (symptoms.length === 0 && diapers.length === 0) return null;

  return (
    <View className="flex-row flex-wrap gap-1 mt-1.5 ml-5">
      {symptoms.map((s) => (
        <View
          key={s.id}
          className="flex-row items-center px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: `${SYMPTOM_COLOR}22` }}
        >
          <Text className="text-caption-sm">
            {symptomEmoji(s.symptomType)}
          </Text>
          <Text
            className="text-caption-sm ml-0.5 font-medium"
            style={{ color: SYMPTOM_COLOR }}
          >
            {symptomLabel(s.symptomType)}
          </Text>
        </View>
      ))}
      {diapers.map((d) => (
        <View
          key={d.id}
          className="flex-row items-center px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: `${DIAPER_COLOR}22` }}
        >
          <Text className="text-caption-sm">
            {diaperEmoji(d.content)}
          </Text>
          <Text
            className="text-caption-sm ml-0.5 font-medium"
            style={{ color: DIAPER_COLOR }}
          >
            {diaperLabel(d.content)}
          </Text>
        </View>
      ))}
    </View>
  );
}
