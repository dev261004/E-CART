// src/hooks/useSessionWatcher.ts
import { useEffect } from "react";
import api from "@/services/api";
import { isAlreadyLoggingOut, markLoggingOut } from "@/services/logoutState";
import { getAccessToken, clearAuth } from "@/services/authService";
import toast from "react-hot-toast";
import axios from "axios";
import { shouldSuppressSessionWatcherLogout } from "@/services/sessionWatcherState";

export function useSessionWatcher(intervalMs: number = 10000) {
  useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;

    const scheduleNext = () => {
      if (cancelled) return;
      timer = window.setTimeout(ping, intervalMs);
    };

    const ping = async () => {
      if (cancelled) return;

      const token = getAccessToken();
      if (!token) {
        // User probably not logged in yet; check again later
        scheduleNext();
        return;
      }

      try {
        await api.get("/api/auth/session-status");
        // Session OK → schedule next check
        scheduleNext();
      } catch (err: any) {
        console.warn("[useSessionWatcher] session status error", err);

        // If we are in the "grace period" (e.g. just changed password on this device),
        // DO NOT log out, just try again later.
        if (shouldSuppressSessionWatcherLogout()) {
          console.info("[useSessionWatcher] logout suppressed (grace period)");
          scheduleNext();
          return;
        }

        // Only log out on actual auth errors (401/403)
        let status: number | undefined;
        if (axios.isAxiosError(err)) {
          status = err.response?.status;
        }

        if (status === 401 || status === 403) {
          if (!isAlreadyLoggingOut()) {
            markLoggingOut();
            clearAuth();
            toast.error("Your session has ended. Please log in again.");
            setTimeout(() => {
              window.location.href = "/login";
            }, 800);
          }
        } else {
          // Network / server error → don't log out, just try again later
          console.warn(
            "[useSessionWatcher] non-auth error, not logging out, will retry"
          );
          scheduleNext();
        }
      }
    };

    // Start pinging
    ping();

    return () => {
      cancelled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [intervalMs]);
}
