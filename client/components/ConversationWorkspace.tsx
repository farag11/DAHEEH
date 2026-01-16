import React, { useRef, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Animated,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as haptics from "@/utils/haptics";

import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { KeyboardAwareScrollViewCompat } from "./KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface Message {
  id: string;
  type: "user" | "assistant" | "loading" | "error";
  content: string;
  timestamp?: Date;
}

export function cleanMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/__([^_\n]+)__/g, '$1')
    .replace(/^[-*]\s+/gm, '• ')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```\w*\n?/g, '').trim())
    .replace(/^\s*>\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

interface ConversationWorkspaceProps {
  messages: Message[];
  scrollViewRef?: React.RefObject<ScrollView | null>;
  contentContainerStyle?: object;
  children?: React.ReactNode;
}

function MessageBubble({ message }: { message: Message }) {
  const { theme } = useTheme();
  const { isRTL } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isUser = message.type === "user";
  const isLoading = message.type === "loading";
  const isError = message.type === "error";

  const userAlign = isRTL ? "flex-start" as const : "flex-end" as const;
  const assistantAlign = isRTL ? "flex-end" as const : "flex-start" as const;

  const bubbleStyle = isUser
    ? { backgroundColor: theme.primary, alignSelf: userAlign }
    : isError
    ? { backgroundColor: theme.error + "20", alignSelf: assistantAlign }
    : { backgroundColor: theme.cardBackground, alignSelf: assistantAlign };

  const textColor = isUser ? "#FFFFFF" : isError ? theme.error : theme.text;

  return (
    <Animated.View
      style={[
        styles.messageBubble,
        bubbleStyle,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <LoadingDots color={theme.textSecondary} />
        </View>
      ) : (
        <>
          {isError ? (
            <View style={[styles.errorHeader, isRTL && styles.rtl]}>
              <Feather name="alert-circle" size={16} color={theme.error} />
            </View>
          ) : null}
          <ThemedText
            style={[
              styles.messageText,
              { color: textColor },
              isRTL && styles.rtlText,
            ]}
          >
            {isUser ? message.content : cleanMarkdown(message.content)}
          </ThemedText>
        </>
      )}
    </Animated.View>
  );
}

function LoadingDots({ color }: { color: string }) {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animations = [
      animateDot(dot1Anim, 0),
      animateDot(dot2Anim, 150),
      animateDot(dot3Anim, 300),
    ];

    animations.forEach(anim => anim.start());

    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, []);

  return (
    <View style={styles.dotsContainer}>
      {[dot1Anim, dot2Anim, dot3Anim].map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            { backgroundColor: color },
            {
              transform: [
                {
                  scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.3],
                  }),
                },
              ],
              opacity: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 1],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

export function ConversationWorkspace({
  messages,
  scrollViewRef,
  contentContainerStyle,
  children,
}: ConversationWorkspaceProps) {
  const internalRef = useRef<ScrollView>(null);
  const ref = scrollViewRef || internalRef;
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        ref.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  if (messages.length === 0) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollViewCompat
        ref={ref}
        style={styles.scrollView}
        contentContainerStyle={[styles.messagesContainer, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {children}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

interface QuickAction {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}

interface FollowUpInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
  style?: object;
  onCameraPress?: () => void;
  onGalleryPress?: () => void;
  onFilePress?: () => void;
  showAttachments?: boolean;
  quickActions?: QuickAction[];
  attachedFileName?: string | null;
  onRemoveFile?: () => void;
}

export function FollowUpInput({
  onSend,
  isLoading,
  placeholder,
  style,
  onCameraPress,
  onGalleryPress,
  onFilePress,
  showAttachments = false,
  quickActions,
  attachedFileName,
  onRemoveFile,
}: FollowUpInputProps) {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const [text, setText] = useState("");

  const handleSend = () => {
    if (text.trim() && !isLoading) {
      haptics.lightTap();
      onSend(text.trim());
      setText("");
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    haptics.lightTap();
    action.onPress();
  };

  const hasText = text.trim().length > 0;
  const canSend = hasText && !isLoading;

  return (
    <View style={[styles.followUpContainer, style]}>
      {attachedFileName ? (
        <View style={[styles.fileBadgeRow, isRTL && styles.fileBadgeRowRTL]}>
          <View style={styles.fileBadge}>
            <Feather name="file-text" size={14} color="#FFFFFF" />
            <ThemedText style={styles.fileBadgeText} numberOfLines={1}>
              {attachedFileName.length > 20 
                ? attachedFileName.substring(0, 17) + "..." 
                : attachedFileName}
            </ThemedText>
            {onRemoveFile ? (
              <Pressable onPress={onRemoveFile} hitSlop={8}>
                <Feather name="x" size={14} color="rgba(255,255,255,0.6)" />
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {quickActions && quickActions.length > 0 ? (
        <View style={[styles.quickActionsRow, isRTL && styles.rtl]}>
          {quickActions.map((action) => (
            <Pressable
              key={action.id}
              style={({ pressed }) => [
                styles.quickActionButton,
                { backgroundColor: action.color + "15", opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => handleQuickAction(action)}
              disabled={isLoading}
            >
              <Feather name={action.icon} size={14} color={action.color} />
              <ThemedText style={[styles.quickActionText, { color: action.color }]}>
                {action.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      ) : null}
      
      <View style={styles.glassCapsule}>
        <BlurView intensity={20} tint="dark" style={styles.capsuleBlur}>
          <View style={[styles.capsuleInner, isRTL && styles.capsuleInnerRTL]}>
            {showAttachments ? (
              <View style={[styles.capsuleTools, isRTL && styles.capsuleToolsRTL]}>
                {onCameraPress ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.capsuleIcon,
                      pressed && styles.capsuleIconPressed,
                    ]}
                    onPress={() => {
                      haptics.lightTap();
                      onCameraPress();
                    }}
                    disabled={isLoading}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather name="camera" size={20} color="#8E8E93" />
                  </Pressable>
                ) : null}
                {onGalleryPress ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.capsuleIcon,
                      pressed && styles.capsuleIconPressed,
                    ]}
                    onPress={() => {
                      haptics.lightTap();
                      onGalleryPress();
                    }}
                    disabled={isLoading}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather name="image" size={20} color="#8E8E93" />
                  </Pressable>
                ) : null}
                {onFilePress ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.capsuleIcon,
                      pressed && styles.capsuleIconPressed,
                    ]}
                    onPress={() => {
                      haptics.lightTap();
                      onFilePress();
                    }}
                    disabled={isLoading}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather name="paperclip" size={20} color="#8E8E93" />
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <TextInput
              style={[
                styles.capsuleTextInput,
                {
                  textAlign: isRTL ? "right" : "left",
                  fontFamily: isRTL ? "Cairo_600SemiBold" : "Poppins_400Regular",
                },
              ]}
              placeholder={placeholder || t("typeMessageHere") || "اكتب رسالتك هنا..."}
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={text}
              onChangeText={setText}
              editable={!isLoading}
              multiline
              maxLength={2000}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />

            <Pressable
              style={({ pressed }) => [
                styles.capsuleSendButton,
                { opacity: pressed && canSend ? 0.85 : 1 },
              ]}
              onPress={handleSend}
              disabled={!canSend}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {isLoading ? (
                <View style={styles.capsuleSendInner}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              ) : (
                <LinearGradient
                  colors={canSend ? ["#5f2c82", "#49a09d"] : ["rgba(60,60,70,0.5)", "rgba(50,50,60,0.5)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.capsuleSendGradient}
                >
                  <Feather
                    name="arrow-up"
                    size={20}
                    color={canSend ? "#FFFFFF" : "rgba(255,255,255,0.3)"}
                    style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
                  />
                </LinearGradient>
              )}
            </Pressable>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: Spacing.lg,
    gap: Spacing.xl,
  },
  messageBubble: {
    maxWidth: "88%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  messageText: {
    fontSize: 17,
    lineHeight: 26,
  },
  rtlText: {
    textAlign: "right",
  },
  rtl: {
    flexDirection: "row-reverse",
  },
  loadingContainer: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  errorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  followUpContainer: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  quickActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  quickActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  attachmentButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  attachmentButtonsRTL: {
    flexDirection: "row-reverse",
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  followUpInput: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  chatInputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    minHeight: 48,
  },
  leftAttachments: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingRight: Spacing.xs,
  },
  chatAttachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  chatTextInput: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Platform.OS === "ios" ? Spacing.sm : Spacing.xs,
    maxHeight: 100,
    minHeight: 36,
  },
  chatSendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.xs,
  },
  glassCapsule: {
    borderRadius: 40,
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
  capsuleBlur: {
    borderRadius: 40,
    overflow: "hidden",
  },
  capsuleInner: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 60,
  },
  capsuleInnerRTL: {
    flexDirection: "row-reverse",
  },
  capsuleTools: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 8,
  },
  capsuleToolsRTL: {
    paddingRight: 0,
    paddingLeft: 8,
    flexDirection: "row-reverse",
  },
  capsuleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.7,
  },
  capsuleIconPressed: {
    opacity: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  fileBadgeRow: {
    flexDirection: "row",
    paddingHorizontal: 4,
  },
  fileBadgeRowRTL: {
    flexDirection: "row-reverse",
  },
  fileBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(95, 44, 130, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  fileBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  capsuleTextInput: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    maxHeight: 100,
    minHeight: 40,
  },
  capsuleSendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    marginLeft: 8,
    shadowColor: "#5f2c82",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  capsuleSendGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  capsuleSendInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(95, 44, 130, 0.6)",
  },
});
