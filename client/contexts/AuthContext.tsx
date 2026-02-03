import React, { createContext, useContext, ReactNode } from 'react';

// Define the shape of your context value here
interface AuthContextType {
  authMode: 'guest' | 'authenticated';
  isGuest: boolean;
  login: () => void;
  signup: () => void;
  loginWithGoogle: () => void;
  continueAsGuest: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const value: AuthContextType = {
    authMode: 'guest',
    isGuest: true,
    login: () => {},
    signup: () => {},
    loginWithGoogle: () => {},
    continueAsGuest: () => {},
    logout: () => {},
  }; 

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
