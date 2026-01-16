import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setHistoryCallback } from "@/services/aiService";

export type Summary = {
  id: string;
  title: string;
  originalText: string;
  summaryText: string;
  complexity: "simple" | "detailed" | "comprehensive";
  createdAt: string;
};

export type Question = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  type: "mcq" | "trueFalse" | "shortAnswer";
  sourceText: string;
  createdAt: string;
};

export type StudyPlan = {
  id: string;
  title: string;
  topics: string[];
  daysAvailable: number;
  hoursPerDay: number;
  planDetails: string;
  createdAt: string;
};

export type Explanation = {
  id: string;
  concept: string;
  explanation: string;
  level: "beginner" | "intermediate" | "advanced";
  createdAt: string;
};

export type StudyStats = {
  totalStudyHours: number;
  questionsAnswered: number;
  summariesCreated: number;
  streakDays: number;
  lastStudyDate: string | null;
};

export type StudyHistoryEntry = {
  id: string;
  actionType: "summary" | "quiz" | "explain" | "plan";
  keyword: string;
  contentId?: string;
  createdAt: Date;
};

export type Collection = {
  id: string;
  name: string;
  description?: string;
  color: string;
  itemIds: string[];
  itemTypes: string[];
  createdAt: string;
  updatedAt: string;
};

type CollectionItems = {
  summaries: Summary[];
  explanations: Explanation[];
  questions: Question[];
  plans: StudyPlan[];
};

type StudyContextType = {
  summaries: Summary[];
  questions: Question[];
  studyPlans: StudyPlan[];
  explanations: Explanation[];
  collections: Collection[];
  stats: StudyStats;
  history: StudyHistoryEntry[];
  addSummary: (summary: Summary) => void;
  addQuestions: (questions: Question[]) => void;
  addStudyPlan: (plan: StudyPlan) => void;
  addExplanation: (explanation: Explanation) => void;
  deleteSummary: (id: string) => void;
  deleteQuestions: (ids: string[]) => void;
  deleteStudyPlan: (id: string) => void;
  deleteExplanation: (id: string) => void;
  updateStats: (update: Partial<StudyStats>) => void;
  incrementQuestionsAnswered: () => void;
  addHistoryEntry: (entry: Omit<StudyHistoryEntry, "id" | "createdAt">) => void;
  clearHistory: () => void;
  clearAllData: () => void;
  getSummaryById: (id: string) => Summary | undefined;
  getExplanationById: (id: string) => Explanation | undefined;
  addCollection: (collection: Omit<Collection, "id" | "createdAt" | "updatedAt">) => Collection;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  addItemToCollection: (collectionId: string, itemId: string, itemType: string) => void;
  addMultipleItemsToCollection: (collectionId: string, itemIds: string[], itemTypes: string[]) => void;
  removeItemFromCollection: (collectionId: string, itemId: string) => void;
  getCollectionItems: (collectionId: string) => CollectionItems;
  isLoading: boolean;
};

const StudyContext = createContext<StudyContextType | undefined>(undefined);

const STORAGE_KEYS = {
  summaries: "study_summaries",
  questions: "study_questions",
  studyPlans: "study_plans",
  explanations: "study_explanations",
  stats: "study_stats",
  history: "study_history",
  collections: "study_collections",
};

const defaultStats: StudyStats = {
  totalStudyHours: 0,
  questionsAnswered: 0,
  summariesCreated: 0,
  streakDays: 0,
  lastStudyDate: null,
};

export function StudyProvider({ children }: { children: ReactNode }) {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [explanations, setExplanations] = useState<Explanation[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [stats, setStats] = useState<StudyStats>(defaultStats);
  const [history, setHistory] = useState<StudyHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const addHistoryEntry = (entry: Omit<StudyHistoryEntry, "id" | "createdAt">) => {
    const newEntry: StudyHistoryEntry = {
      ...entry,
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    const newHistory = [newEntry, ...history];
    const limitedHistory = newHistory.slice(0, 20);
    setHistory(limitedHistory);
    saveHistory(limitedHistory);
  };

  useEffect(() => {
    setHistoryCallback(addHistoryEntry);
  }, [addHistoryEntry]);

  const loadAllData = async () => {
    try {
      const [savedSummaries, savedQuestions, savedPlans, savedExplanations, savedStats, savedHistory, savedCollections] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.summaries),
        AsyncStorage.getItem(STORAGE_KEYS.questions),
        AsyncStorage.getItem(STORAGE_KEYS.studyPlans),
        AsyncStorage.getItem(STORAGE_KEYS.explanations),
        AsyncStorage.getItem(STORAGE_KEYS.stats),
        AsyncStorage.getItem(STORAGE_KEYS.history),
        AsyncStorage.getItem(STORAGE_KEYS.collections),
      ]);

      if (savedSummaries) setSummaries(JSON.parse(savedSummaries));
      if (savedQuestions) setQuestions(JSON.parse(savedQuestions));
      if (savedPlans) setStudyPlans(JSON.parse(savedPlans));
      if (savedExplanations) setExplanations(JSON.parse(savedExplanations));
      if (savedStats) setStats(JSON.parse(savedStats));
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory).map((entry: any) => ({
          ...entry,
          createdAt: new Date(entry.createdAt),
        }));
        setHistory(parsedHistory);
      }
      if (savedCollections) setCollections(JSON.parse(savedCollections));
    } catch (error) {
      console.error("Error loading study data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSummaries = async (data: Summary[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.summaries, JSON.stringify(data));
  };

  const saveQuestions = async (data: Question[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.questions, JSON.stringify(data));
  };

  const saveStudyPlans = async (data: StudyPlan[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.studyPlans, JSON.stringify(data));
  };

  const saveExplanations = async (data: Explanation[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.explanations, JSON.stringify(data));
  };

  const saveStats = async (data: StudyStats) => {
    await AsyncStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(data));
  };

  const saveHistory = async (data: StudyHistoryEntry[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.history, JSON.stringify(data));
  };

  const saveCollections = async (data: Collection[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.collections, JSON.stringify(data));
  };

  const addSummary = (summary: Summary) => {
    const newSummaries = [summary, ...summaries];
    setSummaries(newSummaries);
    saveSummaries(newSummaries);
    const newStats = { ...stats, summariesCreated: stats.summariesCreated + 1 };
    setStats(newStats);
    saveStats(newStats);
    
    const keyword = summary.title.substring(0, 50);
    const newEntry: StudyHistoryEntry = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      actionType: "summary",
      keyword,
      contentId: summary.id,
      createdAt: new Date(),
    };
    const newHistory = [newEntry, ...history];
    const limitedHistory = newHistory.slice(0, 20);
    setHistory(limitedHistory);
    saveHistory(limitedHistory);
  };

  const addQuestions = (newQuestions: Question[]) => {
    const updatedQuestions = [...newQuestions, ...questions];
    setQuestions(updatedQuestions);
    saveQuestions(updatedQuestions);
  };

  const addStudyPlan = (plan: StudyPlan) => {
    const newPlans = [plan, ...studyPlans];
    setStudyPlans(newPlans);
    saveStudyPlans(newPlans);
  };

  const addExplanation = (explanation: Explanation) => {
    const newExplanations = [explanation, ...explanations];
    setExplanations(newExplanations);
    saveExplanations(newExplanations);
    
    const keyword = explanation.concept.substring(0, 50);
    const newEntry: StudyHistoryEntry = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      actionType: "explain",
      keyword,
      contentId: explanation.id,
      createdAt: new Date(),
    };
    const newHistory = [newEntry, ...history];
    const limitedHistory = newHistory.slice(0, 20);
    setHistory(limitedHistory);
    saveHistory(limitedHistory);
  };

  const deleteSummary = (id: string) => {
    const newSummaries = summaries.filter((s) => s.id !== id);
    setSummaries(newSummaries);
    saveSummaries(newSummaries);
  };

  const deleteQuestions = (ids: string[]) => {
    const newQuestions = questions.filter((q) => !ids.includes(q.id));
    setQuestions(newQuestions);
    saveQuestions(newQuestions);
  };

  const deleteStudyPlan = (id: string) => {
    const newPlans = studyPlans.filter((p) => p.id !== id);
    setStudyPlans(newPlans);
    saveStudyPlans(newPlans);
  };

  const deleteExplanation = (id: string) => {
    const newExplanations = explanations.filter((e) => e.id !== id);
    setExplanations(newExplanations);
    saveExplanations(newExplanations);
  };

  const updateStats = (update: Partial<StudyStats>) => {
    const newStats = { ...stats, ...update };
    setStats(newStats);
    saveStats(newStats);
  };

  const incrementQuestionsAnswered = () => {
    const newStats = { ...stats, questionsAnswered: stats.questionsAnswered + 1 };
    setStats(newStats);
    saveStats(newStats);
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  const clearAllData = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.summaries),
        AsyncStorage.removeItem(STORAGE_KEYS.questions),
        AsyncStorage.removeItem(STORAGE_KEYS.studyPlans),
        AsyncStorage.removeItem(STORAGE_KEYS.explanations),
        AsyncStorage.removeItem(STORAGE_KEYS.stats),
        AsyncStorage.removeItem(STORAGE_KEYS.history),
        AsyncStorage.removeItem(STORAGE_KEYS.collections),
      ]);
      setSummaries([]);
      setQuestions([]);
      setStudyPlans([]);
      setExplanations([]);
      setCollections([]);
      setStats(defaultStats);
      setHistory([]);
    } catch (error) {
      console.error("Error clearing data:", error);
    }
  };

  const getSummaryById = (id: string): Summary | undefined => {
    return summaries.find((s) => s.id === id);
  };

  const getExplanationById = (id: string): Explanation | undefined => {
    return explanations.find((e) => e.id === id);
  };

  const addCollection = (collection: Omit<Collection, "id" | "createdAt" | "updatedAt">): Collection => {
    const now = new Date().toISOString();
    const newCollection: Collection = {
      ...collection,
      id: `collection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    const newCollections = [newCollection, ...collections];
    setCollections(newCollections);
    saveCollections(newCollections);
    return newCollection;
  };

  const updateCollection = (id: string, updates: Partial<Collection>) => {
    const newCollections = collections.map((c) =>
      c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
    );
    setCollections(newCollections);
    saveCollections(newCollections);
  };

  const deleteCollection = (id: string) => {
    const newCollections = collections.filter((c) => c.id !== id);
    setCollections(newCollections);
    saveCollections(newCollections);
  };

  const addItemToCollection = (collectionId: string, itemId: string, itemType: string) => {
    const newCollections = collections.map((c) => {
      if (c.id === collectionId) {
        if (c.itemIds.includes(itemId)) {
          return c;
        }
        return {
          ...c,
          itemIds: [...c.itemIds, itemId],
          itemTypes: [...c.itemTypes, itemType],
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    setCollections(newCollections);
    saveCollections(newCollections);
  };

  const addMultipleItemsToCollection = (collectionId: string, itemIds: string[], itemTypes: string[]) => {
    const newCollections = collections.map((c) => {
      if (c.id === collectionId) {
        const existingIds = new Set(c.itemIds);
        const newItemIds = [...c.itemIds];
        const newItemTypes = [...c.itemTypes];
        
        itemIds.forEach((itemId, index) => {
          if (!existingIds.has(itemId)) {
            newItemIds.push(itemId);
            newItemTypes.push(itemTypes[index]);
          }
        });
        
        return {
          ...c,
          itemIds: newItemIds,
          itemTypes: newItemTypes,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    setCollections(newCollections);
    saveCollections(newCollections);
  };

  const removeItemFromCollection = (collectionId: string, itemId: string) => {
    const newCollections = collections.map((c) => {
      if (c.id === collectionId) {
        const index = c.itemIds.indexOf(itemId);
        if (index === -1) {
          return c;
        }
        const newItemIds = [...c.itemIds];
        const newItemTypes = [...c.itemTypes];
        newItemIds.splice(index, 1);
        newItemTypes.splice(index, 1);
        return {
          ...c,
          itemIds: newItemIds,
          itemTypes: newItemTypes,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    setCollections(newCollections);
    saveCollections(newCollections);
  };

  const getCollectionItems = (collectionId: string): CollectionItems => {
    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) {
      return { summaries: [], explanations: [], questions: [], plans: [] };
    }

    const result: CollectionItems = {
      summaries: [],
      explanations: [],
      questions: [],
      plans: [],
    };

    collection.itemIds.forEach((itemId, index) => {
      const itemType = collection.itemTypes[index];
      switch (itemType) {
        case "summary":
          const summary = summaries.find((s) => s.id === itemId);
          if (summary) result.summaries.push(summary);
          break;
        case "explanation":
          const explanation = explanations.find((e) => e.id === itemId);
          if (explanation) result.explanations.push(explanation);
          break;
        case "question":
          const question = questions.find((q) => q.id === itemId);
          if (question) result.questions.push(question);
          break;
        case "plan":
          const plan = studyPlans.find((p) => p.id === itemId);
          if (plan) result.plans.push(plan);
          break;
      }
    });

    return result;
  };

  return (
    <StudyContext.Provider
      value={{
        summaries,
        questions,
        studyPlans,
        explanations,
        collections,
        stats,
        history,
        addSummary,
        addQuestions,
        addStudyPlan,
        addExplanation,
        deleteSummary,
        deleteQuestions,
        deleteStudyPlan,
        deleteExplanation,
        updateStats,
        incrementQuestionsAnswered,
        addHistoryEntry,
        clearHistory,
        clearAllData,
        getSummaryById,
        getExplanationById,
        addCollection,
        updateCollection,
        deleteCollection,
        addItemToCollection,
        addMultipleItemsToCollection,
        removeItemFromCollection,
        getCollectionItems,
        isLoading,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy() {
  const context = useContext(StudyContext);
  if (context === undefined) {
    throw new Error("useStudy must be used within a StudyProvider");
  }
  return context;
}
