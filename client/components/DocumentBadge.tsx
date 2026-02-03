import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { ThemedText } from "./ThemedText";
import { useLanguage } from "@/contexts/LanguageContext";
import * as haptics from "@/utils/haptics";

interface DocumentBadgeProps {
  fileName: string;
  onRemove: () => void;
  disabled?: boolean;
}

export function DocumentBadge({ fileName, onRemove, disabled = false }: DocumentBadgeProps) {
  const { isRTL } = useLanguage();
  const displayName = fileName.length > 25 
    ? fileName.substring(0, 22) + "..." 
    : fileName;

  const getFileIcon = (name: string): keyof typeof Feather.glyphMap => {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'file-text';
      case 'doc':
      case 'docx':
        return 'file';
      case 'txt':
      case 'md':
        return 'file-text';
      default:
        return 'paperclip';
    }
  };

  const handleRemove = () => {
    haptics.lightTap();
    onRemove();
  };

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]} testID="badge-document">
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <LinearGradient
          colors={["rgba(95, 44, 130, 0.4)", "rgba(73, 160, 157, 0.3)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, isRTL && styles.gradientRTL]}
        >
          <Feather name={getFileIcon(fileName)} size={16} color="#FFFFFF" />
          <ThemedText style={styles.fileName} numberOfLines={1}>
            {displayName}
          </ThemedText>
          {!disabled ? (
            <Pressable 
              onPress={handleRemove} 
              hitSlop={10}
              style={({ pressed }) => [
                styles.removeButton,
                pressed && styles.removeButtonPressed,
              ]}
              testID="button-remove-document"
            >
              <Feather name="x" size={14} color="rgba(255,255,255,0.7)" />
            </Pressable>
          ) : null}
        </LinearGradient>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: "hidden",
    alignSelf: "flex-start",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#5f2c82",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  containerRTL: {
    alignSelf: "flex-end",
  },
  blurContainer: {
    borderRadius: 20,
    overflow: "hidden",
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  gradientRTL: {
    flexDirection: "row-reverse",
  },
  fileName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
    maxWidth: 180,
  },
  removeButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    marginLeft: 4,
  },
  removeButtonPressed: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
});
