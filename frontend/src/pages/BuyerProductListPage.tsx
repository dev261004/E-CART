// src/pages/user/BuyerProductListPage.tsx
import React, { useEffect, useState, JSX } from "react";
import {
  Search,
  SlidersHorizontal,
  IndianRupee,
  ShoppingCart,
  Filter,
} from "lucide-react";

import productService from "@/services/productService";
import categoryService from "@/services/categoryService";
import type {
  IProductsListResult,
  IProductQuery,
} from "@/types/product";
import type { ApiResult } from "@/types/api";
import { useAsync } from "@/hooks/useAsync";
import { useServerErrors } from "@/hooks/useServerErrors";
import LoadingPage from "@/components/LoadingPage";
import {
  productListFilterSchema,
  type ProductListFilterInput,
} from "@/validation/productListSchema";

interface CategoryOption {
  _id: string;
  name: string;
}

const DEFAULT_LIMIT = 9;

export default function BuyerProductListPage(): JSX.Element {
  const [products, setProducts] = useState<IProductsListResult | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(DEFAULT_LIMIT);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [filters, setFilters] = useState<ProductListFilterInput>({
    search: "",
    category: "",
    minPrice: "",
    maxPrice: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { loading, run } = useAsync();

  const {
    globalError,
    setErrorsObject,
    handleServerError,
    clearErrors,
  } = useServerErrors();

  // Load active categories for dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getCategories({
          page: 1,
          limit: 50,
          isActive: true,
          sortBy: "name",
          sortOrder: "asc",
        } as any);

        if (!res.error && res.data) {
          setCategories(
            res.data.items.map((c: any) => ({ _id: c._id, name: c.name }))
          );
        }
      } catch (err) {
        console.warn("Failed to load categories for filter:", err);
      }
    };
    fetchCategories();
  }, []);

  const buildQuery = (): IProductQuery => {
    const parsed = productListFilterSchema.safeParse(filters);
    if (!parsed.success) {
      const errMap: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0] || "global");
        errMap[key] = issue.message;
      });
      setErrorsObject(errMap);
      return {
        page: 1,
        limit,
        isActive: true,
        sortBy: "createdAt",
        sortOrder: "desc",
      };
    }

    const data = parsed.data;

    const query: IProductQuery = {
      page,
      limit,
      isActive: true,
      sortBy: data.sortBy || "createdAt",
      sortOrder: data.sortOrder || "desc",
    };

    if (data.search) query.search = data.search;
    if (data.category) query.category = data.category;

    if (data.minPrice && data.minPrice !== "") {
      const n = Number(data.minPrice);
      if (!Number.isNaN(n)) query.minPrice = n;
    }
    if (data.maxPrice && data.maxPrice !== "") {
      const n = Number(data.maxPrice);
      if (!Number.isNaN(n)) query.maxPrice = n;
    }

    return query;
  };

  const fetchProducts = async () => {
    clearErrors();
    const query = buildQuery();

    const { data: runResult, error: runError } = await run(() =>
      productService.getProducts(query)
    );

    if (runError) {
      handleServerError(runError);
      setProducts(null);
      return;
    }

    const apiResult = runResult as ApiResult<IProductsListResult>;
    if (apiResult.error) {
      setErrorsObject({
        global:
          apiResult.error.message ||
          "Sorry, we couldn’t load products right now.",
      });
      setProducts(null);
      return;
    }

    setProducts(apiResult.data ?? null);
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchProducts();
    }, 400);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, limit]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    const raw =
      name === "minPrice" || name === "maxPrice"
        ? value.replace(/\s+/g, "")
        : value;

    setFilters((prev) => ({
      ...prev,
      [name]: raw,
    }));
  };

  // 🔽 sort: now also handles title
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;

    if (val === "newest") {
      setFilters((prev) => ({
        ...prev,
        sortBy: "createdAt",
        sortOrder: "desc",
      }));
    } else if (val === "priceLow") {
      setFilters((prev) => ({
        ...prev,
        sortBy: "price",
        sortOrder: "asc",
      }));
    } else if (val === "priceHigh") {
      setFilters((prev) => ({
        ...prev,
        sortBy: "price",
        sortOrder: "desc",
      }));
    } else if (val === "titleAsc") {
      setFilters((prev) => ({
        ...prev,
        sortBy: "title",
        sortOrder: "asc",
      }));
    } else if (val === "titleDesc") {
      setFilters((prev) => ({
        ...prev,
        sortBy: "title",
        sortOrder: "desc",
      }));
    }
  };

  const goToPage = (p: number) => {
    if (!products) {
      setPage(p);
      return;
    }
    const safe = Math.max(1, Math.min(p, products.totalPages || 1));
    setPage(safe);
  };

  const renderPagination = () => {
    if (!products || !products.items || products.items.length === 0) return null;

    const totalPages = products.totalPages || 1;
    if (totalPages <= 1) return null;

    const pages: number[] = [];
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
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            disabled={!products.hasPrev}
            onClick={() => goToPage(page - 1)}
            className={`px-3 py-1 rounded-full border text-sm ${
              !products.hasPrev
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
                className={`px-3 py-1 rounded-full text-sm ${
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
            disabled={!products.hasNext}
            onClick={() => goToPage(page + 1)}
            className={`px-3 py-1 rounded-full border text-sm ${
              !products.hasNext
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-gray-100"
            }`}
          >
            Next
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600">
          <span>
            Page {products.page} of {products.totalPages || 1}
          </span>
          <span className="font-medium text-gray-800">
            {products.total} products
          </span>

          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-full border px-3 py-1 text-xs sm:text-sm bg-white"
          >
            {[6, 9, 12, 24].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  const renderProductsGrid = () => {
    if (!products || products.items.length === 0) {
      return (
        <div className="py-16 text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            No products found
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Try changing the search text or filters.
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.items.map((prod) => {
          const displayCategory =
            typeof prod.category === "string"
              ? ""
              : prod.category?.name || "";

          const imageSrc =
            prod.images && prod.images.length > 0
              ? prod.images[0]
              : "/placeholder-product.png";

          return (
            <div
              key={prod._id}
              className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
            >
              {/* 🔽 IMAGE: use object-contain, no zoom, no blur */}
              <div className="relative bg-slate-50 flex items-center justify-center h-52 overflow-hidden">
                <img
                  src={imageSrc}
                  alt={prod.title}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                />
                {displayCategory && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-600/90 text-white">
                    {displayCategory}
                  </span>
                )}
                {prod.stock !== undefined && prod.stock <= 0 && (
                  <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-600/90 text-white">
                    Out of stock
                  </span>
                )}
              </div>

              <div className="flex flex-col flex-1 p-4">
                {/* 🔽 just title, rating removed */}
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                  {prod.title}
                </h3>

                <p className="mt-2 text-xs text-gray-500 line-clamp-2">
                  {prod.description || "No description available"}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <IndianRupee size={16} className="text-indigo-600" />
                    <span className="text-lg font-bold text-gray-900">
                      {prod.price.toFixed(2)}
                    </span>
                  </div>
                  {prod.stock !== undefined && prod.stock > 0 && (
                    <span className="text-[11px] text-gray-500">
                      {prod.stock} in stock
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className={`mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium shadow-sm transition ${
                    prod.stock !== undefined && prod.stock <= 0
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                  disabled={prod.stock !== undefined && prod.stock <= 0}
                >
                  <ShoppingCart size={16} />
                  {prod.stock !== undefined && prod.stock <= 0
                    ? "Out of stock"
                    : "Add to cart"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderFilters = () => {
    // map current sortBy + sortOrder to select value
    let sortValue = "newest";
    if (filters.sortBy === "price") {
      sortValue = filters.sortOrder === "asc" ? "priceLow" : "priceHigh";
    } else if (filters.sortBy === "title") {
      sortValue = filters.sortOrder === "asc" ? "titleAsc" : "titleDesc";
    } else {
      sortValue = "newest";
    }

    return (
      <div className="mb-6 rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-sm p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-indigo-500" />
              Filters & search
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Find products by name, category, price and sort order.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-600">
              Search
            </label>
            <div className="mt-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                name="search"
                value={filters.search || ""}
                onChange={handleFilterChange}
                placeholder="Search by product name..."
                className="w-full pl-9 pr-3 py-2 rounded-full border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-medium text-gray-600">
              Category
            </label>
            <div className="mt-1 relative">
              <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                name="category"
                value={filters.category || ""}
                onChange={handleFilterChange}
                className="w-full pl-9 pr-3 py-2 rounded-full border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="text-xs font-medium text-gray-600">
              Sort by
            </label>
            <select
              onChange={handleSortChange}
              className="mt-1 w-full px-3 py-2 rounded-full border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={sortValue}
            >
              <option value="newest">Newest first</option>
              <option value="priceLow">Price: Low to High</option>
              <option value="priceHigh">Price: High to Low</option>
              <option value="titleAsc">Title: A → Z</option>
              <option value="titleDesc">Title: Z → A</option>
            </select>
          </div>
        </div>

        {/* Price range */}
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-gray-600">
              Min price
            </label>
            <div className="mt-1 flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600">
                <IndianRupee size={15} />
              </span>
              <input
                name="minPrice"
                value={filters.minPrice || ""}
                onChange={handleFilterChange}
                placeholder="0"
                inputMode="decimal"
                className="flex-1 px-3 py-2 rounded-full border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">
              Max price
            </label>
            <div className="mt-1 flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600">
                <IndianRupee size={15} />
              </span>
              <input
                name="maxPrice"
                value={filters.maxPrice || ""}
                onChange={handleFilterChange}
                placeholder="5000"
                inputMode="decimal"
                className="flex-1 px-3 py-2 rounded-full border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setFilters({
                  search: "",
                  category: "",
                  minPrice: "",
                  maxPrice: "",
                  sortBy: "createdAt",
                  sortOrder: "desc",
                });
                setPage(1);
              }}
              className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-full border text-sm bg-white hover:bg-gray-100"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-slate-50 px-4 py-6 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Explore products
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Browse active products with filters and sorting.
            </p>
          </div>
        </div>

        {renderFilters()}

        <div className="mt-4">
          {loading && !products ? (
            <LoadingPage message="Loading products..." fullScreen={false} />
          ) : globalError ? (
            <div className="py-16 text-center text-red-600">
              {globalError}
            </div>
          ) : (
            <>
              {renderProductsGrid()}
              {renderPagination()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
