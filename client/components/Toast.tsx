import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { StyleSheet, View, I18nManager, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Spacing, Shadows } from "@/constants/theme";

type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TAB_BAR_HEIGHT = 80;
const ANDROID_GESTURE_NAV_HEIGHT = 48;
const EXTRA_PADDING = 16;
const TOAST_DURATION = 2500;
const ANIMATION_DURATION = 300;

const getIconName = (type: ToastType): keyof typeof Feather.glyphMap => {
  switch (type) {
    case "success":
      return "check-circle";
    case "error":
      return "x-circle";
    case "info":
      return "info";
    default:
      return "info";
  }
};

const getIconColor = (
  type: ToastType,
  theme: { success: string; error: string; info: string }
): string => {
  switch (type) {
    case "success":
      return theme.success;
    case "error":
      return theme.error;
    case "info":
      return theme.info;
    default:
      return theme.info;
  }
};

interface ToastItemProps {
  message: string;
  type: ToastType;
  onDismiss: () => void;
}

function ToastItem({ message, type, onDismiss }: ToastItemProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  const baseInset = Platform.OS === "android" 
    ? Math.max(insets.bottom, ANDROID_GESTURE_NAV_HEIGHT)
    : insets.bottom;
  const bottomOffset = baseInset + TAB_BAR_HEIGHT + EXTRA_PADDING;

  useEffect(() => {
    translateY.value = withSpring(0, {
      damping: 15,
      stiffness: 150,
    });
    opacity.value = withTiming(1, { duration: ANIMATION_DURATION });

    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: ANIMATION_DURATION });
      translateY.value = withTiming(100, { duration: ANIMATION_DURATION }, () => {
        runOnJS(onDismiss)();
      });
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const iconName = getIconName(type);
  const iconColor = getIconColor(type, theme);
  const isRTL = I18nManager.isRTL;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        animatedStyle,
        {
          backgroundColor: theme.cardBackground,
          bottom: bottomOffset,
          flexDirection: isRTL ? "row-reverse" : "row",
        },
        Shadows.medium,
      ]}
    >
      <Feather name={iconName} size={20} color={iconColor} />
      <ThemedText
        style={[
          styles.message,
          { marginStart: Spacing.sm, marginEnd: Spacing.sm },
        ]}
      >
        {message}
      </ThemedText>
    </Animated.View>
  );
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [idCounter, setIdCounter] = useState(0);

  const show = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = idCounter;
      setIdCounter((prev) => prev + 1);
      setToasts((prev) => [...prev, { id, message, type }]);
    },
    [idCounter]
  );

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View style={styles.toastWrapper} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onDismiss={() => dismiss(toast.id)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    zIndex: 9999,
  },
  toastContainer: {
    position: "absolute",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg,
    maxWidth: "90%",
  },
  message: {
    flexShrink: 1,
  },
});
