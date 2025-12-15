// src/utils/env.ts
/**
 * Safe runtime environment accessor for frontend.
 * Tries (in order):
 *  1) process.env (if bundler polyfilled / replaced at build time)
 *  2) import.meta.env (Vite / some setups)
 *  3) window.__ENV (explicit runtime config you can inject)
 *  4) window.NEXT_PUBLIC_* direct (if you set globals)
 *
 * Use getEnv("NEXT_PUBLIC_AUTH_KEY") etc.
 */

export function getEnv(key: string): string | undefined {
  try {
    // 1) process.env (build-time replacement in many setups)
    if (typeof process !== "undefined" && typeof (process as any).env !== "undefined") {
      const val = (process as any).env[key];
      if (typeof val === "string" && val.length > 0) return val;
    }

    // 2) import.meta.env (Vite)
    if (typeof import.meta !== "undefined" && (import.meta as any).env) {
      const val = (import.meta as any).env[key];
      if (typeof val === "string" && val.length > 0) return val;
    }

    // 3) window.__ENV (runtime-injected object)
    if (typeof window !== "undefined" && (window as any).__ENV && (window as any).__ENV[key]) {
      return (window as any).__ENV[key];
    }

    // 4) direct window.<KEY>
    if (typeof window !== "undefined" && (window as any)[key]) {
      return (window as any)[key];
    }

    return undefined;
  } catch (err) {
    console.error("getEnv error:", err);
    return undefined;
  }
}
