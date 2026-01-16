import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

export type AuthMode = "authenticated" | "guest" | null;

export interface User {
  id: string;
  email: string;
  displayName?: string;
  provider: "email" | "google";
}

interface StoredUserCredentials {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  authMode: AuthMode;
  isLoading: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (googleUser: { email: string; name?: string; id: string }) => Promise<{ success: boolean; error?: string }>;
  continueAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "auth_user";
const AUTH_MODE_KEY = "auth_mode";
const USER_CREDENTIALS_PREFIX = "user_";

async function hashPassword(password: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
  return digest;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const [savedUser, savedMode] = await Promise.all([
        AsyncStorage.getItem(AUTH_STORAGE_KEY),
        AsyncStorage.getItem(AUTH_MODE_KEY),
      ]);

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      if (savedMode === "authenticated" || savedMode === "guest") {
        setAuthMode(savedMode);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const saveAuthState = async (newUser: User | null, mode: AuthMode) => {
    try {
      if (newUser) {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      } else {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
      if (mode) {
        await AsyncStorage.setItem(AUTH_MODE_KEY, mode);
      } else {
        await AsyncStorage.removeItem(AUTH_MODE_KEY);
      }
    } catch (error) {
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const getUserCredentialsKey = (email: string): string => {
    return `${USER_CREDENTIALS_PREFIX}${email.toLowerCase().trim()}`;
  };

  const signup = async (email: string, password: string, name?: string): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.toLowerCase().trim();
    
    if (!validateEmail(normalizedEmail)) {
      return { success: false, error: "invalidEmail" };
    }
    if (!validatePassword(password)) {
      return { success: false, error: "passwordMinLength" };
    }

    try {
      const existingUser = await AsyncStorage.getItem(getUserCredentialsKey(normalizedEmail));
      
      if (existingUser) {
        return { success: false, error: "accountExists" };
      }

      const passwordHash = await hashPassword(password);
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const displayName = name?.trim() || normalizedEmail.split("@")[0];

      const credentials: StoredUserCredentials = {
        id: userId,
        email: normalizedEmail,
        displayName,
        passwordHash,
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(getUserCredentialsKey(normalizedEmail), JSON.stringify(credentials));

      const newUser: User = {
        id: userId,
        email: normalizedEmail,
        displayName,
        provider: "email",
      };

      setUser(newUser);
      setAuthMode("authenticated");
      await saveAuthState(newUser, "authenticated");

      return { success: true };
    } catch (error) {
      return { success: false, error: "signupFailed" };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.toLowerCase().trim();
    
    if (!validateEmail(normalizedEmail)) {
      return { success: false, error: "invalidEmail" };
    }
    if (!password || password.length === 0) {
      return { success: false, error: "passwordRequired" };
    }

    try {
      const storedData = await AsyncStorage.getItem(getUserCredentialsKey(normalizedEmail));
      
      if (!storedData) {
        return { success: false, error: "accountNotFound" };
      }

      const credentials: StoredUserCredentials = JSON.parse(storedData);
      const inputPasswordHash = await hashPassword(password);

      if (credentials.passwordHash !== inputPasswordHash) {
        return { success: false, error: "wrongPassword" };
      }

      const authenticatedUser: User = {
        id: credentials.id,
        email: credentials.email,
        displayName: credentials.displayName,
        provider: "email",
      };

      setUser(authenticatedUser);
      setAuthMode("authenticated");
      await saveAuthState(authenticatedUser, "authenticated");

      return { success: true };
    } catch (error) {
      return { success: false, error: "loginFailed" };
    }
  };

  const loginWithGoogle = async (googleUser: { email: string; name?: string; id: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const normalizedEmail = googleUser.email.toLowerCase().trim();
      const userId = `google_${googleUser.id}`;
      const displayName = googleUser.name || normalizedEmail.split("@")[0];

      const newUser: User = {
        id: userId,
        email: normalizedEmail,
        displayName,
        provider: "google",
      };

      setUser(newUser);
      setAuthMode("authenticated");
      await saveAuthState(newUser, "authenticated");

      return { success: true };
    } catch (error) {
      return { success: false, error: "googleLoginFailed" };
    }
  };

  const continueAsGuest = async (): Promise<void> => {
    setUser(null);
    setAuthMode("guest");
    await saveAuthState(null, "guest");
  };

  const logout = async (): Promise<void> => {
    setUser(null);
    setAuthMode(null);
    await saveAuthState(null, null);
  };

  const isGuest = authMode === "guest";

  return (
    <AuthContext.Provider
      value={{
        user,
        authMode,
        isLoading,
        isGuest,
        login,
        signup,
        loginWithGoogle,
        continueAsGuest,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
