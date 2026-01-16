import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { Platform } from "react-native";

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  isOffline: boolean;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: true,
  connectionType: null,
  isOffline: false,
});

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [networkState, setNetworkState] = useState<NetworkContextType>({
    isConnected: true,
    isInternetReachable: true,
    connectionType: null,
    isOffline: false,
  });

  useEffect(() => {
    if (Platform.OS === "web") {
      const handleOnline = () => {
        setNetworkState(prev => ({ ...prev, isConnected: true, isOffline: false }));
      };
      const handleOffline = () => {
        setNetworkState(prev => ({ ...prev, isConnected: false, isOffline: true }));
      };

      if (typeof window !== "undefined") {
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        setNetworkState({
          isConnected: navigator.onLine,
          isInternetReachable: navigator.onLine,
          connectionType: "unknown",
          isOffline: !navigator.onLine,
        });
      }

      return () => {
        if (typeof window !== "undefined") {
          window.removeEventListener("online", handleOnline);
          window.removeEventListener("offline", handleOffline);
        }
      };
    }

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isConnected = state.isConnected ?? false;
      const isInternetReachable = state.isInternetReachable;
      const isOffline = !isConnected || isInternetReachable === false;

      setNetworkState({
        isConnected,
        isInternetReachable,
        connectionType: state.type,
        isOffline,
      });
    });

    NetInfo.fetch().then((state: NetInfoState) => {
      const isConnected = state.isConnected ?? false;
      const isInternetReachable = state.isInternetReachable;
      const isOffline = !isConnected || isInternetReachable === false;

      setNetworkState({
        isConnected,
        isInternetReachable,
        connectionType: state.type,
        isOffline,
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <NetworkContext.Provider value={networkState}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}

export { NetworkContext };
