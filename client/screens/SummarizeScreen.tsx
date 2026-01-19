import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Pressable, TextInput, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@/components/Header";
import { useFloatingDockHeight } from "@/navigation/MainTabNavigator";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as haptics from "@/utils/haptics";
import * as Clipboard from "expo-clipboard";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ConversationWorkspace, Message, FollowUpInput, cleanMarkdown } from "@/components/ConversationWorkspace";
import { useToast } from "@/components/Toast";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useStudy } from "@/contexts/StudyContext";
import { useGamification } from "@/contexts/GamificationContext";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { summarizeText, hasApiKey, sendFollowUp, ConversationMessage } from "@/services/aiService";
import { useImageInput } from "@/hooks/useImageInput";
import { useDocumentInput } from "@/hooks/useDocumentInput";
import { ImageActionBar } from "@/components/ImageActionBar";
import { DocumentBadge } from "@/components/DocumentBadge";
import { ImagePreviewList } from "@/components/ImagePreviewList";
import { AddToCollectionModal } from "@/components/AddToCollectionModal";
import { ClipboardImageBadge } from "@/components/ClipboardImageBadge";
import { GlassPrimaryButton } from "@/components/GlassButton";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";

type Complexity = "simple" | "detailed" | "comprehensive";
type SummarizeScreenRouteProp = RouteProp<HomeStackParamList, "Summarize">;

const CHAT_HISTORY_KEY = "@chat_history_summarize";

export default function SummarizeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  const floatingDockHeight = useFloatingDockHeight();
  const navigation = useNavigation<any>();
  const route = useRoute<SummarizeScreenRouteProp>();
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const { authMode } = useAuth();
  const { addSummary, getSummaryById } = useStudy();
  const { awardXP } = useGamification();
  const toast = useToast();
  const scrollRef = useRef<ScrollView | null>(null);

  const isGuest = authMode === "guest";

  const [text, setText] = useState("");
  const [complexity, setComplexity] = useState<Complexity>("simple");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const [lastSummary, setLastSummary] = useState<string | null>(null);
  const [lastSummaryId, setLastSummaryId] = useState<string | null>(null);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const [originalContent, setOriginalContent] = useState<string | null>(null);
  const [showAddToCollection, setShowAddToCollection] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          const storedDate = new Date(data.timestamp);
          const now = new Date();
          const hoursDiff = (now.getTime() - storedDate.getTime()) / (1000 * 60 * 60);
          
          if (hoursDiff < 24 && data.messages && data.messages.length > 0) {
            const validMessages = data.messages.filter((m: Message) => m.type !== "loading");
            setMessages(validMessages);
            setOriginalContent(data.originalContent || null);
            setLastSummary(data.lastSummary || null);
            setLastSummaryId(data.lastSummaryId || null);
            setShowInput(validMessages.length === 0);
          }
        }
      } catch (error) {}
      setHistoryLoaded(true);
    };
    loadChatHistory();
  }, []);

  useEffect(() => {
    if (!historyLoaded) return;
    
    const saveChatHistory = async () => {
      try {
        const validMessages = messages.filter(m => m.type !== "loading");
        if (validMessages.length === 0) {
          await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
          return;
        }
        const data = {
          messages: validMessages,
          originalContent,
          lastSummary,
          lastSummaryId,
          timestamp: new Date().toISOString(),
        };
        await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(data));
      } catch (error) {}
    };
    saveChatHistory();
  }, [messages, originalContent, lastSummary, lastSummaryId, historyLoaded]);

  useEffect(() => {
    const sessionId = route.params?.sessionId;
    if (sessionId) {
      const summary = getSummaryById(sessionId);
      if (summary) {
        const previewText = summary.originalText.length > 100
          ? summary.originalText.substring(0, 100) + "..."
          : summary.originalText;
        
        setMessages([
          {
            id: `user_${sessionId}`,
            type: "user",
            content: previewText,
            timestamp: new Date(summary.createdAt),
          },
          {
            id: `assistant_${sessionId}`,
            type: "assistant",
            content: summary.summaryText,
            timestamp: new Date(summary.createdAt),
          },
        ]);
        setShowInput(false);
        setLastSummary(summary.summaryText);
        setLastSummaryId(sessionId);
        navigation.setParams({ sessionId: undefined });
      } else {
        toast.show(t("sessionNotFound") || "Session not found", "error");
        setMessages([]);
        setShowInput(true);
        setLastSummary(null);
        setLastSummaryId(null);
        setText("");
        navigation.setParams({ sessionId: undefined });
      }
    }
  }, [route.params?.sessionId]);

  const {
    images,
    isLoading: isImageLoading,
    takePhoto,
    pickFromGallery,
    pasteFromClipboard,
    removeImage,
    clearImages,
    maxImages,
    getBase64Images,
    hasClipboardImage,
    checkClipboardForImage,
    pasteDetectedImage,
  } = useImageInput();

  const {
    document: attachedDocument,
    pickDocument,
    removeDocument,
    clearDocument,
    getDocumentText,
  } = useDocumentInput();

  const handlePasteImage = async () => {
    haptics.lightTap();
    const success = await pasteFromClipboard();
    if (success) {
      toast.show(t("imagePasted"), "success");
    } else {
      toast.show(t("noImageInClipboard"), "error");
    }
  };

  const complexityOptions: { key: Complexity; label: string }[] = [
    { key: "simple", label: t("simple") },
    { key: "detailed", label: t("detailed") },
    { key: "comprehensive", label: t("comprehensive") },
  ];

  const handleGenerate = async () => {
    const hasImages = images.length > 0;
    const hasText = text.trim().length > 0;
    const hasDocument = !!attachedDocument;
    const documentText = getDocumentText();

    if (!hasText && !hasImages && !hasDocument) {
      toast.show(t("provideStudyText"), "error");
      return;
    }

    const hasKey = await hasApiKey();
    if (!hasKey) {
      toast.show(t("enterApiKey"), "error");
      return;
    }

    const userText = text.trim();
    const userMessageId = Date.now().toString();
    
    setMessages(prev => [...prev, {
      id: userMessageId,
      type: "user",
      content: userText || `[${images.length} ${t("images")}]`,
      timestamp: new Date(),
    }]);
    
    setShowInput(false);
    setIsLoading(true);
    haptics.mediumTap();

    const loadingId = Date.now().toString() + "_loading";
    setMessages(prev => [...prev, {
      id: loadingId,
      type: "loading",
      content: "",
    }]);

    try {
      let combinedText = userText;
      const base64Images = hasImages ? getBase64Images() : undefined;

      if (hasImages) {
        setIsExtractingText(true);
      }

      if (documentText && documentText.trim()) {
        if (combinedText) {
          combinedText = combinedText + "\n\n" + documentText;
        } else {
          combinedText = documentText;
        }
      }

      if (!combinedText.trim() && !hasImages) {
        setMessages(prev => prev.filter(m => m.id !== loadingId));
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: "error",
          content: t("noTextExtracted"),
        }]);
        setIsLoading(false);
        setIsExtractingText(false);
        setShowInput(true);
        return;
      }

      const rawSummary = await summarizeText(combinedText || "", complexity, base64Images);
      setIsExtractingText(false);
      const summary = cleanMarkdown(rawSummary);
      
      setMessages(prev => prev.filter(m => m.id !== loadingId));
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: "assistant",
        content: summary,
        timestamp: new Date(),
      }]);

      setLastSummary(summary);
      setOriginalContent(combinedText);

      const summaryId = Date.now().toString();
      setLastSummaryId(summaryId);
      addSummary({
        id: summaryId,
        title: combinedText.substring(0, 50) + (combinedText.length > 50 ? "..." : ""),
        originalText: combinedText,
        summaryText: summary,
        complexity,
        createdAt: new Date().toISOString(),
      });

      awardXP("summary");

      clearImages();
      clearDocument();
      setText("");
      haptics.success();
    } catch (error: any) {
      setMessages(prev => prev.filter(m => m.id !== loadingId));
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: "error",
        content: error.message || t("tryAgain"),
      }]);
      setShowInput(true);
      haptics.error();
    } finally {
      setIsLoading(false);
      setIsExtractingText(false);
    }
  };

  const handleCopy = async () => {
    if (lastSummary) {
      await Clipboard.setStringAsync(lastSummary);
      haptics.success();
      toast.show(t("copied"), "success");
    }
  };

  const handleNewSummary = async () => {
    setMessages([]);
    setShowInput(true);
    setLastSummary(null);
    setLastSummaryId(null);
    setText("");
    setOriginalContent(null);
    setIsFollowUpLoading(false);
    clearDocument();
    clearImages();
    try {
      await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
    } catch (error) {}
  };

  const handleAddToCollection = () => {
    if (lastSummaryId) {
      setShowAddToCollection(true);
    }
  };

  const handleFollowUp = async (question: string) => {
    if (!question.trim()) return;

    const userMessageId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: userMessageId,
      type: "user",
      content: question,
      timestamp: new Date(),
    }]);

    setIsFollowUpLoading(true);
    haptics.lightTap();

    const loadingId = Date.now().toString() + "_loading";
    setMessages(prev => [...prev, {
      id: loadingId,
      type: "loading",
      content: "",
    }]);

    try {
      const conversationMessages: ConversationMessage[] = messages
        .filter(m => m.type === "user" || m.type === "assistant")
        .map(m => ({ type: m.type as "user" | "assistant", content: m.content }));
      
      conversationMessages.push({ type: "user", content: question });

      const contextInfo = originalContent 
        ? `The user was given a summary of the following content: "${originalContent.substring(0, 500)}${originalContent.length > 500 ? "..." : ""}"` 
        : undefined;

      const rawResponse = await sendFollowUp(conversationMessages, contextInfo);
      const response = cleanMarkdown(rawResponse);

      setMessages(prev => prev.filter(m => m.id !== loadingId));
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: "assistant",
        content: response,
        timestamp: new Date(),
      }]);

      haptics.success();
    } catch (error: any) {
      setMessages(prev => prev.filter(m => m.id !== loadingId));
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: "error",
        content: error.message || t("tryAgain"),
      }]);
      haptics.error();
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  const handleCreateQuiz = () => {
    navigation.navigate("Quiz");
  };

  const handleTestMe = () => {
    if (lastSummary) {
      navigation.navigate("Quiz", { sourceText: lastSummary });
    } else if (originalContent) {
      navigation.navigate("Quiz", { sourceText: originalContent });
    } else if (text.trim()) {
      navigation.navigate("Quiz", { sourceText: text.trim() });
    } else {
      navigation.navigate("Quiz");
    }
  };

  const handleTestMeWithContent = (content: string) => {
    navigation.navigate("Quiz", { sourceText: content });
  };

  const isProcessing = isLoading || isImageLoading;

  const showConversation = !showInput && messages.length > 0;
  const FOLLOW_UP_INPUT_HEIGHT = 80;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {showConversation ? (
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={headerHeight}
        >
          <View style={styles.conversationContainer}>
            <ConversationWorkspace
              messages={messages}
              scrollViewRef={scrollRef}
              contentContainerStyle={{
                paddingTop: headerHeight + Spacing.lg,
                paddingBottom: FOLLOW_UP_INPUT_HEIGHT + Spacing.lg,
                paddingHorizontal: Spacing.lg,
              }}
              onTestMe={handleTestMeWithContent}
            >
              {!isLoading && lastSummary ? (
                <View style={styles.actionsContainer}>
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: theme.cardBackground }]}
                    onPress={handleCopy}
                  >
                    <Feather name="copy" size={18} color={theme.primary} />
                    <ThemedText style={[styles.actionText, { color: theme.primary }]}>
                      {t("copy")}
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: theme.primary }]}
                    onPress={handleTestMe}
                  >
                    <Feather name="edit-3" size={18} color="#FFFFFF" />
                    <ThemedText style={[styles.actionText, { color: "#FFFFFF" }]}>
                      {t("testMe")}
                    </ThemedText>
                  </Pressable>
                  {lastSummaryId ? (
                    <Pressable
                      style={[styles.actionButton, { backgroundColor: theme.cardBackground }]}
                      onPress={handleAddToCollection}
                    >
                      <Feather name="folder-plus" size={18} color={theme.warning} />
                      <ThemedText style={[styles.actionText, { color: theme.warning }]}>
                        {t("collection")}
                      </ThemedText>
                    </Pressable>
                  ) : null}
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: theme.cardBackground }]}
                    onPress={handleNewSummary}
                  >
                    <Feather name="plus" size={18} color={theme.success} />
                    <ThemedText style={[styles.actionText, { color: theme.success }]}>
                      {t("newSummary")}
                    </ThemedText>
                  </Pressable>
                </View>
              ) : null}
            </ConversationWorkspace>
          </View>
          <View 
            style={[
              styles.followUpInputWrapper, 
              { 
                backgroundColor: "transparent",
                paddingBottom: insets.bottom + Spacing.md,
              }
            ]}
          >
            <FollowUpInput
              onSend={handleFollowUp}
              isLoading={isFollowUpLoading}
              placeholder={t("askFollowUp") || "Ask a follow-up question..."}
              showAttachments={true}
              onCameraPress={takePhoto}
              onGalleryPress={pickFromGallery}
              onFilePress={pickDocument}
              attachedFileName={attachedDocument?.name}
              onRemoveFile={removeDocument}
            />
          </View>
        </KeyboardAvoidingView>
      ) : null}

      {showInput ? (
        <KeyboardAwareScrollViewCompat
          style={[styles.inputContainer, { backgroundColor: theme.backgroundRoot }]}
          contentContainerStyle={{
            paddingTop: messages.length > 0 ? Spacing.lg : headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
            paddingHorizontal: Spacing.lg,
          }}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
        >
          <Animated.View entering={FadeIn.delay(100).duration(300)}>
            <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
              <ThemedText style={[styles.label, isRTL && styles.rtlText]}>{t("complexity")}</ThemedText>
              <View style={[styles.chipsContainer, isRTL && styles.rtl]}>
                {complexityOptions.map((option) => (
                  <Pressable
                    key={option.key}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          complexity === option.key ? theme.primary : theme.backgroundSecondary,
                      },
                    ]}
                    onPress={() => {
                      setComplexity(option.key);
                      haptics.selection();
                    }}
                  >
                    <ThemedText
                      style={[styles.chipText, { color: complexity === option.key ? "#FFFFFF" : theme.text }]}
                    >
                      {option.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(150).duration(300)}>
            <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
              <View style={[styles.labelRow, isRTL && styles.rtl]}>
                <ThemedText style={styles.label}>{t("enterText")}</ThemedText>
                <ThemedText style={[styles.charCount, { color: theme.textSecondary }]}>
                  {text.length}/5000 {t("characters")}
                </ThemedText>
              </View>
            <View style={styles.textInputWrapper}>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.inputBackground,
                    color: theme.text,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
                placeholder={t("enterText")}
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={8}
                maxLength={5000}
                value={text}
                onChangeText={setText}
                textAlignVertical="top"
                onFocus={checkClipboardForImage}
              />
              <ClipboardImageBadge
                visible={hasClipboardImage && !isGuest}
                onPress={async () => {
                  const success = await pasteDetectedImage();
                  if (success) {
                    toast.show(t("imagePasted"), "success");
                  }
                }}
                isLoading={isImageLoading}
              />
            </View>

            <View style={styles.imageSection}>
              {isGuest ? (
                <ThemedText
                  style={[
                    styles.guestNote,
                    { color: theme.textSecondary },
                    isRTL && styles.rtlText,
                  ]}
                >
                  {t("guestModeNote")}
                </ThemedText>
              ) : null}
              <ImageActionBar
                onCameraPress={takePhoto}
                onGalleryPress={pickFromGallery}
                onFilePress={pickDocument}
                disabled={isProcessing}
                isLoading={isImageLoading}
              />
              {attachedDocument ? (
                <DocumentBadge
                  fileName={attachedDocument.name}
                  onRemove={removeDocument}
                  disabled={isProcessing}
                />
              ) : null}
              <ImagePreviewList
                images={images}
                onRemove={removeImage}
                maxImages={maxImages}
                isScanning={isExtractingText}
                scanningText={t("analyzing")}
              />
            </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(200).duration(300)}>
              <GlassPrimaryButton
              title={isExtractingText ? t("extractingText") : t("generateSummary")}
              onPress={handleGenerate}
              icon="zap"
              disabled={isProcessing}
              isLoading={isProcessing}
            />
          </Animated.View>
        </KeyboardAwareScrollViewCompat>
      ) : null}

      {lastSummaryId ? (
        <AddToCollectionModal
          visible={showAddToCollection}
          onClose={() => setShowAddToCollection(false)}
          itemId={lastSummaryId}
          itemType="summary"
          onSuccess={() => toast.show(t("itemAdded"), "success")}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputContainer: {
    flex: 1,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  rtlText: {
    textAlign: "right",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  rtl: {
    flexDirection: "row-reverse",
  },
  charCount: {
    fontSize: 12,
  },
  chipsContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  textInputWrapper: {
    position: "relative",
  },
  textInput: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    minHeight: 200,
    fontSize: 16,
  },
  imageSection: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  guestNote: {
    fontSize: 13,
    fontWeight: "400",
    marginBottom: Spacing.sm,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  conversationContainer: {
    flex: 1,
  },
  followUpInputWrapper: {
    paddingTop: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
});
