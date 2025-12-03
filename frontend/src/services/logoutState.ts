// src/services/logoutState.ts
let isLoggingOut = false;

export function markLoggingOut() {
  isLoggingOut = true;
}

export function isAlreadyLoggingOut() {
  return isLoggingOut;
}
