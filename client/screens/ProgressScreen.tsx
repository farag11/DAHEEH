import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@/components/Header";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStudy } from "@/contexts/StudyContext";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useFloatingDockHeight } from "@/navigation/MainTabNavigator";

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const floatingDockHeight = useFloatingDockHeight();
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const { stats, summaries, questions, studyPlans } = useStudy();

  const hasData = stats.questionsAnswered > 0 || stats.summariesCreated > 0 || summaries.length > 0;

  const statCards = [
    {
      icon: "clock",
      label: t("totalHours"),
      value: stats.totalStudyHours.toString(),
      color: theme.primary,
    },
    {
      icon: "check-circle",
      label: t("questionsAnswered"),
      value: stats.questionsAnswered.toString(),
      color: theme.success,
    },
    {
      icon: "zap",
      label: t("streak"),
      value: `${stats.streakDays} ${t("days")}`,
      color: theme.warning,
    },
  ];

  const activityCards = [
    {
      icon: "file-text",
      label: t("summaries"),
      value: summaries.length.toString(),
      color: theme.primary,
    },
    {
      icon: "help-circle",
      label: t("questions"),
      value: questions.length.toString(),
      color: theme.accent,
    },
    {
      icon: "calendar",
      label: t("plans"),
      value: studyPlans.length.toString(),
      color: theme.success,
    },
  ];

  if (!hasData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={[styles.emptyContainer, { paddingTop: headerHeight }]}>
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.primary + "15" }]}>
            <Feather name="trending-up" size={48} color={theme.primary} />
          </View>
          <ThemedText style={styles.emptyTitle}>{t("noDataYet")}</ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            {t("startStudying")}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
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
      <ThemedText style={[styles.sectionTitle, isRTL && styles.rtlText]}>
        {t("todayStudy")}
      </ThemedText>

      <View style={styles.statsGrid}>
        {statCards.map((stat, index) => (
          <View
            key={index}
            style={[styles.statCard, { backgroundColor: theme.cardBackground }]}
          >
            <View style={[styles.iconContainer, { backgroundColor: stat.color + "20" }]}>
              <Feather name={stat.icon as any} size={24} color={stat.color} />
            </View>
            <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              {stat.label}
            </ThemedText>
          </View>
        ))}
      </View>

      <ThemedText style={[styles.sectionTitle, isRTL && styles.rtlText, { marginTop: Spacing["2xl"] }]}>
        {t("library")}
      </ThemedText>

      <View style={styles.activityGrid}>
        {activityCards.map((card, index) => (
          <View
            key={index}
            style={[styles.activityCard, { backgroundColor: theme.cardBackground }]}
          >
            <View style={[styles.activityRow, isRTL && styles.rtl]}>
              <View style={[styles.smallIconContainer, { backgroundColor: card.color + "20" }]}>
                <Feather name={card.icon as any} size={20} color={card.color} />
              </View>
              <ThemedText style={styles.activityValue}>{card.value}</ThemedText>
            </View>
            <ThemedText style={[styles.activityLabel, { color: theme.textSecondary }]}>
              {card.label}
            </ThemedText>
          </View>
        ))}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: Spacing.lg,
  },
  rtlText: {
    textAlign: "right",
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  activityGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  activityCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  rtl: {
    flexDirection: "row-reverse",
  },
  smallIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  activityValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  activityLabel: {
    fontSize: 12,
  },
});
