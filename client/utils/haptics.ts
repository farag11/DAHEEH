import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

const isWeb = Platform.OS === "web";

export function lightTap(): void {
  if (isWeb) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function mediumTap(): void {
  if (isWeb) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function heavyTap(): void {
  if (isWeb) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

export function success(): void {
  if (isWeb) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function warning(): void {
  if (isWeb) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

export function error(): void {
  if (isWeb) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

export function selection(): void {
  if (isWeb) return;
  Haptics.selectionAsync();
}
