import { Pressable, Text, type ViewStyle } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  style?: ViewStyle;
}

const variantClasses = {
  primary: "bg-coo-primary active:bg-coo-primary-pressed",
  secondary: "bg-coo-surface-elevated dark:bg-coo-surface-elevated-dark active:bg-coo-divider dark:active:bg-coo-divider-dark",
  outline: "border border-coo-primary bg-transparent active:bg-coo-primary/10",
  ghost: "bg-transparent active:bg-coo-surface-elevated dark:active:bg-coo-surface-elevated-dark",
};

const textVariantClasses = {
  primary: "text-white",
  secondary: "text-coo-text-primary dark:text-coo-text-primary-dark",
  outline: "text-coo-primary",
  ghost: "text-coo-primary",
};

const sizeClasses = {
  sm: "px-4 py-2 rounded-sm",
  md: "px-5 py-3 rounded-lg",
  lg: "px-6 py-4 rounded-lg",
};

const textSizeClasses = {
  sm: "text-caption",
  md: "text-body",
  lg: "text-body-lg font-semibold",
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  style,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`items-center justify-center ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? "opacity-50" : ""}`}
      style={style}
    >
      <Text
        className={`${textVariantClasses[variant]} ${textSizeClasses[size]}`}
      >
        {title}
      </Text>
    </Pressable>
  );
}
