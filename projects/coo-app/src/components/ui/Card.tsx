import { View, type ViewProps, type ViewStyle } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Colors } from "@/constants/theme";

interface CardProps extends ViewProps {
  elevated?: boolean;
}

export function Card({
  children,
  elevated = false,
  className = "",
  style,
  ...props
}: CardProps) {
  const { isDark } = useThemeColors();
  const bg = elevated
    ? "bg-coo-surface-elevated dark:bg-coo-surface-elevated-dark"
    : "bg-coo-surface dark:bg-coo-surface-dark";

  const lightColors = Colors.light;
  const shadowStyle: ViewStyle | undefined = !isDark
    ? elevated
      ? lightColors.shadowElevated
      : lightColors.shadowCard
    : undefined;

  return (
    <View
      className={`rounded-md p-base ${bg} ${className}`}
      style={[shadowStyle, style]}
      {...props}
    >
      {children}
    </View>
  );
}
