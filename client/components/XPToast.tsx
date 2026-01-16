import React, { useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  runOnJS,
  FadeInUp,
  FadeOutUp,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { XPToastData, XP_REWARDS } from "@/contexts/GamificationContext";
import { Spacing, BorderRadius } from "@/constants/theme";

type XPToastProps = {
  toast: XPToastData;
  onDismiss: (id: string) => void;
};

export function XPToast({ toast, onDismiss }: XPToastProps) {
  const { theme } = useTheme();
  const { isRTL } = useLanguage();
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  const rewardInfo = XP_REWARDS[toast.reason];
  const label = isRTL ? rewardInfo.labelAr : rewardInfo.labelEn;

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, mass: 0.8 });
    opacity.value = withTiming(1, { duration: 200 });
    
    const timeout = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.8, { duration: 200 }, () => {
        runOnJS(onDismiss)(toast.id);
      });
    }, 2500);
    
    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <BlurView intensity={80} tint="dark" style={styles.blur}>
        <View style={[styles.content, isRTL && styles.rtl]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.gradientStart + "30" }]}>
            <Feather name="zap" size={16} color={theme.gradientStart} />
          </View>
          <View style={styles.textContainer}>
            <ThemedText type="label" style={[styles.xpText, { color: theme.gradientStart }]}>
              +{toast.amount} XP
            </ThemedText>
            <ThemedText type="small" style={styles.reasonText}>
              {label}
            </ThemedText>
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
}

type XPToastContainerProps = {
  toasts: XPToastData[];
  onDismiss: (id: string) => void;
};

export function XPToastContainer({ toasts, onDismiss }: XPToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <View style={styles.toastContainer} pointerEvents="box-none">
      {toasts.slice(-3).map((toast, index) => (
        <Animated.View
          key={toast.id}
          entering={FadeInUp.delay(index * 50).springify().damping(12)}
          exiting={FadeOutUp}
          style={{ marginBottom: 8 }}
        >
          <XPToast toast={toast} onDismiss={onDismiss} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
  },
  container: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  blur: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  rtl: {
    flexDirection: "row-reverse",
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    alignItems: "flex-start",
  },
  xpText: {
    fontSize: 16,
    fontWeight: "700",
  },
  reasonText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 11,
  },
});
