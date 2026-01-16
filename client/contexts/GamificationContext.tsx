import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as haptics from "@/utils/haptics";

export type RankInfo = {
  title: string;
  titleAr: string;
  minLevel: number;
  maxLevel: number;
  color: string;
  icon: string;
};

export const RANKS: RankInfo[] = [
  { title: "Novice", titleAr: "مبتدئ", minLevel: 1, maxLevel: 4, color: "#8E8E93", icon: "star" },
  { title: "Scholar", titleAr: "مجتهد", minLevel: 5, maxLevel: 9, color: "#10B981", icon: "award" },
  { title: "Elite", titleAr: "متفوق", minLevel: 10, maxLevel: 19, color: "#7209B7", icon: "zap" },
  { title: "Daheeh", titleAr: "دحيح 🤓", minLevel: 20, maxLevel: 999, color: "#F59E0B", icon: "crown" },
];

export type XPRewardReason = "summary" | "quiz_correct" | "study_plan" | "explanation" | "streak_bonus";

export const XP_REWARDS: Record<XPRewardReason, { amount: number; labelEn: string; labelAr: string }> = {
  summary: { amount: 50, labelEn: "Summary Created", labelAr: "ملخص جديد" },
  quiz_correct: { amount: 20, labelEn: "Correct Answer", labelAr: "إجابة صحيحة" },
  study_plan: { amount: 100, labelEn: "Study Plan Created", labelAr: "خطة دراسة" },
  explanation: { amount: 30, labelEn: "Concept Explained", labelAr: "شرح مفهوم" },
  streak_bonus: { amount: 25, labelEn: "Streak Bonus", labelAr: "مكافأة المداومة" },
};

export type XPToastData = {
  id: string;
  amount: number;
  reason: XPRewardReason;
  timestamp: number;
};

type GamificationState = {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string | null;
  totalXPEarned: number;
};

type GamificationContextType = {
  xp: number;
  level: number;
  streak: number;
  rankInfo: RankInfo;
  xpToNextLevel: number;
  xpProgress: number;
  totalXPEarned: number;
  awardXP: (reason: XPRewardReason, customAmount?: number) => void;
  xpToasts: XPToastData[];
  dismissToast: (id: string) => void;
  isLoading: boolean;
  resetProgress: () => Promise<void>;
};

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

const STORAGE_KEY = "gamification_data";
const XP_PER_LEVEL = 500;

const defaultState: GamificationState = {
  xp: 0,
  level: 1,
  streak: 0,
  lastActiveDate: null,
  totalXPEarned: 0,
};

function calculateLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

function calculateXPToNextLevel(xp: number): number {
  const currentLevel = calculateLevel(xp);
  const xpForNextLevel = currentLevel * XP_PER_LEVEL;
  return xpForNextLevel - xp;
}

function calculateXPProgress(xp: number): number {
  const xpInCurrentLevel = xp % XP_PER_LEVEL;
  return xpInCurrentLevel / XP_PER_LEVEL;
}

function getRankForLevel(level: number): RankInfo {
  for (const rank of RANKS) {
    if (level >= rank.minLevel && level <= rank.maxLevel) {
      return rank;
    }
  }
  return RANKS[RANKS.length - 1];
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isConsecutiveDay(lastDate: Date, currentDate: Date): boolean {
  const oneDayMs = 24 * 60 * 60 * 1000;
  const lastDateStart = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
  const currentDateStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  const diffDays = Math.round((currentDateStart.getTime() - lastDateStart.getTime()) / oneDayMs);
  return diffDays === 1;
}

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GamificationState>(defaultState);
  const [xpToasts, setXpToasts] = useState<XPToastData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const previousLevelRef = useRef<number>(1);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading && state.level > previousLevelRef.current) {
      haptics.success();
      previousLevelRef.current = state.level;
    }
  }, [state.level, isLoading]);

  const loadData = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData) as GamificationState;
        
        const today = new Date();
        let updatedStreak = parsed.streak;
        
        if (parsed.lastActiveDate) {
          const lastActive = new Date(parsed.lastActiveDate);
          if (!isSameDay(lastActive, today) && !isConsecutiveDay(lastActive, today)) {
            updatedStreak = 0;
          }
        }
        
        setState({
          ...parsed,
          streak: updatedStreak,
          level: calculateLevel(parsed.xp),
        });
        previousLevelRef.current = calculateLevel(parsed.xp);
      }
    } catch (error) {
      console.error("Error loading gamification data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async (data: GamificationState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving gamification data:", error);
    }
  };

  const awardXP = useCallback((reason: XPRewardReason, customAmount?: number) => {
    const rewardInfo = XP_REWARDS[reason];
    const amount = customAmount ?? rewardInfo.amount;
    
    setState((prev) => {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      
      let newStreak = prev.streak;
      if (prev.lastActiveDate) {
        const lastActive = new Date(prev.lastActiveDate);
        if (!isSameDay(lastActive, today)) {
          if (isConsecutiveDay(lastActive, today)) {
            newStreak = prev.streak + 1;
          } else {
            newStreak = 1;
          }
        }
      } else {
        newStreak = 1;
      }
      
      const newXP = prev.xp + amount;
      const newLevel = calculateLevel(newXP);
      
      const newState: GamificationState = {
        xp: newXP,
        level: newLevel,
        streak: newStreak,
        lastActiveDate: todayStr,
        totalXPEarned: prev.totalXPEarned + amount,
      };
      
      saveData(newState);
      return newState;
    });
    
    const toastId = `xp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast: XPToastData = {
      id: toastId,
      amount,
      reason,
      timestamp: Date.now(),
    };
    
    setXpToasts((prev) => [...prev, newToast]);
    
    haptics.lightTap();
    
    setTimeout(() => {
      setXpToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setXpToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const resetProgress = useCallback(async () => {
    setState(defaultState);
    previousLevelRef.current = 1;
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const contextValue: GamificationContextType = {
    xp: state.xp,
    level: state.level,
    streak: state.streak,
    rankInfo: getRankForLevel(state.level),
    xpToNextLevel: calculateXPToNextLevel(state.xp),
    xpProgress: calculateXPProgress(state.xp),
    totalXPEarned: state.totalXPEarned,
    awardXP,
    xpToasts,
    dismissToast,
    isLoading,
    resetProgress,
  };

  return (
    <GamificationContext.Provider value={contextValue}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error("useGamification must be used within a GamificationProvider");
  }
  return context;
}
