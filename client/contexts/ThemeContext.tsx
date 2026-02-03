import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState('dark');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Placeholder for the useAccentTheme hook
export const useAccentTheme = () => {
  const [accentColor, setAccentColor] = useState('#4361EE');

  const getAccentColor = () => accentColor;

  const getAccentGradient = () => [accentColor, accentColor];

  return {
    accentColor,
    setAccentColor,
    getAccentColor,
    getAccentGradient,
  };
};
