import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, TextInput, Modal, FlatList, Platform } from "react-native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as haptics from "@/utils/haptics";

import { useToast } from "@/components/Toast";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius, AccentColors } from "@/constants/theme";
import type { AccentColorName } from "@/constants/theme";
import {
  getAISettings,
  saveProviderApiKey,
  hasProviderApiKey,
  getProviderDisplayName,
  setSelectedProvider as persistSelectedProvider,
  type AIProviderName,
  type AIProviderInfo,
} from "@/services/aiProviders";

const AI_PROVIDERS: AIProviderName[] = [
  "gemini",
  "deepseek", 
  "claude",
  "mistral",
  "grok",
  "cohere",
  "anthropic",
  "openai",
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  const { theme, accentColor, setAccentColor } = useTheme();
  const { t, isRTL } = useLanguage();
  const toast = useToast();

  const [selectedProvider, setSelectedProvider] = useState<AIProviderName | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [providerKeysStatus, setProviderKeysStatus] = useState<Record<AIProviderName, boolean>>({} as Record<AIProviderName, boolean>);
  const [showProviderModal, setShowProviderModal] = useState(false);

  const colorThemes: { name: AccentColorName; label: string; color: string }[] = [
    { name: "purple", label: "purple", color: AccentColors.purple },
    { name: "orange", label: "orange", color: AccentColors.orange },
    { name: "gray", label: "gray", color: AccentColors.gray },
    { name: "pink", label: "pink", color: AccentColors.pink },
    { name: "blue", label: "blue", color: AccentColors.blue },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await getAISettings();
    const keysStatus: Record<AIProviderName, boolean> = {} as Record<AIProviderName, boolean>;
    
    for (const provider of AI_PROVIDERS) {
      keysStatus[provider] = await hasProviderApiKey(provider);
    }
    
    setProviderKeysStatus(keysStatus);
    
    if (settings.selectedProvider) {
      setSelectedProvider(settings.selectedProvider);
    }
  };

  const handleSaveApiKey = async () => {
    if (!selectedProvider || !apiKey.trim()) return;
    
    await saveProviderApiKey(selectedProvider, apiKey.trim());
    setProviderKeysStatus(prev => ({ ...prev, [selectedProvider]: true }));
    setApiKey("");
    haptics.success();
    toast.show(t("apiKeySaved"), "success");
  };

  const handleSelectProvider = async (provider: AIProviderName) => {
    setSelectedProvider(provider);
    await persistSelectedProvider(provider);
    setApiKey("");
    setShowApiKey(false);
    setShowProviderModal(false);
    haptics.lightTap();
  };

  const handleColorChange = (colorName: AccentColorName) => {
    setAccentColor(colorName);
    haptics.lightTap();
  };

  const getProviderPlaceholder = (provider: AIProviderName): string => {
    const name = getProviderDisplayName(provider);
    return `${t("enterApiKeyFor")} ${name}...`;
  };

  const renderProviderItem = useCallback(({ item }: { item: AIProviderName }) => {
    const hasKey = providerKeysStatus[item];
    const isSelected = selectedProvider === item;
    
    return (
      <Pressable
        style={[
          styles.providerItem,
          { 
            backgroundColor: isSelected ? theme.primary + "15" : theme.cardBackground,
            borderColor: isSelected ? theme.primary : theme.border,
          }
        ]}
        onPress={() => handleSelectProvider(item)}
        testID={`provider-${item}`}
      >
        <View style={[styles.providerItemContent, isRTL && styles.rtl]}>
          <View style={styles.providerItemLeft}>
            <ThemedText style={[styles.providerItemName, { color: theme.text }]}>
              {getProviderDisplayName(item)}
            </ThemedText>
            {hasKey ? (
              <View style={[styles.configuredBadge, { backgroundColor: theme.success + "20" }]}>
                <Feather name="shield" size={10} color={theme.success} />
                <ThemedText style={[styles.configuredText, { color: theme.success }]}>
                  {t("apiKeySecured")}
                </ThemedText>
              </View>
            ) : null}
          </View>
          {isSelected ? (
            <Feather name="check-circle" size={20} color={theme.primary} />
          ) : (
            <Feather name="circle" size={20} color={theme.textSecondary} />
          )}
        </View>
      </Pressable>
    );
  }, [providerKeysStatus, selectedProvider, theme, isRTL, t]);

  return (
    <>
      <KeyboardAwareScrollViewCompat
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + 100,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: tabBarHeight }}
      >
        <ThemedText style={[styles.sectionTitle, isRTL && styles.rtlText]}>
          {t("appearance")}
        </ThemedText>

        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <ThemedText style={[styles.cardTitle, isRTL && styles.rtlText]}>
            {t("colorTheme")}
          </ThemedText>
          <View style={styles.colorGrid}>
            {colorThemes.map((colorTheme) => (
              <Pressable
                key={colorTheme.name}
                style={[
                  styles.colorOption,
                  { borderColor: accentColor === colorTheme.name ? colorTheme.color : theme.border },
                  accentColor === colorTheme.name && styles.colorOptionSelected,
                ]}
                onPress={() => handleColorChange(colorTheme.name)}
              >
                <View style={[styles.colorCircle, { backgroundColor: colorTheme.color }]}>
                  {accentColor === colorTheme.name ? (
                    <Feather name="check" size={16} color="#FFFFFF" />
                  ) : null}
                </View>
                <ThemedText style={[styles.colorLabel, { color: theme.textSecondary }]}>
                  {t(colorTheme.label)}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <ThemedText style={[styles.sectionTitle, isRTL && styles.rtlText, { marginTop: Spacing.xl }]}>
          {t("aiProviders")}
        </ThemedText>

        <View style={[styles.infoCard, { backgroundColor: theme.primary + "15" }]}>
          <Feather name="info" size={16} color={theme.primary} style={{ marginRight: Spacing.sm }} />
          <ThemedText style={[styles.infoText, { color: theme.primary }]}>
            {t("allProvidersFree")}
          </ThemedText>
        </View>

        {Object.values(providerKeysStatus).filter(Boolean).length > 0 ? (
          <View style={[styles.keysCountCard, { backgroundColor: theme.success + "15" }]}>
            <Feather name="shield" size={16} color={theme.success} style={{ marginRight: Spacing.sm }} />
            <ThemedText style={[styles.keysCountText, { color: theme.success }]}>
              {Object.values(providerKeysStatus).filter(Boolean).length} {t("keysConfigured")}
            </ThemedText>
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <ThemedText style={[styles.cardTitle, isRTL && styles.rtlText]}>
            {t("configureApiKey")}
          </ThemedText>
          <ThemedText style={[styles.cardSubtitle, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
            {t("selectToConfigureKey")}
          </ThemedText>

          <Pressable
            style={[styles.providerSelector, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
            onPress={() => setShowProviderModal(true)}
            testID="provider-selector"
          >
            <View style={[styles.providerSelectorContent, isRTL && styles.rtl]}>
              <View style={styles.providerSelectorLeft}>
                {selectedProvider ? (
                  <>
                    <ThemedText style={[styles.providerSelectorText, { color: theme.text }]}>
                      {getProviderDisplayName(selectedProvider)}
                    </ThemedText>
                    {providerKeysStatus[selectedProvider] ? (
                      <View style={[styles.configuredBadgeSmall, { backgroundColor: theme.success + "20" }]}>
                        <Feather name="shield" size={8} color={theme.success} />
                      </View>
                    ) : null}
                  </>
                ) : (
                  <ThemedText style={[styles.providerSelectorPlaceholder, { color: theme.textSecondary }]}>
                    {t("selectProvider")}
                  </ThemedText>
                )}
              </View>
              <Feather name="chevron-down" size={20} color={theme.textSecondary} />
            </View>
          </Pressable>

          {selectedProvider ? (
            <View style={styles.apiKeySection}>
              <View style={[styles.apiKeyInputRow, isRTL && styles.rtl]}>
                <TextInput
                  style={[
                    styles.apiKeyInput,
                    { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border },
                  ]}
                  placeholder={getProviderPlaceholder(selectedProvider)}
                  placeholderTextColor={theme.textSecondary}
                  value={apiKey}
                  onChangeText={setApiKey}
                  secureTextEntry={!showApiKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="api-key-input"
                />
                <Pressable
                  style={[styles.eyeButton, { backgroundColor: theme.backgroundSecondary }]}
                  onPress={() => setShowApiKey(!showApiKey)}
                  testID="toggle-visibility"
                >
                  <Feather name={showApiKey ? "eye-off" : "eye"} size={20} color={theme.text} />
                </Pressable>
              </View>
              <Pressable
                style={[
                  styles.saveButton, 
                  { backgroundColor: apiKey.trim() ? theme.primary : theme.backgroundSecondary }
                ]}
                onPress={handleSaveApiKey}
                disabled={!apiKey.trim()}
                testID="save-api-key"
              >
                <ThemedText style={[styles.saveButtonText, { color: apiKey.trim() ? "#FFFFFF" : theme.textSecondary }]}>
                  {t("save")}
                </ThemedText>
              </Pressable>
              {providerKeysStatus[selectedProvider] ? (
                <View style={[styles.keyStatusRow, isRTL && styles.rtl]}>
                  <Feather name="shield" size={14} color={theme.success} />
                  <ThemedText style={[styles.keyStatusText, { color: theme.success }]}>
                    {t("apiKeySecured")}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </KeyboardAwareScrollViewCompat>

      <Modal
        visible={showProviderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProviderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
                {t("selectProvider")}
              </ThemedText>
              <Pressable
                style={[styles.modalCloseButton, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => setShowProviderModal(false)}
                testID="close-modal"
              >
                <Feather name="x" size={20} color={theme.text} />
              </Pressable>
            </View>
            <FlatList
              data={AI_PROVIDERS}
              keyExtractor={(item) => item}
              renderItem={renderProviderItem}
              contentContainerStyle={styles.providerList}
              showsVerticalScrollIndicator={false}
            />
            <View style={[styles.modalFooter, { borderTopColor: theme.border, paddingBottom: insets.bottom + Spacing.md }]}>
              <Pressable
                style={[styles.doneButton, { backgroundColor: theme.primary }]}
                onPress={() => setShowProviderModal(false)}
                testID="done-button"
              >
                <ThemedText style={styles.doneButtonText}>{t("done")}</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  rtlText: {
    textAlign: "right",
  },
  rtl: {
    flexDirection: "row-reverse",
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  colorOption: {
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    minWidth: 70,
  },
  colorOptionSelected: {
    borderWidth: 2,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  colorLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  keysCountCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  keysCountText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  providerSelector: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  providerSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  providerSelectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  providerSelectorText: {
    fontSize: 15,
    fontWeight: "500",
  },
  providerSelectorPlaceholder: {
    fontSize: 15,
  },
  configuredBadgeSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  apiKeySection: {
    marginTop: Spacing.lg,
  },
  apiKeyInputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  apiKeyInput: {
    flex: 1,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: 14,
  },
  eyeButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  keyStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  keyStatusText: {
    fontSize: 12,
    fontWeight: "500",
  },
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
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  providerList: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  providerItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  providerItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  providerItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  providerItemName: {
    fontSize: 15,
    fontWeight: "500",
  },
  configuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    gap: 4,
  },
  configuredText: {
    fontSize: 11,
    fontWeight: "500",
  },
  modalFooter: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  doneButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
