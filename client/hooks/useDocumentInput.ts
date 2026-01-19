import { useState, useCallback } from "react";
import * as DocumentPicker from "expo-document-picker";
import { Platform } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import * as haptics from "@/utils/haptics";

export interface DocumentData {
  uri: string;
  name: string;
  type: string;
  size?: number;
  textContent?: string;
}

interface UseDocumentInputReturn {
  document: DocumentData | null;
  isLoading: boolean;
  error: string | null;
  pickDocument: () => Promise<boolean>;
  removeDocument: () => void;
  clearDocument: () => void;
  getDocumentText: () => string | undefined;
  isDisabled: boolean;
}

async function readTextContent(uri: string, mimeType: string): Promise<string | undefined> {
  const isTextFile = mimeType === "text/plain" || 
                     mimeType === "text/markdown" || 
                     mimeType?.includes("text");
  
  if (!isTextFile) {
    return undefined;
  }

  try {
    const response = await fetch(uri);
    const text = await response.text();
    return text;
  } catch (error) {
    return undefined;
  }
}

export function useDocumentInput(): UseDocumentInputReturn {
  const { authMode } = useAuth();
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDisabled = authMode === "guest";

  const pickDocument = useCallback(async (): Promise<boolean> => {
    if (isDisabled) return false;

    setIsLoading(true);
    setError(null);
    haptics.lightTap();
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const mimeType = asset.mimeType || "application/octet-stream";
        
        const textContent = await readTextContent(asset.uri, mimeType);
        
        setDocument({
          uri: asset.uri,
          name: asset.name,
          type: mimeType,
          size: asset.size,
          textContent,
        });
        haptics.success();
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to pick document";
      setError(errorMessage);
      haptics.error();
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isDisabled]);

  const removeDocument = useCallback((): void => {
    haptics.lightTap();
    setDocument(null);
    setError(null);
  }, []);

  const clearDocument = useCallback((): void => {
    setDocument(null);
    setError(null);
  }, []);

  const getDocumentText = useCallback((): string | undefined => {
    return document?.textContent;
  }, [document]);

  return {
    document,
    isLoading,
    error,
    pickDocument,
    removeDocument,
    clearDocument,
    getDocumentText,
    isDisabled,
  };
}
