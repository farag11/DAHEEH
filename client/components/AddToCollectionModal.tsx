import React, { useState } from "react";
import { View, StyleSheet, Pressable, FlatList, TextInput, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as haptics from "@/utils/haptics";

import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStudy, Collection } from "@/contexts/StudyContext";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";

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

interface AddToCollectionModalProps {
  visible: boolean;
  onClose: () => void;
  itemId: string;
  itemType: "summary" | "explanation" | "question" | "plan";
  onSuccess?: () => void;
}

export function AddToCollectionModal({
  visible,
  onClose,
  itemId,
  itemType,
  onSuccess,
}: AddToCollectionModalProps) {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const { collections, addCollection, addItemToCollection } = useStudy();

  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLLECTION_COLORS[0]);

  const handleAddToCollection = (collection: Collection) => {
    addItemToCollection(collection.id, itemId);
    haptics.success();
    onSuccess?.();
    onClose();
  };

  const handleCreateAndAdd = () => {
    if (!newCollectionName.trim()) return;
    
    const newCollection = addCollection({
      name: newCollectionName.trim(),
      description: newCollectionDescription.trim() || undefined,
      color: selectedColor,
      itemIds: [itemId],
      itemTypes: [itemType],
    });
    
    haptics.success();
    setShowCreateNew(false);
    setNewCollectionName("");
    setNewCollectionDescription("");
    setSelectedColor(COLLECTION_COLORS[0]);
    onSuccess?.();
    onClose();
  };

  const handleClose = () => {
    setShowCreateNew(false);
    setNewCollectionName("");
    setNewCollectionDescription("");
    setSelectedColor(COLLECTION_COLORS[0]);
    onClose();
  };

  const isItemInCollection = (collection: Collection) => {
    return collection.itemIds.includes(itemId);
  };

  const renderCollectionItem = ({ item }: { item: Collection }) => {
    const isAdded = isItemInCollection(item);
    return (
      <Pressable
        style={({ pressed }) => [
          styles.collectionItem,
          { 
            backgroundColor: theme.cardBackground, 
            opacity: pressed ? 0.9 : 1,
            borderColor: isAdded ? item.color : "transparent",
            borderWidth: isAdded ? 2 : 0,
          },
        ]}
        onPress={() => !isAdded && handleAddToCollection(item)}
        disabled={isAdded}
      >
        <View style={[styles.collectionItemContent, isRTL && styles.rtl]}>
          <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
          <View style={styles.collectionInfo}>
            <ThemedText style={styles.collectionName} numberOfLines={1}>
              {item.name}
            </ThemedText>
            <ThemedText style={[styles.collectionCount, { color: theme.textSecondary }]}>
              {item.itemIds.length} {t("items")}
            </ThemedText>
          </View>
          {isAdded ? (
            <View style={[styles.addedBadge, { backgroundColor: item.color + "20" }]}>
              <Feather name="check" size={16} color={item.color} />
            </View>
          ) : (
            <Feather name="plus-circle" size={24} color={theme.primary} />
          )}
        </View>
      </Pressable>
    );
  };

  const renderCreateNewForm = () => (
    <View style={styles.createForm}>
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
        value={newCollectionName}
        onChangeText={setNewCollectionName}
        placeholder={t("collectionName")}
        placeholderTextColor={theme.textSecondary}
      />

      <ThemedText style={[styles.inputLabel, { color: theme.textSecondary, marginTop: Spacing.lg }]}>
        {t("collectionDescription")}
      </ThemedText>
      <TextInput
        style={[
          styles.input,
          styles.textArea,
          { 
            backgroundColor: theme.inputBackground, 
            color: theme.text,
            textAlign: isRTL ? "right" : "left",
          },
        ]}
        value={newCollectionDescription}
        onChangeText={setNewCollectionDescription}
        placeholder={t("collectionDescription")}
        placeholderTextColor={theme.textSecondary}
        multiline
        numberOfLines={2}
      />

      <ThemedText style={[styles.inputLabel, { color: theme.textSecondary, marginTop: Spacing.lg }]}>
        {t("selectColor")}
      </ThemedText>
      <View style={[styles.colorPicker, isRTL && styles.rtl]}>
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
            {selectedColor === color ? (
              <Feather name="check" size={16} color="#FFFFFF" />
            ) : null}
          </Pressable>
        ))}
      </View>

      <View style={[styles.buttonRow, isRTL && styles.rtl]}>
        <Pressable
          style={[styles.cancelButton, { borderColor: theme.border }]}
          onPress={() => setShowCreateNew(false)}
        >
          <ThemedText style={{ color: theme.text }}>{t("cancel")}</ThemedText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.createButton,
            { 
              backgroundColor: newCollectionName.trim() ? theme.primary : theme.backgroundSecondary,
              opacity: pressed ? 0.9 : 1,
              flex: 1,
            },
          ]}
          onPress={handleCreateAndAdd}
          disabled={!newCollectionName.trim()}
        >
          <ThemedText style={[
            styles.createButtonText,
            { color: newCollectionName.trim() ? "#FFFFFF" : theme.textSecondary },
          ]}>
            {t("createCollection")}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable 
        style={styles.modalOverlay}
        onPress={handleClose}
      >
        <Pressable 
          style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.modalHeader, isRTL && styles.rtl]}>
            <ThemedText style={styles.modalTitle}>{t("addToCollection")}</ThemedText>
            <Pressable onPress={handleClose}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          {showCreateNew ? (
            renderCreateNewForm()
          ) : (
            <View style={styles.modalBody}>
              <Pressable
                style={({ pressed }) => [
                  styles.createNewButton,
                  { 
                    backgroundColor: theme.primary + "15",
                    opacity: pressed ? 0.9 : 1,
                  },
                  isRTL && styles.rtl,
                ]}
                onPress={() => {
                  haptics.lightTap();
                  setShowCreateNew(true);
                }}
              >
                <Feather name="plus" size={20} color={theme.primary} />
                <ThemedText style={[styles.createNewText, { color: theme.primary }]}>
                  {t("newCollection")}
                </ThemedText>
              </Pressable>

              {collections.length > 0 ? (
                <FlatList
                  data={collections}
                  renderItem={renderCollectionItem}
                  keyExtractor={(item) => item.id}
                  style={styles.collectionList}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Feather name="folder" size={48} color={theme.textSecondary} />
                  <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                    {t("noCollections")}
                  </ThemedText>
                </View>
              )}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalBody: {
    padding: Spacing.lg,
    paddingBottom: Spacing["4xl"],
  },
  createNewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  createNewText: {
    fontSize: 16,
    fontWeight: "500",
  },
  collectionList: {
    maxHeight: 300,
  },
  collectionItem: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  collectionItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  rtl: {
    flexDirection: "row-reverse",
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: "500",
  },
  collectionCount: {
    fontSize: 12,
  },
  addedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
  },
  createForm: {
    padding: Spacing.lg,
    paddingBottom: Spacing["4xl"],
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  input: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    height: 60,
    textAlignVertical: "top",
  },
  colorPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  colorOptionSelected: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing["2xl"],
  },
  cancelButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  createButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
