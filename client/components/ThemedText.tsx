import { Text, type TextProps, I18nManager } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Typography, ArabicTypography } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "h1" | "h2" | "h3" | "h4" | "body" | "small" | "link" | "display" | "label";
};

const getArabicFontFamily = (weight: string) => {
  switch (weight) {
    case "700":
    case "bold":
      return "Cairo_700Bold";
    case "600":
    case "semibold":
      return "Cairo_600SemiBold";
    case "500":
    case "medium":
      return "Cairo_500Medium";
    default:
      return "Cairo_400Regular";
  }
};

const getEnglishFontFamily = (weight: string) => {
  switch (weight) {
    case "700":
    case "bold":
      return "Poppins_700Bold";
    case "600":
    case "semibold":
      return "Poppins_600SemiBold";
    default:
      return "Poppins_400Regular";
  }
};

const getFontFamily = (isArabic: boolean, weight: string) => {
  return isArabic ? getArabicFontFamily(weight) : getEnglishFontFamily(weight);
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "body",
  ...rest
}: ThemedTextProps) {
  const { theme, isDark } = useTheme();
  const { isRTL } = useLanguage();

  const getColor = () => {
    if (isDark && darkColor) {
      return darkColor;
    }

    if (!isDark && lightColor) {
      return lightColor;
    }

    if (type === "link") {
      return theme.link;
    }

    return theme.text;
  };

  const getTypeStyle = () => {
    const typo = isRTL ? ArabicTypography : Typography;
    switch (type) {
      case "display":
        return typo.displayLarge || Typography.displayLarge;
      case "h1":
        return typo.h1;
      case "h2":
        return typo.h2;
      case "h3":
        return typo.h3;
      case "h4":
        return typo.h4;
      case "body":
        return typo.body;
      case "small":
        return typo.small;
      case "label":
        return typo.label || Typography.label;
      case "link":
        return typo.link || Typography.link;
      default:
        return typo.body;
    }
  };

  const typeStyle = getTypeStyle();
  const fontWeight = typeStyle.fontWeight || "400";
  const fontFamily = getFontFamily(isRTL, String(fontWeight));

  return (
    <Text 
      style={[
        { color: getColor() }, 
        typeStyle, 
        { fontFamily, fontWeight: undefined }, // Explicitly set fontFamily and unset fontWeight
        isRTL && { textAlign: "right" },
        style,
      ]} 
      {...rest} 
    />
  );
}
