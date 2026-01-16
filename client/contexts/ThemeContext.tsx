import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AccentColorName = "purple" | "orange" | "gray" | "pink" | "blue";

export const AccentColors: Record<AccentColorName, string> = {
  purple: "#7209B7",
  orange: "#FF6B35",
  gray: "#6C757D",
  pink: "#E91E8B",
  blue: "#4361EE",
};

export const AccentGradients: Record<AccentColorName, { start: string; end: string }> = {
  purple: { start: "#7C3AED", end: "#EC4899" },
  orange: { start: "#F59E0B", end: "#EF4444" },
  gray: { start: "#4B5563", end: "#1F2937" },
  pink: { start: "#EC4899", end: "#8B5CF6" },
  blue: { start: "#3B82F6", end: "#06B6D4" },
};

type ThemeContextType = {
  accentColor: AccentColorName;
  setAccentColor: (color: AccentColorName) => void;
  getAccentColor: () => string;
  getAccentGradient: () => { start: string; end: string };
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ACCENT_THEME_KEY = "accent_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [accentColor, setAccentColorState] = useState<AccentColorName>("blue");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAccentColor();
  }, []);

  const loadAccentColor = async () => {
    try {
      const savedColor = await AsyncStorage.getItem(ACCENT_THEME_KEY);
      if (savedColor && savedColor in AccentColors) {
        setAccentColorState(savedColor as AccentColorName);
      }
    } catch (error) {
      console.error("Error loading accent color:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setAccentColor = async (color: AccentColorName) => {
    try {
      await AsyncStorage.setItem(ACCENT_THEME_KEY, color);
      setAccentColorState(color);
    } catch (error) {
      console.error("Error saving accent color:", error);
    }
  };

  const getAccentColor = (): string => {
    return AccentColors[accentColor];
  };

  const getAccentGradient = (): { start: string; end: string } => {
    return AccentGradients[accentColor];
  };

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ accentColor, setAccentColor, getAccentColor, getAccentGradient }}>
      {children}
    </ThemeContext.Provider>
  );
}

const defaultAccentTheme: ThemeContextType = {
  accentColor: "blue",
  setAccentColor: () => {},
  getAccentColor: () => AccentColors.blue,
  getAccentGradient: () => AccentGradients.blue,
};

export function useAccentTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return defaultAccentTheme;
  }
  return context;
}
