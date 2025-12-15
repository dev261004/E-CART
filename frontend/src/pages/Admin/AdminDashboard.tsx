// src/pages/AdminDashboard.tsx
import React, { JSX } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, clearAuth } from "@/services/authService";


export default function AdminDashboard(): JSX.Element {
  const navigate = useNavigate();
  const user = getUser();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome{user ? `, ${user.name}` : ""}. Manage your store from here.</p>
          </div>

          
        </header>

        <main>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card: Add Category */}
            <div className="col-span-1 rounded-2xl bg-white shadow p-6 flex flex-col justify-between">

              <div>
                <h3 className="text-lg font-semibold">Categories</h3>
                <p className="text-sm text-gray-500 mt-2">Create and manage product categories.</p>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => navigate("/admin/category/add")}
                  className="w-full inline-flex items-center justify-center px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Add Category
                </button>
              </div>

            </div>

            <div className="col-span-1 rounded-2xl bg-white shadow p-6">
           
              <h3 className="text-lg font-semibold">Categories</h3>
              <p className="text-sm text-gray-500 mt-2">Click below to show the Categories list.</p>


              <div className="mt-11">
                <button
                  onClick={() => navigate("/admin/categories")}
                  className="w-full inline-flex items-center justify-center px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  View Categories
                </button>
              </div>
            </div>

            {/* You can add other admin cards here (Products, Orders, Users) */}
            <div className="col-span-1 rounded-2xl bg-white shadow p-6">
              <h3 className="text-lg font-semibold">Products</h3>
              <p className="text-sm text-gray-500 mt-2">Click below to show the Products.</p>

              <div className="mt-11">
                <button
                  onClick={() => navigate("/admin/products")}
                  className="w-full inline-flex items-center justify-center px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  View Products
                </button>
              </div>
            </div>


          </div>
        </main>
      </div>
    </div>
  );
}
