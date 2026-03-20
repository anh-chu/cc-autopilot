import { useColorScheme } from "nativewind";
import { Colors } from "@/constants/theme";

export function useThemeColors() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  return { colors: isDark ? Colors.dark : Colors.light, isDark };
}
