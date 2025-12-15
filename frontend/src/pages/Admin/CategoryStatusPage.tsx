// src/pages/admin/CategoryStatusPage.tsx
import React, { useEffect, useState, JSX } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  ShieldOff,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,      // 👈 NEW
} from "lucide-react";

import categoryService from "@/services/categoryService";
import type { IListCategoriesResult, ICategoryQuery } from "@/types/category";
import { logoutRequest, clearAuth, getUser } from "@/services/authService";
import { listCategorySchema } from "@/validation/categorySchema";
import LoadingPage from "@/components/LoadingPage";
import { useServerErrors } from "@/hooks/useServerErrors";
import { LogOut } from "lucide-react";
import toast from "react-hot-toast";

export default function CategoryStatusPage(): JSX.Element {
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    if (!user) navigate("/login");
    else if (user.role !== "admin") navigate("/login");
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      console.warn("Logout failed; clearing client state.");
    } finally {
      clearAuth();
      navigate("/login");
    }
  };

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [data, setData] = useState<IListCategoriesResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // 👇 NEW: confirm modal target
  const [confirmTarget, setConfirmTarget] = useState<{
    id: string;
    name: string;
    isActive: boolean;
  } | null>(null);

  const { globalError, setErrorsObject, handleServerError, clearErrors } =
    useServerErrors();

  const buildQuery = (): ICategoryQuery => {
    const raw = {
      page,
      limit,
      search: search.trim() || undefined,
      isActive:
        statusFilter === ""
          ? undefined
          : statusFilter === "active"
          ? true
          : false,
      sortBy: "name",
      sortOrder,
    };

    const parsed = listCategorySchema.safeParse(raw as any);
    if (!parsed.success) {
      return { page: 1, limit: 10, sortBy: "name", sortOrder: "asc" };
    }
    return parsed.data as unknown as ICategoryQuery;
  };

  const fetchCategories = async () => {
    setLoading(true);
    clearErrors();
    try {
      const q = buildQuery();
      const res = await categoryService.getCategories(q);

      if (res.error) {
        setErrorsObject({
          global: res.error.message || "Failed to load categories",
        });
        setData(null);
      } else {
        setData(res.data ?? null);
      }
    } catch (err: any) {
      handleServerError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (page === 1) fetchCategories();
      else setPage(1);
    }, 300);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, limit, sortOrder]);

  const toggleSort = () =>
    setSortOrder((s) => (s === "asc" ? "desc" : "asc"));

  const goToPage = (p: number) => {
    if (!data) {
      setPage(p);
      return;
    }
    const safe = Math.max(1, Math.min(p, data.totalPages || 1));
    setPage(safe);
  };

  // 👇 Actual toggle logic (no confirm here)
  const performToggleActive = async (
    id: string,
    name: string,
    currentActive: boolean
  ) => {
    if (updatingId) return;

    setUpdatingId(id);

    // optimistic update
    const prevData = data;
    setData((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((c) =>
              c._id === id ? { ...c, isActive: !currentActive } : c
            ),
          }
        : prev
    );

    try {
      const res = await categoryService.setCategoryActive(id, !currentActive);

      if (res.error) {
        toast.error(res.error.message || "Failed to update category");
        setData(prevData);
      } else {
        toast.success(
          !currentActive
            ? `Category "${name}" activated`
            : `Category "${name}" deactivated`
        );
      }
    } catch (err: any) {
      console.error("setCategoryActive error:", err);
      toast.error("Something went wrong updating category");
      setData(prevData);
    } finally {
      setUpdatingId(null);
      setConfirmTarget(null);
    }
  };

  // 👇 When user clicks Activate/Deactivate button → open confirm modal
  const handleToggleClick = (id: string, name: string, currentActive: boolean) => {
    setConfirmTarget({ id, name, isActive: currentActive });
  };

  const renderRows = () => {
    if (!data || data.items.length === 0) {
      return (
        <div className="py-16 text-center">
          <h3 className="mt-4 text-lg font-semibold text-gray-800">
            No categories match your filters
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Try adjusting search text or status filter.
          </p>
        </div>
      );
    }

    return (
      <div className="w-full">
        {/* Desktop table */}
        <div className="hidden md:block overflow-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-slate-50/80">
              <tr className="text-left">
                <th className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <button
                    onClick={toggleSort}
                    className="inline-flex items-center gap-2 focus:outline-none"
                  >
                    <span>Name</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        sortOrder === "asc" ? "rotate-180" : ""
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 9l6-6 6 6M6 15l6 6 6-6"
                      />
                    </svg>
                  </button>
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Description
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {data.items.map((c) => {
                const isUpdating = updatingId === c._id;
                return (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-4 align-top">
                      <div className="text-sm font-semibold text-gray-900">
                        {c.name}
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top text-sm text-gray-600 max-w-xl">
                      {c.description || (
                        <span className="text-gray-300">No description</span>
                      )}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold ${
                          c.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-rose-50 text-rose-700 border border-rose-100"
                        }`}
                      >
                        {c.isActive ? (
                          <ShieldCheck size={14} />
                        ) : (
                          <ShieldOff size={14} />
                        )}
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-top text-right">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          handleToggleClick(c._id, c.name, c.isActive ?? false)
                        }
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm transition ${
                          c.isActive
                            ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        } ${isUpdating ? "opacity-70 cursor-wait" : ""}`}
                      >
                        {isUpdating ? (
                          <>
                            <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                            Updating...
                          </>
                        ) : c.isActive ? (
                          <>
                            <ShieldOff size={14} />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={14} />
                            Activate
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-4">
          {data.items.map((c) => {
            const isUpdating = updatingId === c._id;
            return (
              <div
                key={c._id}
                className="bg-white rounded-xl p-4 shadow-sm border border-slate-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {c.name}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      {c.description || (
                        <span className="text-gray-300">No description</span>
                      )}
                    </div>
                    <div className="mt-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${
                          c.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-rose-50 text-rose-700 border border-rose-100"
                        }`}
                      >
                        {c.isActive ? (
                          <ShieldCheck size={12} />
                        ) : (
                          <ShieldOff size={12} />
                        )}
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() =>
                      handleToggleClick(c._id, c.name, c.isActive ?? false)
                    }
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm transition ${
                      c.isActive
                        ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    } ${isUpdating ? "opacity-70 cursor-wait" : ""}`}
                  >
                    {isUpdating ? (
                      <>
                        <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        Updating...
                      </>
                    ) : c.isActive ? (
                      <>
                        <ShieldOff size={14} />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={14} />
                        Activate
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPagination = () => {
    if (!data || !data.items || data.items.length === 0 || data.total === 0)
      return null;

    const pages: number[] = [];
    const totalPages = data.totalPages || 1;
    if (totalPages <= 1) return null;

    let start: number;
    let end: number;

    if (totalPages <= 5) {
      start = 1;
      end = totalPages;
    } else {
      start = Math.max(1, page - 2);
      end = Math.min(totalPages, start + 4);
      if (end - start < 4) {
        start = Math.max(1, end - 4);
      }
    }

    for (let p = start; p <= end; p++) pages.push(p);

    return (
      <div className="sticky bottom-0 bg-gradient-to-r from-white/70 to-white/40 backdrop-blur-sm py-3 flex items-center justify-between gap-4 border-t px-4">
        <div className="flex items-center gap-2">
          <button
            disabled={!data.hasPrev}
            onClick={() => goToPage(page - 1)}
            className={`px-3 py-1 rounded-md border text-sm ${
              !data.hasPrev
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-gray-100"
            }`}
          >
            Prev
          </button>

          <div className="flex items-center gap-2">
            {pages.map((p) => (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`px-3 py-1 rounded-md text-sm ${
                  p === page
                    ? "bg-indigo-600 text-white"
                    : "border hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            disabled={!data.hasNext}
            onClick={() => goToPage(page + 1)}
            className={`px-3 py-1 rounded-md border text-sm ${
              !data.hasNext
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-gray-100"
            }`}
          >
            Next
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-4">
            <span>
              Page {data.page} of {data.totalPages}
            </span>
            <span className="font-medium text-gray-800">
              Total: {data.total}
            </span>
          </div>

          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-md border px-2 py-1 text-xs sm:text-sm"
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  const renderControls = () => (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div className="flex flex-1 items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            autoFocus
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-9 pr-10 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white/70 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "" | "active" | "inactive")
              }
              className="pl-7 pr-3 py-2 rounded-full border bg-white/70 text-xs sm:text-sm"
            >
              <option value="">All status</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>

          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setLimit(10);
              setSortOrder("asc");
              setPage(1);
            }}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-white border text-xs sm:text-sm hover:bg-gray-100"
          >
            <RefreshCw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 justify-end">
        <div className="hidden md:block text-xs sm:text-sm text-gray-600">
          Sorted by name:{" "}
            <strong className="ml-1">
              {sortOrder === "asc" ? "A → Z" : "Z → A"}
            </strong>
        </div>

        <button
          onClick={toggleSort}
          className="px-4 py-2 rounded-full bg-indigo-600 text-white text-xs sm:text-sm hover:bg-indigo-700"
        >
          Toggle sort
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs sm:text-sm"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden shadow-sm"
        style={{ background: "linear-gradient(120deg,#eef2ff,#f9fafb)" }}
      >
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Manage Category Status
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Activate or deactivate categories without deleting them.
              </p>
            </div>
          </div>

          {renderControls()}

          <div className="bg-white/60 rounded-xl border border-slate-100 p-4 sm:p-5">
            {loading && !data ? (
              <LoadingPage message="Loading categories..." fullScreen={false} />
            ) : globalError ? (
              <div className="py-10 text-center text-red-700">
                {globalError}
              </div>
            ) : (
              <>
                {renderRows()}
                <div className="mt-4">{renderPagination()}</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 🔔 Confirm Modal */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="text-rose-500" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {confirmTarget.isActive
                    ? "Deactivate category?"
                    : "Activate category?"}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  You are about to{" "}
                  <span className="font-medium">
                    {confirmTarget.isActive ? "deactivate" : "activate"}
                  </span>{" "}
                  the category{" "}
                  <span className="font-medium">
                    &quot;{confirmTarget.name}&quot;
                  </span>
                  . You can change this again later.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  performToggleActive(
                    confirmTarget.id,
                    confirmTarget.name,
                    confirmTarget.isActive
                  )
                }
                className={`px-4 py-2 rounded-full text-sm font-medium text-white shadow-sm ${
                  confirmTarget.isActive
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {confirmTarget.isActive ? "Yes, deactivate" : "Yes, activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
