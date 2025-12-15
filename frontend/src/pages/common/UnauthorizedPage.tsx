// src/pages/UnauthorizedPage.tsx
import React,{JSX} from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Lock, Home, LogIn, Mail } from "lucide-react";
import { clearAuth } from "@/services/authService"; // optional: clear client auth if you want
import toast from "react-hot-toast";

/**
 * Generic Unauthorized page.
 *
 * Usage:
 *  <Route path="/unauthorized" element={<UnauthorizedPage />} />
 *
 * You can also render with props like:
 *  <UnauthorizedPage code={403} message="Forbidden" />
 */
type Props = {
  code?: number;
  message?: string;
  showLogin?: boolean; // show login button (default true)
};

export default function UnauthorizedPage({
  code = 401,
  message = "You don’t have permission to view this page.",
  showLogin = true,
}: Props): JSX.Element {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
  };

  const handleLogin = () => {
    // optional: clear client auth to be safe
    try {
      clearAuth();
    } catch {}
    toast.dismiss();
    navigate("/login");
  };

  const handleContact = () => {
    // navigate to support/contact page or open mailto
    window.location.href = "mailto:support@example.com?subject=Unauthorized%20access%20help";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-indigo-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left illustration + short text */}
        <div className="relative rounded-3xl overflow-hidden p-8 bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-2xl">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/8 rounded-full blur-xl" />

          <div className="relative z-10 flex flex-col items-start gap-6">
            <div className="inline-flex items-center gap-3 bg-white/10 rounded-full px-3 py-1">
              <Lock size={18} />
              <span className="text-sm font-medium">Secure</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
              Access denied
            </h1>

            <p className="text-sm md:text-base text-indigo-100/90 max-w-md">
              {message} If you think this is a mistake, contact support or sign in with an account that has the required permissions.
            </p>

            <div className="mt-2 flex gap-3">
              <button
                onClick={handleGoHome}
                className="inline-flex items-center gap-2 bg-white text-indigo-700 px-4 py-2 rounded-full font-medium shadow hover:scale-[1.02] transition"
                aria-label="Go to home"
              >
                <Home size={16} />
                Home
              </button>

              {showLogin && (
                <button
                  onClick={handleLogin}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 text-white font-medium hover:bg-white/10 transition"
                  aria-label="Sign in"
                >
                  <LogIn size={16} />
                  Sign in
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right card with details + actions */}
        <div className="bg-white rounded-3xl shadow-md p-6 md:p-8">
          <div className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <div className="text-lg font-semibold text-gray-900">{code} — {code === 401 ? "Unauthorized" : "Forbidden"}</div>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              {message}
            </p>

            <div className="w-full border-t my-2" />

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleGoHome}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                aria-label="Go to dashboard"
              >
                <Home size={14} />
                Go home
              </button>

              <button
                onClick={handleContact}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
              >
                 <LogIn size={16} />
                  Sign Up       
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-400">
              Tip: If you recently changed your password or your account was modified, try signing in again.
            </div>
          </div>
        </div>
      </div>

      {/* Decorative corner */}
      <svg className="fixed right-6 bottom-6 opacity-10 w-48 h-48 pointer-events-none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="100" fill="url(#g)"></circle>
      </svg>
    </div>
  );
}
