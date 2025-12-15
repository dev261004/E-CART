// src/pages/user/UserDashboardPage.tsx
import React, { JSX } from "react";
import { getUser } from "@/services/authService";
import LoadingPage from "@/components/LoadingPage";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ShoppingBag, Heart, UserCircle, KeyRound } from "lucide-react";

export default function UserDashboardPage(): JSX.Element {
  const user = getUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) {
    return <LoadingPage message="Loading your dashboard..." fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Top welcome section */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">Welcome back,</p>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            {user.name ?? "User"}
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 capitalize">
              {user.role ?? "buyer"}
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your account settings from one place.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/user/profile")}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 text-xs sm:text-sm text-slate-700 hover:bg-slate-50"
          >
            <UserCircle size={16} />
            Profile
          </button>
          <button
            type="button"
            onClick={() => navigate("/user/change-password")}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-600 text-xs sm:text-sm text-white hover:bg-indigo-700"
          >
            <KeyRound size={16} />
            Change password
          </button>
        </div>
      </div>

      {/* Quick stats / shortcut cards
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Orders card */}
       {/* <button
          type="button"
          onClick={() => navigate("/user/orders")}
          className="group bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-3 hover:shadow-md hover:border-indigo-100 transition"
        >
          <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <ShoppingBag size={20} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs text-slate-500">Orders</p>
            <p className="text-sm font-semibold text-slate-800">
              View your orders
            </p>
            <p className="text-[11px] text-slate-500 group-hover:text-indigo-600">
              Track and manage your purchases →
            </p>
          </div>
        </button>

        {/*
        <button
          type="button"
          onClick={() => navigate("/user/wishlist")}
          className="group bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-3 hover:shadow-md hover:border-rose-100 transition"
        >
          <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
            <Heart size={20} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs text-slate-500">Wishlist</p>
            <p className="text-sm font-semibold text-slate-800">
              Saved products
            </p>
            <p className="text-[11px] text-slate-500 group-hover:text-rose-500">
              View items you&apos;ve liked →
            </p>
          </div>
        </button>

     
        <button
          type="button"
          onClick={() => navigate("/user/profile")}
          className="group bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-3 hover:shadow-md hover:border-emerald-100 transition"
        >
          <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <UserCircle size={20} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs text-slate-500">Account</p>
            <p className="text-sm font-semibold text-slate-800">
              Profile & settings
            </p>
            <p className="text-[11px] text-slate-500 group-hover:text-emerald-600">
              Update your details →
            </p>
          </div>
        </button>
      </div> */}

    
     {/* /* <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Recent activity
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          You can later show recent orders, viewed products, recommendations,
          etc. here.
        </p>
        <div className="mt-4 text-xs text-slate-400 italic">
          No recent activity to display yet.
        </div>
      </div> }*/ }

    </div>
  );
}
