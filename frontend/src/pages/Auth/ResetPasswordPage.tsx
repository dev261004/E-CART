import React, { useState, useEffect, JSX } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/validation/forgotResetPasswordSchema";
import { useAsync } from "@/hooks/useAsync";
import messages from "@/utils/messages";
import * as authService from "@/services/authService";

import type { ApiResponse, ApiResult } from "@/types/api";
import { useServerErrors } from "@/hooks/useServerErrors";
import { Eye, EyeOff } from "lucide-react";

const RESEND_COOLDOWN_SECONDS = 60;

export default function ResetPasswordPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as { email?: string; resetToken?: string } | undefined;
  const prefilledEmail = state?.email;
  const initialResetToken = state?.resetToken || "";

  const [form, setForm] = useState<ResetPasswordInput>({
    email: prefilledEmail || "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string>(initialResetToken);

  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState<number>(
    prefilledEmail ? RESEND_COOLDOWN_SECONDS : 0
  );

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

  useEffect(() => {
    if (!prefilledEmail || !initialResetToken) {
      navigate("/forgot-password");
    }
  }, [prefilledEmail, initialResetToken, navigate]);

  // cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(
      () => setCooldown((prev) => (prev > 0 ? prev - 1 : 0)),
      1000
    );
    return () => clearInterval(id);
  }, [cooldown]);

  // 🔹 live validate one field using full schema
  const validateField = (
    fieldName: keyof ResetPasswordInput,
    nextForm: ResetPasswordInput
  ) => {
    const parsed = resetPasswordSchema.safeParse(nextForm);

    let message: string | undefined;
    if (!parsed.success) {
      const issue = parsed.error.issues.find((i) => i.path[0] === fieldName);
      message = issue?.message;
    }

    const newErrors: Record<string, string> = { ...errors };
    if (message) newErrors[fieldName] = message;
    else delete newErrors[fieldName];

    if (errors.global) newErrors.global = errors.global;

    setErrorsObject(newErrors);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof ResetPasswordInput;

    let normalized = value;

    if (fieldName === "otp") {
      // only digits, max 6
      normalized = value.replace(/\D/g, "").slice(0, 6);
    } else if (fieldName === "newPassword" || fieldName === "confirmPassword") {
      // no spaces in passwords
      normalized = value.replace(/\s+/g, "");
    } else {
      normalized = value.trimStart();
    }

    setForm((prev) => {
      const nextForm: ResetPasswordInput = {
        ...prev,
        [fieldName]: normalized,
      };

      validateField(fieldName, nextForm);

      // also revalidate confirmPassword when password changes (for match check)
      if (
        (fieldName === "newPassword" || fieldName === "confirmPassword") &&
        nextForm.confirmPassword
      ) {
        validateField("confirmPassword", nextForm);
      }

      return nextForm;
    });

    if (errors[name]) clearFieldError(name);
    if (successMessage) setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setSuccessMessage(null);

    const finalForm: ResetPasswordInput = {
      ...form,
      otp: form.otp.trim(),
      newPassword: form.newPassword.trim(),
      confirmPassword: form.confirmPassword.trim(),
    };

    const parsed = resetPasswordSchema.safeParse(finalForm);
    if (!parsed.success) {
      const errMap: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path?.[0] as keyof ResetPasswordInput | undefined;
        if (path) errMap[path] = issue.message;
        else errMap.global = issue.message;
      });

      if (!errMap.global) {
        errMap.global = "Please correct the highlighted fields.";
      }

      setErrorsObject(errMap);
      return;
    }

    const payload = {
      email: finalForm.email.trim(),
      otp: finalForm.otp.trim(),
      newPassword: finalForm.newPassword,
      resetToken,
    };

    const { data: runResult, error: runError } = await run(() =>
      authService.resetPassword(payload)
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
    setSuccessMessage(
      successData?.message || "Your password has been reset successfully."
    );

    navigate("/login");
  };

  const handleResendOtp = async () => {
    clearErrors();
    setSuccessMessage(null);

    if (!form.email.trim()) {
      setErrorsObject({
        email: "Email is required to resend OTP.",
      });
      return;
    }

    if (cooldown > 0 || resendLoading) return;

    try {
      setResendLoading(true);
      const { data, error } = await authService.resendOtp({
        email: form.email.trim(),
      });

      if (error) {
        setErrorsObject({
          ...(error.fields || {}),
          global: error.message || messages.ERROR.SERVER_ERROR,
        });
        return;
      }

      if (data?.resetToken) {
        setResetToken(data.resetToken);
      }

      setSuccessMessage(
        data?.message || "OTP has been resent to your email address."
      );

      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err: any) {
      handleServerError(err);
    } finally {
      setResendLoading(false);
    }
  };

  const allFilled =
    form.otp.length === 6 &&
    form.newPassword.trim().length > 0 &&
    form.confirmPassword.trim().length > 0;

  const hasFieldErrors = Object.keys(errors).some(
    (k) => k !== "global" && !!errors[k]
  );

  const isSubmitDisabled = !allFilled || hasFieldErrors || loading;

  const isEmailReadonly = Boolean(prefilledEmail);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-indigo-100 p-4">
      <div className="max-w-4xl w-full bg-white/80 backdrop-blur-md rounded-3xl shadow-xl grid grid-cols-1 md:grid-cols-2 overflow-hidden border border-indigo-50">
        {/* Left illustration */}
        <div className="hidden md:flex items-center justify-center bg-gradient-to-b from-indigo-50 to-white p-8">
          <div className="w-full max-w-sm text-center">
            <h2 className="mt-6 text-2xl font-semibold text-gray-900">
              Set a new password
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter the OTP sent to your email and choose a strong new password.
            </p>
          </div>
        </div>

        {/* Right form */}
        <div className="p-8 sm:p-10">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-extrabold text-gray-900 text-center">
              Reset your password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your email, OTP, and a new password.
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
              {/* Email (read-only) */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>

                <div
                  id="email"
                  className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 bg-gray-50 cursor-not-allowed border-gray-200"
                >
                  {form.email}
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  OTP has been sent to{" "}
                  <span className="font-medium">{form.email}</span>. Please use
                  the OTP received on this email to reset your password.
                </p>
              </div>

              {/* OTP + Resend */}
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="otp"
                    className="block text-sm font-medium text-gray-700"
                  >
                    6-digit OTP
                  </label>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldown > 0 || resendLoading}
                    className={`text-xs font-medium ${
                      cooldown > 0 || resendLoading
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-indigo-600 hover:underline"
                    }`}
                  >
                    {resendLoading
                      ? "Resending..."
                      : cooldown > 0
                      ? `Resend OTP in ${cooldown}s`
                      : "Resend OTP"}
                  </button>
                </div>

                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={form.otp}
                  onChange={handleChange}
                  placeholder="Enter OTP"
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    getError("otp") ? "border-rose-500" : "border-gray-200"
                  }`}
                />
                {getError("otp") && (
                  <p className="mt-1 text-sm text-rose-600">
                    {getError("otp")}
                  </p>
                )}
              </div>

              {/* New password */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  New password
                </label>
                <div className="relative mt-1">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={form.newPassword}
                    onChange={handleChange}
                    placeholder="Enter new password"
                    className={`block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      getError("newPassword")
                        ? "border-rose-500"
                        : "border-gray-200"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {getError("newPassword") && (
                  <p className="mt-1 text-sm text-rose-600">
                    {getError("newPassword")}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Must be 8–16 characters and include uppercase, lowercase,
                  number, and special character.
                </p>
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm password
                </label>
                <div className="relative mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className={`block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      getError("confirmPassword")
                        ? "border-rose-500"
                        : "border-gray-200"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {getError("confirmPassword") && (
                  <p className="mt-1 text-sm text-rose-600">
                    {getError("confirmPassword")}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`w-full inline-flex justify-center items-center px-4 py-2.5 rounded-full text-white text-sm font-medium shadow ${
                  isSubmitDisabled
                    ? "bg-indigo-300 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                    Resetting...
                  </span>
                ) : (
                  "Reset password"
                )}
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
                OTP is valid for 10 minutes. You can resend a new OTP once
                every {RESEND_COOLDOWN_SECONDS} seconds.
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
