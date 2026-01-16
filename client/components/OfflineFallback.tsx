import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLanguage } from "@/contexts/LanguageContext";

interface OfflineFallbackProps {
  showServerError?: boolean;
}

export function OfflineFallback({ showServerError = false }: OfflineFallbackProps) {
  const { language, isRTL } = useLanguage();

  const serverErrorText = language === "ar" 
    ? "لا يوجد اتصال بالسيرفر - العمل في وضع عدم الاتصال"
    : "No server connection - Working in offline mode";

  const offlineText = language === "ar"
    ? "وضع عدم الاتصال - النظام المحلي يعمل"
    : "Offline Mode Active - Local System Running";

  const displayText = showServerError ? serverErrorText : offlineText;

  return (
    <View style={styles.container}>
      <Feather name="wifi-off" size={64} color="#ff9800" />
      <Text style={[styles.text, isRTL && styles.rtlText]}>
        {displayText}
      </Text>
      <Text style={[styles.subtext, isRTL && styles.rtlText]}>
        {language === "ar" 
          ? "البيانات المحفوظة متاحة للاستخدام"
          : "Cached data is available for use"}
      </Text>
    </View>
  );
}

export function SimpleOfflineBanner({ isOffline }: { isOffline: boolean }) {
  if (!isOffline) return null;
  
  return (
    <View style={styles.banner}>
      <Feather name="wifi-off" size={14} color="#000000" style={styles.bannerIcon} />
      <Text style={styles.bannerText}>Offline Mode Active</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  subtext: {
    fontSize: 16,
    color: "#a0a0a0",
    textAlign: "center",
  },
  banner: {
    backgroundColor: "#ff9800",
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  bannerIcon: {
    marginRight: 8,
  },
  bannerText: {
    color: "#000000",
    fontWeight: "600",
    fontSize: 14,
  },
});
