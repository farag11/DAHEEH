import React from "react";
import { Text, StyleSheet } from "react-native";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/hooks/useTheme";

interface HeaderTitleTextProps {
  children?: string;
  title?: string;
  tintColor?: string;
}

export function HeaderTitleText({ children, title, tintColor }: HeaderTitleTextProps) {
  const { isRTL } = useLanguage();
  const { theme } = useTheme();

  const displayTitle = title || children || "";

  return (
    <Text
      style={[
        styles.title,
        {
          fontFamily: isRTL ? "Cairo_700Bold" : "Poppins_700Bold",
          color: tintColor || theme.text,
        },
      ]}
      numberOfLines={1}
    >
      {displayTitle}
    </Text>
  );
}

export function createHeaderTitle(title: string) {
  return function CustomHeaderTitle({ tintColor }: { tintColor?: string }) {
    return <HeaderTitleText title={title} tintColor={tintColor} />;
  };
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    textAlign: "center",
  },
});
