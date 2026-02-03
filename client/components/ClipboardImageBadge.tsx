import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import * as haptics from "@/utils/haptics";

interface ClipboardImageBadgeProps {
  visible: boolean;
  onPress: () => void;
  isLoading?: boolean;
}

export function ClipboardImageBadge({ visible, onPress, isLoading }: ClipboardImageBadgeProps) {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();

  if (!visible) return null;

  const handlePress = () => {
    haptics.lightTap();
    onPress();
  };

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={[styles.container, isRTL && styles.containerRTL]}
    >
      <Pressable
        style={({ pressed }) => [
          styles.badge,
          { 
            backgroundColor: theme.primary,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        onPress={handlePress}
        disabled={isLoading}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        accessibilityLabel={t("imageDetected")}
        accessibilityRole="button"
      >
        <View style={[styles.badgeContent, isRTL && styles.badgeContentRTL]}>
          <View style={styles.iconContainer}>
            <Feather name="clipboard" size={14} color="#FFFFFF" />
            <View style={[styles.notificationDot, { backgroundColor: theme.success }]} />
          </View>
          <ThemedText style={styles.badgeText}>
            {t("imageDetected")}
          </ThemedText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 8,
    right: 8,
    zIndex: 100,
  },
  containerRTL: {
    right: undefined,
    left: 8,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    minHeight: 32,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  badgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeContentRTL: {
    flexDirection: "row-reverse",
  },
  iconContainer: {
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
