import { QueryClient, QueryFunction } from "@tanstack/react-query";
import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Gets the base URL for the Express API server
 * @returns {string} The API base URL
 */
function getApiUrl(): string {
  // Check for production environment
  const isProduction = process.env.NODE_ENV === "production" ||
                      process.env.EXPO_PUBLIC_ENV === "production" ||
                      !__DEV__;

  // Use production URL for production builds
  if (isProduction) {
    // Use environment variable if available, otherwise fallback to production URL
    return process.env.EXPO_PUBLIC_DOMAIN || "https://daheeh.onrender.com";
  }

  // تم استخدام الـ IP الخاص بجهازك لضمان اتصال الموبايل بالسيرفر
  return "http://192.168.1.3:5000";
}

const BASE_URL = getApiUrl(); 

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // بناء الرابط الكامل باستخدام الـ IP
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  
  const res = await fetch(fullUrl, {
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
    // بناء الرابط الكامل للطلبات العادية (GET)
    const path = queryKey.join("/");
    const fullUrl = `${BASE_URL}/${path}`;
    
    const res = await fetch(fullUrl, {
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