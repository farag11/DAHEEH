import { QueryClient, QueryFunction } from "@tanstack/react-query";
import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Gets the base URL for the Express API server
 * @returns {string} The API base URL
 */
export function getApiUrl(): string {
  // Check for production environment
  const isProduction = process.env.NODE_ENV === "production" ||
                      process.env.EXPO_PUBLIC_ENV === "production" ||
                      !__DEV__;

  // Use production URL for production builds
  if (isProduction) {
    // Use environment variable if available, otherwise fallback to production URL
    return process.env.EXPO_PUBLIC_DOMAIN || "https://daheeh.onrender.com";
  }

  // Try multiple sources for the domain in development
  let host =
    process.env.EXPO_PUBLIC_DOMAIN ||
    Constants.expoConfig?.extra?.domain ||
    Constants.expoConfig?.hostUri?.split(":")[0];

  // For web, use window.location
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.location.origin;
  }

  // For physical Android/iOS devices, use local IP address instead of localhost
  // This allows physical devices to communicate with the server running on the same network
  if (Platform.OS === "android" || Platform.OS === "ios") {
    // Check if we're in development mode and not using a configured domain
    if (!host || host === "localhost" || host === "127.0.0.1") {
      // Use local IP address for physical devices
      // This assumes the server is running on port 5000 on the development machine
      const localIP = process.env.EXPO_PUBLIC_LOCAL_IP || "192.168.1.100"; // Default fallback
      console.log(`Using local IP ${localIP}:5000 for physical device communication`);
      return `http://${localIP}:5000`;
    }
  }

  // Fallback for development (simulator/emulator or when host is configured)
  if (!host) {
    // Use localhost for development
    console.warn("Domain not configured, using localhost:5000");
    return "http://localhost:5000";
  }

  let url = new URL(`https://${host}`);
  return url.href;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);

    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
