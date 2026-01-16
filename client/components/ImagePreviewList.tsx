import React from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface ImagePreviewListProps {
  images: string[];
  onRemove: (index: number) => void;
  maxImages?: number;
  isScanning?: boolean;
  scanningText?: string;
}

export function ImagePreviewList({
  images,
  onRemove,
  maxImages = 5,
  isScanning = false,
  scanningText = "Scanning...",
}: ImagePreviewListProps) {
  const { theme } = useTheme();

  if (images.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ThemedText type="small" style={styles.countText}>
        {images.length}/{maxImages} images
      </ThemedText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {images.map((uri, index) => (
          <View key={`${uri}-${index}`} style={styles.imageWrapper}>
            <Image source={{ uri }} style={styles.image} />
            
            {isScanning ? (
              <View style={styles.scanningOverlay}>
                <BlurView intensity={30} tint="dark" style={styles.scanningBlur}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <ThemedText style={styles.scanningLabel}>{scanningText}</ThemedText>
                </BlurView>
              </View>
            ) : null}
            
            {!isScanning ? (
              <Pressable
                onPress={() => onRemove(index)}
                style={[
                  styles.removeButton,
                  { backgroundColor: theme.error },
                ]}
              >
                <Feather name="x" size={14} color={theme.buttonText} />
              </Pressable>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  countText: {
    marginLeft: Spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xs,
    gap: Spacing.sm,
  },
  imageWrapper: {
    position: "relative",
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
  },
  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  scanningOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  scanningBlur: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  scanningLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
