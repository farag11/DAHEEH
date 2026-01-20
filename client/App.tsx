import React, { useEffect, useState } from "react";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { useFonts } from "expo-font";
import { Feather } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo"; // مكتبة الشبكة الأساسية

import {
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
} from "@expo-google-fonts/cairo";
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";

// React Query & Client
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

// Navigation
import RootStackNavigator from "@/navigation/RootStackNavigator";

// Contexts
import { LanguageProvider } from "@/contexts/LanguageContext";
import { StudyProvider } from "@/contexts/StudyContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/contexts/AuthContext"; // Firebase Auth Provider
import { NetworkProvider } from "@/contexts/NetworkContext";
import { GamificationProvider, useGamification } from "@/contexts/GamificationContext";

// Components
import { XPToastContainer } from "@/components/XPToast";

// Theme Configuration
const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#0D0D1A",
  },
};

// Prevent Splash Screen from hiding automatically
SplashScreen.preventAutoHideAsync().catch(() => {});

// --- Offline Banner Component (Self-Contained Fix) ---
function OfflineBanner() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    // مراقبة حالة الإنترنت مباشرة هنا لتجنب أخطاء الـ Hooks الخارجية
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  if (isConnected !== false) return null; // لا تظهر شيئاً إذا كان متصلاً

  return (
    <View style={bannerStyles.container}>
      <View style={bannerStyles.iconContainer}>
        <Feather name="wifi-off" size={14} color="#000000" />
      </View>
      <Text style={bannerStyles.text}>Offline Mode - وضع عدم الاتصال</Text>
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  container: {
    backgroundColor: "#ff9800",
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    zIndex: 9999, // لضمان ظهوره فوق كل شيء
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    color: "#000000",
    fontWeight: "600",
    fontSize: 13,
  },
});

// --- XP Toast Overlay ---
function XPToastOverlay() {
  // استخدام آمن للـ Hook مع قيمة افتراضية في حالة الفشل
  try {
    const { xpToasts, dismissToast } = useGamification();
    return <XPToastContainer toasts={xpToasts} onDismiss={dismissToast} />;
  } catch (e) {
    return null; // عدم إظهار الـ Toast في حالة وجود خطأ في الـ Context
  }
}

// --- Main App Content ---
function AppContent() {
  return (
    <>
      <OfflineBanner />
      <NavigationContainer theme={navigationTheme}>
        <RootStackNavigator />
      </NavigationContainer>
      <XPToastOverlay />
    </>
  );
}

// --- Root App Component ---
export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    const loadFeatherFont = async () => {
      try {
        if (Feather.font) {
          await Font.loadAsync(Feather.font);
        }
      } catch (error) {
        console.warn("Failed to load Feather font:", error);
      }
    };

    if (fontsLoaded) {
      loadFeatherFont();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingTitle}>Daheeh</Text>
        <Text style={styles.loadingTitleAr}>دحيح</Text>
        <ActivityIndicator size="large" color="#4361EE" style={styles.loadingSpinner} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // ترتيب الـ Providers (Providers Hierarchy)
  // 1. QueryClient (Data Fetching)
  // 2. UI Providers (SafeArea, Gesture, Keyboard)
  // 3. Network (Connectivity)
  // 4. Auth (Firebase - Needs Network)
  // 5. Data/Logic Providers (Study, Gamification - Need Auth)
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root}>
          <KeyboardProvider>
            <NetworkProvider>
              <LanguageProvider>
                <ThemeProvider>
                  <AuthProvider> 
                    <ToastProvider>
                      <StudyProvider>
                        <GamificationProvider>
                          <AppContent />
                        </GamificationProvider>
                      </StudyProvider>
                    </ToastProvider>
                  </AuthProvider>
                </ThemeProvider>
              </LanguageProvider>
            </NetworkProvider>
            <StatusBar style="light" />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0D0D1A",
  },
  loadingTitle: {
    fontSize: 36,
    fontWeight: "700",
    color: "#4361EE",
    marginBottom: 4,
  },
  loadingTitleAr: {
    fontSize: 32,
    fontFamily: "Cairo_700Bold",
    color: "#FFFFFF",
    marginBottom: 24,
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#8E8E93",
  },
})