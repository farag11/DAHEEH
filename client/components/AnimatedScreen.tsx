import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface AnimatedScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
}

export function AnimatedScreen({
  children,
  style,
  delay = 100,
}: AnimatedScreenProps) {
  return (
    <Animated.View 
      entering={FadeInDown.delay(delay).springify().damping(12).mass(0.8)}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </Animated.View>
  );
}
