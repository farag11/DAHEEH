import React, { useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as haptics from "@/utils/haptics";
import { useLanguage } from "@/contexts/LanguageContext";
import { ThemedText } from "./ThemedText";

interface AttachedFile {
  name: string;
  uri: string;
  type?: string;
}

interface GlassInputBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onSend: (text: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  onCameraPress?: () => void;
  onGalleryPress?: () => void;
  onFilePress?: () => void;
  showAttachments?: boolean;
  attachedFile?: AttachedFile | null;
  onRemoveFile?: () => void;
  sendIcon?: keyof typeof Feather.glyphMap;
  multiline?: boolean;
  maxLength?: number;
  style?: object;
}

export function GlassInputBar({
  value: externalValue,
  onChangeText: externalOnChangeText,
  onSend,
  placeholder,
  isLoading = false,
  disabled = false,
  onCameraPress,
  onGalleryPress,
  onFilePress,
  showAttachments = true,
  attachedFile,
  onRemoveFile,
  sendIcon = "arrow-up",
  multiline = true,
  maxLength = 2000,
  style,
}: GlassInputBarProps) {
  const { t, isRTL } = useLanguage();
  const [internalText, setInternalText] = useState("");

  const text = externalValue !== undefined ? externalValue : internalText;
  const setText = externalOnChangeText || setInternalText;

  const handleSend = () => {
    if (text.trim() && !isLoading && !disabled) {
      haptics.lightTap();
      onSend(text.trim());
      if (!externalOnChangeText) {
        setInternalText("");
      }
    }
  };

  const hasText = text.trim().length > 0;
  const canSend = hasText && !isLoading && !disabled;

  return (
    <View style={[styles.container, style]}>
      {attachedFile ? (
        <View style={styles.fileBadgeContainer}>
          <View style={styles.fileBadge}>
            <Feather name="file-text" size={14} color="#FFFFFF" />
            <ThemedText style={styles.fileBadgeText} numberOfLines={1}>
              {attachedFile.name.length > 20 
                ? attachedFile.name.substring(0, 17) + "..." 
                : attachedFile.name}
            </ThemedText>
            {onRemoveFile ? (
              <Pressable onPress={onRemoveFile} hitSlop={8}>
                <Feather name="x" size={14} color="rgba(255,255,255,0.6)" />
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      <View style={styles.capsuleOuter}>
        <BlurView intensity={25} tint="dark" style={styles.capsuleBlur}>
          <View style={[styles.capsuleInner, isRTL && styles.capsuleInnerRTL]}>
            {showAttachments ? (
              <View style={[styles.toolsContainer, isRTL && styles.toolsContainerRTL]}>
                {onCameraPress ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.toolIcon,
                      { opacity: pressed ? 1 : 0.7 },
                    ]}
                    onPress={() => {
                      haptics.lightTap();
                      onCameraPress();
                    }}
                    disabled={isLoading || disabled}
                    hitSlop={12}
                  >
                    <Feather 
                      name="camera" 
                      size={20} 
                      color="#8E8E93"
                    />
                  </Pressable>
                ) : null}
                {onGalleryPress ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.toolIcon,
                      { opacity: pressed ? 1 : 0.7 },
                    ]}
                    onPress={() => {
                      haptics.lightTap();
                      onGalleryPress();
                    }}
                    disabled={isLoading || disabled}
                    hitSlop={12}
                  >
                    <Feather 
                      name="image" 
                      size={20} 
                      color="#8E8E93"
                    />
                  </Pressable>
                ) : null}
                {onFilePress ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.toolIcon,
                      { opacity: pressed ? 1 : 0.7 },
                    ]}
                    onPress={() => {
                      haptics.lightTap();
                      onFilePress();
                    }}
                    disabled={isLoading || disabled}
                    hitSlop={12}
                  >
                    <Feather 
                      name="paperclip" 
                      size={20} 
                      color="#8E8E93"
                    />
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <TextInput
              style={[
                styles.textInput,
                { 
                  textAlign: isRTL ? "right" : "left",
                  fontFamily: isRTL ? "Cairo_700Bold" : undefined,
                },
              ]}
              placeholder={placeholder || "Ask follow-up..."}
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={text}
              onChangeText={setText}
              editable={!isLoading && !disabled}
              multiline={multiline}
              maxLength={maxLength}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />

            <Pressable
              style={({ pressed }) => [
                styles.sendButton,
                { opacity: pressed && canSend ? 0.85 : 1 },
              ]}
              onPress={handleSend}
              disabled={!canSend}
              hitSlop={8}
            >
              {isLoading ? (
                <View style={styles.sendButtonInner}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              ) : (
                <LinearGradient
                  colors={canSend 
                    ? ["#5f2c82", "#49a09d"] 
                    : ["rgba(60,60,70,0.5)", "rgba(50,50,60,0.5)"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sendButtonGradient}
                >
                  <Feather
                    name={sendIcon}
                    size={20}
                    color={canSend ? "#FFFFFF" : "rgba(255,255,255,0.3)"}
                    style={isRTL && sendIcon === "arrow-up" ? { transform: [{ scaleX: -1 }] } : undefined}
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
    gap: 8,
  },
  fileBadgeContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
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
  capsuleOuter: {
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
    alignItems: "center",
    paddingHorizontal: 14,
    height: 60,
  },
  capsuleInnerRTL: {
    flexDirection: "row-reverse",
  },
  toolsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingRight: 8,
  },
  toolsContainerRTL: {
    paddingRight: 0,
    paddingLeft: 8,
    flexDirection: "row-reverse",
  },
  toolIcon: {
    width: 40,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  sendButton: {
    width: 44,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#5f2c82",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  sendButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(95, 44, 130, 0.6)",
  },
});
