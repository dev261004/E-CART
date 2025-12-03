// src/services/interceptors.ts
import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { getAccessToken, refreshAccessToken, clearAuth } from "./authService";
import { isAlreadyLoggingOut, markLoggingOut } from "@/services/logoutState";

import toast from "react-hot-toast";

let refreshPromise: Promise<string | null> | null = null;

function hardLogout() {
  console.log("[Interceptor] hardLogout called");

  // clear everything: accessToken, user, sessionId
   if (isAlreadyLoggingOut()) return;

  markLoggingOut();
  clearAuth();
  toast.error("Your session has ended. Please log in again.");
  setTimeout(() => (window.location.href = "/login"), 800);
}

export function setupInterceptors(apiInstance: AxiosInstance) {
  // REQUEST: attach access token
  apiInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getAccessToken();
      if (token && config.headers) {
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
      return config;
    }
  );

  // RESPONSE: handle 401 + refresh
  apiInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const status = error.response?.status;
      const originalRequest = (error.config || {}) as AxiosRequestConfig & {
        _retry?: boolean;
      };

      if (!error.response) {
        return Promise.reject(error);
      }

      const url = originalRequest.url || "";
      const isLoginCall = url.includes("/api/user/login");
      const isRefreshCall = url.includes("/api/auth/refresh");
      const isSessionStatusCall = url.includes("/api/auth/session-status");

      // 1) Not 401 → just reject
      if (status !== 401) {
        return Promise.reject(error);
      }

      // 2) 401 on login → bad credentials from user, no refresh
      if (isLoginCall) {
        return Promise.reject(error);
      }

      // 3) 401 on /session-status → session dead → hard logout
      if (isSessionStatusCall) {
        console.log("[Interceptor] 401 on session-status → hardLogout");
        //hardLogout();
        return Promise.reject(error);
      }

      // 4) 401 on /refresh → refresh token / session invalid → hard logout
      if (isRefreshCall) {
        console.log("[Interceptor] 401 on refresh → hardLogout");
        hardLogout();
        return Promise.reject(error);
      }

      // 5) Already retried once → hard logout
      if (originalRequest._retry) {
        console.log("[Interceptor] second 401 on", url, "→ hardLogout");
        hardLogout();
        return Promise.reject(error);
      }

      // 6) First 401 on a normal API → try refresh
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = (async () => {
          const newAccessToken = await refreshAccessToken();
          if (!newAccessToken) {
            console.log("[Interceptor] refresh failed → hardLogout");
            hardLogout();
            return null;
          }
          return newAccessToken;
        })().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;

      if (!newToken) {
        // hardLogout already called
        return Promise.reject(error);
      }

      // 7) Refresh succeeded → retry original request
      originalRequest.headers = originalRequest.headers ?? {};
      (originalRequest.headers as any).Authorization = `Bearer ${newToken}`;
      console.log("[Interceptor] retrying with new token:", url);
      return apiInstance(originalRequest);
    }
  );
}
