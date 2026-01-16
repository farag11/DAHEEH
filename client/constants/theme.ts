import { Platform } from "react-native";

export type AccentColorName = "purple" | "orange" | "gray" | "pink" | "blue";

export const AccentColors: Record<AccentColorName, string> = {
  purple: "#7209B7",
  orange: "#FF6B35",
  gray: "#6C757D",
  pink: "#E91E8B",
  blue: "#4361EE",
};

export const Colors = {
  light: {
    primary: "#4361EE",
    secondary: "#FF6B35",
    accent: "#7209B7",
    success: "#28A745",
    warning: "#FF6B35",
    error: "#DC3545",
    info: "#17A2B8",
    text: "#212529",
    textSecondary: "#6C757D",
    buttonText: "#FFFFFF",
    tabIconDefault: "#6C757D",
    tabIconSelected: "#4361EE",
    link: "#4361EE",
    backgroundRoot: "#F8F9FA",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#E9ECEF",
    backgroundTertiary: "#DEE2E6",
    border: "#E9ECEF",
    cardBackground: "#FFFFFF",
    inputBackground: "#F8F9FA",
  },
  dark: {
    primary: "#7209B7",
    secondary: "#FF6B35",
    accent: "#4361EE",
    success: "#28A745",
    warning: "#FF6B35",
    error: "#DC3545",
    info: "#17A2B8",
    text: "#FFFFFF",
    textSecondary: "#B0B0B0",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#7209B7",
    link: "#7209B7",
    backgroundRoot: "#121212",
    backgroundDefault: "#1E1E1E",
    backgroundSecondary: "#2D2D2D",
    backgroundTertiary: "#404040",
    border: "#333333",
    cardBackground: "#1E1E1E",
    inputBackground: "#2D2D2D",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
  androidBottomPadding: 20,
  androidNavBarHeight: 48,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  displayLarge: {
    fontSize: 32,
    fontWeight: "700" as const,
    lineHeight: 40,
  },
  displayMedium: {
    fontSize: 24,
    fontWeight: "600" as const,
    lineHeight: 32,
  },
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 28,
  },
  bodyLarge: {
    fontSize: 18,
    fontWeight: "400" as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500" as const,
    lineHeight: 20,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
};

export const ArabicTypography = {
  displayLarge: {
    fontSize: 34,
    fontWeight: "700" as const,
    lineHeight: 48,
    letterSpacing: 0.5,
  },
  displayMedium: {
    fontSize: 26,
    fontWeight: "600" as const,
    lineHeight: 38,
    letterSpacing: 0.3,
  },
  h1: {
    fontSize: 34,
    fontWeight: "700" as const,
    lineHeight: 48,
    letterSpacing: 0.5,
  },
  h2: {
    fontSize: 30,
    fontWeight: "700" as const,
    lineHeight: 42,
    letterSpacing: 0.3,
  },
  h3: {
    fontSize: 26,
    fontWeight: "600" as const,
    lineHeight: 36,
    letterSpacing: 0.2,
  },
  h4: {
    fontSize: 22,
    fontWeight: "600" as const,
    lineHeight: 32,
    letterSpacing: 0.2,
  },
  bodyLarge: {
    fontSize: 19,
    fontWeight: "400" as const,
    lineHeight: 32,
    letterSpacing: 0.3,
  },
  body: {
    fontSize: 17,
    fontWeight: "400" as const,
    lineHeight: 28,
    letterSpacing: 0.2,
  },
  bodyMedium: {
    fontSize: 17,
    fontWeight: "500" as const,
    lineHeight: 28,
    letterSpacing: 0.2,
  },
  small: {
    fontSize: 15,
    fontWeight: "400" as const,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  label: {
    fontSize: 15,
    fontWeight: "500" as const,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  link: {
    fontSize: 17,
    fontWeight: "500" as const,
    lineHeight: 26,
    letterSpacing: 0.1,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "Poppins, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};
