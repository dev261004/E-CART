import React, { useState, JSX } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast"; 
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/validation/forgotResetPasswordSchema";
import { useAsync } from "@/hooks/useAsync";
import LoadingPage from "@/components/LoadingPage";
import messages from "@/utils/messages";
import * as authService from "@/services/authService";

import type { ApiResponse, ApiResult } from "@/types/api";
import { useServerErrors } from "@/hooks/useServerErrors";


export default function ForgotPasswordPage(): JSX.Element {
  const navigate = useNavigate();

  const [form, setForm] = useState<ForgotPasswordInput>({ email: "" });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { loading, run } = useAsync();
  const {
    errors,
    getError,
    setErrorsObject,
    clearFieldError,
    handleServerError,
    clearErrors,
    globalError,
  } = useServerErrors();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;

  // 🔹 Email — lowercase + no spaces allowed
  const normalized =
    name === "email"
      ? value.replace(/\s+/g, "").toLowerCase()
      : value;

  setForm((prev) => ({ ...prev, [name]: normalized }));

  // Clear error for this field while typing
  if (errors[name]) clearFieldError(name);

  // Clear success message if editing again
  if (successMessage) setSuccessMessage(null);
};


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  clearErrors();
  setSuccessMessage(null);

  const parsed = forgotPasswordSchema.safeParse(form);
  if (!parsed.success) {
    const errMap: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const path = issue.path?.[0] as keyof ForgotPasswordInput | undefined;
      if (path) errMap[path] = issue.message;
      else errMap.global = issue.message;
    });
    if (!errMap.global) {
      errMap.global = "Please fix the highlighted field.";
    }
    setErrorsObject(errMap);
    return;
  }

  const payload = { email: parsed.data.email.trim() };

  const { data: runResult, error: runError } = await run(() =>
    authService.forgotPassword(payload)
  );

  if (runError) {
    handleServerError(runError);
    return;
  }

const apiResult = runResult as ApiResult<ApiResponse>;

if (apiResult.error) {
  setErrorsObject({
    ...(apiResult.error.fields || {}),
    global: apiResult.error.message || messages.ERROR.SERVER_ERROR,
  });
  return;
}

const successData = apiResult.data;

// you saw in logs: successData = { resetToken: "..." }
const resetToken = (successData as any)?.resetToken as string | undefined;

if (!resetToken) {
  toast.error("Reset token is not provided.");
  return;
}

toast.success("OTP has been sent to your email address.");

navigate("/reset-password", {
  state: {
    email: payload.email,
    resetToken,           // 👈 this will populate prefilledEmail & initialResetToken
  },
});

};



  if (loading) {
    return <LoadingPage message="Sending OTP..." fullScreen />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-indigo-100 p-4">
      <div className="max-w-4xl w-full bg-white/80 backdrop-blur-md rounded-3xl shadow-xl grid grid-cols-1 md:grid-cols-2 overflow-hidden border border-indigo-50">
        {/* Left side illustration */}
        <div className="hidden md:flex items-center justify-center bg-gradient-to-b from-indigo-50 to-white p-8">
          <div className="w-full max-w-sm text-center">
            <h2 className="mt-6 text-2xl font-semibold text-gray-900">
              Forgot your password?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email and we&apos;ll send you a one-time OTP to reset your password.
            </p>
          </div>
        </div>

        {/* Right side form */}
        <div className="p-8 sm:p-10">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-extrabold text-gray-900 text-center">
              Reset your password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              We&apos;ll send a 6-digit OTP to your email.
            </p>

            {successMessage && (
              <div className="mt-6 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-center">
                {successMessage}
              </div>
            )}

            {globalError && (
              <div className="mt-6 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-center">
                {globalError}
              </div>
            )}

            <form
              className="mt-6 space-y-4"
              onSubmit={handleSubmit}
              noValidate
            >
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    getError("email") ? "border-rose-500" : "border-gray-200"
                  }`}
                />
                {getError("email") && (
                  <p className="mt-1 text-sm text-rose-600">
                    {getError("email")}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full inline-flex justify-center items-center px-4 py-2.5 rounded-full text-white text-sm font-medium shadow bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Send OTP
              </button>

              <div className="text-sm text-center text-gray-600 mt-2">
                Remembered your password?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-indigo-600 font-medium hover:underline"
                >
                  Back to login
                </button>
              </div>

              <div className="text-xs text-gray-400 text-center mt-4">
                Make sure to check your spam or promotions folder if you don&apos;t see the email.
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
