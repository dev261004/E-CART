// src/pages/vendor/VendorDashboard.tsx
import React, { useEffect, useState, JSX } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "@/services/authService";
import productService from "@/services/productService";
import categoryService from "@/services/categoryService";
import LoadingPage from "@/components/LoadingPage";

// Illustration (uploaded file). Use this local path as requested.

export default function VendorDashboard(): JSX.Element {
  const navigate = useNavigate();
  const user = getUser();

  const [stats, setStats] = useState({
    products: 0,
    active: 0,
    inactive: 0,
    categories: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch counts in parallel:
        // 1) total products (limit=1, backend returns total)
        // 2) active products (isActive=true)
        // 3) categories count
        const [allRes, activeRes, catRes] = await Promise.all([
          productService.getVendorProducts({ page: 1, limit: 1 }),
          productService.getVendorProducts({ page: 1, limit: 1, isActive: true } as any),
          categoryService.getCategories({ page: 1, limit: 1 } as any),
        ]);

        if (!mounted) return;

        const total = allRes?.data?.total ?? 0;
        const active = activeRes?.data?.total ?? 0;
        const categories = catRes?.data?.total ?? 0;
        const inactive = Math.max(0, total - active);

        setStats({
          products: total,
          active,
          inactive,
          categories
        });
      } catch (err: any) {
        console.error("VendorDashboard loadStats error:", err);
        setError(err?.message ?? "Failed to load statistics");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  if (!user) return <LoadingPage message="Verifying..." fullScreen />;

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome, {user.name}</h1>
          <p className="text-sm text-slate-500">Vendor dashboard — manage your products and listings.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/vendor/product/add")} className="px-4 py-2 rounded-full bg-indigo-600 text-white shadow hover:bg-indigo-700">Add Product</button>
          <button onClick={() => navigate("/vendor/products")} className="px-4 py-2 rounded-full border bg-white/10">View Products</button>
        </div>
      </div>

      {error && <div className="p-4 rounded-md bg-rose-50 text-rose-700 border">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="rounded-2xl p-4" style={{ background: "linear-gradient(180deg,#ecfdf5,#e6fffa)" }}>
          <div className="text-xs font-semibold text-teal-700">Products</div>
          <div className="mt-2 text-2xl font-bold text-slate-800">{loading ? "…" : stats.products}</div>
          <div className="mt-3 text-sm text-slate-600">Total products you have listed</div>
        </div>

        <div className="rounded-2xl p-4" style={{ background: "linear-gradient(180deg,#eef2ff,#f3f0ff)" }}>
          <div className="text-xs font-semibold text-indigo-700">Active</div>
          <div className="mt-2 text-2xl font-bold text-slate-800">{loading ? "…" : stats.active}</div>
          <div className="mt-3 text-sm text-slate-600">Products currently active</div>
        </div>

        <div className="rounded-2xl p-4" style={{ background: "linear-gradient(180deg,#fff7ed,#fff1e6)" }}>
          <div className="text-xs font-semibold text-amber-700">Categories</div>
          <div className="mt-2 text-2xl font-bold text-slate-800">{loading ? "…" : stats.categories}</div>
          <div className="mt-3 text-sm text-slate-600">Available categories</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       

       
      </div>
    </div>
  );
}
