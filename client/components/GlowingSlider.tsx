import React, { useRef, useState } from "react";
import { View, StyleSheet, Pressable, LayoutChangeEvent, PanResponder } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as haptics from "@/utils/haptics";
import { ThemedText } from "./ThemedText";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccentTheme } from "@/contexts/ThemeContext";

interface GlowingSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  label?: string;
  valueLabel?: string;
  showValue?: boolean;
  accentColor?: string;
  gradientColors?: [string, string];
}

export function GlowingSlider({
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  label,
  valueLabel,
  showValue = true,
  accentColor,
  gradientColors,
}: GlowingSliderProps) {
  const { isRTL } = useLanguage();
  const { getAccentColor } = useAccentTheme();
  const thumbScale = useSharedValue(1);
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  const lastValueRef = useRef(value);
  
  const themeAccent = getAccentColor();
  const effectiveAccentColor = accentColor || themeAccent;
  
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  const effectiveGradient = gradientColors || [
    effectiveAccentColor,
    hexToRgba(effectiveAccentColor, 0.5),
  ];
  
  const range = maximumValue - minimumValue;
  const progressPercent = ((lastValueRef.current - minimumValue) / range) * 100;

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: thumbScale.value }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setTrackWidth(width);
    trackWidthRef.current = width;
  };

  const calculateValue = (locationX: number): number => {
    const width = trackWidthRef.current;
    if (width === 0) return value;
    
    const percent = isRTL 
      ? 1 - (locationX / width)
      : locationX / width;
    const clampedPercent = Math.max(0, Math.min(1, percent));
    let newValue = minimumValue + clampedPercent * range;
    
    if (step > 0) {
      newValue = Math.round(newValue / step) * step;
    }
    
    return Math.max(minimumValue, Math.min(maximumValue, newValue));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        thumbScale.value = withTiming(1.15, { duration: 150, easing: Easing.out(Easing.ease) });
        lastValueRef.current = value;
      },
      onPanResponderMove: (evt) => {
        const newValue = calculateValue(evt.nativeEvent.locationX);
        if (newValue !== lastValueRef.current) {
          lastValueRef.current = newValue;
        }
      },
      onPanResponderRelease: () => {
        thumbScale.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) });
        const finalValue = lastValueRef.current;
        if (finalValue !== value) {
          haptics.selection();
          onValueChange(finalValue);
        }
      },
      onPanResponderTerminate: () => {
        thumbScale.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) });
        lastValueRef.current = value;
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      {(label || showValue) && (
        <View style={[styles.labelRow, isRTL && styles.labelRowRTL]}>
          {label && (
            <ThemedText style={styles.label}>{label}</ThemedText>
          )}
          {showValue && valueLabel && (
            <ThemedText style={styles.valueText}>{valueLabel}</ThemedText>
          )}
        </View>
      )}
      
      <View 
        style={styles.sliderContainer}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        <View style={styles.trackBackground}>
          <LinearGradient
            colors={effectiveGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.trackProgress,
              { width: `${progressPercent}%` },
              isRTL && styles.trackProgressRTL,
            ]}
          />
        </View>
        
        <Animated.View 
          style={[
            styles.thumbContainer,
            thumbAnimatedStyle,
            isRTL 
              ? { right: `${progressPercent}%`, left: undefined }
              : { left: `${progressPercent}%` },
          ]}
        >
          <View style={[styles.thumbOuter, { shadowColor: effectiveAccentColor }]}>
            <View style={[styles.thumbInner, { backgroundColor: effectiveAccentColor }]} />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  labelRowRTL: {
    flexDirection: "row-reverse",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  valueText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  sliderContainer: {
    height: 44,
    justifyContent: "center",
    position: "relative",
  },
  trackBackground: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  trackProgress: {
    height: "100%",
    borderRadius: 4,
  },
  trackProgressRTL: {
    position: "absolute",
    right: 0,
    left: undefined,
  },
  thumbContainer: {
    position: "absolute",
    top: "50%",
    marginTop: -16,
    marginLeft: -16,
    width: 32,
    height: 32,
  },
  thumbTouchable: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 12,
  },
  thumbInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
