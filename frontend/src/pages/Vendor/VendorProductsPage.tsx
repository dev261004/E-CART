// src/pages/vendor/VendorProductsPage.tsx
import React, { useEffect, useMemo, useState, JSX } from "react";
import { useNavigate } from "react-router-dom";
import productService from "@/services/productService";
import categoryService from "@/services/categoryService";
import { getUser } from "@/services/authService";
import LoadingPage from "@/components/LoadingPage";
import type { IProductsListResult, IProductQuery } from "@/types/product";
import type { ICategory } from "@/types/category";
import { AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

const PLACEHOLDER =
  "/mnt/data/A_2D_digital_vector_graphic_showcases_a_%22404_ERROR.png";

type SortOption = {
  key: string;
  label: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

const SORT_OPTIONS: SortOption[] = [
  { key: "newest", label: "Newest", sortBy: "createdAt", sortOrder: "desc" },
  { key: "oldest", label: "Oldest", sortBy: "createdAt", sortOrder: "asc" },
  { key: "price_low", label: "Price: Low → High", sortBy: "price", sortOrder: "asc" },
  { key: "price_high", label: "Price: High → Low", sortBy: "price", sortOrder: "desc" },
  { key: "title_az", label: "Title: A → Z", sortBy: "title", sortOrder: "desc" },
  { key: "title_za", label: "Title: Z → A", sortBy: "title", sortOrder: "asc" },
];

export default function VendorProductsPage(): JSX.Element {
  const navigate = useNavigate();
  const user = getUser();

  // query / ui state
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [isActive, setIsActive] = useState<string | "">("");

  const [sortOptionKey, setSortOptionKey] = useState<string>(SORT_OPTIONS[0].key);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IProductsListResult | null>(null);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [error, setError] = useState<string | null>(null);

  // delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentSort = useMemo(
    () => SORT_OPTIONS.find((s) => s.key === sortOptionKey) ?? SORT_OPTIONS[0],
    [sortOptionKey]
  );

  // fetch categories for filter dropdown
  useEffect(() => {
    const loadCats = async () => {
      try {
        const res = await categoryService.getCategories({
          page: 1,
          limit: 100,
          isActive: true,
        } as any);
        if (!res.error) setCategories(res.data?.items ?? []);
      } catch {
        // ignore errors
      }
    };
    loadCats();
  }, []);

  const fetchData = async (opts?: Partial<IProductQuery>) => {
    setLoading(true);
    setError(null);
    try {
      const q: IProductQuery = {
        page: opts?.page ?? page,
        limit: opts?.limit ?? limit,
        search: opts?.search ?? (search || undefined),
        category: opts?.category ?? (category || undefined),
        minPrice: opts?.minPrice ?? (minPrice ? Number(minPrice) : undefined),
        maxPrice: opts?.maxPrice ?? (maxPrice ? Number(maxPrice) : undefined),
        isActive:
          opts?.isActive ?? (isActive === "" ? undefined : isActive === "true"),
        sortBy: opts?.sortBy ?? currentSort.sortBy,
        sortOrder: opts?.sortOrder ?? currentSort.sortOrder,
      };

      const res = await productService.getVendorProducts(q);
      if (res.error) {
        setError(res.error.message || "Failed to fetch products");
        setData(null);
      } else {
        setData(res.data ?? null);
        if (res.data && res.data.totalPages > 0 && q.page! > res.data.totalPages) {
          setPage(res.data.totalPages);
        }
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  // initial load + page / limit / sort changes
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, sortOptionKey]);

  // debounced filters/search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchData({ page: 1 });
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, minPrice, maxPrice, isActive]);

  const openDeleteConfirm = (id: string, title: string) => {
    setDeleteTarget({ id, title });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const res = await productService.deleteProduct(deleteTarget.id);
      if (res.error) {
        toast.error(res.error.message ?? "Failed to delete product");
      } else {
        toast.success("Product deleted successfully");
        await fetchData();
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete product");
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/vendor/product/edit/${id}`);
  };

  if (!user)
    return <LoadingPage message="Checking authentication..." fullScreen />;

  return (
    <div
      className="min-h-screen p-6"
      style={{ background: "linear-gradient(180deg,#f7fbff,#eef6f7)" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">My Products</h1>
            <p className="text-sm text-slate-500">
              Manage products you listed — edit, delete or add new ones.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/vendor/product/add")}
              className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700"
            >
              Add Product
            </button>
          </div>
        </div>

        {/* Filters */}
        <div
          className="bg-white/5 p-4 rounded-2xl mb-6 border"
          style={{ backdropFilter: "blur(6px)" }}
        >
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="w-full sm:w-auto">
              <input
                type="search"
                placeholder="Search title"
                value={search}
                autoFocus
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-56 rounded-lg px-3 py-2 border border-gray-200 bg-white/60 text-sm"
              />
            </div>

            {/* Category */}
            <div className="w-full sm:w-44">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg px-3 py-2 border bg-white/60 text-sm"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Min & Max price */}
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                type="number"
                className="w-full sm:w-24 rounded-lg px-3 py-2 border bg-white/60 text-sm"
              />
              <input
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                type="number"
                className="w-full sm:w-24 rounded-lg px-3 py-2 border bg-white/60 text-sm"
              />
            </div>

            {/* Status */}
            <div className="w-full sm:w-40">
              <select
                value={isActive}
                onChange={(e) => setIsActive(e.target.value)}
                className="w-full rounded-lg px-3 py-2 border bg-white/60 text-sm"
              >
                <option value="">Any status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            {/* Sort – pushed to the right on larger screens */}
            <div className="flex items-center gap-2 w-full sm:w-auto md:ml-auto">
              <label className="text-sm text-slate-600 whitespace-nowrap">
                Sort
              </label>
              <select
                value={sortOptionKey}
                onChange={(e) => {
                  setSortOptionKey(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg px-2 py-2 border bg-white/60 text-sm w-36"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>


        {/* Content */}
        <div
          className="rounded-2xl p-4 border"
          style={{ background: "linear-gradient(180deg,#ffffff05,#ffffff03)" }}
        >
          {loading && !data && (
            <div className="py-8 text-center">
              <LoadingPage message="Loading products..." fullScreen={false} />
            </div>
          )}

          {!loading && error && (
            <div className="py-8 text-center text-rose-600">{error}</div>
          )}

          {!loading && !error && (
            <>
              {/* Grid of product cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(data?.items ?? []).map((p) => {
                  const img =
                    p.images && p.images.length > 0
                      ? Array.isArray(p.images)
                        ? p.images[0]
                        : (p.images as any)
                      : PLACEHOLDER;

                  const categoryName =
                    typeof p.category === "string"
                      ? ""
                      : p.category
                        ? (p.category as any).name
                        : "";

                  const descriptionText =
                    typeof p.description === "string" &&
                      p.description.trim().length > 0
                      ? p.description
                      : "No description provided.";

                  return (
                    <div
                      key={p._id}
                      className="rounded-xl overflow-hidden shadow-sm"
                      style={{
                        background: "linear-gradient(180deg,#f8fafc,#eef6f7)",
                      }}
                    >
                      {/* Better image container: aspect ratio + object-contain */}
                      <div className="w-full aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden">
                        <img
                          src={img}
                          alt={p.title}
                          className="max-h-full max-w-full object-contain"
                          loading="lazy"
                        />
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800">
                              {p.title}
                            </h3>
                            <div className="text-sm text-slate-500">
                              {categoryName}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              ₹{p.price.toFixed(2)}
                            </div>
                            <div className="text-xs text-slate-500">
                              {p.stock ?? 0} in stock
                            </div>
                          </div>
                        </div>

                        {/* Description with fallback + tooltip */}
                        <p
                          className="mt-3 text-sm text-slate-600 line-clamp-3"
                          title={descriptionText}
                        >
                          {descriptionText}
                        </p>

                        <div className="mt-4 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(p._id)}
                              className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs sm:text-sm hover:bg-indigo-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                openDeleteConfirm(p._id, p.title)
                              }
                              className="px-3 py-1 rounded-full border text-xs sm:text-sm text-rose-600 hover:bg-rose-50"
                            >
                              Delete
                            </button>
                          </div>

                          <div
                            className={`text-sm font-medium ${p.isActive ? "text-emerald-600" : "text-rose-600"
                              }`}
                          >
                            {p.isActive ? "Active" : "Inactive"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Empty state */}
              {(!data || (data.items?.length ?? 0) === 0) && (
                <div className="py-12 text-center text-slate-500">
                  No products found.
                  <button
                    className="ml-2 text-indigo-600 underline"
                    onClick={() => navigate("/vendor/product/add")}
                  >
                    Add a product
                  </button>
                </div>
              )}

              {/* Pagination */}
              {/* Pagination – show only when there are products */}
              {data && (data.total ?? 0) > 0 && (data.items?.length ?? 0) > 0 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-slate-600">
                    Showing{" "}
                    {(data.items?.length ?? 0) === 0
                      ? 0
                      : (data.page - 1) * data.limit + 1}{" "}
                    -{" "}
                    {Math.min(data.page * data.limit, data.total ?? 0)} of{" "}
                    {data.total ?? 0}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={!data.hasPrev}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={`px-3 py-1 rounded-md text-sm ${!data.hasPrev
                          ? "opacity-40 cursor-not-allowed border"
                          : "bg-white/70 border hover:bg-white"
                        }`}
                    >
                      Prev
                    </button>
                    <div className="px-3 py-1 text-sm">
                      {data.page}/{data.totalPages}
                    </div>
                    <button
                      disabled={!data.hasNext}
                      onClick={() => setPage((p) => p + 1)}
                      className={`px-3 py-1 rounded-md text-sm ${!data.hasNext
                          ? "opacity-40 cursor-not-allowed border"
                          : "bg-white/70 border hover:bg-white"
                        }`}
                    >
                      Next
                    </button>

                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                      className="px-2 py-1 rounded-md border text-sm bg-white/80"
                    >
                      {[6, 9, 12, 24].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

              )}
            </>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6 border border-rose-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="text-rose-500" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete product?
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  You are about to delete{" "}
                  <span className="font-medium">
                    &quot;{deleteTarget.title}&quot;
                  </span>
                  . This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-full border text-sm text-gray-700 bg-white hover:bg-gray-50"
                disabled={!!deletingId}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-full text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                disabled={!!deletingId}
              >
                {deletingId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
