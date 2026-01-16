import React, { useEffect } from "react";
import { View, StyleSheet, LayoutAnimation, Platform, UIManager } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  FadeInDown,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { useLanguage } from "@/contexts/LanguageContext";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ProgressDashboardProps {
  progress?: number;
  totalMinutes?: number;
  daysRemaining?: number;
  label?: string;
}

export function ProgressDashboard({
  progress = 0,
  totalMinutes = 0,
  daysRemaining = 0,
  label,
}: ProgressDashboardProps) {
  const { t, isRTL } = useLanguage();
  const progressWidth = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  
  useEffect(() => {
    progressWidth.value = withDelay(
      300,
      withTiming(progress, {
        duration: 1200,
        easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
      })
    );
    
    glowOpacity.value = withDelay(
      800,
      withSpring(1, { damping: 15, stiffness: 100 })
    );
  }, [progress]);

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const timeDisplay = hours > 0 
    ? `${hours}${t("hours") || "h"} ${mins > 0 ? `${mins}${t("minutes") || "m"}` : ""}`
    : `${mins} ${t("minutes") || "min"}`;

  return (
    <Animated.View 
      entering={FadeInDown.delay(400).duration(600).springify()}
      style={styles.container}
    >
      <BlurView intensity={15} tint="dark" style={styles.blur}>
        <View style={styles.content}>
          <View style={[styles.headerRow, isRTL && styles.headerRowRTL]}>
            <View style={[styles.iconContainer, isRTL && styles.iconContainerRTL]}>
              <LinearGradient
                colors={["rgba(127, 0, 255, 0.3)", "rgba(0, 82, 212, 0.3)"]}
                style={styles.iconGradient}
              >
                <Feather name="target" size={20} color="#FFFFFF" />
              </LinearGradient>
              <ThemedText style={styles.headerTitle}>
                {label || t("planProgress") || "Plan Progress"}
              </ThemedText>
            </View>
            <ThemedText style={styles.percentageText}>
              {Math.round(progress)}%
            </ThemedText>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFillContainer, progressAnimatedStyle]}>
                <LinearGradient
                  colors={["#7F00FF", "#0052D4", "#00C9A7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressFill}
                />
                <Animated.View style={[styles.progressGlow, glowAnimatedStyle]} />
              </Animated.View>
            </View>
          </View>

          <View style={[styles.statsRow, isRTL && styles.statsRowRTL]}>
            <View style={styles.statItem}>
              <Feather name="clock" size={16} color="rgba(255,255,255,0.5)" />
              <ThemedText style={styles.statText}>{timeDisplay}</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Feather name="calendar" size={16} color="rgba(255,255,255,0.5)" />
              <ThemedText style={styles.statText}>
                {daysRemaining} {t("days") || "days"}
              </ThemedText>
            </View>
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    shadowColor: "#7F00FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  blur: {
    borderRadius: 20,
    overflow: "hidden",
  },
  content: {
    padding: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerRowRTL: {
    flexDirection: "row-reverse",
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainerRTL: {
    flexDirection: "row-reverse",
  },
  iconGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  percentageText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textShadowColor: "rgba(127, 0, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressTrack: {
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  progressFillContainer: {
    height: "100%",
    position: "relative",
  },
  progressFill: {
    flex: 1,
    borderRadius: 7,
  },
  progressGlow: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 20,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 7,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  statsRowRTL: {
    flexDirection: "row-reverse",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.6)",
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});
