// File: src/components/LoadingPage.tsx
// src/components/LoadingPage.tsx
import React from "react";

type LoadingPageProps = {
  message?: string;
  fullScreen?: boolean;
};

export default function LoadingPage({
  message = "Loading...",
  fullScreen = true,
}: LoadingPageProps) {
  return (
    <div
      className={`${
        fullScreen
          ? "min-h-screen flex items-center justify-center"
          : "flex items-center justify-center py-10"
      } bg-gray-50`}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="w-12 h-12 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>

        {/* Message */}
        <p className="text-gray-700 text-lg font-medium">{message}</p>
      </div>
    </div>
  );
}
