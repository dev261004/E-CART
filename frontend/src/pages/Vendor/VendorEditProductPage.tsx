// src/pages/vendor/VendorEditProductPage.tsx
import React, { useEffect, useState, JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUser } from "@/services/authService";
import categoryService from "@/services/categoryService";
import productService from "@/services/productService";
import { productSchema, type ProductInput } from "@/validation/productSchema";
import type { ICategory } from "@/types/category";
import type { IProduct } from "@/types/product";
import LoadingPage from "@/components/LoadingPage";
import toast from "react-hot-toast";

type FormErrors = Partial<Record<keyof ProductInput | "global", string>>;

export default function VendorEditProductPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = getUser();

  const [form, setForm] = useState<ProductInput>({
    title: "",
    price: 0,
    category: "",
    description: "",
    images: [],
    stock: undefined,
  });

  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSave, setLoadingSave] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
  }, [user, navigate]);

  // Load categories + product
  useEffect(() => {
    const load = async () => {
        
      if (!id) {
        setErrorMsg("Missing product id.");
        setLoading(false);
        return;
      }

      try {
        const catRes = await categoryService.getCategories({
          page: 1,
          limit: 100,
          isActive: true,
        } as any);
        if (!catRes.error) {
          setCategories(catRes.data?.items ?? []);
        }

        const prodRes = await productService.getProductById(id);
        if (prodRes.error || !prodRes.data) {
          setErrorMsg(
            prodRes.error?.message || "Failed to load product details."
          );
          return;
        }

       const p = prodRes.data; 

        setForm({
          title: p.title ?? "",
          price: p.price ?? 0,
          category:
            typeof p.category === "string"
              ? p.category
              : (p.category as any)?._id ?? "",
          description: p.description ?? "",
          images: Array.isArray(p.images) ? p.images : [],
          stock: typeof p.stock === "number" ? p.stock : undefined,
        });
      } catch (err: any) {
        setErrorMsg(err?.message ?? "Failed to load product.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handleChange = <K extends keyof ProductInput>(
    key: K,
    value: ProductInput[K]
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setErrors({});
    setErrorMsg(null);

    const parsed = productSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: FormErrors = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path?.[0] as keyof ProductInput | undefined;
        if (path) fieldErrors[path] = issue.message;
        else fieldErrors.global = issue.message;
      });
      setErrors(fieldErrors);
      setErrorMsg("Please correct the highlighted fields.");
      return;
    }

    setLoadingSave(true);
    try {
      const payload = {
        ...parsed.data,
        stock:
          typeof parsed.data.stock === "number"
            ? parsed.data.stock
            : undefined,
      };

      const res = await productService.updateProduct(id, payload);
      if (res.error) {
        setErrorMsg(res.error.message || "Failed to update product.");
        setErrors((prev) => ({
          ...prev,
          ...(res.error?.fields as any),
        }));
        return;
      }

      toast.success("Product updated successfully");
      navigate("/vendor/products");
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Failed to update product");
      toast.error(err?.message ?? "Failed to update product");
    } finally {
      setLoadingSave(false);
    }
  };

  if (!user) {
    return <LoadingPage message="Checking authentication..." fullScreen />;
  }

  if (loading) {
    return <LoadingPage message="Loading product..." fullScreen />;
  }

  return (
    <div
      className="min-h-screen py-6 px-4"
      style={{ background: "linear-gradient(180deg,#f7fbff,#eef6f7)" }}
    >
      <div className="max-w-4xl mx-auto">
        <div
          className="rounded-2xl p-6 shadow-lg border border-indigo-50"
          style={{ background: "linear-gradient(180deg,#ffffffee,#f5f7ff)" }}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Edit Product
              </h2>
              <p className="text-sm text-gray-600">
                Update your product details. Changes will be reflected instantly.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/vendor/products")}
              className="px-3 py-1.5 rounded-full border text-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to products
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product name
              </label>
              <input
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className={`mt-1 block w-full rounded-lg px-3 py-2 border text-sm bg-white/70 ${
                  errors.title ? "border-rose-500" : "border-gray-200"
                }`}
                placeholder="e.g. Ceramic Planter"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-rose-600">{errors.title}</p>
              )}
            </div>

            {/* Price + Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={String(form.price ?? "")}
                  onChange={(e) =>
                    handleChange("price", Number(e.target.value))
                  }
                  className={`mt-1 block w-full rounded-lg px-3 py-2 border text-sm bg-white/70 ${
                    errors.price ? "border-rose-500" : "border-gray-200"
                  }`}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.price}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Stock
                </label>
                <input
                  type="number"
                  value={form.stock ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "stock",
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value)
                    )
                  }
                  className={`mt-1 block w-full rounded-lg px-3 py-2 border text-sm bg-white/70 ${
                    errors.stock ? "border-rose-500" : "border-gray-200"
                  }`}
                  placeholder="e.g. 10"
                />
                {errors.stock && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.stock}
                  </p>
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className={`mt-1 block w-full rounded-lg px-3 py-2 border text-sm bg-white/70 ${
                  errors.category ? "border-rose-500" : "border-gray-200"
                }`}
              >
                <option value="">-- Select category --</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.category}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={form.description ?? ""}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={5}
                className={`mt-1 block w-full rounded-lg px-3 py-2 border text-sm bg-white/70 ${
                  errors.description ? "border-rose-500" : "border-gray-200"
                }`}
                placeholder="Describe the product..."
              />
              {errors.description && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.description}
                </p>
              )}
            </div>

            {/* <div className="text-xs text-gray-500 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
              Images are kept as-is for now. If you want to support editing
              images, we can reuse the upload logic from Add Product.
            </div> */}

            <div className="flex items-center gap-3 mt-4">
              <button
                type="submit"
                disabled={loadingSave}
                className={`px-4 py-2 rounded-full text-sm text-white font-medium ${
                  loadingSave
                    ? "bg-indigo-300 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loadingSave ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/vendor/products")}
                className="px-4 py-2 rounded-full border text-sm text-gray-700 bg-white hover:bg-gray-50"
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
