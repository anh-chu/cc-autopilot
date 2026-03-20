import { View, Text, Pressable, Modal } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/useThemeColors";

const REPORT_REASONS = [
  "Feeding shaming",
  "Medical misinformation",
  "Spam or self-promotion",
  "Harassment or bullying",
  "Inappropriate content",
  "Other",
];

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  contentType: "post" | "comment";
}

export function ReportModal({
  visible,
  onClose,
  onSubmit,
  contentType,
}: ReportModalProps) {
  const { colors } = useThemeColors();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!selected) return;
    onSubmit(selected);
    setSelected(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/50 justify-end"
      >
        <Pressable
          onPress={() => {}}
          className="bg-coo-surface dark:bg-coo-surface-dark rounded-t-2xl p-base pb-10"
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-heading-lg text-coo-text-primary dark:text-coo-text-primary-dark font-semibold">
              Report {contentType}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Text className="text-body text-coo-text-secondary dark:text-coo-text-secondary-dark mb-4">
            Why are you reporting this {contentType}?
          </Text>

          {REPORT_REASONS.map((reason) => (
            <Pressable
              key={reason}
              onPress={() => setSelected(reason)}
              className={`flex-row items-center p-3 rounded-md mb-2 border ${
                selected === reason
                  ? "border-coo-primary bg-coo-primary/10"
                  : "border-coo-divider dark:border-coo-divider-dark"
              }`}
            >
              <Ionicons
                name={
                  selected === reason
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={20}
                color={selected === reason ? colors.primary : colors.textTertiary}
              />
              <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark ml-3">
                {reason}
              </Text>
            </Pressable>
          ))}

          <Pressable
            onPress={handleSubmit}
            disabled={!selected}
            className={`mt-4 py-3 rounded-lg items-center ${
              selected ? "bg-coo-error" : "bg-coo-divider dark:bg-coo-divider-dark"
            }`}
          >
            <Text
              className={`text-body-lg font-semibold ${
                selected ? "text-white" : "text-coo-text-tertiary dark:text-coo-text-tertiary-dark"
              }`}
            >
              Submit Report
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
