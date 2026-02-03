import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

import { ThemedText } from "@/components/ThemedText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { BorderRadius, Spacing, Typography } from "@/constants/theme";

WebBrowser.maybeCompleteAuthSession();

type AuthMode = "login" | "signup";

interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function AuthScreen() {
  const { theme, isDark } = useTheme();
  const { t, isRTL, language, setLanguage } = useLanguage();
  const { login, signup, loginWithGoogle, continueAsGuest } = useAuth();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const getPlatformGoogleClientId = () => {
    if (Platform.OS === "web") {
      return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    } else if (Platform.OS === "android") {
      return process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
    } else if (Platform.OS === "ios") {
      return process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    }
    return undefined;
  };

  const isGoogleAuthConfigured = !!getPlatformGoogleClientId();

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "placeholder",
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "placeholder",
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "placeholder.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === "success") {
      handleGoogleResponse(response.authentication?.accessToken);
    }
  }, [response]);

  const handleGoogleResponse = async (accessToken: string | undefined) => {
    if (!accessToken) return;

    try {
      setIsGoogleLoading(true);
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const userInfo = await userInfoResponse.json();
      
      if (userInfo.email) {
        await loginWithGoogle({
          email: userInfo.email,
          name: userInfo.name,
          id: userInfo.id,
        });
      }
    } catch (error) {
      const errorMessage = language === "ar" 
        ? "فشل تسجيل الدخول بـ Google. يرجى المحاولة مرة أخرى."
        : "Google sign-in failed. Please try again.";
      Alert.alert(language === "ar" ? "خطأ" : "Error", errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isGoogleAuthConfigured) {
      const errorMessage = language === "ar"
        ? "تسجيل الدخول بـ Google غير مُفعّل حالياً. يرجى استخدام البريد الإلكتروني أو المتابعة كزائر."
        : "Google sign-in is not configured. Please use email or continue as guest.";
      Alert.alert(language === "ar" ? "تنبيه" : "Notice", errorMessage);
      return;
    }
    try {
      setIsGoogleLoading(true);
      await promptAsync();
    } catch (error) {
      const errorMessage = language === "ar"
        ? "هذه الميزة تتطلب نسخة APK النهائية لتعمل بشكل صحيح"
        : "This feature requires the final APK version to work properly";
      Alert.alert(language === "ar" ? "تنبيه" : "Notice", errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!validateEmail(email)) {
      newErrors.email = t("invalidEmail");
    }

    if (password.length < 6) {
      newErrors.password = t("passwordMinLength");
    }

    if (mode === "signup" && password !== confirmPassword) {
      newErrors.confirmPassword = t("passwordsDoNotMatch");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = mode === "login" 
        ? await login(email, password)
        : await signup(email, password);
      
      if (!result.success && result.error) {
        setErrors({ email: t(result.error) });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAsGuest = async () => {
    setIsLoading(true);
    try {
      await continueAsGuest();
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setErrors({});
    setConfirmPassword("");
  };

  const flexDirection = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <Pressable
        onPress={() => {
          const newLanguage = language === "en" ? "ar" : "en";
          setLanguage(newLanguage);
        }}
        style={[
          styles.languageToggleButton,
          {
            top: insets.top + Spacing.md,
            [isRTL ? "left" : "right"]: Spacing.lg,
            backgroundColor: theme.backgroundDefault,
            borderColor: theme.border,
          },
        ]}
        testID="button-language-toggle"
      >
        <Feather name="globe" size={20} color={theme.primary} />
        <ThemedText type="small" style={[styles.languageToggleText, { color: theme.primary }]}>
          {language === "en" ? "AR" : "EN"}
        </ThemedText>
      </Pressable>

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing["3xl"],
            paddingBottom: insets.bottom + Spacing["2xl"],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="h1" style={styles.appName}>
            {t("appName")}
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            {mode === "login" ? t("welcomeBack") : t("getStarted")}
          </ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText type="small" style={[styles.label, { textAlign }]}>
              {t("email")}
            </ThemedText>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: errors.email ? theme.error : "transparent",
                  flexDirection,
                },
              ]}
            >
              <Feather
                name="mail"
                size={20}
                color={theme.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  { color: theme.text, textAlign },
                ]}
                placeholder={t("email")}
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                testID="input-email"
              />
            </View>
            {errors.email ? (
              <ThemedText
                type="small"
                style={[styles.errorText, { color: theme.error, textAlign }]}
              >
                {errors.email}
              </ThemedText>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={[styles.label, { textAlign }]}>
              {t("password")}
            </ThemedText>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: errors.password ? theme.error : "transparent",
                  flexDirection,
                },
              ]}
            >
              <Feather
                name="lock"
                size={20}
                color={theme.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  { color: theme.text, textAlign },
                ]}
                placeholder={t("password")}
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                testID="input-password"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                testID="button-toggle-password"
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={theme.textSecondary}
                />
              </Pressable>
            </View>
            {errors.password ? (
              <ThemedText
                type="small"
                style={[styles.errorText, { color: theme.error, textAlign }]}
              >
                {errors.password}
              </ThemedText>
            ) : null}
          </View>

          {mode === "signup" ? (
            <View style={styles.inputGroup}>
              <ThemedText type="small" style={[styles.label, { textAlign }]}>
                {t("confirmPassword")}
              </ThemedText>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: errors.confirmPassword ? theme.error : "transparent",
                    flexDirection,
                  },
                ]}
              >
                <Feather
                  name="lock"
                  size={20}
                  color={theme.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.text, textAlign },
                  ]}
                  placeholder={t("confirmPassword")}
                  placeholderTextColor={theme.textSecondary}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  testID="input-confirm-password"
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                  testID="button-toggle-confirm-password"
                >
                  <Feather
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color={theme.textSecondary}
                  />
                </Pressable>
              </View>
              {errors.confirmPassword ? (
                <ThemedText
                  type="small"
                  style={[styles.errorText, { color: theme.error, textAlign }]}
                >
                  {errors.confirmPassword}
                </ThemedText>
              ) : null}
            </View>
          ) : null}

          <Pressable
            onPress={handleSubmit}
            disabled={isLoading}
            style={[styles.primaryButtonContainer, { opacity: isLoading ? 0.7 : 1 }]}
            testID="button-submit"
          >
            <LinearGradient
              colors={["#7F00FF", "#0052D4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <ThemedText type="body" style={styles.primaryButtonText}>
                {mode === "login" ? t("login") : t("signup")}
              </ThemedText>
            </LinearGradient>
          </Pressable>

          <View style={styles.guestSection}>
            <Pressable
              onPress={handleContinueAsGuest}
              disabled={isLoading}
              style={[
                styles.guestButton,
                {
                  backgroundColor: theme.backgroundSecondary,
                  opacity: isLoading ? 0.5 : 1,
                },
              ]}
              testID="button-continue-guest"
            >
              <Feather
                name="user"
                size={20}
                color={theme.textSecondary}
                style={{ marginRight: isRTL ? 0 : Spacing.sm, marginLeft: isRTL ? Spacing.sm : 0 }}
              />
              <ThemedText type="body" style={{ color: theme.text }}>
                {t("continueAsGuest")}
              </ThemedText>
            </Pressable>
            <ThemedText
              type="small"
              style={[styles.guestNote, { color: theme.textSecondary, textAlign: "center" }]}
            >
              {t("guestModeNote")}
            </ThemedText>
          </View>

          {isGoogleAuthConfigured ? (
            <>
              <View style={styles.dividerContainer}>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                <ThemedText type="small" style={[styles.dividerText, { color: theme.textSecondary }]}>
                  {language === "ar" ? "ـــ أو ـــ" : "— or —"}
                </ThemedText>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              </View>

              <Pressable
                onPress={handleGoogleSignIn}
                disabled={isGoogleLoading}
                style={[
                  styles.googleButton,
                  { opacity: isGoogleLoading ? 0.6 : 1 },
                ]}
                testID="button-google-signin"
              >
                <View style={styles.googleIconContainer}>
                  <ThemedText style={styles.googleIconG}>G</ThemedText>
                </View>
                <ThemedText type="body" style={styles.googleButtonText}>
                  {language === "ar" ? "المتابعة باستخدام Google" : "Continue with Google"}
                </ThemedText>
              </Pressable>
            </>
          ) : null}
        </View>

        <View style={[styles.footer, { flexDirection }]}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {mode === "login" ? t("dontHaveAccount") : t("alreadyHaveAccount")}{" "}
          </ThemedText>
          <Pressable onPress={toggleMode} testID="button-toggle-mode">
            <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>
              {mode === "login" ? t("signup") : t("login")}
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  languageToggleButton: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    zIndex: 10,
  },
  languageToggleText: {
    fontWeight: "600",
    fontSize: 14,
    marginLeft: Spacing.xs,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing["2xl"],
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  appName: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: "center",
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    height: "100%",
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  errorText: {
    marginTop: Spacing.xs,
  },
  primaryButtonContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    shadowColor: "#7F00FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButton: {
    height: Spacing.buttonHeight,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.full,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 17,
  },
  guestSection: {
    marginBottom: Spacing.md,
  },
  guestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xs,
  },
  guestNote: {
    paddingHorizontal: Spacing.md,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: Spacing.md,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  googleIconG: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4285F4",
  },
  googleButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xl,
    marginTop: Spacing.lg,
  },
});
