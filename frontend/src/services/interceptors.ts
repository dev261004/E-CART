// // src/services/interceptors.ts
// import type {
//   AxiosError,
//   AxiosInstance,
//   AxiosRequestConfig,
//   InternalAxiosRequestConfig,
// } from "axios";
// import { getAccessToken, refreshAccessToken, clearAuth } from "./authService";
// import { isAlreadyLoggingOut, markLoggingOut } from "@/services/logoutState";
// import { shouldSuppressSessionWatcherLogout } from "@/services/sessionWatcherState"; // 🔹 add this


// import toast from "react-hot-toast";

// let refreshPromise: Promise<string | null> | null = null;

// function hardLogout() {
//   // 🔹 If we are in the "grace period" (e.g. just changed password on THIS device),
//   //     do NOT force logout. Let the request fail, but keep user logged in.
//   if (shouldSuppressSessionWatcherLogout()) {
//     console.log("[Interceptor] hardLogout suppressed due to grace period");
//     return;
//   }

//   console.log("[Interceptor] hardLogout called");

//   if (isAlreadyLoggingOut()) return;

//   markLoggingOut();
//   clearAuth();
//   toast.error("Your session has ended. Please log in again.");
//   setTimeout(() => (window.location.href = "/login"), 800);
// }


// export function setupInterceptors(apiInstance: AxiosInstance) {
//   // REQUEST: attach access token
//   apiInstance.interceptors.request.use(
//     (config: InternalAxiosRequestConfig) => {
//       const token = getAccessToken();
//       if (token && config.headers) {
//         (config.headers as any).Authorization = `Bearer ${token}`;
//       }
//       return config;
//     }
//   );

//   // RESPONSE: handle 401 + refresh
//   apiInstance.interceptors.response.use(
//     (response) => response,
//     async (error: AxiosError) => {
//       const status = error.response?.status;
//       const originalRequest = (error.config || {}) as AxiosRequestConfig & {
//         _retry?: boolean;
//       };

//       if (!error.response) {
//         return Promise.reject(error);
//       }

//       const url = originalRequest.url || "";
//       const isLoginCall = url.includes("/api/user/login");
//       const isRefreshCall = url.includes("/api/auth/refresh");
//       //const isSessionStatusCall = url.includes("/api/auth/session-status");

//       // 1) Not 401 → just reject
//       if (status !== 401) {
//         return Promise.reject(error);
//       }

//       // 2) 401 on login → bad credentials from user, no refresh
//       if (isLoginCall) {
//         return Promise.reject(error);
//       }

//       // 3) 401 on /session-status → session dead → hard logout
//       // if (isSessionStatusCall) {
//       //   console.log("[Interceptor] 401 on session-status → hardLogout");
//       //   //hardLogout();
//       //   return Promise.reject(error);
//       // }

//       // 4) 401 on /refresh → refresh token / session invalid → hard logout
//       if (isRefreshCall) {
//         console.log("[Interceptor] 401 on refresh → hardLogout");
//         hardLogout();
//         return Promise.reject(error);
//       }

//       // 5) Already retried once → hard logout
//       if (originalRequest._retry) {
//         console.log("[Interceptor] second 401 on", url, "→ hardLogout");
//         hardLogout();
//         return Promise.reject(error);
//       }

//       // 6) First 401 on a normal API → try refresh
//       originalRequest._retry = true;

//       if (!refreshPromise) {
//         refreshPromise = (async () => {
//           const newAccessToken = await refreshAccessToken();
//           if (!newAccessToken) {
//             console.log("[Interceptor] refresh failed → hardLogout");
//             hardLogout();
//             return null;
//           }
//           return newAccessToken;
//         })().finally(() => {
//           refreshPromise = null;
//         });
//       }

//       const newToken = await refreshPromise;

//       if (!newToken) {
//         // hardLogout already called
//         return Promise.reject(error);
//       }

//       // 7) Refresh succeeded → retry original request
//       originalRequest.headers = originalRequest.headers ?? {};
//       (originalRequest.headers as any).Authorization = `Bearer ${newToken}`;
//       console.log("[Interceptor] retrying with new token:", url);
//       return apiInstance(originalRequest);
//     }
//   );
// }
// src/services/interceptors.ts
import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { getAccessToken, refreshAccessToken, clearAuth } from "./authService";
import { isAlreadyLoggingOut, markLoggingOut } from "@/services/logoutState";
import { shouldSuppressSessionWatcherLogout } from "@/services/sessionWatcherState";
import toast from "react-hot-toast";

import { AES_256_CBC_encrypt, getDecryptedData } from "@/utils/crypto";
import { getEnv } from "@/utils/env";

let refreshPromise: Promise<string | null> | null = null;

function hardLogout() {
  if (shouldSuppressSessionWatcherLogout()) {
    console.log("[Interceptor] hardLogout suppressed due to grace period");
    return;
  }

  if (isAlreadyLoggingOut()) return;

  markLoggingOut();
  clearAuth();
  toast.error("Your session has ended. Please log in again.");
  setTimeout(() => (window.location.href = "/login"), 800);
}

export function setupInterceptors(apiInstance: AxiosInstance) {
  /* =========================
     REQUEST INTERCEPTOR
     ========================= */
  apiInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      try {
        // 1️⃣ Attach access token
        const token = getAccessToken();
        if (token && config.headers) {
          (config.headers as any).Authorization = `Bearer ${token}`;
        }

        // 2️⃣ Encrypt ONLY non-GET requests with X-Encrypt header
        const method = config.method?.toLowerCase();
        const isFormData = config.data instanceof FormData;
        const shouldEncrypt =
          method !== "get" &&
          !isFormData &&
          config.headers &&
          (config.headers as any)["X-Encrypt"] === "1";

        const hasBody = config.data && typeof config.data === "object";
        const alreadyWrapped = !!(config.data && (config.data as any).data);

        if (shouldEncrypt && hasBody && !alreadyWrapped) {
          const json = JSON.stringify(config.data);

          const encrypted = AES_256_CBC_encrypt(
            json,
            getEnv("VITE_PUBLIC_AUTH_KEY"),
            getEnv("VITE_PUBLIC_AUTH_IV")
          );

          config.data = { data: encrypted };

        }
      } catch (err) {
        console.error("[Interceptor] request error:", err);
      }

      return config;
    },
    (err) => Promise.reject(err)
  );

  /* =========================
     RESPONSE INTERCEPTOR
     ========================= */
  apiInstance.interceptors.response.use(
    (response) => {
      try {
        // 🔐 Decrypt successful encrypted responses
        const encryptedPayload = response?.data?.data;

        if (typeof encryptedPayload === "string") {
          const decrypted = getDecryptedData(encryptedPayload);

          response.data = {
            ...response.data,
            decrypted,
          };
        }
      } catch (err) {
        console.error("[Interceptor] response decrypt failed:", err);
      }

      return response;
    },
    async (error: AxiosError) => {
      // 🔐 Try to decrypt encrypted error responses
      if (
        error.response &&
        typeof (error.response.data as any)?.data === "string"
      ) {
        try {
          const decrypted = getDecryptedData(
            (error.response.data as any).data
          );
          (error.response.data as any).decrypted = decrypted;
        } catch {
          /* ignore */
        }
      }

      if (!error.response) {
        return Promise.reject(error);
      }

      const status = error.response.status;
      const originalRequest = error.config as AxiosRequestConfig & {
        _retry?: boolean;
      };

      const url = originalRequest?.url || "";
      const isLoginCall = url.includes("/api/user/login");
      const isRefreshCall = url.includes("/api/auth/refresh");
      const isEncryptedRoute =
        originalRequest?.headers &&
        (originalRequest.headers as any)["X-Encrypt"] === "1";

      // ❗ Do NOT logout on encrypted route failures
      if (status === 401 && isEncryptedRoute) {
        console.warn(
          "[Interceptor] 401 on encrypted route, skipping hard logout"
        );
        return Promise.reject(error);
      }

      if (status !== 401) {
        return Promise.reject(error);
      }

      if (isLoginCall) {
        return Promise.reject(error);
      }

      if (isRefreshCall) {
        hardLogout();
        return Promise.reject(error);
      }

      if (originalRequest._retry) {
        hardLogout();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = (async () => {
          const newToken = await refreshAccessToken();
          if (!newToken) {
            hardLogout();
            return null;
          }
          return newToken;
        })().finally(() => {
          refreshPromise = null;
        });
      }

      const newAccessToken = await refreshPromise;
      if (!newAccessToken) {
        return Promise.reject(error);
      }

      originalRequest.headers = originalRequest.headers ?? {};
      (originalRequest.headers as any).Authorization = `Bearer ${newAccessToken}`;

      return apiInstance(originalRequest);
    }
  );
}
