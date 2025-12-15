/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/authService.ts
import { IUser } from "@/types/user";
import axios from "axios";
import api from "@/services/api";
import type { ApiResponse, ApiResult } from "@/types/api";

import type {
  IResetPasswordPayload,
  ChangePasswordPayload,
  ChangePasswordResponseData,
} from "@/types/auth";

import { suppressSessionWatcherLogoutFor } from "@/services/sessionWatcherState"; // 🔹 add this

const ACCESS_KEY = "accessToken";
const USER_KEY = "user";

export const getAccessToken = (): string | null =>
  localStorage.getItem(ACCESS_KEY);

export const setAccessToken = (t: string) =>
  localStorage.setItem(ACCESS_KEY, t);

export function setSessionId(sessionId: string) {
  localStorage.setItem("sessionId", sessionId);
}

export function getSessionId(): string | null {
  return localStorage.getItem("sessionId");
}

export const clearAuth = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("sessionId"); // 🔹 remove sessionId too

  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem("sessionId"); // optional, just in case
};

export const setUser = (u: IUser) =>
  localStorage.setItem(USER_KEY, JSON.stringify(u));

export const getUser = (): IUser | null => {
  const s = localStorage.getItem(USER_KEY);
  if (!s) return null;
  try {
    return JSON.parse(s) as IUser;
  } catch {
    return null;
  }
};

const refreshClient = axios.create({
  baseURL: "http://localhost:4000",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const res = await refreshClient.post(
      "/api/auth/refresh",
      {},
      {
        headers: {
     
          "X-Encrypt": "0",     // 🚨 force disable encryption
        },
      }
    );

    const newAccess = res.data?.data?.accessToken;
    if (newAccess) setAccessToken(newAccess);
    return newAccess;
  } catch (err: any) {
    console.warn("[authService] refreshAccessToken failed", err?.response?.status);
    return null;
  }
};

export const logoutRequest = async () => {
  try {
    // backend clears refresh cookie + DB token
    const res = await api.post("/api/user/logout", {}, { withCredentials: true });
    return res.data;
  } catch (err) {
    console.error("Logout error:", err);
    throw err;
  }
};

export async function forgotPassword(
  payload: { email: string }
): Promise<ApiResult<ApiResponse>> {
  const res = await api.post(
    "/api/auth/forgot-password",
    payload,
    {
      headers: {
        "X-Encrypt": "1", // 🔐 trigger encryption
      },
    }
  );

  const envelope = res?.data ?? {};

  // 🔐 prefer decrypted payload if present
  const responseData =
    (envelope as any).decrypted ?? envelope.data ?? null;

  return {
    data: responseData,
    message: envelope.message,
    error: envelope.error ?? null,
  };
}


export async function resetPassword(payload: IResetPasswordPayload) {
  const res = await api.post("/api/auth/reset-password", payload);
  return res.data as ApiResult<ApiResponse>;
}

export async function resendOtp(
  payload: { email: string }
): Promise<ApiResult<{ message?: string; resetToken?: string }>> {
  const res = await api.post(
    "/api/auth/resend-otp",
    payload,
    {
      headers: {
        "X-Encrypt": "1", // 🔐 trigger encryption
      },
    }
  );

  const envelope = res?.data ?? {};

  // 🔐 prefer decrypted payload if present
  const responseData =
    (envelope as any).decrypted ?? envelope.data ?? null;

  return {
    data: responseData,
    message: envelope.message,
    error: envelope.error ?? null,
  };
}


// 🔹 UPDATED: changePassword now also updates accessToken and gives watcher a grace period
const changePassword = async (
  payload: ChangePasswordPayload
): Promise<ApiResult<ChangePasswordResponseData>> => {
  try {
    const res = await api.post("/api/auth/change-password", payload, {
      withCredentials: true,
    });

    const envelope = res?.data ?? {};
//console.log("change-password decrypted:", envelope.decrypted);

    // 🔐 IMPORTANT: prefer decrypted payload
    const data =
      (envelope as any).decrypted ??
      envelope.data ??
      null;

    if (data?.accessToken) {
      setAccessToken(data.accessToken);

      // Grace period so this device isn't logged out
      suppressSessionWatcherLogoutFor(10000);
    }

    return {
      data,
      message: envelope.message,
      error: null,
    };
  } catch (err: any) {
    const server = err?.response?.data;
    const message =
      server?.message ?? err?.message ?? "Failed to change password";
    const fields = server?.data?.errors || server?.errors || undefined;

    return {
      data: null,
      message: undefined,
      error: { message, fields },
    };
  }
};


export default {
  changePassword,
};
