// src/pages/SignupPage.tsx
import React, {
  useState,
  useEffect,
  useRef,
  JSX,
} from "react";
import { useNavigate } from "react-router-dom";

import { signupSchema, type SignupInput } from "@/validation/signupSchema";
import { useAsync } from "@/hooks/useAsync";
import messages from "@/utils/messages";

import * as userService from "@/services/userService";
import type { SignupResponseData } from "@/types/user";
import type { ApiResult } from "@/types/api";
import { useServerErrors } from "@/hooks/useServerErrors";

import { Eye, EyeOff } from "lucide-react";

const ILLUSTRATION_SRC = "./signup.jpg";

export default function SignupPage(): JSX.Element {
  const navigate = useNavigate();

  const [form, setForm] = useState<SignupInput>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    role: "buyer",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  // 🔹 For auto-focus on name
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // 🔹 Helper: capitalize each word in name
  const normalizeName = (value: string) => {
    // collapse multiple spaces, trim, then capitalize
    const cleaned = value.replace(/\s+/g, " ").trimStart();
    return cleaned
      .split(" ")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""))
      .join(" ");
  };

  // 🔹 Helper: normalize email -> trim + lowercase
  const normalizeEmail = (value: string) => {
    return value.replace(/\s+/g, "").toLowerCase();
  };

  // 🔹 Helper: normalize phone -> digits only, max 10
  const normalizePhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits.slice(0, 10);
  };

  // 🔹 Helper: normalize generic text -> collapse spaces and trim
  const normalizeText = (value: string) => {
    return value.replace(/\s+/g, " ").trimStart();
  };

  // 🔹 Validate single field using signupSchema
  const validateField = (fieldName: keyof SignupInput, nextForm: SignupInput) => {
    const parsed = signupSchema.safeParse(nextForm);

    let message: string | undefined;
    if (!parsed.success) {
      const issueForField = parsed.error.issues.find(
        (issue) => issue.path[0] === fieldName
      );
      message = issueForField?.message;
    }

    const newErrors: Record<string, string> = { ...errors };

    if (message) {
      newErrors[fieldName] = message;
    } else {
      delete newErrors[fieldName];
    }

    // keep any existing global error untouched here
    if (errors.global) {
      newErrors.global = errors.global;
    }

    setErrorsObject(newErrors);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const fieldName = name as keyof SignupInput;

    let normalizedValue = value;

    if (fieldName === "name") {
      normalizedValue = normalizeName(value);
    } else if (fieldName === "email") {
      normalizedValue = normalizeEmail(value);
    } else if (fieldName === "phoneNumber") {
      normalizedValue = normalizePhone(value);
    } else if (fieldName === "password" || fieldName === "confirmPassword") {
      // trim leading spaces, but allow spaces in the middle if user wants
      normalizedValue = value.replace(/\s+/g, "");
    } else if (fieldName === "role") {
      normalizedValue = value;
    } else {
      normalizedValue = normalizeText(value);
    }

    setForm((prev) => {
      const nextForm = {
        ...prev,
        [fieldName]: normalizedValue,
      };

      // Real-time validation for this field
      validateField(fieldName, nextForm);

      return nextForm;
    });

    // clear field-specific error if any
    if (errors[name]) {
      clearFieldError(name);
    }

    // clear success message when user edits anything
    if (successMessage) {
      setSuccessMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    clearErrors();
    setSuccessMessage(null);

    // Final trim/normalization just before submit
    const finalForm: SignupInput = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phoneNumber: form.phoneNumber.trim(),
      password: form.password.trim(),
      confirmPassword: form.confirmPassword.trim(),
    };

    const parsed = signupSchema.safeParse(finalForm);
    if (!parsed.success) {
      const zodErrorMap: Record<string, string> = {};

      parsed.error.issues.forEach((err) => {
        const path = err.path?.[0] as keyof SignupInput | undefined;
        if (path) zodErrorMap[path] = err.message;
        else zodErrorMap.global = err.message;
      });

      if (!zodErrorMap.global) {
        zodErrorMap.global = "Please correct the highlighted fields.";
      }

      setErrorsObject(zodErrorMap);
      return;
    }

    const payload = {
      name: finalForm.name,
      email: finalForm.email,
      password: finalForm.password,
      phoneNumber: finalForm.phoneNumber,
      role: finalForm.role,
    };

    const { data: runResult, error: runError } = await run(() =>
      userService.signup(payload)
    );

    if (runError) {
      handleServerError(runError);
      return;
    }

    const apiResult = runResult as ApiResult<SignupResponseData>;

    if (apiResult.error) {
      const fieldErrors = apiResult.error.fields || {};
      const msg = apiResult.error.message || messages.ERROR.SERVER_ERROR;

      setErrorsObject({
        ...fieldErrors,
        global: msg,
      });

      return;
    }

    const successData = apiResult.data!;
    setSuccessMessage(
      successData?.user
        ? `${successData.user.name}, your account was created`
        : successData?.message ?? "User registered successfully"
    );

    setTimeout(() => navigate("/login"), 1200);
  };

  // 🔹 Disable button until all fields filled AND no field errors
  const allFieldsFilled =
    form.name.trim().length > 0 &&
    form.email.trim().length > 0 &&
    form.phoneNumber.trim().length === 10 &&
    form.password.trim().length > 0 &&
    form.confirmPassword.trim().length > 0 &&
    form.role.trim().length > 0;

  const hasFieldErrors = Object.keys(errors).some(
    (key) => key !== "global" && !!errors[key]
  );

  const isSubmitDisabled = !allFieldsFilled || hasFieldErrors || loading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-indigo-100 p-4">
      <div className="max-w-4xl w-full bg-white/80 backdrop-blur-md rounded-3xl shadow-xl grid grid-cols-1 md:grid-cols-2 overflow-hidden border border-indigo-50">
        {/* LEFT SIDE — illustration */}
        <div className="hidden md:flex flex-col items-center justify-center p-8 bg-gradient-to-b from-indigo-50 to-white">
          <div className="w-full max-w-md text-center">
            <img
              src={ILLUSTRATION_SRC}
              alt="Signup illustration"
              className="w-full h-auto object-contain"
            />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Start shopping — it only takes a minute.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="p-8 sm:p-10">
          <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-extrabold text-gray-900 text-center">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Start shopping — it only takes a minute.
            </p>

            {/* success */}
            {successMessage && (
              <div className="mt-6 p-3 rounded-md bg-green-50 border border-green-200 text-green-800 text-center">
                {successMessage}
              </div>
            )}

            {/* global error */}
            {globalError && (
              <div className="mt-6 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-center">
                {globalError}
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full name
                </label>
                <input
                  ref={nameInputRef}
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 ${
                    getError("name") ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {getError("name") && (
                  <p className="text-sm text-red-600">{getError("name")}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 ${
                    getError("email") ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {getError("email") && (
                  <p className="text-sm text-red-600">{getError("email")}</p>
                )}
              </div>

              {/* Phone + Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone with static +91 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <div
                    className={`mt-1 flex items-center rounded-lg border px-3 py-2 ${
                      getError("phoneNumber")
                        ? "border-red-500"
                        : "border-gray-200"
                    }`}
                  >
                    <span className="mr-2 text-gray-600 text-sm font-medium">
                      +91
                    </span>
                    <input
                      name="phoneNumber"
                      value={form.phoneNumber}
                      maxLength={10}
                      onChange={handleChange}
                      inputMode="numeric"
                      className="flex-1 outline-none bg-transparent text-sm"
                    />
                  </div>
                  {getError("phoneNumber") && (
                    <p className="text-sm text-red-600">
                      {getError("phoneNumber")}
                    </p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 ${
                      getError("role") ? "border-red-500" : "border-gray-200"
                    }`}
                  >
                    <option value="buyer">Buyer</option>
                    <option value="vendor">Vendor</option>
                  </select>
                  {getError("role") && (
                    <p className="text-sm text-red-600">{getError("role")}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative mt-1">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 ${
                      getError("password")
                        ? "border-red-500"
                        : "border-gray-200"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {getError("password") && (
                  <p className="text-sm text-red-600">
                    {getError("password")}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative mt-1">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 ${
                      getError("confirmPassword")
                        ? "border-red-500"
                        : "border-gray-200"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {getError("confirmPassword") && (
                  <p className="text-sm text-red-600">
                    {getError("confirmPassword")}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`w-full inline-flex justify-center items-center px-4 py-2 rounded-full text-white font-medium shadow ${
                  isSubmitDisabled
                    ? "bg-indigo-300 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  "Create account"
                )}
              </button>

              {/* Already have account */}
              <div className="text-sm text-center text-gray-600">
                Already a member?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-indigo-600 font-medium"
                >
                  Log in
                </button>
              </div>
            </form>

            <p className="mt-6 text-xs text-gray-400 text-center">
              By creating an account, you agree to our{" "}
              <span className="underline">Terms</span> and{" "}
              <span className="underline">Privacy Policy</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
