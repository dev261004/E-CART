// src/layouts/AdminLayout.tsx
import React, { useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { logoutRequest, clearAuth, getUser } from "@/services/authService";
import {
  LayoutDashboard,
  PlusCircle,
  Menu,
  X,
  LogOut,
  KeyRound,
  ListTree,
  User,              // 🔹 NEW
} from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const user = getUser();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch (e) {
      console.warn("Logout API failed, forcing local clear.");
    }

    clearAuth();
    navigate("/login");
  };

  const handleProfileClick = () => {
    navigate("/admin/profile");
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? "A";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* SIDEBAR */}
      <div
        className={`
        fixed top-0 left-0 h-full 
        text-white
        shadow-xl border-r-0
        transition-all duration-300 ease-in-out
        z-40
        bg-gradient-to-b from-indigo-600 to-purple-500
        ${collapsed ? "w-16" : "w-60"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"}
      `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          {/* Left: title / initials */}
          {!collapsed ? (
            <div>
              <h1 className="text-lg font-semibold">Admin Panel</h1>
              <p className="text-sm text-white/80">
                {user?.name ?? "Administrator"}
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleProfileClick}
              className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-base font-semibold hover:bg-white/30 transition"
              aria-label="Open profile"
            >
              {userInitial}
            </button>
          )}

          {/* Right: profile icon + close (mobile) */}
          <div className="flex items-center gap-2">
            {/* Profile icon – visible in both modes */}
            <button
              type="button"
              onClick={handleProfileClick}
              className="p-2 rounded-full hover:bg-white/15 transition"
              aria-label="Open profile"
            >
              <User size={20} className="text-white" />
            </button>

            {/* Mobile close button */}
            <button
              className="sm:hidden p-2"
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 space-y-1 px-2">
          <Link
            to="/admin"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/90 hover:bg-white/10 transition"
          >
            <LayoutDashboard size={20} />
            {!collapsed && <span>Dashboard</span>}
          </Link>

          <Link
            to="/admin/categories"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/90 hover:bg-white/10 transition"
          >
            <ListTree size={20} />
            {!collapsed && <span>Categories</span>}
          </Link>

          <Link
            to="/admin/category/add"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/90 hover:bg-white/10 transition"
          >
            <PlusCircle size={20} />
            {!collapsed && <span>Add Category</span>}
          </Link>

<Link
  to="/admin/categories/status"
  className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/90 hover:bg-white/10 transition"
>
  <ListTree size={20} />
  {!collapsed && <span>Manage Categories</span>}
</Link>
          <Link
            to="/admin/change-password"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/90 hover:bg-white/10 transition"
          >
            <KeyRound size={18} />
            {!collapsed && <span>Change Password</span>}
          </Link>
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-4 w-full px-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/20 text-red-200 w-full transition"
          >
            <LogOut size={20} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* MOBILE MENU BUTTON */}
      <button
        className="absolute top-3 left-3 sm:hidden z-50 p-2 bg-white rounded-full shadow"
        onClick={() => setMobileOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      {/* COLLAPSE TOGGLE (DESKTOP) */}
      <button
        className={`
          absolute top-3 
          ${collapsed ? "left-[70px]" : "left-[260px]"} 
          p-2 bg-white shadow rounded-full hidden sm:flex z-50 transition-all
        `}
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? "»" : "«"}
      </button>

      {/* MAIN CONTENT */}
      <main
        className={`
          flex-1 transition-all duration-300 px-4 sm:px-8 py-6
          ${collapsed ? "sm:ml-16" : "sm:ml-60"}
        `}
      >
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
