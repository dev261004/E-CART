
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '@/pages/HomePage'

import SignupPage from '@/pages/Auth/SignupPage';
import LoginPage from '@/pages/Auth/LoginPage';
import ForgotPasswordPage from "@/pages/Auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/Auth/ResetPasswordPage";
import UserProfilePage from "@/pages/Auth/UserProfilePage";
import ChangePasswordPage from '@/pages/Auth/ChangePasswordPage';
import AddCategoryPage from "@/pages/Admin/AddCategoryPage";
import CategoryStatusPage from "@/pages/Admin/CategoryStatusPage"
import AdminDashboard from "@/pages/Admin/AdminDashboard";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import AdminLayout from "@/components/layout/AdminLayout";
import UserLayout from "@/components/layout/UserLayout";
import UserDashboardPage from "@/pages/Auth/UserDashboardPage";
import BuyerProductListPage from '@/pages/BuyerProductListPage';
import VendorDashboard from "@/pages/Vendor/VendorDashboard";
import AddProductPage from "@/pages/Vendor/AddProductPage";
import VendorLayout from "@/components/layout/VendorLayout";
import VendorProductsPage from "@/pages/Vendor/VendorProductsPage"
import VendorEditProductPage from "@/pages/Vendor/VendorEditProductPage"

import CategoryListPage from "@/pages/CategoryListPage";
import NotFoundPage from '@/pages/NotFoundPage';
import {useSessionWatcher} from "@/hooks/useSessionWatcher";



export default function AppRoutes() {
  
  useSessionWatcher(10000);
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      {/* Auth */}
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/profile" element={<UserProfilePage />} />
{/* 
      <Route path="/change-password" element={<ChangePasswordPage />} />

      <Route path="/categories" element={<CategoryListPage />} /> */}

      <Route path="/user" element={<UserLayout />}>
        <Route index element={<UserDashboardPage />} />
        <Route path="categories" element={<CategoryListPage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
        <Route path="profile" element={<UserProfilePage />} />
        <Route path="products" element={<BuyerProductListPage />} />
      </Route>

      {/* ADMIN ROUTES */}
      <Route
        path="/admin"
        element={
          <RoleProtectedRoute role="admin">
            <AdminLayout />
          </RoleProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="categories" element={<CategoryListPage />} />
        <Route path="category/add" element={<AddCategoryPage />} />
         <Route path="categories/status" element={<CategoryStatusPage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
        <Route path="profile" element={<UserProfilePage />} />
      </Route>

  
      <Route
        path='/vendor'
        element={
          <RoleProtectedRoute role="vendor">
            <VendorLayout />
          </RoleProtectedRoute>
        }
      >
        <Route index element={<VendorDashboard />} />
        <Route path="product/add" element={<AddProductPage />} />
        <Route path="products" element={<VendorProductsPage />} />
        <Route path="product/edit/:id" element={<VendorEditProductPage />} />
        <Route path="categories" element={<CategoryListPage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
        <Route path="profile" element={<UserProfilePage />} />
      </Route>

      {/* NOT FOUND */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}





