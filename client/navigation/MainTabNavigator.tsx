import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HomeStackNavigator from "@/navigation/HomeStackNavigator";
import LibraryStackNavigator from "@/navigation/LibraryStackNavigator";
import ProgressStackNavigator from "@/navigation/ProgressStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import { useAccentTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import * as haptics from "@/utils/haptics";

const CHAT_SCREENS = ["Summarize", "Quiz", "Explain"];

export type MainTabParamList = {
  HomeTab: undefined;
  LibraryTab: undefined;
  ProgressTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const METALLIC_GRAY = "#636366";
const DOCK_BOTTOM = 0;
const DOCK_HEIGHT = 70;

const getDefaultTabBarStyle = (bottomInset: number) => ({
  position: "absolute" as const,
  bottom: DOCK_BOTTOM,
  left: 0,
  right: 0,
  width: "100%" as const,
  height: DOCK_HEIGHT,
  backgroundColor: "rgba(15, 15, 20, 0.96)",
  borderRadius: 0,
  borderWidth: 0,
  borderTopWidth: 1,
  borderTopColor: "rgba(255, 255, 255, 0.1)",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.3,
  shadowRadius: 12,
  elevation: 12,
  paddingBottom: Platform.OS === 'android' ? 10 : Math.max(bottomInset, 20),
  paddingTop: 0,
  justifyContent: "center" as const,
  zIndex: 100,
});

const hiddenTabBarStyle = { display: "none" as const };

interface GlowIconProps {
  name: keyof typeof Feather.glyphMap;
  focused: boolean;
  size: number;
  activeColor: string;
  glowColor: string;
}

function GlowIcon({ name, focused, size, activeColor, glowColor }: GlowIconProps) {
  const iconSize = size + 2;
  
  if (focused) {
    return (
      <View style={styles.iconContainer}>
        <View style={[styles.glowRing, { backgroundColor: glowColor }]} />
        <Feather 
          name={name} 
          size={iconSize} 
          color={activeColor}
          style={[styles.glowIcon, { textShadowColor: glowColor }]}
        />
      </View>
    );
  }
  
  return (
    <View style={styles.iconContainer}>
      <Feather name={name} size={iconSize} color={METALLIC_GRAY} />
    </View>
  );
}

export function useFloatingDockHeight(): number {
  const insets = useSafeAreaInsets();
  return DOCK_HEIGHT + DOCK_BOTTOM + Math.max(insets.bottom, 20);
}

export default function MainTabNavigator() {
  const { t } = useLanguage();
  const { getAccentColor, getAccentGradient } = useAccentTheme();
  const insets = useSafeAreaInsets();
  
  const accentColor = getAccentColor();
  const accentGradient = getAccentGradient();
  const glowColor = `${accentColor}99`;
  const defaultTabBarStyle = getDefaultTabBarStyle(insets.bottom);
  
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenListeners={{
        tabPress: () => {
          haptics.selection();
        },
      }}
      screenOptions={{
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: METALLIC_GRAY,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: defaultTabBarStyle,
        tabBarItemStyle: {
          margin: 0,
          padding: 0,
          marginTop: 0,
          marginBottom: 0,
          justifyContent: "center",
          alignItems: "center",
          height: 60,
        },
        tabBarIconStyle: {
          marginTop: 15,
          marginBottom: 0,
          alignSelf: "center",
        },
        tabBarBackground: () => (
          <BlurView
            intensity={40}
            tint="dark"
            style={[StyleSheet.absoluteFill, styles.blurBackground]}
          />
        ),
        headerShown: false,
        animation: "shift",
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? "Home";
          const hideTabBar = CHAT_SCREENS.includes(routeName);
          return {
            title: t("home"),
            tabBarStyle: hideTabBar ? hiddenTabBarStyle : defaultTabBarStyle,
            tabBarIcon: ({ focused, size }) => (
              <GlowIcon 
                name="home" 
                focused={focused} 
                size={size} 
                activeColor={accentColor}
                glowColor={glowColor}
              />
            ),
          };
        }}
      />
      <Tab.Screen
        name="LibraryTab"
        component={LibraryStackNavigator}
        options={{
          title: t("library"),
          tabBarIcon: ({ focused, size }) => (
            <GlowIcon 
              name="book-open" 
              focused={focused} 
              size={size}
              activeColor={accentColor}
              glowColor={glowColor}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ProgressTab"
        component={ProgressStackNavigator}
        options={{
          title: t("progress"),
          tabBarIcon: ({ focused, size }) => (
            <GlowIcon 
              name="bar-chart-2" 
              focused={focused} 
              size={size}
              activeColor={accentColor}
              glowColor={glowColor}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: t("profile"),
          tabBarIcon: ({ focused, size }) => (
            <GlowIcon 
              name="user" 
              focused={focused} 
              size={size}
              activeColor={accentColor}
              glowColor={glowColor}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  blurBackground: {
    borderRadius: 0,
    overflow: "hidden",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
  },
  glowRing: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.25,
    transform: [{ scale: 1.2 }],
  },
  glowIcon: {
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
