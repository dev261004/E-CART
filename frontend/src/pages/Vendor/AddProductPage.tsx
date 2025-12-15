// src/pages/vendor/AddProductPage.tsx
import React, { useEffect, useState, JSX } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "@/services/authService";
import categoryService from "@/services/categoryService";
import productService from "@/services/productService";
import { productSchema, type ProductInput } from "@/validation/productSchema";
import LoadingPage from "@/components/LoadingPage";
import type { IListCategoriesResult, ICategory } from "@/types/category";
import type { ApiResult } from "@/types/api";
import { useServerErrors } from "@/hooks/useServerErrors";

export default function AddProductPage(): JSX.Element {
  const navigate = useNavigate();
  const user = getUser();

  const [form, setForm] = useState<ProductInput>({
    title: "",
    price: 10,
    category: "",
    description: "",
    images: [],
    stock: undefined,
  });

  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const {
    errors,
    getError,
    setErrorsObject,
    setFieldError,
    clearFieldError,
    handleServerError,
    clearErrors,
    globalError,
  } = useServerErrors();

  // 1) Fetch categories: only active ones (explicit numeric page/limit)
  useEffect(() => {
    const load = async () => {
      setLoadingCategories(true);
      clearErrors();
      try {
        const res: ApiResult<IListCategoriesResult> =
          await categoryService.getCategories({
            page: 1,
            limit: 50,
            isActive: true,
          } as any);

        if (res.error) {
          setErrorsObject({
            global: res.error.message || "Unable to load categories",
          });
          setCategories([]);
        } else {
          setCategories(res.data?.items ?? []);
        }
      } catch (err: any) {
        handleServerError(err);
      } finally {
        setLoadingCategories(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // generate previews when selectedFiles changes
  useEffect(() => {
    const urls = selectedFiles.map((f) => URL.createObjectURL(f));
    setPreviews(urls);

    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [selectedFiles]);

  // generic field handler with live validation
  const handleChange = <K extends keyof ProductInput>(
    key: K,
    value: ProductInput[K]
  ) => {
    const updatedForm: ProductInput = {
      ...form,
      [key]: value,
    };

    setForm(updatedForm);

    // Run Zod validation on updated form for live feedback
    const parsed = productSchema.safeParse(updatedForm);

    if (!parsed.success) {
      // find error for this specific field
      const fieldIssue = parsed.error.issues.find(
        (issue) => (issue.path?.[0] as keyof ProductInput | undefined) === key
      );
      if (fieldIssue) {
        setFieldError(key as string, fieldIssue.message);
      } else {
        clearFieldError(key as string);
      }
      setIsFormValid(false);
    } else {
      // no validation errors at all
      clearFieldError(key as string);
      setIsFormValid(true);
    }

    // clear success if user edits again
    if (successMsg) {
      setSuccessMsg(null);
    }
  };

  // file selection handler
  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const arr = Array.from(files);
    const total = selectedFiles.length + arr.length;
    if (total > 5) {
      setFieldError("images", "You can upload at most 5 images.");
      return;
    }

    clearFieldError("images");
    setSelectedFiles((prev) => [...prev, ...arr]);
  };

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    clearErrors();

    // final validation on submit
    const parsed = productSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};

      parsed.error.issues.forEach((issue) => {
        const p = issue.path?.[0] as keyof ProductInput | undefined;
        if (p) errs[p] = issue.message;
        else errs.global = issue.message;
      });

      if (!errs.global) {
        errs.global = "Please fill the required fields correctly.";
      }

      setErrorsObject(errs);
      setIsFormValid(false);
      return;
    }

    setIsFormValid(true);
    setLoading(true);

    try {
      // 1. If files selected -> upload and get URLs
      let uploadedUrls: string[] = [];
      if (selectedFiles.length > 0) {
        setUploading(true);
        const uploadRes = await productService.uploadImages(selectedFiles);
        setUploading(false);

        if (uploadRes.error) {
          setErrorsObject({
            global: uploadRes.error.message || "Image upload failed",
          });
          setLoading(false);
          return;
        }
        uploadedUrls = uploadRes.data ?? [];
      }

      // 2. Build payload
      const payload = {
        ...parsed.data,
        images: uploadedUrls.length ? uploadedUrls : parsed.data.images ?? [],
        stock:
          typeof parsed.data.stock === "number"
            ? parsed.data.stock
            : undefined,
      };

      // 3. Call create product endpoint
      const res = await productService.createProduct(payload);
      if (res.error) {
        const fields = res.error.fields || {};
        const msg = res.error.message || "Failed to create product";

        setErrorsObject({
          ...fields,
          global: msg,
        });

        setLoading(false);
        return;
      }

      // success
      setSuccessMsg("Product created successfully.");
      setForm({
        title: "",
        price: 0,
        category: "",
        description: "",
        images: [],
        stock: undefined,
      });
      setSelectedFiles([]);
      setPreviews([]);
      setIsFormValid(false);

      setTimeout(() => navigate("/vendor/products"), 900);
    } catch (err: any) {
      handleServerError(err);
    } finally {
      setLoading(false);
      setUploading(false);
    }

    navigate("/vendor/products")
  };

  // disable button until all required fields are filled & schema is valid
  const requiredFilled =
    form.title.trim().length > 0 &&
    form.category.trim().length > 0 &&
    (form.description ?? "").trim().length > 0 &&
    form.price !== undefined &&
    form.price !== null;

  const isSubmitDisabled =
    loading || uploading || !requiredFilled || !isFormValid;

  // if auth not ready
  if (!user)
    return (
      <LoadingPage
        message="Checking authentication..."
        fullScreen
      />
    );

  return (
    <div
      className="min-h-screen py-6 px-4"
      style={{ background: "linear-gradient(180deg,#f7fbff,#eef6f7)" }}
    >
      <div className="max-w-4xl mx-auto">
        <div
          className="rounded-2xl p-6"
          style={{ background: "linear-gradient(180deg,#ffffff07,#ffffff03)" }}
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Add Product
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Create a product listing for your store.
          </p>

          {successMsg && (
            <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 mb-4">
              {successMsg}
            </div>
          )}

          {globalError && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 mb-4">
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product name
              </label>
              <input
                name="title"
                tabIndex={1}
                autoFocus
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className={`mt-1 block w-full rounded-lg px-3 py-2 border ${
                  getError("title") ? "border-rose-500" : "border-gray-200"
                } bg-white/60`}
                placeholder="e.g. Ceramic Planter"
              />
              {getError("title") && (
                <p className="mt-1 text-sm text-rose-600">
                  {getError("title")}
                </p>
              )}
            </div>

            {/* Price & Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Price
                </label>
                <input
                  name="price"
                  tabIndex={2}
                  type="number"
                  step="1"
                  value={String(form.price ?? "")}
                  onChange={(e) =>
                    handleChange("price", Number(e.target.value))
                  }
                  className={`mt-1 block w-full rounded-lg px-3 py-2 border ${
                    getError("price") ? "border-rose-500" : "border-gray-200"
                  } bg-white/60`}
                  placeholder="500"
                />
                {getError("price") && (
                  <p className="mt-1 text-sm text-rose-600">
                    {getError("price")}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Stock{" "}
                </label>
                <input
                  name="stock"
                  tabIndex={3}
                  type="number"
                  step="1"
                  value={form.stock ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "stock",
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value)
                    )
                  }
                  className={`mt-1 block w-full rounded-lg px-3 py-2 border ${
                    getError("stock") ? "border-rose-500" : "border-gray-200"
                  } bg-white/60`}
                  placeholder="e.g. 10"
                />
                {getError("stock") && (
                  <p className="mt-1 text-sm text-rose-600">
                    {getError("stock")}
                  </p>
                )}
              </div>
            </div>

            {/* Category dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <div className="mt-1">
                <select
                  tabIndex={4}
                  value={form.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 border ${
                    getError("category")
                      ? "border-rose-500"
                      : "border-gray-200"
                  } bg-white/60`}
                >
                  <option value="">-- Select category --</option>
                  {loadingCategories ? (
                    <option>Loading...</option>
                  ) : (
                    categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))
                  )}
                </select>
                {getError("category") && (
                  <p className="mt-1 text-sm text-rose-600">
                    {getError("category")}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                tabIndex={5}
                value={form.description ?? ""}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={5}
                className={`mt-1 block w-full rounded-lg px-3 py-2 border ${
                  getError("description")
                    ? "border-rose-500"
                    : "border-gray-200"
                } bg-white/60`}
                placeholder="Describe the product..."
              />
              {getError("description") && (
                <p className="mt-1 text-sm text-rose-600">
                  {getError("description")}
                </p>
              )}
            </div>

            {/* Image file uploader */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Images (optional, up to 5)
              </label>
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <label
                  tabIndex={6}
                  role="button"
                  className="px-3 py-2 rounded-md bg-indigo-600 text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Select images
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleSelectFiles}
                    className="hidden"
                  />
                </label>

                <div className="flex gap-2 flex-wrap">
                  {previews.map((p, idx) => (
                    <div
                      key={idx}
                      className="w-24 h-24 rounded-md overflow-hidden relative border bg-slate-100"
                    >
                      <img
                        src={p}
                        alt={`preview-${idx}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSelectedFile(idx)}
                        className="absolute top-1 right-1 bg-rose-600 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center"
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Accepted: JPG, PNG. Max 5 files. Files will be uploaded to
                server before product creation.
              </div>
              {getError("images") && (
                <p className="mt-1 text-sm text-rose-600">
                  {getError("images")}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 mt-4">
              <button
                type="submit"
                tabIndex={7}
                disabled={isSubmitDisabled}
                className={`px-4 py-2 rounded-full text-white inline-flex items-center justify-center ${
                  isSubmitDisabled
                    ? "bg-indigo-300 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loading || uploading ? (
                  <>
                    <span className="mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    {uploading ? "Uploading images..." : "Saving..."}
                  </>
                ) : (
                  "Save product"
                )}
              </button>
              <button
                type="button"
                tabIndex={8}
                onClick={() => navigate("/vendor")}
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
