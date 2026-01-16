import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAccentTheme } from "@/contexts/ThemeContext";

export function useTheme() {
  const colorScheme = useColorScheme();
  const { getAccentColor, getAccentGradient, accentColor, setAccentColor } = useAccentTheme();
  const isDark = colorScheme === "dark";
  const baseTheme = Colors[colorScheme ?? "light"];
  const gradient = getAccentGradient();
  
  const theme = {
    ...baseTheme,
    primary: getAccentColor(),
    tabIconSelected: getAccentColor(),
    link: getAccentColor(),
    gradientStart: gradient.start,
    gradientEnd: gradient.end,
  };

  return {
    theme,
    isDark,
    accentColor,
    setAccentColor,
    getAccentColor,
    getAccentGradient,
  };
}
