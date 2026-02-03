import React from "react";
import { Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as haptics from "@/utils/haptics";

const TIMING_CONFIG = {
  duration: 150,
  easing: Easing.out(Easing.ease),
};

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableProps extends Omit<PressableProps, "style"> {
  style?: StyleProp<ViewStyle>;
  scaleDown?: number;
  hapticFeedback?: boolean;
  hapticType?: "light" | "medium" | "heavy";
  children: React.ReactNode;
}

export function AnimatedPressable({
  style,
  scaleDown = 0.96,
  hapticFeedback = true,
  hapticType = "light",
  onPressIn,
  onPressOut,
  onPress,
  children,
  ...props
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: any) => {
    scale.value = withTiming(scaleDown, TIMING_CONFIG);
    if (hapticFeedback) {
      if (hapticType === "light") haptics.lightTap();
      else if (hapticType === "medium") haptics.mediumTap();
      else haptics.heavyTap();
    }
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withTiming(1, TIMING_CONFIG);
    onPressOut?.(e);
  };

  return (
    <AnimatedPressableBase
      style={[animatedStyle, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      {...props}
    >
      {children}
    </AnimatedPressableBase>
  );
}
