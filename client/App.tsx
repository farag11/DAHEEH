import React, { useEffect } from "react";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import * as Font from "expo-font";
import { Feather } from "@expo/vector-icons";
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

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { StudyProvider } from "@/contexts/StudyContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { NetworkProvider, useNetwork } from "@/contexts/NetworkContext";
import { GamificationProvider, useGamification } from "@/contexts/GamificationContext";
import { XPToastContainer } from "@/components/XPToast";

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#0D0D1A", // Match the app's dark background
  },
};

SplashScreen.preventAutoHideAsync().catch(() => {});

function OfflineBanner() {
  const { isOffline } = useNetwork();

  if (!isOffline) return null;

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

function OfflineFallbackScreen() {
  return (
    <View style={offlineStyles.container}>
      <Feather name="wifi-off" size={64} color="#ff9800" />
      <Text style={offlineStyles.title}>لا يوجد اتصال بالسيرفر</Text>
      <Text style={offlineStyles.subtitle}>العمل في وضع عدم الاتصال</Text>
      <Text style={offlineStyles.message}>No server connection - Working in offline mode</Text>
      <Text style={offlineStyles.hint}>البيانات المحفوظة متاحة للاستخدام</Text>
      <Text style={offlineStyles.hintEn}>Cached data is available for use</Text>
    </View>
  );
}

const offlineStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 24,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#ff9800",
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#a0a0a0",
    textAlign: "center",
    marginBottom: 24,
  },
  hint: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
  },
  hintEn: {
    fontSize: 12,
    color: "#6E6E73",
    textAlign: "center",
    marginTop: 4,
  },
});

function GlobalErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <View style={errorStyles.container}>
      <Feather name="alert-triangle" size={64} color="#ff9800" />
      <Text style={errorStyles.title}>لا يوجد اتصال بالسيرفر</Text>
      <Text style={errorStyles.subtitle}>العمل في وضع عدم الاتصال</Text>
      <Text style={errorStyles.message}>No server connection - Working in offline mode</Text>
      <View style={errorStyles.button}>
        <Text style={errorStyles.buttonText} onPress={resetError}>
          Retry / إعادة المحاولة
        </Text>
      </View>
    </View>
  );
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 24,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#ff9800",
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#a0a0a0",
    textAlign: "center",
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#4361EE",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
});

function XPToastOverlay() {
  const { xpToasts, dismissToast } = useGamification();
  return <XPToastContainer toasts={xpToasts} onDismiss={dismissToast} />;
}

function AppContent() {
  const { isOffline } = useNetwork();

  if (isOffline) {
    return <OfflineFallbackScreen />;
  }

  return (
    <>
      <OfflineBanner />
      <NavigationContainer theme={navigationTheme}>
        <RootStackNavigator />
      </NavigationContainer>
    </>
  );
}

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

  return (
    <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
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
                            <XPToastOverlay />
                            <AppContent />
                          </GamificationProvider>
                        </StudyProvider>
                      </ToastProvider>
                    </AuthProvider>
                  </ThemeProvider>
                </LanguageProvider>
              </NetworkProvider>
              <StatusBar style="auto" />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
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
});
