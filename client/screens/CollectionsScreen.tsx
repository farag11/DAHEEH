import React, { useState, useMemo, useEffect } from "react";
import { View, StyleSheet, Pressable, FlatList, TextInput, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as haptics from "@/utils/haptics";

import { ConfirmModal } from "@/components/ConfirmModal";
import { useToast } from "@/components/Toast";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStudy, Collection, Summary, Explanation, Question, StudyPlan } from "@/contexts/StudyContext";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useFloatingDockHeight } from "@/navigation/MainTabNavigator";

type AddableItem = {
  id: string;
  title: string;
  subtitle: string;
  type: "summary" | "explanation" | "question" | "plan";
  icon: keyof typeof Feather.glyphMap;
  color: string;
};

const COLLECTION_COLORS = [
  "#7209B7",
  "#4361EE",
  "#FF6B35",
  "#28A745",
  "#E91E8B",
  "#17A2B8",
  "#DC3545",
  "#FFC107",
];

type CollectionsScreenRouteProp = RouteProp<{ Collections: { collectionId?: string } }, "Collections">;

interface DeleteModalState {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export default function CollectionsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const floatingDockHeight = useFloatingDockHeight();
  const navigation = useNavigation<any>();
  const route = useRoute<CollectionsScreenRouteProp>();
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const toast = useToast();
  const { 
    collections, 
    addCollection, 
    deleteCollection,
    updateCollection,
    getCollectionItems,
    addItemToCollection,
    addMultipleItemsToCollection,
    summaries,
    explanations,
    questions,
    studyPlans,
  } = useStudy();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [addItemsSearchQuery, setAddItemsSearchQuery] = useState("");
  const [collectionSearchQuery, setCollectionSearchQuery] = useState("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLLECTION_COLORS[0]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedCollectionName, setEditedCollectionName] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    visible: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const availableItems = useMemo((): AddableItem[] => {
    if (!selectedCollection) return [];
    
    const existingIds = new Set(selectedCollection.itemIds);
    const items: AddableItem[] = [];
    
    summaries.forEach(s => {
      if (!existingIds.has(s.id)) {
        items.push({
          id: s.id,
          title: s.title || s.originalText.substring(0, 50),
          subtitle: s.summaryText.substring(0, 80),
          type: "summary",
          icon: "file-text",
          color: theme.primary,
        });
      }
    });
    
    explanations.forEach(e => {
      if (!existingIds.has(e.id)) {
        items.push({
          id: e.id,
          title: e.concept,
          subtitle: e.explanation.substring(0, 80),
          type: "explanation",
          icon: "book-open",
          color: theme.accent,
        });
      }
    });
    
    questions.forEach(q => {
      if (!existingIds.has(q.id)) {
        items.push({
          id: q.id,
          title: q.question,
          subtitle: `${t("correct")}: ${q.correctAnswer}`,
          type: "question",
          icon: "help-circle",
          color: theme.warning,
        });
      }
    });
    
    studyPlans.forEach(p => {
      if (!existingIds.has(p.id)) {
        items.push({
          id: p.id,
          title: p.title,
          subtitle: p.planDetails.substring(0, 80),
          type: "plan",
          icon: "calendar",
          color: theme.success,
        });
      }
    });
    
    return items;
  }, [selectedCollection, summaries, explanations, questions, studyPlans, theme, t]);

  const filteredAvailableItems = useMemo(() => {
    if (!addItemsSearchQuery.trim()) return availableItems;
    const query = addItemsSearchQuery.toLowerCase();
    return availableItems.filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.subtitle.toLowerCase().includes(query)
    );
  }, [availableItems, addItemsSearchQuery]);

  useEffect(() => {
    if (selectedCollection) {
      const updated = collections.find(c => c.id === selectedCollection.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedCollection)) {
        setSelectedCollection(updated);
      }
    }
  }, [collections]);

  const toggleItemSelection = (itemId: string) => {
    haptics.selection();
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleConfirmAddItems = () => {
    if (!selectedCollection || selectedItemIds.size === 0) return;
    
    const itemsToAdd = availableItems.filter(item => selectedItemIds.has(item.id));
    
    if (addMultipleItemsToCollection) {
      addMultipleItemsToCollection(
        selectedCollection.id,
        itemsToAdd.map(i => i.id),
        itemsToAdd.map(i => i.type)
      );
    } else {
      itemsToAdd.forEach(item => {
        addItemToCollection(selectedCollection.id, item.id, item.type);
      });
    }
    
    haptics.success();
    toast.show(
      `${t("added") || "Added"} ${selectedItemIds.size} ${t("items") || "items"}`, 
      "success"
    );
    setSelectedItemIds(new Set());
    setShowAddItemsModal(false);
    setAddItemsSearchQuery("");
  };

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;
    
    addCollection({
      name: newCollectionName.trim(),
      description: newCollectionDescription.trim() || undefined,
      color: selectedColor,
      itemIds: [],
      itemTypes: [],
    });
    
    haptics.success();
    toast.show(t("collectionCreated"), "success");
    setShowCreateModal(false);
    setNewCollectionName("");
    setNewCollectionDescription("");
    setSelectedColor(COLLECTION_COLORS[0]);
  };

  const handleDeleteCollection = (collection: Collection) => {
    setDeleteModal({
      visible: true,
      title: t("deleteCollection"),
      message: t("confirm"),
      onConfirm: () => {
        deleteCollection(collection.id);
        haptics.success();
        setDeleteModal(prev => ({ ...prev, visible: false }));
        if (selectedCollection?.id === collection.id) {
          setSelectedCollection(null);
        }
      },
    });
  };

  const handleCollectionPress = (collection: Collection) => {
    haptics.lightTap();
    setSelectedCollection(collection);
    setEditedCollectionName(collection.name);
  };

  const handleBackToCollections = () => {
    haptics.lightTap();
    setSelectedCollection(null);
    setCollectionSearchQuery("");
    setIsEditingName(false);
  };

  const handleSaveCollectionName = () => {
    if (!selectedCollection || !editedCollectionName.trim()) return;
    if (editedCollectionName.trim() === selectedCollection.name) {
      setIsEditingName(false);
      return;
    }
    
    if (updateCollection) {
      updateCollection(selectedCollection.id, { name: editedCollectionName.trim() });
      haptics.success();
      toast.show(t("saved") || "Saved", "success");
    }
    setIsEditingName(false);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: theme.primary + "15" }]}>
        <Feather name="folder" size={48} color={theme.primary} />
      </View>
      <ThemedText style={styles.emptyTitle}>{t("noCollections")}</ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        {t("createFirstCollection")}
      </ThemedText>
    </View>
  );

  const renderCollectionItem = ({ item }: { item: Collection }) => {
    const itemCount = item.itemIds?.length || 0;
    return (
      <Pressable
        style={({ pressed }) => [
          styles.collectionCard,
          { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
        ]}
        onPress={() => handleCollectionPress(item)}
        onLongPress={() => handleDeleteCollection(item)}
      >
        <View style={[styles.collectionCardContent, isRTL && styles.rtl]}>
          <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
          <View style={styles.collectionInfo}>
            <ThemedText style={styles.collectionName}>{item.name}</ThemedText>
            <ThemedText style={[styles.collectionCount, { color: theme.textSecondary }]}>
              {itemCount} {itemCount === 1 ? t("item") : t("items")}
            </ThemedText>
          </View>
          <Feather 
            name={isRTL ? "chevron-left" : "chevron-right"} 
            size={20} 
            color={theme.textSecondary} 
          />
        </View>
      </Pressable>
    );
  };

  const renderCollectionDetails = () => {
    if (!selectedCollection) return null;

    const collectionItemsData = getCollectionItems(selectedCollection.id);
    
    const allItems: any[] = [
      ...collectionItemsData.summaries,
      ...collectionItemsData.explanations,
      ...collectionItemsData.questions,
      ...collectionItemsData.plans,
    ];
    
    const filteredItems = collectionSearchQuery.trim()
      ? allItems.filter((item: any) => {
          const query = collectionSearchQuery.toLowerCase();
          if ("title" in item && item.title) return item.title.toLowerCase().includes(query);
          if ("summaryText" in item) return item.summaryText.toLowerCase().includes(query);
          if ("question" in item) return item.question.toLowerCase().includes(query);
          if ("concept" in item) return item.concept.toLowerCase().includes(query);
          if ("planDetails" in item) return item.planDetails.toLowerCase().includes(query);
          return false;
        })
      : allItems;

    const getItemDetails = (item: any) => {
      if ("summaryText" in item) {
        return { 
          type: "summary", 
          icon: "file-text" as keyof typeof Feather.glyphMap, 
          color: theme.primary,
          title: item.title || item.originalText?.substring(0, 50),
          subtitle: item.summaryText?.substring(0, 80),
          navigable: true,
        };
      }
      if ("concept" in item) {
        return { 
          type: "explanation", 
          icon: "book-open" as keyof typeof Feather.glyphMap, 
          color: theme.accent,
          title: item.concept,
          subtitle: item.explanation?.substring(0, 80),
          navigable: false,
        };
      }
      if ("question" in item) {
        return { 
          type: "question", 
          icon: "help-circle" as keyof typeof Feather.glyphMap, 
          color: theme.warning,
          title: item.question,
          subtitle: `${t("correct")}: ${item.correctAnswer}`,
          navigable: false,
        };
      }
      if ("planDetails" in item) {
        return { 
          type: "plan", 
          icon: "calendar" as keyof typeof Feather.glyphMap, 
          color: theme.success,
          title: item.title,
          subtitle: item.planDetails?.substring(0, 80),
          navigable: false,
        };
      }
      return { type: "unknown", icon: "file" as keyof typeof Feather.glyphMap, color: theme.text, title: "Unknown", subtitle: "", navigable: false };
    };

    const renderCollectionDetailItem = ({ item }: { item: any }) => {
      const { type, icon, color, title, subtitle, navigable: isNavigable } = getItemDetails(item);
      
      return (
        <Pressable
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={isNavigable ? () => {
            haptics.lightTap();
            navigation.navigate("HomeTab", {
              screen: "Summarize",
              params: { sessionId: item.id },
            });
          } : undefined}
        >
          <View style={[styles.cardHeader, isRTL && styles.rtl]}>
            <View style={[styles.badge, { backgroundColor: color + "20" }]}>
              <Feather name={icon} size={12} color={color} style={{ marginEnd: 4 }} />
              <ThemedText style={[styles.badgeText, { color }]}>
                {type}
              </ThemedText>
            </View>
            {isNavigable ? (
              <Feather 
                name={isRTL ? "chevron-left" : "chevron-right"} 
                size={18} 
                color={theme.textSecondary} 
              />
            ) : null}
          </View>
          <ThemedText style={styles.cardTitle} numberOfLines={2}>
            {title}
          </ThemedText>
          <ThemedText style={[styles.cardPreview, { color: theme.textSecondary }]} numberOfLines={2}>
            {subtitle}
          </ThemedText>
        </Pressable>
      );
    };

    return (
      <View style={styles.container}>
        <Pressable
          style={[styles.backButton, isRTL && styles.rtl]}
          onPress={handleBackToCollections}
        >
          <Feather 
            name={isRTL ? "chevron-right" : "chevron-left"} 
            size={24} 
            color={theme.primary} 
          />
          <ThemedText style={[styles.backButtonText, { color: theme.primary }]}>
            {t("collections")}
          </ThemedText>
        </Pressable>
        
        <View style={[styles.collectionHeader, { borderBottomColor: theme.border }]}>
          <View style={[styles.colorIndicator, { backgroundColor: selectedCollection.color, width: 8, height: 8 }]} />
          {isEditingName ? (
            <View style={styles.editNameContainer}>
              <TextInput
                style={[
                  styles.editNameInput,
                  { 
                    color: theme.text, 
                    borderColor: theme.primary,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
                value={editedCollectionName}
                onChangeText={setEditedCollectionName}
                autoFocus
                onBlur={handleSaveCollectionName}
                onSubmitEditing={handleSaveCollectionName}
              />
              <Pressable onPress={handleSaveCollectionName} style={styles.saveNameButton}>
                <Feather name="check" size={20} color={theme.primary} />
              </Pressable>
            </View>
          ) : (
            <Pressable 
              onPress={() => {
                setIsEditingName(true);
                setEditedCollectionName(selectedCollection.name);
              }}
              style={styles.editableNameRow}
            >
              <ThemedText style={styles.collectionTitle}>{selectedCollection.name}</ThemedText>
              <Feather name="edit-2" size={16} color={theme.textSecondary} style={{ marginStart: 8 }} />
            </Pressable>
          )}
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.glassSearchOuter}>
            <BlurView intensity={25} tint="dark" style={styles.glassSearchBlur}>
              <View style={[styles.glassSearchInner, isRTL && styles.glassSearchInnerRTL]}>
                <Feather name="search" size={18} color="rgba(255,255,255,0.5)" />
                <TextInput
                  style={[
                    styles.glassSearchInput,
                    { textAlign: isRTL ? "right" : "left" },
                  ]}
                  placeholder={t("searchInCollection") || "Search in collection..."}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={collectionSearchQuery}
                  onChangeText={setCollectionSearchQuery}
                />
                {collectionSearchQuery.length > 0 ? (
                  <Pressable onPress={() => setCollectionSearchQuery("")}>
                    <Feather name="x-circle" size={16} color="rgba(255,255,255,0.5)" />
                  </Pressable>
                ) : null}
              </View>
            </BlurView>
          </View>
        </View>

        <FlatList
          data={filteredItems}
          renderItem={renderCollectionDetailItem}
          keyExtractor={(item) => `${item.id}`}
          contentContainerStyle={{
            paddingHorizontal: Spacing.lg,
            paddingBottom: floatingDockHeight + Spacing.xl,
            flexGrow: 1,
          }}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconContainer, { backgroundColor: theme.primary + "15" }]}>
                <Feather name="inbox" size={48} color={theme.primary} />
              </View>
              <ThemedText style={styles.emptyTitle}>
                {collectionSearchQuery.trim() ? (t("noResults") || "No results") : t("emptyCollection")}
              </ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                {collectionSearchQuery.trim() ? (t("tryDifferentSearch") || "Try a different search") : t("addItemsToCollection")}
              </ThemedText>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />

        <View style={[styles.addButtonContainer, { bottom: floatingDockHeight + Spacing.lg }]}>
          <Pressable
            style={({ pressed }) => [
              styles.gradientButtonWrapper,
              { opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={() => {
              haptics.mediumTap();
              setSelectedItemIds(new Set());
              setShowAddItemsModal(true);
            }}
          >
            <LinearGradient
              colors={["#5f2c82", "#49a09d"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              <Feather name="plus" size={20} color="#FFFFFF" />
              <ThemedText style={styles.gradientButtonText}>
                {t("addContent") || "إضافة محتوى"}
              </ThemedText>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderMultiSelectHistoryPicker = () => (
    <Modal
      visible={showAddItemsModal}
      animationType="slide"
      transparent
      onRequestClose={() => {
        setShowAddItemsModal(false);
        setAddItemsSearchQuery("");
        setSelectedItemIds(new Set());
      }}
    >
      <Pressable 
        style={styles.modalOverlay}
        onPress={() => {
          setShowAddItemsModal(false);
          setAddItemsSearchQuery("");
          setSelectedItemIds(new Set());
        }}
      >
        <Pressable 
          style={styles.historyPickerContainer}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.historyPickerGlass}>
            <BlurView intensity={30} tint="dark" style={styles.historyPickerBlur}>
              <View style={styles.historyPickerHeader}>
                <ThemedText style={styles.historyPickerTitle}>
                  {t("selectItems") || "Select Items"}
                </ThemedText>
                <Pressable onPress={() => {
                  setShowAddItemsModal(false);
                  setAddItemsSearchQuery("");
                  setSelectedItemIds(new Set());
                }}>
                  <Feather name="x" size={24} color="rgba(255,255,255,0.8)" />
                </Pressable>
              </View>

              <View style={styles.historyPickerSearchContainer}>
                <View style={styles.glassSearchOuter}>
                  <BlurView intensity={20} tint="dark" style={styles.glassSearchBlur}>
                    <View style={[styles.glassSearchInner, isRTL && styles.glassSearchInnerRTL]}>
                      <Feather name="search" size={18} color="rgba(255,255,255,0.5)" />
                      <TextInput
                        style={[
                          styles.glassSearchInput,
                          { textAlign: isRTL ? "right" : "left" },
                        ]}
                        placeholder={t("searchHistory") || "Search history..."}
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={addItemsSearchQuery}
                        onChangeText={setAddItemsSearchQuery}
                      />
                      {addItemsSearchQuery.length > 0 ? (
                        <Pressable onPress={() => setAddItemsSearchQuery("")}>
                          <Feather name="x-circle" size={16} color="rgba(255,255,255,0.5)" />
                        </Pressable>
                      ) : null}
                    </View>
                  </BlurView>
                </View>
              </View>

              {selectedItemIds.size > 0 && (
                <View style={styles.selectionCounter}>
                  <ThemedText style={styles.selectionCounterText}>
                    {selectedItemIds.size} {t("selected") || "selected"}
                  </ThemedText>
                </View>
              )}

              <FlatList
                data={filteredAvailableItems}
                keyExtractor={(item) => `${item.type}-${item.id}`}
                style={styles.historyPickerList}
                contentContainerStyle={{ paddingBottom: Spacing.xl }}
                renderItem={({ item }) => {
                  const isSelected = selectedItemIds.has(item.id);
                  return (
                    <Pressable
                      style={({ pressed }) => [
                        styles.historyPickerItem,
                        isSelected && styles.historyPickerItemSelected,
                        { opacity: pressed ? 0.9 : 1 },
                      ]}
                      onPress={() => toggleItemSelection(item.id)}
                    >
                      <View style={[styles.historyPickerItemContent, isRTL && styles.rtl]}>
                        <View style={[
                          styles.checkbox,
                          isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
                        ]}>
                          {isSelected && <Feather name="check" size={14} color="#FFFFFF" />}
                        </View>
                        <View style={[styles.historyPickerIcon, { backgroundColor: item.color + "30" }]}>
                          <Feather name={item.icon} size={18} color={item.color} />
                        </View>
                        <View style={styles.historyPickerInfo}>
                          <ThemedText style={styles.historyPickerItemTitle} numberOfLines={1}>
                            {item.title}
                          </ThemedText>
                          <ThemedText style={styles.historyPickerItemSubtitle} numberOfLines={1}>
                            {item.subtitle}
                          </ThemedText>
                        </View>
                        <View style={[styles.historyPickerTypeBadge, { backgroundColor: item.color + "20" }]}>
                          <ThemedText style={[styles.historyPickerTypeBadgeText, { color: item.color }]}>
                            {item.type}
                          </ThemedText>
                        </View>
                      </View>
                    </Pressable>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.historyPickerEmpty}>
                    <Feather name="inbox" size={40} color="rgba(255,255,255,0.4)" />
                    <ThemedText style={styles.historyPickerEmptyText}>
                      {availableItems.length === 0 
                        ? (t("noItemsToAdd") || "No items to add") 
                        : (t("noResults") || "No results")}
                    </ThemedText>
                    <ThemedText style={styles.historyPickerEmptySubtext}>
                      {availableItems.length === 0 
                        ? (t("createContentFirst") || "Create summaries, quizzes, or explanations first") 
                        : (t("tryDifferentSearch") || "Try a different search")}
                    </ThemedText>
                  </View>
                }
              />

              {selectedItemIds.size > 0 && (
                <View style={styles.confirmButtonContainer}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.gradientButtonWrapper,
                      { opacity: pressed ? 0.9 : 1, width: "100%" },
                    ]}
                    onPress={handleConfirmAddItems}
                  >
                    <LinearGradient
                      colors={["#5f2c82", "#49a09d"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.gradientButton, { paddingVertical: 16 }]}
                    >
                      <Feather name="check" size={20} color="#FFFFFF" />
                      <ThemedText style={styles.gradientButtonText}>
                        {t("confirmAdd") || "Confirm Adding"} ({selectedItemIds.size})
                      </ThemedText>
                    </LinearGradient>
                  </Pressable>
                </View>
              )}
            </BlurView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  if (selectedCollection) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot, paddingTop: headerHeight }]}>
        {renderCollectionDetails()}
        {renderMultiSelectHistoryPicker()}
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
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={collections}
        renderItem={renderCollectionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingHorizontal: Spacing.lg,
          paddingBottom: floatingDockHeight + Spacing.xl,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { 
            backgroundColor: theme.primary, 
            opacity: pressed ? 0.9 : 1,
            bottom: floatingDockHeight + Spacing.lg,
          },
          isRTL ? { left: Spacing.lg } : { right: Spacing.lg },
        ]}
        onPress={() => {
          haptics.mediumTap();
          setShowCreateModal(true);
        }}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>

      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowCreateModal(false)}
        >
          <Pressable 
            style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHeader, isRTL && styles.rtl]}>
              <ThemedText style={styles.modalTitle}>{t("newCollection")}</ThemedText>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
                {t("collectionName")}
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme.inputBackground, 
                    color: theme.text,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
                placeholder={t("enterCollectionName")}
                placeholderTextColor={theme.textSecondary}
                value={newCollectionName}
                onChangeText={setNewCollectionName}
              />

              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary, marginTop: Spacing.lg }]}>
                {t("description")} ({t("optional")})
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme.inputBackground, 
                    color: theme.text,
                    textAlign: isRTL ? "right" : "left",
                    minHeight: 80,
                  },
                ]}
                placeholder={t("enterDescription")}
                placeholderTextColor={theme.textSecondary}
                value={newCollectionDescription}
                onChangeText={setNewCollectionDescription}
                multiline
                textAlignVertical="top"
              />

              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary, marginTop: Spacing.lg }]}>
                {t("selectColor")}
              </ThemedText>
              <View style={styles.colorPicker}>
                {COLLECTION_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedColor(color);
                      haptics.selection();
                    }}
                  >
                    {selectedColor === color && (
                      <Feather name="check" size={16} color="#FFFFFF" />
                    )}
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.createButton,
                  { 
                    backgroundColor: newCollectionName.trim() ? theme.primary : theme.backgroundSecondary,
                    opacity: pressed && newCollectionName.trim() ? 0.9 : 1,
                  },
                ]}
                onPress={handleCreateCollection}
                disabled={!newCollectionName.trim()}
              >
                <ThemedText style={[
                  styles.createButtonText,
                  { color: newCollectionName.trim() ? "#FFFFFF" : theme.textSecondary },
                ]}>
                  {t("create")}
                </ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  collectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    marginBottom: Spacing.md,
  },
  collectionTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  editableNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  editNameContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  editNameInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    fontFamily: "Cairo_700Bold",
  },
  saveNameButton: {
    padding: Spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  glassSearchOuter: {
    borderRadius: 20,
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
    borderRadius: 20,
    overflow: "hidden",
  },
  glassSearchInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  glassSearchInnerRTL: {
    flexDirection: "row-reverse",
  },
  glassSearchInput: {
    flex: 1,
    fontSize: 15,
    color: "#FFFFFF",
    fontFamily: "Cairo_500Medium",
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
    paddingHorizontal: Spacing.xl,
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
  collectionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  collectionCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  collectionInfo: {
    flex: 1,
    gap: 2,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: "600",
  },
  collectionCount: {
    fontSize: 13,
  },
  fab: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonContainer: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
  },
  gradientButtonWrapper: {
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#5f2c82",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  gradientButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Cairo_700Bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalBody: {
    padding: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  input: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: 16,
    fontFamily: "Cairo_500Medium",
  },
  colorPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  createButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  rtl: {
    flexDirection: "row-reverse",
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
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  cardPreview: {
    fontSize: 14,
  },
  historyPickerContainer: {
    flex: 1,
    marginTop: 60,
  },
  historyPickerGlass: {
    flex: 1,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(15, 15, 20, 0.96)",
  },
  historyPickerBlur: {
    flex: 1,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  historyPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  historyPickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Cairo_700Bold",
  },
  historyPickerSearchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  selectionCounter: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  selectionCounterText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    fontFamily: "Cairo_500Medium",
  },
  historyPickerList: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  historyPickerItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "transparent",
  },
  historyPickerItemSelected: {
    backgroundColor: "rgba(95, 44, 130, 0.2)",
    borderColor: "rgba(95, 44, 130, 0.5)",
  },
  historyPickerItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  historyPickerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  historyPickerInfo: {
    flex: 1,
  },
  historyPickerItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 2,
    fontFamily: "Cairo_600SemiBold",
  },
  historyPickerItemSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
  },
  historyPickerTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  historyPickerTypeBadgeText: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  historyPickerEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  historyPickerEmptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: "rgba(255,255,255,0.6)",
    marginTop: Spacing.lg,
    textAlign: "center",
    fontFamily: "Cairo_600SemiBold",
  },
  historyPickerEmptySubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  confirmButtonContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
});
