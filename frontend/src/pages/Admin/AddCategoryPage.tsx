// src/pages/admin/AddCategoryPage.tsx
import React, { useEffect, useState, JSX } from "react";
import { useNavigate } from "react-router-dom";
import { categorySchema, type CategoryInput } from "@/validation/categorySchema";
import { useAsync } from "@/hooks/useAsync";
import LoadingPage from "@/components/LoadingPage";
import categoryService from "@/services/categoryService";
import { getUser } from "@/services/authService";
import type { CreateCategoryResponse } from "@/types/category";
import type { ApiError, ApiResult } from "@/types/api";
import { useServerErrors } from "@/hooks/useServerErrors";

export default function AddCategoryPage(): JSX.Element {
  const navigate = useNavigate();
  const user = getUser();

  // block if not admin (extra client-side guard)
  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  const [form, setForm] = useState<CategoryInput>({
    name: "",
    description: "",
    isActive: true,
  });

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const { loading, run } =
    useAsync<ApiResult<CreateCategoryResponse>, ApiError>();

  const {
    errors,
    getError,
    setErrorsObject,
    handleServerError,
    clearFieldError,
    clearErrors,
    globalError,
    setFieldError,
  } = useServerErrors();

  function handleChange<K extends keyof CategoryInput>(
    key: K,
    value: CategoryInput[K]
  ) {
    const updatedForm: CategoryInput = { ...form, [key]: value };
    setForm(updatedForm);

    // Live Zod validation for this field
    const parsed = categorySchema.safeParse(updatedForm);

    if (!parsed.success) {
      const fieldIssue = parsed.error.issues.find(
        (issue) => (issue.path?.[0] as keyof CategoryInput | undefined) === key
      );
      if (fieldIssue) {
        setFieldError(key as string, fieldIssue.message);
      } else {
        clearFieldError(key as string);
      }
      setIsFormValid(false);
    } else {
      clearFieldError(key as string);
      setIsFormValid(true);
    }

    // clear success if user edits again
    if (successMsg) {
      setSuccessMsg(null);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    clearErrors();
    setSuccessMsg(null);

    // client-side validation with zod (final check)
    const parsed = categorySchema.safeParse(form);
    if (!parsed.success) {
      const zodErrorMap: Record<string, string> = {};

      parsed.error.issues.forEach((issue) => {
        const path = issue.path?.[0] as keyof CategoryInput | undefined;
        if (path) zodErrorMap[path] = issue.message;
        else zodErrorMap.global = issue.message;
      });

      if (!zodErrorMap.global) {
        zodErrorMap.global = "Please fill all required fields";
      }

      setErrorsObject(zodErrorMap);
      setIsFormValid(false);
      return;
    }

    setIsFormValid(true);

    // prepare payload consistent with backend expectations (capitalize first letter of name)
    const payload = {
      name:
        parsed.data.name.charAt(0).toUpperCase() +
        parsed.data.name.slice(1),
      description: parsed.data.description ?? "",
      isActive:
        typeof parsed.data.isActive === "boolean"
          ? parsed.data.isActive
          : true,
    };

    const { data: runResult, error: runError } = await run(() =>
      categoryService.createCategory(payload)
    );

    if (runError) {
      handleServerError(runError);
      return;
    }

    const apiResult = runResult as ApiResult<CreateCategoryResponse>;

    if (apiResult.error) {
      const fieldErrors = apiResult.error.fields || {};
      const msg = apiResult.error.message || "Failed to create category";

      setErrorsObject({
        ...fieldErrors,
        global: msg,
      });
      return;
    }

    // success
    setSuccessMsg("Category created successfully.");
    setForm({ name: "", description: "", isActive: true });
    setIsFormValid(false);

    setTimeout(() => navigate("/admin/categories"), 1000);
  };

  // Required fields check (only name is required)
  const requiredFilled = (form.name ?? "").trim().length > 0;

  const isSubmitDisabled = loading || !requiredFilled || !isFormValid;

  if (loading)
    return <LoadingPage message="Saving category..." fullScreen={false} />;

  return (
    <div className="flex justify-center mt-10 px-4">
      <div className="w-full max-w-3xl">
        <div className="bg-white rounded-2xl shadow px-6 py-6">
          <div className="flex items-start gap-6">
            <div>
              <h2 className="text-xl font-semibold">Add Category</h2>
              <p className="text-sm text-gray-500">
                Create a new product category.
              </p>
            </div>
          </div>

          {/* Success + Global error */}
          {successMsg && (
            <div className="mt-4 p-3 rounded-md bg-green-50 border border-green-200 text-green-800">
              {successMsg}
            </div>
          )}
          {globalError && (
            <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-800">
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category name
              </label>
              <input
                autoFocus
                tabIndex={1}
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g. Indoor Plants"
                className={`mt-1 block w-full rounded-lg border px-3 py-2 ${
                  getError("name") ? "border-red-500" : "border-gray-200"
                }`}
              />
              {getError("name") && (
                <p className="mt-1 text-sm text-red-600">
                  {getError("name")}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description (optional)
              </label>
              <textarea
                tabIndex={2}
                value={form.description ?? ""}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Short description (max 500 chars)"
                rows={4}
                className={`mt-1 block w-full rounded-lg border px-3 py-2 ${
                  getError("description")
                    ? "border-red-500"
                    : "border-gray-200"
                }`}
              />
              {getError("description") && (
                <p className="mt-1 text-sm text-red-600">
                  {getError("description")}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                tabIndex={3}
                disabled={isSubmitDisabled}
                className={`px-4 py-2 rounded-full text-white inline-flex items-center justify-center ${
                  isSubmitDisabled
                    ? "bg-indigo-300 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loading ? (
                  <>
                    <span className="mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
              <button
                type="button"
                tabIndex={4}
                onClick={() => navigate("/admin")}
                className="px-4 py-2 rounded-full border bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
