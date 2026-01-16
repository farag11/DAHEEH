import React from "react";
import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as haptics from "@/utils/haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { useAccentTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStudy } from "@/contexts/StudyContext";
import { useGamification } from "@/contexts/GamificationContext";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import { useFloatingDockHeight } from "@/navigation/MainTabNavigator";

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, "Home">;

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const floatingDockHeight = useFloatingDockHeight();
  const { theme } = useTheme();
  const { getAccentColor } = useAccentTheme();
  const { t, isRTL } = useLanguage();
  const accentColor = getAccentColor();
  const { stats } = useStudy();
  const { streak } = useGamification();
  const navigation = useNavigation<NavigationProp>();

  const quickActions = [
    { icon: "file-text", label: t("summarize"), route: "Summarize" as const, color: "#4361EE" },
    { icon: "help-circle", label: t("quiz"), route: "Quiz" as const, color: "#7209B7" },
    { icon: "book", label: t("explain"), route: "Explain" as const, color: "#10B981" },
    { icon: "calendar", label: t("plan"), route: "Planner" as const, color: "#F59E0B" },
  ];

  const features = [
    {
      icon: "file-text",
      title: t("textSummarizer"),
      description: t("summarizeDesc"),
      route: "Summarize" as const,
      accentColor: "#4361EE",
    },
    {
      icon: "help-circle",
      title: t("questionGenerator"),
      description: t("quizDesc"),
      route: "Quiz" as const,
      accentColor: "#7209B7",
    },
    {
      icon: "book",
      title: t("conceptExplainer"),
      description: t("explainDesc"),
      route: "Explain" as const,
      accentColor: "#10B981",
    },
    {
      icon: "calendar",
      title: t("studyPlanner"),
      description: t("planDesc"),
      route: "Planner" as const,
      accentColor: "#F59E0B",
    },
  ];

  const handleNavigate = (route: keyof HomeStackParamList) => {
    haptics.lightTap();
    navigation.navigate(route);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: floatingDockHeight + Spacing.lg,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
      {/* Professional Stats Banner - Glass Theme */}
      <Animated.View entering={FadeInDown.delay(100).springify().damping(12).mass(0.8)}>
        <View 
          style={[
            styles.heroCard, 
            { 
              borderColor: hexToRgba(accentColor, 0.25),
              shadowColor: accentColor,
            }
          ]}
        >
          <LinearGradient
            colors={[hexToRgba(accentColor, 0.56), hexToRgba(accentColor, 0.12)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={[styles.heroContent, isRTL && styles.heroContentRTL]}>
              <ThemedText type="h2" style={[styles.heroTitle, isRTL && styles.rtlText]}>
                {t("welcomeBack") || "Welcome Back"}
              </ThemedText>
              <ThemedText style={[styles.heroSubtitle, isRTL && styles.rtlText]}>
                {t("readyToAchieve") || "Ready to achieve your goals today?"}
              </ThemedText>
            </View>

            <View style={[styles.statsRow, isRTL && styles.rtl]}>
              <View style={styles.statItem}>
                <Feather name="zap" size={20} color="rgba(255,255,255,0.9)" style={styles.statIcon} />
                <ThemedText type="h3" style={styles.statNumber}>
                  {streak || 0}
                </ThemedText>
                <ThemedText type="small" style={styles.statLabel}>
                  {t("dayStreak") || "Day Streak"}
                </ThemedText>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Feather name="check-circle" size={20} color="rgba(255,255,255,0.9)" style={styles.statIcon} />
                <ThemedText type="h3" style={styles.statNumber}>
                  {stats?.questionsAnswered || 0}
                </ThemedText>
                <ThemedText type="small" style={styles.statLabel}>
                  {t("questionsAnswered") || "Questions"}
                </ThemedText>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Feather name="file-text" size={20} color="rgba(255,255,255,0.9)" style={styles.statIcon} />
                <ThemedText type="h3" style={styles.statNumber}>
                  {stats?.summariesCreated || 0}
                </ThemedText>
                <ThemedText type="small" style={styles.statLabel}>
                  {t("summaries") || "Summaries"}
                </ThemedText>
              </View>
            </View>
          </LinearGradient>
        </View>
      </Animated.View>

      {/* Quick Actions - Simple dark cards */}
      <Animated.View entering={FadeInDown.delay(200).springify().damping(12).mass(0.8)}>
        <View style={[styles.quickActionsGrid, isRTL && styles.rtl]}>
          {quickActions.map((action) => (
            <Pressable
              key={action.route}
              style={({ pressed }) => [
                styles.quickAction,
                { opacity: pressed ? 0.8 : 1 }
              ]}
              onPress={() => handleNavigate(action.route)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + "20" }]}>
                <Feather name={action.icon as any} size={22} color={action.color} />
              </View>
              <ThemedText type="small" style={styles.quickActionLabel}>
                {action.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* Feature Cards - Simple dark cards with subtle borders */}
      <Animated.View entering={FadeInDown.delay(300).springify().damping(12).mass(0.8)}>
        <ThemedText type="h4" style={[styles.sectionTitle, isRTL && styles.rtlText]}>
          {t("allFeatures")}
        </ThemedText>
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <Animated.View
              key={feature.route}
              entering={FadeInDown.delay(400 + index * 80).springify().damping(12).mass(0.8)}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.featureCard,
                  { opacity: pressed ? 0.85 : 1 }
                ]}
                onPress={() => handleNavigate(feature.route)}
              >
                <View style={[styles.featureIcon, { backgroundColor: feature.accentColor + "15" }]}>
                  <Feather name={feature.icon as any} size={24} color={feature.accentColor} />
                </View>
                <View style={[styles.featureContent, isRTL && styles.featureContentRTL]}>
                  <ThemedText type="body" style={[styles.featureTitle, isRTL && styles.rtlText]}>
                    {feature.title}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={[styles.featureDescription, isRTL && styles.rtlText]}
                    numberOfLines={2}
                  >
                    {feature.description}
                  </ThemedText>
                </View>
                <View style={styles.featureArrow}>
                  <Feather
                    name={isRTL ? "chevron-left" : "chevron-right"}
                    size={18}
                    color="rgba(255,255,255,0.5)"
                  />
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F14",
  },
  heroCard: {
    borderRadius: 20,
    marginBottom: Spacing["2xl"],
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  heroGradient: {
    paddingTop: Spacing["2xl"],
    paddingBottom: Spacing["xl"],
    paddingHorizontal: Spacing["xl"],
    borderRadius: 19,
  },
  heroContent: {
    marginBottom: Spacing["xl"],
  },
  heroContentRTL: {
    alignItems: "flex-end",
  },
  heroTitle: {
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  rtl: {
    flexDirection: "row-reverse",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIcon: {
    marginBottom: 4,
  },
  statNumber: {
    color: "#FFFFFF",
    marginBottom: 2,
    fontWeight: "700",
  },
  statLabel: {
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
  },
  sectionTitle: {
    marginBottom: 12,
    color: "#FFFFFF",
  },
  rtlText: {
    textAlign: "right",
  },
  quickActionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing["2xl"],
    gap: Spacing.sm,
  },
  quickAction: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xs,
    backgroundColor: "#1A1A24",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  quickActionLabel: {
    textAlign: "center",
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
  },
  featuresGrid: {
    gap: Spacing.md,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#1A1A24",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginEnd: Spacing.lg,
  },
  featureContent: {
    flex: 1,
    marginEnd: Spacing.md,
  },
  featureContentRTL: {
    alignItems: "flex-end",
  },
  featureTitle: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 4,
  },
  featureDescription: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    lineHeight: 18,
  },
  featureArrow: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
});
