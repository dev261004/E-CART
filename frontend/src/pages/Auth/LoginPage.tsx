import React, { useState, useEffect, JSX,useRef } from "react";
import { useNavigate } from "react-router-dom";

import { loginSchema, type LoginInput } from "@/validation/loginSchema";
import { useAsync } from "@/hooks/useAsync";
import messages from "@/utils/messages";

import * as userService from "@/services/userService";
import { setUser, setAccessToken, setSessionId } from "@/services/authService";
import type { LoginResponseData } from "@/types/user";
import type { ApiResult } from "@/types/api";

import { useServerErrors } from "@/hooks/useServerErrors";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

const ILLUSTRATION_SRC = "./login.jpg";

export default function LoginPage(): JSX.Element {
  const navigate = useNavigate();

  const [form, setForm] = useState<LoginInput>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const { loading, run } = useAsync();

  const {
    errors,
    getError,
    setErrorsObject,
    handleServerError,
    clearFieldError,
    clearErrors,
    globalError,
  } = useServerErrors();

  const emailInputRef = useRef<HTMLInputElement | null>(null);
  
    useEffect(() => {
      emailInputRef.current?.focus();
    }, []);
  
  // live single-field validation
  const validateField = (fieldName: keyof LoginInput, nextForm: LoginInput) => {
    const parsed = loginSchema.safeParse(nextForm);

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
    const fieldName = name as keyof LoginInput;

    let normalized = value;

    if (fieldName === "email") {
      normalized = value.replace(/\s+/g, "").toLowerCase();
    }  else {
      normalized = value.trimStart();
    }

    setForm((prev) => {
      const nextForm = { ...prev, [fieldName]: normalized };
      validateField(fieldName, nextForm);
      return nextForm;
    });

    if (errors[name]) clearFieldError(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      parsed.error.issues.forEach((err) => {
        const path = err.path?.[0] as keyof LoginInput;
        if (path) map[path] = err.message;
        else map.global = err.message;
      });
      map.global ??= "Please correct the highlighted fields.";
      setErrorsObject(map);
      return;
    }

    const payload = {
      email: form.email.trim().toLowerCase(),
      password: form.password,
    };

    const { data: runResult, error: runError } = await run(() =>
      userService.login(payload)
    );

    if (runError) {
      handleServerError(runError);
      return;
    }

    const apiResult = runResult as ApiResult<LoginResponseData>;
//console.log("FULL apiResult:", apiResult);
//console.log("apiResult.data:", apiResult.data);
//console.log("apiResult.error:", apiResult.error); 
if (apiResult.error || !apiResult.data) {
  toast.error(apiResult.error?.message ?? "Login failed");
  return;
}

// 🔐 READ FROM decrypted
const success = apiResult.data;

//console.log("Login success data:", success);
if (!success) {
  toast.error("Invalid login response");
  return;
}

//  console.log("accessToken from login:", success.accessToken);
if (success.accessToken) setAccessToken(success.accessToken);
if (success.user) setUser(success.user);
if (success.sessionId) setSessionId(success.sessionId);

toast.success("Login successful");

setTimeout(() => {
  const role =  success?.user?.role;
 //console.log("user from login :",success.user);
  //console.log("Navigating based on role:", role);
  if (role === "admin") navigate("/admin");
  else if (role === "vendor") navigate("/vendor");
  else if (role === "buyer") navigate("/user");
  else navigate("/unauthorized");
}, 200);

  };

  // disable button until valid
  const allFilled = form.email.length > 0 && form.password.length > 0;
  const hasErrors = Object.keys(errors).some(
    (k) => k !== "global" && !!errors[k]
  );
  const isSubmitDisabled = !allFilled || hasErrors || loading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-indigo-100 p-4">
      <div className="max-w-4xl w-full bg-white/80 backdrop-blur-md rounded-3xl shadow-xl grid grid-cols-1 md:grid-cols-2 overflow-hidden border border-indigo-50">
        {/* LEFT Illustration */}
        <div className="hidden md:flex items-center justify-center bg-gradient-to-b from-indigo-50 to-white p-8">
          <div className="w-full max-w-md text-center">
            <img
              src={ILLUSTRATION_SRC}
              alt="Login illustration"
              className="w-full h-auto object-contain rounded-xl"
            />
            <div className="mt-6 text-center">
              <h3 className="text-2xl font-semibold text-gray-900">
                Welcome back
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Log in to access your account and orders.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT Form */}
        <div className="p-8 sm:p-10">
          <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-extrabold text-gray-900 text-center">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your credentials to continue.
            </p>

            {globalError && (
              <div className="mt-6 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-center">
                {globalError}
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                ref={emailInputRef}
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
                    className={`block w-full rounded-lg border px-3 py-2 ${
                      getError("password") ? "border-red-500" : "border-gray-200"
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
                  <p className="text-sm text-red-600">{getError("password")}</p>
                )}
              </div>

              {/* Links */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="text-sm text-indigo-600 font-medium hover:underline"
                >
                  Create an account
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm text-indigo-600 font-medium hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Login button */}
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
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
