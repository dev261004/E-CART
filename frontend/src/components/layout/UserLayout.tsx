import React, { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { getUser, logoutRequest, clearAuth } from "@/services/authService";
import { Menu, X, LogOut, UserCircle, ShoppingBag, Heart, Settings,KeyRound,ListTree } from "lucide-react";

export default function UserLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: "/user", label: "Dashboard", icon: <UserCircle size={18} /> },
    // { to: "/user/orders", label: "My Orders", icon: <ShoppingBag size={18} /> },
    // { to: "/user/wishlist", label: "Wishlist", icon: <Heart size={18} /> },
    { to: "/user/profile", label: "Profile", icon: <Settings size={18} /> },
    { to: "/user/categories", label: "Categories", icon: <ListTree size={18} /> },
    { to: "/user/products", label: "Products", icon: <ListTree size={18} /> },
    { to: "/user/change-password", label: "Change Password", icon: <KeyRound size={18} /> },
   
  ];

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      console.warn("Logout failed; clearing client state.");
    }
    clearAuth();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-40 text-white shadow-xl transition-all duration-300
          bg-gradient-to-b from-indigo-600 to-purple-600
          ${collapsed ? "w-16" : "w-60"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/15">
          {!collapsed ? (
            <div>
              <h1 className="text-lg font-semibold">User Panel</h1>
              <p className="text-xs text-white/80">{user?.name}</p>
            </div>
          ) : (
            <div className="text-xl font-semibold">{user?.name?.charAt(0) ?? "U"}</div>
          )}

          {/* Mobile close */}
          <button className="sm:hidden p-2" onClick={() => setMobileOpen(false)}>
            <X className="text-white" size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 space-y-1 px-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-white/90 transition 
              hover:bg-white/10 mx-1 ${
                location.pathname === item.to ? "bg-white/10" : ""
              }`}
              onClick={() => setMobileOpen(false)}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-5 w-full px-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-200 hover:bg-red-500/20 w-full"
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE MENU BUTTON */}
      <button
        className="sm:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-full shadow"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={18} />
      </button>

      {/* COLLAPSE BUTTON (Desktop only) */}
      <button
        className={`hidden sm:flex fixed top-4 transition-all duration-300 z-40
          ${collapsed ? "left-20" : "left-64"} p-2 bg-white rounded-full shadow`}
        onClick={() => setCollapsed((v) => !v)}
      >
        {collapsed ? "»" : "«"}
      </button>

      {/* MAIN PAGE */}
      <main
        className={`flex-1 px-4 sm:px-8 py-6 transition-all duration-300 
          ${collapsed ? "sm:ml-16" : "sm:ml-60"}`}
      >
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
