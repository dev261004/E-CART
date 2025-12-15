// src/pages/common/ChangePasswordPage.tsx
import React, { useEffect, useState, JSX } from "react";
import { useNavigate } from "react-router-dom";
import {
  changePasswordSchema,
  type ChangePasswordFormInput,
} from "@/validation/changePasswordSchema";

import type { ChangePasswordResponseData } from "@/types/auth";
import type { ApiResult } from "@/types/api";
import changePasswordService from "@/services/authService";
import { getUser } from "@/services/authService";
import { useServerErrors } from "@/hooks/useServerErrors";
import LoadingPage from "@/components/LoadingPage";
import toast from "react-hot-toast";
import { LockKeyhole, ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function ChangePasswordPage(): JSX.Element {
  const navigate = useNavigate();
  const user = getUser();

  const [form, setForm] = useState<ChangePasswordFormInput>({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  // Password visibility
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  const {
    errors: fieldErrors,
    globalError,
    setErrorsObject,
    handleServerError,
    clearErrors,
    setFieldError,
    clearFieldError,
  } = useServerErrors();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) {
    return <LoadingPage message="Checking authentication..." fullScreen />;
  }

  const getError = (field: keyof ChangePasswordFormInput | "global") => {
    if (field === "global") return globalError;
    return fieldErrors[field];
  };

  // 🔹 Live validation on change + tabIndex friendly
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const key = name as keyof ChangePasswordFormInput;

    const updatedForm: ChangePasswordFormInput = {
      ...form,
      [key]: value,
    };

    setForm(updatedForm);

    // Run Zod validation on full form
    const parsed = changePasswordSchema.safeParse(updatedForm);

    if (!parsed.success) {
      // Set error only for this specific field
      const issueForField = parsed.error.issues.find(
        (issue) => (issue.path?.[0] as keyof ChangePasswordFormInput | undefined) === key
      );

      if (issueForField) {
        setFieldError(key as string, issueForField.message);
      } else {
        clearFieldError(key as string);
      }

      setIsFormValid(false);
    } else {
      // Form is valid → clear this field error
      clearFieldError(key as string);
      setIsFormValid(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setSubmitting(false); // ensure false before validation

    const parsed = changePasswordSchema.safeParse(form);
    if (!parsed.success) {
      const errors: Partial<
        Record<keyof ChangePasswordFormInput | "global", string>
      > = {};

      parsed.error.issues.forEach((issue) => {
        const path = issue.path?.[0] as
          | keyof ChangePasswordFormInput
          | undefined;
        if (path) errors[path] = issue.message;
        else errors.global = issue.message;
      });

      setErrorsObject(errors);
      setIsFormValid(false);
      return;
    }

    setIsFormValid(true);
    setSubmitting(true);

    const payload = {
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    };

    try {
      const res: ApiResult<ChangePasswordResponseData> =
        await changePasswordService.changePassword(payload);

      if (res.error) {
        handleServerError(res.error);
        toast.error(res.error.message ?? "Failed to change password");
        setSubmitting(false);
        return;
      }

      setForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });

      toast.success("Password changed successfully");
    } catch (err: any) {
      handleServerError(err);
      toast.error(
        err?.message ?? "Something went wrong while changing password"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabel =
    user?.role === "admin"
      ? "Admin"
      : user?.role === "vendor"
      ? "Vendor"
      : "Buyer";

  // All fields must be filled
  const requiredFilled =
    form.currentPassword.trim().length > 0 &&
    form.newPassword.trim().length > 0 &&
    form.confirmNewPassword.trim().length > 0;

  const isSubmitDisabled = submitting || !requiredFilled || !isFormValid;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-indigo-50 to-slate-100 px-4 py-8">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT PANEL */}
        <div className="hidden md:flex flex-col justify-center bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-500 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 -left-10 w-32 h-32 bg-indigo-900/30 rounded-full blur-2xl" />

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
              <ShieldCheck size={16} />
              <span>Secure account control</span>
            </div>

            <h2 className="text-3xl font-semibold leading-tight">
              Keep your account
              <br />
              <span className="font-bold">safe & protected</span>
            </h2>

            <p className="text-sm text-indigo-100">
              When you change your password, all other logged-in devices will be
              signed out automatically. Only this device will stay authenticated.
            </p>

            <ul className="mt-4 space-y-2 text-sm text-indigo-100">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                <span>
                  Auto logout on other devices after password change.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                <span>
                  Strong password requirements enforced for your safety.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                <span>
                  Works seamlessly for Admin, Vendor, and Buyer accounts.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* RIGHT PANEL – form */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <LockKeyhole className="text-indigo-600" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Change password
                </h1>
                <p className="text-xs text-gray-500">
                  Logged in as{" "}
                  <span className="font-medium">
                    {user?.email ?? user?.name ?? "User"}
                  </span>{" "}
                  · <span className="capitalize">{roleLabel}</span>
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            For your security, changing your password will sign you out from all
            other devices. Only this session will stay logged in.
          </p>

          {getError("global") && (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {getError("global")}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Current password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Current password
              </label>
              <div className="relative">
                <input
                  autoFocus
                  tabIndex={1}
                  type={showCurrent ? "text" : "password"}
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter current password"
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    getError("currentPassword")
                      ? "border-rose-500"
                      : "border-gray-200"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowCurrent((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={2}
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {getError("currentPassword") && (
                <p className="mt-1 text-xs text-rose-600">
                  {getError("currentPassword")}
                </p>
              )}
            </div>

            {/* New password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                New password
              </label>
              <div className="relative">
                <input
                  tabIndex={3}
                  type={showNew ? "text" : "password"}
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    getError("newPassword")
                      ? "border-rose-500"
                      : "border-gray-200"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowNew((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={4}
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {getError("newPassword") && (
                <p className="mt-1 text-xs text-rose-600">
                  {getError("newPassword")}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Must be 8–16 characters, include uppercase, lowercase, number
                and special character.
              </p>
            </div>

            {/* Confirm new password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  tabIndex={5}
                  type={showConfirm ? "text" : "password"}
                  name="confirmNewPassword"
                  value={form.confirmNewPassword}
                  onChange={handleChange}
                  placeholder="Re-enter new password"
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    getError("confirmNewPassword")
                      ? "border-rose-500"
                      : "border-gray-200"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={6}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {getError("confirmNewPassword") && (
                <p className="mt-1 text-xs text-rose-600">
                  {getError("confirmNewPassword")}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              tabIndex={7}
              disabled={isSubmitDisabled}
              className={`mt-2 w-full inline-flex justify-center items-center px-4 py-2 rounded-full text-sm font-medium text-white shadow ${
                isSubmitDisabled
                  ? "bg-indigo-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {submitting && (
                <span className="mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              )}
              {submitting ? "Changing password..." : "Change password"}
            </button>
          </form>

          <button
            type="button"
            tabIndex={8}
            onClick={() => navigate(-1)}
            className="mt-4 w-full text-center text-xs text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
