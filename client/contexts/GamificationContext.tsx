import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Toast {
  id: number;
  message: string;
}

export const RANKS = [
  { name: 'Beginner', minXP: 0, minLevel: 0, title: 'Beginner', titleAr: 'مبتدئ' },
  { name: 'Novice', minXP: 100, minLevel: 1, title: 'Novice', titleAr: 'مبتدئ' },
  { name: 'Pro', minXP: 500, minLevel: 5, title: 'Pro', titleAr: 'محترف' },
];

interface GamificationContextType {
  xpToasts: Toast[];
  dismissToast: (id: number) => void;
  level: number;
  xp: number;
  xpProgress: number;
  xpToNextLevel: number;
  streak: number;
  rankInfo: any;
  totalXPEarned: number;
  awardXP: (amount: number) => void;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export const GamificationProvider = ({ children }: { children: ReactNode }) => {
  const [xpToasts, setXpToasts] = useState<Toast[]>([]);

  const dismissToast = (id: number) => {
    setXpToasts(toasts => toasts.filter(t => t.id !== id));
  };

  const value = {
    xpToasts,
    dismissToast,
    level: 1,
    xp: 0,
    xpProgress: 0,
    xpToNextLevel: 100,
    streak: 0,
    rankInfo: RANKS[0],
    totalXPEarned: 0,
    awardXP: (amount: number) => {},
  }

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error("useGamification must be used within a GamificationProvider");
  }
  return context;
};
