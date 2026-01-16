import React from "react";
import { StyleSheet, View, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

import { useAuth } from "@/contexts/AuthContext";

interface ImageActionBarProps {
  onCameraPress: () => void;
  onGalleryPress: () => void;
  onFilePress?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function ImageActionBar({
  onCameraPress,
  onGalleryPress,
  onFilePress,
  disabled = false,
  isLoading = false,
}: ImageActionBarProps) {
  const { authMode } = useAuth();

  const isGuest = authMode === "guest";

  if (isGuest) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <View style={styles.buttonsRow}>
          <Pressable
            onPress={onCameraPress}
            disabled={disabled || isLoading}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              disabled && styles.buttonDisabled,
            ]}
            data-testid="button-camera"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#8E8E93" />
            ) : (
              <Feather name="camera" size={22} color="#8E8E93" />
            )}
          </Pressable>

          <Pressable
            onPress={onGalleryPress}
            disabled={disabled || isLoading}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              disabled && styles.buttonDisabled,
            ]}
            data-testid="button-gallery"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#8E8E93" />
            ) : (
              <Feather name="image" size={22} color="#8E8E93" />
            )}
          </Pressable>

          {onFilePress ? (
            <Pressable
              onPress={onFilePress}
              disabled={disabled || isLoading}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                disabled && styles.buttonDisabled,
              ]}
              data-testid="button-file"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#8E8E93" />
              ) : (
                <Feather name="paperclip" size={22} color="#8E8E93" />
              )}
            </Pressable>
          ) : null}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: "hidden",
    alignSelf: "flex-start",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(20, 20, 25, 0.88)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  blurContainer: {
    borderRadius: 24,
    overflow: "hidden",
  },
  buttonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  buttonPressed: {
    opacity: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});
