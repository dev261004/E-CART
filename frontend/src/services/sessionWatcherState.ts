// src/services/sessionWatcherState.ts

let suppressLogoutUntil = 0;

/**
 * Call this right after a successful password change on the SAME device.
 * It will prevent the session watcher from logging out for the next `ms` milliseconds.
 */
export function suppressSessionWatcherLogoutFor(ms: number) {
  suppressLogoutUntil = Date.now() + ms;
}

export function shouldSuppressSessionWatcherLogout() {
  return Date.now() < suppressLogoutUntil;
}
