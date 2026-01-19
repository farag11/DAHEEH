import React, { useEffect } from "react";
import { View, StyleSheet, Pressable, Modal } from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import * as haptics from "@/utils/haptics";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: string;
  destructive?: boolean;
}

const TIMING_CONFIG = {
  duration: 200,
  easing: Easing.out(Easing.ease),
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ConfirmModal({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  icon = "alert-triangle",
  destructive = false,
}: ConfirmModalProps) {
  const { theme, isDark } = useTheme();
  const { t, isRTL } = useLanguage();

  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const cancelScale = useSharedValue(1);
  const confirmScale = useSharedValue(1);

  const confirmLabel = confirmText || t("confirm");
  const cancelLabel = cancelText || t("cancel");

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, TIMING_CONFIG);
      translateY.value = withTiming(0, TIMING_CONFIG);
      opacity.value = withTiming(1, TIMING_CONFIG);
      haptics.mediumTap();
    } else {
      backdropOpacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(100, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const cancelButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cancelScale.value }],
  }));

  const confirmButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: confirmScale.value }],
  }));

  const handleCancelPressIn = () => {
    cancelScale.value = withTiming(0.96, TIMING_CONFIG);
  };

  const handleCancelPressOut = () => {
    cancelScale.value = withTiming(1, TIMING_CONFIG);
  };

  const handleConfirmPressIn = () => {
    confirmScale.value = withTiming(0.96, TIMING_CONFIG);
  };

  const handleConfirmPressOut = () => {
    confirmScale.value = withTiming(1, TIMING_CONFIG);
  };

  const handleCancel = () => {
    haptics.lightTap();
    onCancel();
  };

  const handleConfirm = () => {
    if (destructive) {
      haptics.heavyTap();
    } else {
      haptics.success();
    }
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <Animated.View style={[styles.overlay, backdropStyle]}>
        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.modalContent, { backgroundColor: theme.cardBackground }, contentStyle]}>
          <View style={[styles.iconContainer, { backgroundColor: (destructive ? theme.error : theme.primary) + "15" }]}>
            <Feather
              name={icon as any}
              size={28}
              color={destructive ? theme.error : theme.primary}
            />
          </View>
          
          <ThemedText style={[styles.title, isRTL && styles.rtlText]}>{title}</ThemedText>
          <ThemedText style={[styles.message, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
            {message}
          </ThemedText>

          <View style={[styles.buttonRow, isRTL && styles.rtl]}>
            <AnimatedPressable
              style={[styles.button, styles.cancelButton, { backgroundColor: theme.backgroundSecondary }, cancelButtonStyle]}
              onPress={handleCancel}
              onPressIn={handleCancelPressIn}
              onPressOut={handleCancelPressOut}
            >
              <ThemedText style={[styles.buttonText, { color: theme.text }]}>{cancelLabel}</ThemedText>
            </AnimatedPressable>
            <AnimatedPressable
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: destructive ? theme.error : theme.primary },
                confirmButtonStyle,
              ]}
              onPress={handleConfirm}
              onPressIn={handleConfirmPressIn}
              onPressOut={handleConfirmPressOut}
            >
              <ThemedText style={[styles.buttonText, { color: "#FFFFFF" }]}>{confirmLabel}</ThemedText>
            </AnimatedPressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 320,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  rtlText: {
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  rtl: {
    flexDirection: "row-reverse",
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  cancelButton: {},
  confirmButton: {},
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
