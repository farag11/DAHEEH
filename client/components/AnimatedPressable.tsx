import React from "react";
import { Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as haptics from "@/utils/haptics";

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
    scale.value = withSpring(scaleDown, {
      damping: 15,
      stiffness: 400,
      mass: 0.5,
    });
    if (hapticFeedback) {
      if (hapticType === "light") haptics.lightTap();
      else if (hapticType === "medium") haptics.mediumTap();
      else haptics.heavyTap();
    }
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
      mass: 0.6,
    });
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
