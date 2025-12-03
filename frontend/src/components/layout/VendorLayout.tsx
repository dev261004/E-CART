// src/layouts/VendorLayout.tsx
import React, { useEffect, useState, JSX } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { logoutRequest, clearAuth, getUser } from "@/services/authService";
import { Menu, X, LogOut, PlusSquare, Box, User,KeyRound,ListTree } from "lucide-react";

export default function VendorLayout(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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

  const handleProfileClick = () => navigate("/vendor/profile");
  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? "V";

  const navItems = [
    { to: "/vendor", label: "Dashboard", icon: <Box size={18} /> },
    { to: "/vendor/product/add", label: "Add Product", icon: <PlusSquare size={18} /> },
    { to: "/vendor/products", label: "Products", icon: <Box size={18} /> },
    { to: "/vendor/change-password", label: "Change Password", icon: <KeyRound size={18} /> },
    { to: "/vendor/categories", label: "Categories", icon: <ListTree size={18} /> }
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full z-40 transform transition-all duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"}
          ${collapsed ? "w-16" : "w-64"}
          bg-gradient-to-b from-teal-600 to-indigo-600 text-white shadow-lg
        `}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          {/* Left title or initial */}
          {!collapsed ? (
            <div>
              <div className="text-lg font-semibold">Vendor Panel</div>
              <div className="text-xs text-white/80 mt-1">{user?.name ?? "Vendor"}</div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleProfileClick}
              className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center 
                         text-base font-semibold hover:bg-white/30 transition"
              aria-label="Open profile"
            >
              {userInitial}
            </button>
          )}

          {/* Right icons */}
          <div className="flex items-center gap-2">
            {/* Profile Icon */}
            <button
              type="button"
              onClick={handleProfileClick}
              className="p-2 rounded hover:bg-white/15 transition"
              aria-label="Open profile"
            >
              <User size={18} className="text-white" />
            </button>

            {/* Mobile close */}
            <button className="sm:hidden p-2" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X className="text-white" size={18} />
            </button>

            {/* Collapse button */}
            <button
              className="hidden sm:inline-flex p-2 rounded hover:bg-white/10"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? "»" : "«"}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-2 py-6 space-y-1">
          {navItems.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-white/10 mx-2 
                ${location.pathname === it.to ? "bg-white/10" : ""}`}
            >
              <div className="text-white/90">{it.icon}</div>
              {!collapsed && <div className="text-sm font-medium">{it.label}</div>}
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-4 w-full px-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/20 transition text-red-100"
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        className="sm:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-full shadow"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${collapsed ? "sm:ml-16" : "sm:ml-64"} ml-0 p-6`}>
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
