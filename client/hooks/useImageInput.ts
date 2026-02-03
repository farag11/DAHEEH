import { useState, useCallback, useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "@/contexts/AuthContext";

const MAX_IMAGES = 5;
const LOADING_TIMEOUT_MS = 15000;

export interface ImageData {
  uri: string;
  base64: string;
}

interface UseImageInputReturn {
  images: string[];
  imageData: ImageData[];
  isLoading: boolean;
  cameraPermission: ImagePicker.PermissionStatus | null;
  mediaLibraryPermission: ImagePicker.PermissionStatus | null;
  requestCameraPermission: () => Promise<boolean>;
  requestMediaLibraryPermission: () => Promise<boolean>;
  takePhoto: () => Promise<void>;
  pickFromGallery: () => Promise<void>;
  pasteFromClipboard: () => Promise<boolean>;
  removeImage: (index: number) => void;
  clearImages: () => void;
  getBase64Images: () => string[];
  canAddMore: boolean;
  imageCount: number;
  maxImages: number;
  isDisabled: boolean;
  hasClipboardImage: boolean;
  checkClipboardForImage: () => Promise<void>;
  pasteDetectedImage: () => Promise<boolean>;
}

export function useImageInput(): UseImageInputReturn {
  const { authMode } = useAuth();
  const [imageData, setImageData] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraPermission, setCameraPermission] =
    useState<ImagePicker.PermissionStatus | null>(null);
  const [mediaLibraryPermission, setMediaLibraryPermission] =
    useState<ImagePicker.PermissionStatus | null>(null);
  const [hasClipboardImage, setHasClipboardImage] = useState(false);
  const appState = useRef(AppState.currentState);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isDisabled = authMode === "guest";

  const clearLoadingTimeout = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, []);

  const setLoadingWithTimeout = useCallback((loading: boolean) => {
    clearLoadingTimeout();
    setIsLoading(loading);
    if (loading) {
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn("[useImageInput] Loading timeout - resetting state");
        setIsLoading(false);
      }, LOADING_TIMEOUT_MS);
    }
  }, [clearLoadingTimeout]);

  useEffect(() => {
    return () => {
      clearLoadingTimeout();
    };
  }, [clearLoadingTimeout]);

  const checkClipboardForImage = useCallback(async (): Promise<void> => {
    if (isDisabled) {
      setHasClipboardImage(false);
      return;
    }
    if (imageData.length >= MAX_IMAGES) {
      setHasClipboardImage(false);
      return;
    }
    try {
      const hasImage = await Clipboard.hasImageAsync();
      setHasClipboardImage(hasImage);
    } catch (error) {
      console.error("Clipboard check failed:", error);
      setHasClipboardImage(false);
    }
  }, [isDisabled, imageData.length]);

  useEffect(() => {
    checkClipboardForImage();

    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        checkClipboardForImage();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [checkClipboardForImage]);

  const pasteDetectedImage = useCallback(async (): Promise<boolean> => {
    if (isDisabled) return false;
    if (imageData.length >= MAX_IMAGES) return false;
    if (!hasClipboardImage) return false;

    const success = await pasteFromClipboardInternal();
    if (success) {
      setHasClipboardImage(false);
    }
    return success;
  }, [isDisabled, imageData.length, hasClipboardImage]);

  const pasteFromClipboardInternal = async (): Promise<boolean> => {
    try {
      const hasImage = await Clipboard.hasImageAsync();
      if (!hasImage) {
        return false;
      }

      setLoadingWithTimeout(true);
      const clipboardImage = await Clipboard.getImageAsync({ format: "png" });
      if (clipboardImage && clipboardImage.data) {
        const base64Data = clipboardImage.data.replace(/^data:image\/\w+;base64,/, "");
        const newImage: ImageData = {
          uri: `data:image/png;base64,${base64Data}`,
          base64: base64Data,
        };
        setImageData((prev) => [...prev, newImage]);
        setLoadingWithTimeout(false);
        return true;
      }
      setLoadingWithTimeout(false);
      return false;
    } catch (error) {
      console.error("Failed to paste image from clipboard:", error);
      setLoadingWithTimeout(false);
      return false;
    }
  };

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    setCameraPermission(status);
    return status === ImagePicker.PermissionStatus.GRANTED;
  }, []);

  const requestMediaLibraryPermission =
    useCallback(async (): Promise<boolean> => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      setMediaLibraryPermission(status);
      return status === ImagePicker.PermissionStatus.GRANTED;
    }, []);

  const takePhoto = useCallback(async (): Promise<void> => {
    if (isDisabled) return;
    if (imageData.length >= MAX_IMAGES) return;

    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        console.warn("[useImageInput] Camera permission denied");
        return;
      }

      setLoadingWithTimeout(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const remainingSlots = MAX_IMAGES - imageData.length;
        const newImages = result.assets
          .slice(0, remainingSlots)
          .filter((asset) => asset.uri && asset.base64)
          .map((asset) => ({
            uri: asset.uri,
            base64: asset.base64!,
          }));
        setImageData((prev) => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error("[useImageInput] Failed to take photo:", error);
    } finally {
      setLoadingWithTimeout(false);
    }
  }, [imageData.length, requestCameraPermission, isDisabled, setLoadingWithTimeout]);

  const pickFromGallery = useCallback(async (): Promise<void> => {
    if (isDisabled) return;
    if (imageData.length >= MAX_IMAGES) return;

    try {
      const hasPermission = await requestMediaLibraryPermission();
      if (!hasPermission) {
        console.warn("[useImageInput] Media library permission denied");
        return;
      }

      setLoadingWithTimeout(true);
      const remainingSlots = MAX_IMAGES - imageData.length;
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages = result.assets
          .slice(0, remainingSlots)
          .filter((asset) => asset.uri && asset.base64)
          .map((asset) => ({
            uri: asset.uri,
            base64: asset.base64!,
          }));
        setImageData((prev) => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error("[useImageInput] Failed to pick from gallery:", error);
    } finally {
      setLoadingWithTimeout(false);
    }
  }, [imageData.length, requestMediaLibraryPermission, isDisabled, setLoadingWithTimeout]);

  const pasteFromClipboard = useCallback(async (): Promise<boolean> => {
    if (isDisabled) return false;
    if (imageData.length >= MAX_IMAGES) return false;

    const success = await pasteFromClipboardInternal();
    if (success) {
      setHasClipboardImage(false);
    }
    return success;
  }, [imageData.length, isDisabled]);

  const removeImage = useCallback((index: number): void => {
    setImageData((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearImages = useCallback((): void => {
    setImageData([]);
  }, []);

  const getBase64Images = useCallback((): string[] => {
    return imageData.map((img) => img.base64);
  }, [imageData]);

  const images = imageData.map((img) => img.uri);

  return {
    images,
    imageData,
    isLoading,
    cameraPermission,
    mediaLibraryPermission,
    requestCameraPermission,
    requestMediaLibraryPermission,
    takePhoto,
    pickFromGallery,
    pasteFromClipboard,
    removeImage,
    clearImages,
    getBase64Images,
    canAddMore: imageData.length < MAX_IMAGES,
    imageCount: imageData.length,
    maxImages: MAX_IMAGES,
    isDisabled,
    hasClipboardImage,
    checkClipboardForImage,
    pasteDetectedImage,
  };
}
