import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert, // Import Alert for dummy action
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as haptics from "@/utils/haptics";

import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStudy, StudyHistoryEntry } from "@/contexts/StudyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useGamification } from "@/contexts/GamificationContext";
import { ThemedText } from "@/components/ThemedText";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useFloatingDockHeight } from "@/navigation/MainTabNavigator";
import { Header } from "@/components/Header"; // Import the new Header component

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FilterTab = "all" | "summary" | "quiz" | "explain";

const FILTER_TABS: { key: FilterTab; labelKey: string }[] = [
  { key: "all", labelKey: "all" },
  { key: "summary", labelKey: "summaries" },
  { key: "quiz", labelKey: "quizzes" },
  { key: "explain", labelKey: "explanations" },
];

function getRelativeTime(date: Date, t: (key: string) => string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return t("justNow");
  } else if (diffMins < 60) {
    return `${diffMins} ${t("minutesAgo")}`;
  } else if (diffHours < 24) {
    return `${diffHours} ${t("hoursAgo")}`;
  } else {
    return `${diffDays} ${t("daysAgo")}`;
  }
}

function getIconName(actionType: string): keyof typeof Feather.glyphMap {
  switch (actionType) {
    case "summary":
      return "file-text";
    case "quiz":
      return "help-circle";
    case "explain":
      return "book-open";
    case "plan":
      return "calendar";
    default:
      return "award";
  }
}

function getActionLabel(actionType: string, t: (key: string) => string): string {
  switch (actionType) {
    case "summary":
      return t("summarized");
    case "quiz":
      return t("quizCreated");
    case "explain":
      return t("explained");
    case "plan":
      return t("planCreated");
    default:
      return t("activityCreated") || "Activity";
  }
}

export default function ProfileScreen() {
  const floatingDockHeight = useFloatingDockHeight();
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { clearAllData, stats, history, clearHistory } = useStudy();
  const { isGuest, logout } = useAuth();
  const { streak } = useGamification();

  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const handleTabChange = useCallback((tab: FilterTab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    haptics.lightTap();
    setActiveTab(tab);
  }, []);

  const filteredHistory = useMemo(() => {
    let filtered = history;

    if (activeTab !== "all") {
      filtered = filtered.filter((item) => item.actionType === activeTab);
    }

    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter((item) =>
        item.keyword.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [history, activeTab, searchText]);

  const handleHistoryItemPress = (entry: StudyHistoryEntry) => {
    if (!entry.contentId) return;

    haptics.lightTap();

    if (entry.actionType === "summary") {
      navigation.navigate("HomeTab", {
        screen: "Summarize",
        params: { sessionId: entry.contentId },
      });
    } else if (entry.actionType === "explain") {
      navigation.navigate("HomeTab", {
        screen: "Explain",
        params: { sessionId: entry.contentId },
      });
    }
  };

  const handleConfirmClearData = () => {
    clearAllData();
    haptics.success();
    setShowClearDataModal(false);
  };

  const handleConfirmClearHistory = () => {
    clearHistory();
    haptics.success();
    setShowClearHistoryModal(false);
    setSearchText("");
    setActiveTab("all");
  };

  const handleConfirmLogout = async () => {
    haptics.success();
    setShowLogoutModal(false);
    await logout();
  };

  const handleSettingsPress = () => {
    haptics.lightTap();
    Alert.alert("Settings", "Settings button pressed!");
    // navigation.navigate("Settings"); // Uncomment and replace with your settings route if available
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "summary":
        return theme.primary;
      case "quiz":
        return theme.accent;
      case "explain":
        return theme.success;
      default:
        return theme.primary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <Header
        title={t("profile")}
        rightIcon="settings-outline"
        onRightPress={handleSettingsPress}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingTop: Spacing.md, // Adjusted padding after adding Header component
          paddingBottom: floatingDockHeight + Spacing.lg,
          paddingHorizontal: Spacing.lg,
        }}
        // scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
      <View style={[styles.avatarContainer, { marginBottom: Spacing["2xl"] }]}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Feather name="user" size={48} color="#FFFFFF" />
        </View>
        <ThemedText style={styles.appName}>{t("appName")}</ThemedText>
        {isGuest ? (
          <View style={[styles.guestBadge, { backgroundColor: theme.accent + "20" }]}>
            <ThemedText style={[styles.guestBadgeText, { color: theme.accent }]}>
              {t("guestMode")}
            </ThemedText>
          </View>
        ) : (
          <ThemedText style={[styles.version, { color: theme.textSecondary }]}>
            {t("version")} 1.0.0
          </ThemedText>
        )}
      </View>

      <View style={[styles.statsRow, isRTL && styles.rtl]}>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <ThemedText style={[styles.statValue, { color: theme.primary }]}>
            {stats.summariesCreated}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            {t("summaries")}
          </ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <ThemedText style={[styles.statValue, { color: theme.accent }]}>
            {stats.questionsAnswered}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            {t("questions")}
          </ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <ThemedText style={[styles.statValue, { color: theme.success }]}>
            {streak}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            {t("streak")}
          </ThemedText>
        </View>
      </View>

      <ThemedText style={[styles.sectionTitle, isRTL && styles.rtlText]}>
        {t("studyHistory")}
      </ThemedText>

      {history.length > 0 ? (
        <View style={styles.historyManagerContainer}>
          <View style={styles.searchContainer}>
            <BlurView intensity={20} tint="dark" style={styles.searchBlur}>
              <View style={[styles.searchInner, isRTL && styles.searchInnerRTL]}>
                <Feather
                  name="search"
                  size={18}
                  color="#8E8E93"
                  style={isRTL ? styles.searchIconRTL : styles.searchIcon}
                />
                <TextInput
                  style={[
                    styles.searchInput,
                    { textAlign: isRTL ? "right" : "left" },
                  ]}
                  placeholder={t("searchHistory")}
                  placeholderTextColor="rgba(142, 142, 147, 0.7)"
                  value={searchText}
                  onChangeText={setSearchText}
                />
                {searchText.length > 0 && (
                  <Pressable
                    onPress={() => setSearchText("")}
                    hitSlop={10}
                    style={styles.clearButton}
                  >
                    <Feather name="x-circle" size={16} color="#8E8E93" />
                  </Pressable>
                )}
              </View>
            </BlurView>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScrollView}
            contentContainerStyle={[
              styles.tabsContainer,
              isRTL && styles.tabsContainerRTL,
            ]}
          >
            {FILTER_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => handleTabChange(tab.key)}
                  style={({ pressed }) => [
                    styles.tabChip,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  {isActive ? (
                    <LinearGradient
                      colors={["#5f2c82", "#49a09d"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.tabChipActive}
                    >
                      <ThemedText style={styles.tabTextActive}>
                        {t(tab.labelKey)}
                      </ThemedText>
                    </LinearGradient>
                  ) : (
                    <View
                      style={[
                        styles.tabChipInactive,
                        { borderColor: "rgba(255, 255, 255, 0.15)" },
                      ]}
                    >
                      <ThemedText
                        style={[styles.tabTextInactive, { color: theme.textSecondary }]}
                      >
                        {t(tab.labelKey)}
                      </ThemedText>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {filteredHistory.length > 0 ? (
            <View style={styles.historyList}>
              {filteredHistory.map((entry, index) => {
                const iconColor = getIconColor(entry.actionType);
                const isClickable =
                  entry.contentId &&
                  (entry.actionType === "summary" || entry.actionType === "explain");

                return (
                  <Pressable
                    key={entry.id}
                    style={({ pressed }) => [
                      styles.historyCard,
                      { backgroundColor: "rgba(30, 30, 35, 0.85)" },
                      isClickable && pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                    ]}
                    onPress={() => handleHistoryItemPress(entry)}
                    disabled={!isClickable}
                  >
                    <View
                      style={[
                        styles.historyCardIcon,
                        { backgroundColor: iconColor + "20" },
                      ]}
                    >
                      <Feather
                        name={getIconName(entry.actionType)}
                        size={20}
                        color={iconColor}
                      />
                    </View>
                    <View
                      style={[
                        styles.historyCardContent,
                        isRTL && { alignItems: "flex-end" },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.historyCardTitle,
                          isRTL && { textAlign: "right" },
                        ]}
                        numberOfLines={1}
                      >
                        {entry.keyword}
                      </ThemedText>
                      <View
                        style={[
                          styles.historyCardMeta,
                          isRTL && styles.historyCardMetaRTL,
                        ]}
                      >
                        <View
                          style={[
                            styles.historyCardBadge,
                            { backgroundColor: iconColor + "15" },
                          ]}
                        >
                          <ThemedText
                            style={[styles.historyCardBadgeText, { color: iconColor }]}
                          >
                            {getActionLabel(entry.actionType, t)}
                          </ThemedText>
                        </View>
                        <ThemedText
                          style={[
                            styles.historyCardTime,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {getRelativeTime(entry.createdAt, t)}
                        </ThemedText>
                      </View>
                    </View>
                    {isClickable && (
                      <Feather
                        name={isRTL ? "chevron-left" : "chevron-right"}
                        size={18}
                        color={theme.textSecondary}
                        style={styles.historyCardChevron}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.noResultsContainer}>
              <View
                style={[
                  styles.noResultsIcon,
                  { backgroundColor: "rgba(142, 142, 147, 0.1)" },
                ]}
              >
                <Feather name="search" size={32} color="#8E8E93" />
              </View>
              <ThemedText
                style={[styles.noResultsTitle, { color: theme.textSecondary }]}
              >
                {t("noResultsFound")}
              </ThemedText>
              <ThemedText
                style={[styles.noResultsSubtitle, { color: theme.textSecondary }]}
              >
                {t("tryDifferentSearch")}
              </ThemedText>
            </View>
          )}

          {filteredHistory.length > 0 && (
            <Pressable
              style={[styles.clearHistoryButton, { borderColor: theme.border }]}
              onPress={() => setShowClearHistoryModal(true)}
            >
              <Feather name="trash-2" size={14} color={theme.textSecondary} />
              <ThemedText
                style={[styles.clearHistoryText, { color: theme.textSecondary }]}
              >
                {t("clearAll")}
              </ThemedText>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={[styles.emptyState, { backgroundColor: theme.cardBackground }]}>
          <Feather
            name="inbox"
            size={48}
            color={theme.textSecondary}
            style={{ marginBottom: Spacing.md }}
          />
          <ThemedText
            style={[styles.emptyStateTitle, { color: theme.textSecondary }]}
          >
            {t("noHistoryYet")}
          </ThemedText>
          <ThemedText
            style={[
              styles.emptyStateMessage,
              { color: theme.textSecondary },
              isRTL && styles.rtlText,
            ]}
          >
            {t("startStudyingHistory")}
          </ThemedText>
        </View>
      )}

      <ThemedText style={[styles.sectionTitle, isRTL && styles.rtlText]}>
        {t("settings")}
      </ThemedText>

      <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
        <View style={[styles.settingRow, isRTL && styles.rtl]}>
          <View style={[styles.settingIcon, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="globe" size={20} color={theme.primary} />
          </View>
          <View style={[styles.settingContent, isRTL && { alignItems: "flex-end" }]}>
            <ThemedText style={styles.settingTitle}>{t("language")}</ThemedText>
            <ThemedText style={[styles.settingValue, { color: theme.textSecondary }]}>
              {language === "en" ? "English" : "العربية"}
            </ThemedText>
          </View>
          <View
            style={[styles.languageToggle, { backgroundColor: theme.backgroundSecondary }]}
          >
            <Pressable
              onPress={() => {
                if (language !== "en") {
                  setLanguage("en");
                  haptics.mediumTap();
                }
              }}
              style={styles.langButton}
            >
              <ThemedText
                style={[
                  styles.langText,
                  language === "en" && { color: theme.primary, fontWeight: "600" },
                ]}
              >
                EN
              </ThemedText>
            </Pressable>
            <ThemedText style={styles.langDivider}>|</ThemedText>
            <Pressable
              onPress={() => {
                if (language !== "ar") {
                  setLanguage("ar");
                  haptics.mediumTap();
                }
              }}
              style={styles.langButton}
            >
              <ThemedText
                style={[
                  styles.langText,
                  language === "ar" && { color: theme.primary, fontWeight: "600" },
                ]}
              >
                AR
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>

      {!isGuest ? (
        <Pressable
          style={[
            styles.dangerButton,
            { backgroundColor: theme.error + "10", borderColor: theme.error },
          ]}
          onPress={() => setShowLogoutModal(true)}
        >
          <Feather name="log-out" size={20} color={theme.error} />
          <ThemedText style={[styles.dangerButtonText, { color: theme.error }]}>
            {t("logout")}
          </ThemedText>
        </Pressable>
      ) : null}

      <Pressable
        style={[
          styles.dangerButton,
          { backgroundColor: theme.error + "10", borderColor: theme.error },
        ]}
        onPress={() => setShowClearDataModal(true)}
      >
        <Feather name="trash-2" size={20} color={theme.error} />
        <ThemedText style={[styles.dangerButtonText, { color: theme.error }]}>
          {t("clearAll")}
        </ThemedText>
      </Pressable>

      <ConfirmModal
        visible={showClearHistoryModal}
        title={t("clearHistory")}
        message={t("clearHistoryConfirm")}
        onConfirm={handleConfirmClearHistory}
        onCancel={() => setShowClearHistoryModal(false)}
        icon="trash-2"
        destructive
      />

      <ConfirmModal
        visible={showClearDataModal}
        title={t("clearAll")}
        message={t("clearDataConfirm")}
        onConfirm={handleConfirmClearData}
        onCancel={() => setShowClearDataModal(false)}
        icon="trash-2"
        destructive
      />

      <ConfirmModal
        visible={showLogoutModal}
        title={t("logout")}
        message={t("confirmLogout")}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutModal(false)}
        icon="log-out"
        destructive
      />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  avatarContainer: {
    alignItems: "center",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  appName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  version: {
    fontSize: 14,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  rtl: {
    flexDirection: "row-reverse",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  rtlText: {
    textAlign: "right",
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 14,
  },
  languageToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  langText: {
    fontSize: 14,
    paddingHorizontal: Spacing.sm,
  },
  langDivider: {
    fontSize: 14,
    opacity: 0.3,
  },
  langButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  historyManagerContainer: {
    marginBottom: Spacing["2xl"],
  },
  searchContainer: {
    marginBottom: Spacing.md,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(20, 20, 25, 0.85)",
  },
  searchBlur: {
    borderRadius: 28,
  },
  searchInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minHeight: 48,
  },
  searchInnerRTL: {
    flexDirection: "row-reverse",
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchIconRTL: {
    marginLeft: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#FFFFFF",
    paddingVertical: Spacing.xs,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  tabsScrollView: {
    marginBottom: Spacing.lg,
  },
  tabsContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  tabsContainerRTL: {
    flexDirection: "row-reverse",
  },
  tabChip: {
    borderRadius: 20,
    overflow: "hidden",
  },
  tabChipActive: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    shadowColor: "#5f2c82",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  tabChipInactive: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "rgba(30, 30, 35, 0.6)",
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  tabTextInactive: {
    fontSize: 13,
    fontWeight: "500",
  },
  historyList: {
    gap: Spacing.sm,
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  historyCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  historyCardContent: {
    flex: 1,
  },
  historyCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
    color: "#FFFFFF",
  },
  historyCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  historyCardMetaRTL: {
    flexDirection: "row-reverse",
  },
  historyCardBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  historyCardBadgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  historyCardTime: {
    fontSize: 11,
  },
  historyCardChevron: {
    marginLeft: Spacing.sm,
  },
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
  },
  noResultsIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  noResultsSubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  clearHistoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.xs,
    marginTop: Spacing.lg,
  },
  clearHistoryText: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.md,
    marginBottom: Spacing["2xl"],
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  emptyStateMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  guestBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  guestBadgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  rankBadgeSection: {
    marginBottom: Spacing["2xl"],
  },
  rankBadgeGradient: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  rankBadgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  rankIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  rankInfo: {
    flex: 1,
    gap: 4,
  },
  rankTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  levelText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  xpProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 4,
  },
  xpProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  xpProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  xpText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    minWidth: 60,
  },
  streakBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255, 149, 0, 0.2)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 149, 0, 0.3)",
  },
  fireEmoji: {
    fontSize: 20,
  },
  streakNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF9500",
  },
});
