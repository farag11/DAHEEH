import React, { useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
  FadeInDown,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGamification, RANKS } from "@/contexts/GamificationContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import * as haptics from "@/utils/haptics";

type LevelCardProps = {
  compact?: boolean;
  onPress?: () => void;
};

export function LevelCard({ compact = false, onPress }: LevelCardProps) {
  const { theme } = useTheme();
  const { isRTL, t } = useLanguage();
  const { level, xp, xpProgress, xpToNextLevel, streak, rankInfo, totalXPEarned } = useGamification();
  
  const progressWidth = useSharedValue(0);
  const fireScale = useSharedValue(1);

  useEffect(() => {
    progressWidth.value = withDelay(300, withSpring(xpProgress, { damping: 15, stiffness: 80 }));
  }, [xpProgress]);

  useEffect(() => {
    if (streak > 0) {
      fireScale.value = withSpring(1.2, { damping: 8 }, () => {
        fireScale.value = withSpring(1, { damping: 12 });
      });
    }
  }, [streak]);

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const fireAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fireScale.value }],
  }));

  const handlePress = () => {
    haptics.lightTap();
    onPress?.();
  };

  const rankTitle = isRTL ? rankInfo.titleAr : rankInfo.title;
  const nextRank = RANKS.find((r) => r.minLevel > level);
  const nextRankTitle = nextRank ? (isRTL ? nextRank.titleAr : nextRank.title) : null;

  if (compact) {
    return (
      <Pressable onPress={handlePress}>
        <Animated.View entering={FadeInDown.delay(100).springify().damping(12).mass(0.8)}>
          <BlurView intensity={40} tint="dark" style={styles.compactContainer}>
            <View style={[styles.compactContent, isRTL && styles.rtl]}>
              <View style={[styles.levelBadge, { backgroundColor: rankInfo.color + "30" }]}>
                <ThemedText type="label" style={[styles.levelNumber, { color: rankInfo.color }]}>
                  {level}
                </ThemedText>
              </View>
              
              <View style={styles.compactInfo}>
                <ThemedText type="label" style={[styles.rankText, { color: rankInfo.color }]}>
                  {rankTitle}
                </ThemedText>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBg}>
                    <Animated.View style={[styles.progressBarFill, progressAnimatedStyle, { backgroundColor: rankInfo.color }]} />
                  </View>
                </View>
              </View>

              {streak > 0 && (
                <Animated.View style={[styles.streakBadge, fireAnimatedStyle]}>
                  <ThemedText style={styles.fireEmoji}>🔥</ThemedText>
                  <ThemedText type="small" style={styles.streakNumber}>{streak}</ThemedText>
                </Animated.View>
              )}
            </View>
          </BlurView>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress}>
      <Animated.View entering={FadeInDown.delay(100).springify().damping(12).mass(0.8)}>
        <LinearGradient
          colors={[theme.gradientStart, theme.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.container}
        >
          <View style={[styles.header, isRTL && styles.rtl]}>
            <View style={styles.levelSection}>
              <View style={styles.levelBadgeLarge}>
                <ThemedText type="h1" style={styles.levelNumberLarge}>
                  {level}
                </ThemedText>
              </View>
              <View style={styles.levelInfo}>
                <ThemedText type="h3" style={styles.rankTitleLarge}>
                  {rankTitle}
                </ThemedText>
                <ThemedText type="small" style={styles.xpText}>
                  {xp.toLocaleString()} XP
                </ThemedText>
              </View>
            </View>

            {streak > 0 && (
              <Animated.View style={[styles.streakSection, fireAnimatedStyle]}>
                <View style={styles.streakContainer}>
                  <ThemedText style={styles.fireEmojiLarge}>🔥</ThemedText>
                  <ThemedText type="h2" style={styles.streakNumberLarge}>
                    {streak}
                  </ThemedText>
                  <ThemedText type="small" style={styles.streakLabel}>
                    {isRTL ? "أيام" : "days"}
                  </ThemedText>
                </View>
              </Animated.View>
            )}
          </View>

          <View style={styles.progressSection}>
            <View style={[styles.progressLabels, isRTL && styles.rtl]}>
              <ThemedText type="small" style={styles.progressLabel}>
                {isRTL ? "المستوى التالي" : "Next Level"}
              </ThemedText>
              <ThemedText type="small" style={styles.progressLabel}>
                {xpToNextLevel.toLocaleString()} XP
              </ThemedText>
            </View>
            <View style={styles.progressBarLarge}>
              <Animated.View 
                style={[
                  styles.progressBarFillLarge, 
                  progressAnimatedStyle,
                ]} 
              />
            </View>
            {nextRankTitle && (
              <ThemedText type="small" style={[styles.nextRankHint, isRTL && styles.rtlText]}>
                {isRTL ? `الرتبة التالية: ${nextRankTitle}` : `Next rank: ${nextRankTitle}`}
              </ThemedText>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  compactContainer: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  compactContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  rtl: {
    flexDirection: "row-reverse",
  },
  rtlText: {
    textAlign: "right",
  },
  levelBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  levelNumber: {
    fontSize: 18,
    fontWeight: "700",
  },
  compactInfo: {
    flex: 1,
    gap: 4,
  },
  rankText: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressBarContainer: {
    height: 4,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 149, 0, 0.2)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 2,
  },
  fireEmoji: {
    fontSize: 14,
  },
  streakNumber: {
    color: "#FF9500",
    fontWeight: "700",
    fontSize: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  levelSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  levelBadgeLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  levelNumberLarge: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  levelInfo: {
    gap: 2,
  },
  rankTitleLarge: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  xpText: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  streakSection: {
    alignItems: "center",
  },
  streakContainer: {
    alignItems: "center",
    backgroundColor: "rgba(255, 149, 0, 0.2)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 149, 0, 0.3)",
  },
  fireEmojiLarge: {
    fontSize: 24,
  },
  streakNumberLarge: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  streakLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 10,
  },
  progressSection: {
    gap: Spacing.xs,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  progressBarLarge: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFillLarge: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
  },
  nextRankHint: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 11,
    marginTop: 4,
  },
});
