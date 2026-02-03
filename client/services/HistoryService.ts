import AsyncStorage from "@react-native-async-storage/async-storage";

// Define a simple structure for conversation messages locally to avoid path issues.
export interface SimpleMessage {
  type: 'user' | 'assistant' | 'error';
  content: string;
}

export type HistoryItemType = "summary" | "quiz" | "explanation" | "plan";

export interface HistoryItem {
  id: string;
  type: HistoryItemType;
  title: string;
  // Using a flexible content type to store either a simple string or an array of messages.
  content: string | SimpleMessage[];
  timestamp: Date;
}

const HISTORY_KEY = "app_history";

export const HistoryService = {
  async getHistory(): Promise<HistoryItem[]> {
    try {
      const historyJson = await AsyncStorage.getItem(HISTORY_KEY);
      if (historyJson) {
        const history = JSON.parse(historyJson) as any[];
        // Ensure timestamp is a Date object
        return history.map(item => ({
          ...item,
          timestamp: new Date(item.timestamp),
        })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      }
      return [];
    } catch (error) {
      console.error("Error loading history:", error);
      return [];
    }
  },

  async saveHistoryItem(item: Omit<HistoryItem, "id" | "timestamp">): Promise<HistoryItem | null> {
    try {
      const history = await this.getHistory();
      const newItem: HistoryItem = {
        ...item,
        id: Date.now().toString(),
        timestamp: new Date(),
      };
      const updatedHistory = [newItem, ...history];
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      return newItem;
    } catch (error) {
      console.error("Error saving history item:", error);
      return null;
    }
  },

  async deleteHistoryItem(id: string): Promise<void> {
    try {
      const history = await this.getHistory();
      const updatedHistory = history.filter(item => item.id !== id);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error("Error deleting history item:", error);
    }
  },
  
  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  },
};
