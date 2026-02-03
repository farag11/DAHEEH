import React, { useState, useMemo } from "react";
import { View, StyleSheet, Pressable, FlatList, TextInput } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@/components/Header";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as haptics from "@/utils/haptics";

import { ConfirmModal } from "@/components/ConfirmModal";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStudy, Collection } from "@/contexts/StudyContext";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useFloatingDockHeight } from "@/navigation/MainTabNavigator";

type TabType = "summaries" | "questions" | "plans";

interface DeleteModalState {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const floatingDockHeight = useFloatingDockHeight();
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const { t, isRTL } = useLanguage();
  const { summaries, questions, studyPlans, collections, deleteSummary, deleteStudyPlan, deleteQuestions } = useStudy();

  const [activeTab, setActiveTab] = useState<TabType>("summaries");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    visible: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const tabs: { key: TabType; label: string }[] = [
    { key: "summaries", label: t("summaries") },
    { key: "questions", label: t("questions") },
    { key: "plans", label: t("plans") },
  ];

  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) return collections;
    const query = searchQuery.toLowerCase();
    return collections.filter(c => 
      c.name.toLowerCase().includes(query) ||
      (c.description && c.description.toLowerCase().includes(query))
    );
  }, [collections, searchQuery]);

  const filteredSummaries = useMemo(() => {
    if (!searchQuery.trim()) return summaries;
    const query = searchQuery.toLowerCase();
    return summaries.filter(s =>
      (s.title && s.title.toLowerCase().includes(query)) ||
      s.summaryText.toLowerCase().includes(query) ||
      s.originalText.toLowerCase().includes(query)
    );
  }, [summaries, searchQuery]);

  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions;
    const query = searchQuery.toLowerCase();
    return questions.filter(q =>
      q.question.toLowerCase().includes(query) ||
      q.correctAnswer.toLowerCase().includes(query)
    );
  }, [questions, searchQuery]);

  const filteredPlans = useMemo(() => {
    if (!searchQuery.trim()) return studyPlans;
    const query = searchQuery.toLowerCase();
    return studyPlans.filter(p =>
      p.title.toLowerCase().includes(query) ||
      p.topics.some(t => t.toLowerCase().includes(query))
    );
  }, [studyPlans, searchQuery]);

  const handleDeleteSummary = (id: string) => {
    setDeleteModal({
      visible: true,
      title: t("delete"),
      message: t("confirm"),
      onConfirm: () => {
        deleteSummary(id);
        haptics.success();
        setDeleteModal(prev => ({ ...prev, visible: false }));
      },
    });
  };

  const handleDeletePlan = (id: string) => {
    setDeleteModal({
      visible: true,
      title: t("delete"),
      message: t("confirm"),
      onConfirm: () => {
        deleteStudyPlan(id);
        haptics.success();
        setDeleteModal(prev => ({ ...prev, visible: false }));
      },
    });
  };

  const handleDeleteQuestions = (id: string) => {
    setDeleteModal({
      visible: true,
      title: t("delete"),
      message: t("confirm"),
      onConfirm: () => {
        deleteQuestions([id]);
        haptics.success();
        setDeleteModal(prev => ({ ...prev, visible: false }));
      },
    });
  };

  const getEmptyStateIcon = (): { name: keyof typeof Feather.glyphMap; color: string } => {
    switch (activeTab) {
      case "summaries":
        return { name: "book-open", color: theme.primary };
      case "questions":
        return { name: "help-circle", color: theme.accent };
      case "plans":
        return { name: "calendar", color: theme.success };
    }
  };

  const getCtaConfig = (): { label: string; icon: keyof typeof Feather.glyphMap; screen: string } => {
    switch (activeTab) {
      case "summaries":
        return { label: t("summarizeNow"), icon: "file-text", screen: "Summarize" };
      case "questions":
        return { label: t("createQuiz"), icon: "help-circle", screen: "Quiz" };
      case "plans":
        return { label: t("createPlanNow"), icon: "calendar", screen: "Planner" };
    }
  };

  const handleCtaPress = () => {
    const ctaConfig = getCtaConfig();
    haptics.mediumTap();
    navigation.navigate("HomeTab", { screen: ctaConfig.screen });
  };

  const renderEmptyState = () => {
    const iconConfig = getEmptyStateIcon();
    const ctaConfig = getCtaConfig();
    const isSearching = searchQuery.trim().length > 0;
    
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconContainer, { backgroundColor: iconConfig.color + "15" }]}>
          <Feather name={isSearching ? "search" : iconConfig.name} size={48} color={iconConfig.color} />
        </View>
        <ThemedText style={styles.emptyTitle}>
          {isSearching 
            ? (t("noSearchResults") || "No results found")
            : (activeTab === "summaries" ? t("noSummaries") : activeTab === "questions" ? t("noQuestions") : t("noPlans"))
          }
        </ThemedText>
        <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          {isSearching 
            ? (t("tryDifferentSearch") || "Try a different search term")
            : t("startCreating")
          }
        </ThemedText>
        {!isSearching && (
          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
              isRTL && styles.rtl,
            ]}
            onPress={handleCtaPress}
          >
            <Feather name={ctaConfig.icon} size={20} color="#FFFFFF" />
            <ThemedText style={styles.ctaButtonText}>{ctaConfig.label}</ThemedText>
          </Pressable>
        )}
      </View>
    );
  };

  const handleSummaryPress = (id: string) => {
    haptics.lightTap();
    navigation.navigate("HomeTab", {
      screen: "Summarize",
      params: { sessionId: id },
    });
  };

  const renderSummaryItem = ({ item }: { item: typeof summaries[0] }) => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
      ]}
      onPress={() => handleSummaryPress(item.id)}
      onLongPress={() => handleDeleteSummary(item.id)}
    >
      <View style={[styles.cardHeader, isRTL && styles.rtl]}>
        <View style={[styles.badge, { backgroundColor: theme.primary + "20" }]}>
          <ThemedText style={[styles.badgeText, { color: theme.primary }]}>
            {item.complexity}
          </ThemedText>
        </View>
        <ThemedText style={[styles.cardDate, { color: theme.textSecondary }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </ThemedText>
      </View>
      <ThemedText style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </ThemedText>
      <ThemedText style={[styles.cardPreview, { color: theme.textSecondary }]} numberOfLines={3}>
        {item.summaryText}
      </ThemedText>
    </Pressable>
  );

  const renderQuestionItem = ({ item }: { item: typeof questions[0] }) => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
      ]}
      onLongPress={() => handleDeleteQuestions(item.id)}
    >
      <View style={[styles.cardHeader, isRTL && styles.rtl]}>
        <View style={[styles.badge, { backgroundColor: theme.accent + "20" }]}>
          <ThemedText style={[styles.badgeText, { color: theme.accent }]}>
            {item.type}
          </ThemedText>
        </View>
        <ThemedText style={[styles.cardDate, { color: theme.textSecondary }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </ThemedText>
      </View>
      <ThemedText style={styles.cardTitle} numberOfLines={2}>
        {item.question}
      </ThemedText>
      <ThemedText style={[styles.cardPreview, { color: theme.textSecondary }]} numberOfLines={2}>
        {t("correct")}: {item.correctAnswer}
      </ThemedText>
    </Pressable>
  );

  const renderPlanItem = ({ item }: { item: typeof studyPlans[0] }) => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
      ]}
      onLongPress={() => handleDeletePlan(item.id)}
    >
      <View style={[styles.cardHeader, isRTL && styles.rtl]}>
        <View style={[styles.badge, { backgroundColor: theme.success + "20" }]}>
          <ThemedText style={[styles.badgeText, { color: theme.success }]}>
            {item.daysAvailable} {t("days")}
          </ThemedText>
        </View>
        <ThemedText style={[styles.cardDate, { color: theme.textSecondary }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </ThemedText>
      </View>
      <ThemedText style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </ThemedText>
      <View style={[styles.topicsContainer, isRTL && styles.rtl]}>
        {item.topics.slice(0, 3).map((topic, index) => (
          <View key={index} style={[styles.topicChip, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText style={styles.topicText}>{topic}</ThemedText>
          </View>
        ))}
        {item.topics.length > 3 && (
          <ThemedText style={{ color: theme.textSecondary }}>+{item.topics.length - 3}</ThemedText>
        )}
      </View>
    </Pressable>
  );

  const getData = () => {
    switch (activeTab) {
      case "summaries":
        return filteredSummaries;
      case "questions":
        return filteredQuestions;
      case "plans":
        return filteredPlans;
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    switch (activeTab) {
      case "summaries":
        return renderSummaryItem({ item });
      case "questions":
        return renderQuestionItem({ item });
      case "plans":
        return renderPlanItem({ item });
    }
  };

  const handleCollectionsPress = () => {
    haptics.lightTap();
    navigation.navigate("Collections");
  };

  const renderGlassSearchBar = () => (
    <View style={styles.searchBarContainer}>
      <View style={styles.glassSearchOuter}>
        <BlurView intensity={25} tint="dark" style={styles.glassSearchBlur}>
          <View style={[styles.glassSearchInner, isRTL && styles.glassSearchInnerRTL]}>
            <Feather name="search" size={20} color="rgba(255,255,255,0.5)" />
            <TextInput
              style={[
                styles.glassSearchInput,
                { textAlign: isRTL ? "right" : "left" },
              ]}
              placeholder={t("searchLibrary") || "ابحث في المكتبة..."}
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => {
                  setSearchQuery("");
                  haptics.lightTap();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x-circle" size={18} color="rgba(255,255,255,0.5)" />
              </Pressable>
            )}
          </View>
        </BlurView>
      </View>
    </View>
  );

  const renderCollectionsButton = () => {
    if (searchQuery.trim() && filteredCollections.length === 0) return null;
    
    return (
      <Pressable
        style={({ pressed }) => [
          styles.collectionsButton,
          { 
            backgroundColor: theme.cardBackground, 
            opacity: pressed ? 0.9 : 1,
          },
          isRTL && styles.rtl,
        ]}
        onPress={handleCollectionsPress}
      >
        <View style={[styles.collectionsButtonContent, isRTL && styles.rtl]}>
          <View style={[styles.collectionsIconContainer, { backgroundColor: theme.primary + "15" }]}>
            <Feather name="folder" size={24} color={theme.primary} />
          </View>
          <View style={styles.collectionsTextContainer}>
            <ThemedText style={styles.collectionsButtonTitle}>{t("collections")}</ThemedText>
            <ThemedText style={[styles.collectionsButtonSubtitle, { color: theme.textSecondary }]}>
              {filteredCollections.length} {filteredCollections.length === 1 ? t("collection") : t("collections").toLowerCase()}
            </ThemedText>
          </View>
        </View>
        <Feather 
          name={isRTL ? "chevron-left" : "chevron-right"} 
          size={24} 
          color={theme.textSecondary} 
        />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={{ paddingTop: headerHeight + Spacing.lg }}>
        {renderGlassSearchBar()}
        <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
          {renderCollectionsButton()}
        </View>
      </View>
      <View style={[styles.tabsContainer]}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && { backgroundColor: theme.primary },
            ]}
            onPress={() => {
              setActiveTab(tab.key);
              haptics.selection();
            }}
          >
            <ThemedText
              style={[
                styles.tabText,
                { color: activeTab === tab.key ? "#FFFFFF" : theme.text },
              ]}
            >
              {tab.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={getData()}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          paddingBottom: floatingDockHeight + Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <ConfirmModal
        visible={deleteModal.visible}
        title={deleteModal.title}
        message={deleteModal.message}
        confirmText={t("delete")}
        cancelText={t("cancel")}
        onConfirm={deleteModal.onConfirm}
        onCancel={() => setDeleteModal(prev => ({ ...prev, visible: false }))}
        destructive
        icon="trash-2"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  glassSearchOuter: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(20, 20, 25, 0.88)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glassSearchBlur: {
    borderRadius: 24,
    overflow: "hidden",
  },
  glassSearchInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  glassSearchInnerRTL: {
    flexDirection: "row-reverse",
  },
  glassSearchInput: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: "Cairo_500Medium",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: "transparent",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
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
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  ctaButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  rtl: {
    flexDirection: "row-reverse",
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  cardDate: {
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  cardPreview: {
    fontSize: 14,
  },
  topicsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  topicChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  topicText: {
    fontSize: 12,
  },
  collectionsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  collectionsButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  collectionsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  collectionsTextContainer: {
    gap: 2,
  },
  collectionsButtonTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  collectionsButtonSubtitle: {
    fontSize: 12,
  },
});
