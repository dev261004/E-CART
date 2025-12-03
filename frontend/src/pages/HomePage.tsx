import React, { JSX } from "react";
import { useNavigate } from "react-router-dom";

const HomePage = (): JSX.Element => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-indigo-100">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-indigo-50 px-8 py-10 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          Welcome 👋
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          Please sign up or log in to continue.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700 transition"
          >
            Sign Up
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-indigo-200 text-indigo-700 text-sm font-medium bg-white hover:bg-indigo-50 transition"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
