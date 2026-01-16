import React, { useState } from "react";
import { 
  View, 
  StyleSheet, 
  Pressable, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import * as haptics from "@/utils/haptics";

type GlassButtonVariant = "primary" | "secondary" | "option" | "selected" | "correct" | "incorrect";

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: GlassButtonVariant;
  icon?: keyof typeof Feather.glyphMap;
  iconPosition?: "left" | "right";
  disabled?: boolean;
  isLoading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  letterPrefix?: string;
  fullWidth?: boolean;
}

export function GlassButton({
  title,
  onPress,
  variant = "primary",
  icon,
  iconPosition = "left",
  disabled = false,
  isLoading = false,
  style,
  textStyle,
  letterPrefix,
  fullWidth = true,
}: GlassButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    if (disabled || isLoading) return;
    haptics.lightTap();
    onPress();
  };

  const getGradientColors = (): [string, string] => {
    if (variant === "correct") {
      return ["rgba(52, 199, 89, 0.35)", "rgba(52, 199, 89, 0.20)"];
    }
    if (variant === "incorrect") {
      return ["rgba(255, 59, 48, 0.35)", "rgba(255, 59, 48, 0.20)"];
    }
    if (variant === "selected") {
      return ["rgba(99, 102, 241, 0.45)", "rgba(99, 102, 241, 0.25)"];
    }
    if (isPressed) {
      return ["rgba(255, 255, 255, 0.35)", "rgba(255, 255, 255, 0.20)"];
    }
    return ["rgba(60, 60, 70, 0.65)", "rgba(45, 45, 55, 0.55)"];
  };

  const getBorderColor = (): string => {
    if (variant === "correct") return "rgba(52, 199, 89, 0.4)";
    if (variant === "incorrect") return "rgba(255, 59, 48, 0.4)";
    if (variant === "selected") return "rgba(99, 102, 241, 0.5)";
    return "rgba(255, 255, 255, 0.2)";
  };

  const getShadowStyle = (): ViewStyle => {
    if (isPressed) {
      return {
        shadowColor: "#FFFFFF",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
      };
    }
    if (variant === "selected") {
      return {
        shadowColor: "#6366F1",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
      };
    }
    if (variant === "correct") {
      return {
        shadowColor: "#34C759",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      };
    }
    if (variant === "incorrect") {
      return {
        shadowColor: "#FF3B30",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      };
    }
    return {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    };
  };

  const getTextColor = (): string => {
    if (variant === "correct") return "#34C759";
    if (variant === "incorrect") return "#FF3B30";
    return "#FFFFFF";
  };

  const getLetterPrefixStyle = (): TextStyle => {
    return {
      color: variant === "selected" ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)",
      fontSize: 14,
      fontWeight: "700",
      marginRight: Spacing.sm,
    };
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={disabled || isLoading}
      style={[
        styles.container,
        getShadowStyle(),
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            { borderColor: getBorderColor() },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.content}>
              {letterPrefix ? (
                <ThemedText style={getLetterPrefixStyle()}>{letterPrefix}</ThemedText>
              ) : null}
              {icon && iconPosition === "left" ? (
                <Feather 
                  name={icon} 
                  size={20} 
                  color={getTextColor()} 
                  style={styles.iconLeft} 
                />
              ) : null}
              <ThemedText 
                style={[
                  styles.text, 
                  { color: getTextColor() },
                  textStyle,
                ]}
              >
                {title}
              </ThemedText>
              {icon && iconPosition === "right" ? (
                <Feather 
                  name={icon} 
                  size={20} 
                  color={getTextColor()} 
                  style={styles.iconRight} 
                />
              ) : null}
            </View>
          )}
        </LinearGradient>
      </BlurView>
    </Pressable>
  );
}

export function GlassPrimaryButton({
  title,
  onPress,
  icon,
  disabled = false,
  isLoading = false,
  style,
}: Omit<GlassButtonProps, "variant">) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    if (disabled || isLoading) return;
    haptics.mediumTap();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={disabled || isLoading}
      style={[
        styles.primaryContainer,
        isPressed && styles.primaryPressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <LinearGradient
        colors={
          isPressed 
            ? ["#6B00E0", "#0045B8"] 
            : ["#7F00FF", "#0052D4"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.primaryGradient}
      >
        <View style={styles.primaryInnerGlow}>
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.content}>
              {icon ? (
                <Feather 
                  name={icon} 
                  size={22} 
                  color="#FFFFFF" 
                  style={styles.iconLeft} 
                />
              ) : null}
              <ThemedText style={styles.primaryText}>{title}</ThemedText>
            </View>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 30,
    overflow: "hidden",
  },
  fullWidth: {
    width: "100%",
  },
  blurContainer: {
    borderRadius: 30,
    overflow: "hidden",
  },
  gradient: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  primaryContainer: {
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#7F00FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  primaryPressed: {
    shadowColor: "#0052D4",
    shadowOpacity: 0.6,
    shadowRadius: 20,
    transform: [{ scale: 0.98 }],
  },
  primaryGradient: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  primaryInnerGlow: {
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xl,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.15)",
  },
  primaryText: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.5,
    color: "#FFFFFF",
  },
});
