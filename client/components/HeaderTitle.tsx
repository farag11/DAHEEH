import React from "react";
import { StyleSheet, Text } from "react-native";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/hooks/useTheme";

interface HeaderTitleProps {
  tintColor?: string;
}

export function HeaderTitle({ tintColor }: HeaderTitleProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isArabic = language === "ar";

  return (
    <Text
      style={[
        styles.title,
        isArabic ? styles.arabicTitle : styles.englishTitle,
        { color: tintColor || theme.text },
      ]}
    >
      {isArabic ? "دحيح" : "Daheeh"}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
  },
  arabicTitle: {
    fontFamily: "Cairo_700Bold",
    letterSpacing: 0.5,
  },
  englishTitle: {
    fontFamily: "Poppins_700Bold",
    letterSpacing: -0.5,
  },
});
