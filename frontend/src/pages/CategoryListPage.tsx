// src/pages/admin/CategoryListPage.tsx
import React, { useEffect, useState, JSX } from "react";
import { useNavigate } from "react-router-dom";
import categoryService from "@/services/categoryService";
import type { IListCategoriesResult, ICategoryQuery } from "@/types/category";
import { logoutRequest, clearAuth, getUser } from "@/services/authService";
import { listCategorySchema } from "@/validation/categorySchema";
import LoadingPage from "@/components/LoadingPage";
import { useServerErrors } from "@/hooks/useServerErrors";
import { LogOut } from "lucide-react";

export default function CategoryListPage(): JSX.Element {
  const navigate = useNavigate();
  const user = getUser(); 

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch (err) { 
      console.warn("Logout failed; clearing client state.");
    } finally {
      clearAuth();
      navigate("/login");
    }
  };

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState<string>("");
  const [isActive, setIsActive] = useState<string | "">("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [data, setData] = useState<IListCategoriesResult | null>(null);
  const [loading, setLoading] = useState(false);

  const { globalError, setErrorsObject, handleServerError, clearErrors } =
    useServerErrors();

  const buildQuery = (): ICategoryQuery => {
    const raw = {
      page,
      limit,
      search: search?.trim() || undefined,
      isActive: isActive === "" ? undefined : isActive === "true",
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
      if (page === 1) {
        fetchCategories();
      } else {
        setPage(1);
      }
    }, 350);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, isActive, limit, sortOrder]);

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

  const renderRows = () => {
    if (!data || data.items.length === 0) {
      return (
        <div className="py-12 text-center">
          <h3 className="mt-4 text-lg font-semibold text-gray-800">
            No categories found
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Try changing search or filter options.
          </p>
        </div>
      );
    }

    return (
      <div className="w-full">
        {/* Desktop table */}
        <div className="hidden md:block overflow-auto">
          <table className="min-w-full divide-y divide-transparent">
            <thead>
              <tr className="text-left">
                <th className="px-6 py-3 text-sm font-medium text-gray-700">
                  <button
                    onClick={toggleSort}
                    className="inline-flex items-center gap-2 focus:outline-none"
                    aria-label={`Sort by name ${
                      sortOrder === "asc" ? "descending" : "ascending"
                    }`}
                  >
                    <span>Name</span>
                    <svg
                      className={`w-4 h-4 transform ${
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

                <th className="px-6 py-3 text-sm font-medium text-gray-700">
                  Description
                </th>
                <th className="px-6 py-3 text-sm font-medium text-gray-700">
                  Active
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.items.map((c) => (
                <tr key={c._id} className="bg-white/20">
                  <td className="px-6 py-4 align-top">
                    <div className="text-sm font-semibold text-gray-900">
                      {c.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top text-sm text-gray-600 max-w-xl">
                    {c.description || (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 align-top">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        c.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-4">
          {data.items.map((c) => (
            <div
              key={c._id}
              className="bg-white/10 rounded-lg p-4 shadow-sm border"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {c.name}
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {c.description || (
                      <span className="text-gray-300">—</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      c.isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {c.isActive ? "Active" : "Inactive"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

const renderPagination = () => {
  
  if (!data || !data.items || data.items.length === 0 || data.total === 0) {
    return null;
  }

  const pages: number[] = [];
  const totalPages = data.totalPages || 1;

  // If only 1 page, you can also optionally hide pagination:
  if (totalPages <= 1) return null;

  let start :number;
  let end :number;
  
  if (totalPages <= 5) {
    // small number of pages → show all
    start = 1;
    end = totalPages;
  } else {
    // sliding window for many pages
    start = Math.max(1, page - 2);
    end = Math.min(totalPages, start + 4);

    // safety: ensure we always show 5 buttons if possible
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
  }
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <div className="sticky bottom-0 bg-gradient-to-r from-white/60 to-white/40 backdrop-blur-sm py-3 flex items-center justify-between gap-4 border-t px-4">
      <div className="flex items-center gap-2">
        <button
          disabled={!data.hasPrev}
          onClick={() => goToPage(page - 1)}
          className={`px-3 py-1 rounded-md border ${
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
              className={`px-3 py-1 rounded-md ${
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
          className={`px-3 py-1 rounded-md border ${
            !data.hasNext
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-gray-100"
          }`}
        >
          Next
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-600 flex items-center gap-4">
          <span>
            Page {data.page} of {data.totalPages}
          </span>
          <span className="font-medium text-gray-800">
            Total Items: {data.total}
          </span>
        </div>

        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="rounded-md border px-2 py-1"
          aria-label="Items per page"
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
      {/* Left: search + filters */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="relative flex-1 md:flex-initial">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full md:w-80 px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white/60"
            aria-label="Search categories"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 px-2"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={isActive}
            onChange={(e) => {
              setIsActive(e.target.value as any);
              setPage(1);
            }}
            className="rounded-full border px-3 py-2 bg-white/60"
            aria-label="Filter by status"
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <button
            onClick={() => {
              setSearch("");
              setIsActive("");
              setLimit(10);
              setSortOrder("asc");
              setPage(1);
            }}
            className="px-3 py-2 rounded-full bg-white border hover:bg-gray-100"
            aria-label="Reset filters"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Right: sort info + toggle + logout */}
      <div className="flex items-center gap-3 justify-end">
        <div className="text-sm text-gray-600 hidden md:block">
          Sorted by name:{" "}
          <strong className="ml-2">
            {sortOrder === "asc" ? "A → Z" : "Z → A"}
          </strong>
        </div>

        <button
          onClick={toggleSort}
          className="px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
          aria-label="Toggle sort"
        >
          Toggle sort
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center px-4 py-2 rounded-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-sm"
        >
          <LogOut size={16} className="mr-1.5" />
          <span className="hidden sm:inline">Logout</span>
          <span className="sm:hidden">Log out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div
        className="rounded-2xl overflow-hidden shadow-sm"
        style={{ background: "linear-gradient(90deg,#f8fafc,#eef2ff)" }}
      >
        <div className="p-6">
          {renderControls()}

          <div className="bg-white/5 rounded-xl p-4 border">
            {loading ? (
              <LoadingPage message={"Loading categories..."} fullScreen />
            ) : globalError ? (
              <div className="py-8 text-center text-red-700">{globalError}</div>
            ) : (
              <>
                {renderRows()}
                <div className="mt-4">{renderPagination()}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
