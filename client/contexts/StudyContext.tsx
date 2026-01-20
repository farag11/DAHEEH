import React, { createContext, useContext, useState, ReactNode } from 'react';

// Placeholder types, to be replaced with actual types
export type Collection = any;
export type Summary = any;
export type Explanation = any;
export type Question = any;
export type StudyPlan = any;
export type StudyHistoryEntry = any;

interface StudyContextType {
  collections: Collection[];
  addCollection: (collection: Collection) => void;
  addItemToCollection: (collectionId: any, item: any) => void;
  deleteCollection: (collectionId: any) => void;
  updateCollection: (collection: Collection) => void;
  getCollectionItems: (collectionId: any) => any[];
  addMultipleItemsToCollection: (collectionId: any, items: any[]) => void;
  summaries: Summary[];
  explanations: Explanation[];
  questions: Question[];
  studyPlans: StudyPlan[];
  stats: any;
  history: StudyHistoryEntry[];
  clearAllData: () => void;
  clearHistory: () => void;
  addSummary: (summary: Summary) => void;
  getSummaryById: (id: any) => Summary | undefined;
  deleteSummary: (id: any) => void;
  addQuestions: (questions: Question[]) => void;
  incrementQuestionsAnswered: () => void;
  deleteQuestions: (ids: any[]) => void;
  addStudyPlan: (plan: StudyPlan) => void;
  deleteStudyPlan: (id: any) => void;
  addExplanation: (explanation: Explanation) => void;
  getExplanationById: (id: any) => Explanation | undefined;
}

const StudyContext = createContext<StudyContextType | null>(null);

export const StudyProvider = ({ children }: { children: ReactNode }) => {
  const value: StudyContextType = {
    collections: [],
    addCollection: () => {},
    addItemToCollection: () => {},
    deleteCollection: () => {},
    updateCollection: () => {},
    getCollectionItems: () => [],
    addMultipleItemsToCollection: () => {},
    summaries: [],
    explanations: [],
    questions: [],
    studyPlans: [],
    stats: {},
    history: [],
    clearAllData: () => {},
    clearHistory: () => {},
    addSummary: () => {},
    getSummaryById: () => undefined,
    deleteSummary: () => {},
    addQuestions: () => {},
    incrementQuestionsAnswered: () => {},
    deleteQuestions: () => {},
    addStudyPlan: () => {},
    deleteStudyPlan: () => {},
    addExplanation: () => {},
    getExplanationById: () => undefined,
  }; 

  return (
    <StudyContext.Provider value={value}>
      {children}
    </StudyContext.Provider>
  );
};

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
};
