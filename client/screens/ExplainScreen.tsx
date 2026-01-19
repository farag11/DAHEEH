import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Pressable, TextInput, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { useStudy } from "@/contexts/StudyContext";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { explainConcept, hasApiKey, sendFollowUp, ConversationMessage } from "@/services/aiService";
import { useImageInput } from "@/hooks/useImageInput";
import { useDocumentInput } from "@/hooks/useDocumentInput";
import { ImageActionBar } from "@/components/ImageActionBar";
import { DocumentBadge } from "@/components/DocumentBadge";
import { ImagePreviewList } from "@/components/ImagePreviewList";
import { AddToCollectionModal } from "@/components/AddToCollectionModal";
import { ClipboardImageBadge } from "@/components/ClipboardImageBadge";
import { GlassPrimaryButton } from "@/components/GlassButton";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";

type Level = "beginner" | "intermediate" | "advanced";
type ExplainScreenRouteProp = RouteProp<HomeStackParamList, "Explain">;

export default function ExplainScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  const floatingDockHeight = useFloatingDockHeight();
  const navigation = useNavigation<any>();
  const route = useRoute<ExplainScreenRouteProp>();
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const { addExplanation, getExplanationById } = useStudy();
  const toast = useToast();
  const scrollRef = useRef<ScrollView | null>(null);

  const [concept, setConcept] = useState("");
  const [level, setLevel] = useState<Level>("beginner");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const [lastExplanation, setLastExplanation] = useState<string | null>(null);
  const [lastExplanationId, setLastExplanationId] = useState<string | null>(null);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const [originalContent, setOriginalContent] = useState<string | null>(null);
  const [showAddToCollection, setShowAddToCollection] = useState(false);

  useEffect(() => {
    const sessionId = route.params?.sessionId;
    if (sessionId) {
      const explanation = getExplanationById(sessionId);
      if (explanation) {
        setMessages([
          {
            id: `user_${sessionId}`,
            type: "user",
            content: explanation.concept,
            timestamp: new Date(explanation.createdAt),
          },
          {
            id: `assistant_${sessionId}`,
            type: "assistant",
            content: explanation.explanation,
            timestamp: new Date(explanation.createdAt),
          },
        ]);
        setShowInput(false);
        setLastExplanation(explanation.explanation);
        setLastExplanationId(sessionId);
        navigation.setParams({ sessionId: undefined });
      } else {
        toast.show(t("sessionNotFound") || "Session not found", "error");
        setMessages([]);
        setShowInput(true);
        setLastExplanation(null);
        setLastExplanationId(null);
        setConcept("");
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

  const levelOptions: { key: Level; label: string; icon: string }[] = [
    { key: "beginner", label: t("beginner"), icon: "star" },
    { key: "intermediate", label: t("intermediate"), icon: "trending-up" },
    { key: "advanced", label: t("advanced"), icon: "award" },
  ];

  const handlePasteImage = async () => {
    haptics.lightTap();
    const success = await pasteFromClipboard();
    if (success) {
      toast.show(t("imagePasted"), "success");
    } else {
      toast.show(t("noImageInClipboard"), "error");
    }
  };

  const handleGenerate = async () => {
    const hasImages = images.length > 0;
    const hasText = concept.trim().length > 0;
    const hasDocument = !!attachedDocument;
    const documentText = getDocumentText();

    if (!hasImages && !hasText && !hasDocument) {
      toast.show(t("provideStudyText"), "error");
      return;
    }

    const hasKey = await hasApiKey();
    if (!hasKey) {
      toast.show(t("enterApiKey"), "error");
      return;
    }

    const userText = concept.trim();
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
      let combinedConcept = userText;
      const base64Images = hasImages ? getBase64Images() : undefined;

      if (hasImages) {
        setIsProcessingOCR(true);
      }

      if (documentText && documentText.trim()) {
        if (combinedConcept) {
          combinedConcept = `${combinedConcept}\n\n${documentText}`;
        } else {
          combinedConcept = documentText;
        }
      }

      if (!combinedConcept && !hasImages) {
        setMessages(prev => prev.filter(m => m.id !== loadingId));
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: "error",
          content: t("noTextExtracted"),
        }]);
        setIsLoading(false);
        setIsProcessingOCR(false);
        setShowInput(true);
        return;
      }

      const rawExplanation = await explainConcept(combinedConcept || "", level, base64Images);
      setIsProcessingOCR(false);
      const explanation = cleanMarkdown(rawExplanation);

      setMessages(prev => prev.filter(m => m.id !== loadingId));
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: "assistant",
        content: explanation,
        timestamp: new Date(),
      }]);

      setLastExplanation(explanation);
      setOriginalContent(combinedConcept);

      const explanationId = Date.now().toString();
      setLastExplanationId(explanationId);
      addExplanation({
        id: explanationId,
        concept: combinedConcept,
        explanation,
        level,
        createdAt: new Date().toISOString(),
      });

      clearImages();
      clearDocument();
      setConcept("");
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
      setIsProcessingOCR(false);
    }
  };

  const handleCopy = async () => {
    if (lastExplanation) {
      await Clipboard.setStringAsync(lastExplanation);
      haptics.success();
      toast.show(t("copied"), "success");
    }
  };

  const handleNewExplanation = () => {
    setMessages([]);
    setShowInput(true);
    setLastExplanation(null);
    setLastExplanationId(null);
    setConcept("");
    setOriginalContent(null);
    setIsFollowUpLoading(false);
    clearDocument();
    clearImages();
  };

  const handleAddToCollection = () => {
    if (lastExplanationId) {
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
        ? `The user was given an explanation of the following concept: "${originalContent.substring(0, 500)}${originalContent.length > 500 ? "..." : ""}"` 
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

  const handleSummarize = () => {
    navigation.navigate("Summarize");
  };

  const handleTestMe = () => {
    if (lastExplanation) {
      navigation.navigate("Quiz", { sourceText: lastExplanation });
    } else if (originalContent) {
      navigation.navigate("Quiz", { sourceText: originalContent });
    } else if (concept.trim()) {
      navigation.navigate("Quiz", { sourceText: concept.trim() });
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
              {!isLoading && lastExplanation ? (
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
                  {lastExplanationId ? (
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
                    onPress={handleNewExplanation}
                  >
                    <Feather name="plus" size={18} color={theme.success} />
                    <ThemedText style={[styles.actionText, { color: theme.success }]}>
                      {t("newExplanation")}
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
          <Animated.View entering={FadeInDown.delay(100).springify().damping(12).mass(0.8)}>
            <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
              <ThemedText style={[styles.label, isRTL && styles.rtlText]}>{t("concept")}</ThemedText>
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
                  placeholder={t("enterConcept")}
                  placeholderTextColor={theme.textSecondary}
                  value={concept}
                  onChangeText={setConcept}
                  onFocus={checkClipboardForImage}
                />
                <ClipboardImageBadge
                  visible={hasClipboardImage}
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
                  isScanning={isProcessingOCR}
                  scanningText={t("analyzing")}
                />
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify().damping(12).mass(0.8)}>
            <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
              <ThemedText style={[styles.label, isRTL && styles.rtlText]}>{t("audienceLevel")}</ThemedText>
              <View style={styles.levelContainer}>
                {levelOptions.map((option) => (
                  <Pressable
                    key={option.key}
                    style={[
                      styles.levelOption,
                      {
                        backgroundColor:
                          level === option.key ? theme.primary : theme.backgroundSecondary,
                        borderColor: level === option.key ? theme.primary : "transparent",
                      },
                    ]}
                    onPress={() => {
                      setLevel(option.key);
                      haptics.selection();
                    }}
                  >
                    <Feather
                      name={option.icon as any}
                      size={24}
                      color={level === option.key ? "#FFFFFF" : theme.text}
                    />
                    <ThemedText
                      style={[styles.levelText, { color: level === option.key ? "#FFFFFF" : theme.text }]}
                    >
                      {option.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).springify().damping(12).mass(0.8)}>
            <GlassPrimaryButton
              title={isProcessingOCR ? t("extractingText") : t("getExplanation")}
              onPress={handleGenerate}
              icon="book-open"
              disabled={isProcessing}
              isLoading={isProcessing}
            />
          </Animated.View>
        </KeyboardAwareScrollViewCompat>
      ) : null}

      {lastExplanationId ? (
        <AddToCollectionModal
          visible={showAddToCollection}
          onClose={() => setShowAddToCollection(false)}
          itemId={lastExplanationId}
          itemType="explanation"
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
  rtl: {
    flexDirection: "row-reverse",
  },
  textInputWrapper: {
    position: "relative",
  },
  textInput: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    fontSize: 16,
  },
  imageSection: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  levelContainer: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  levelOption: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  levelText: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
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
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
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
