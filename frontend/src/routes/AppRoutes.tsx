
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '@/pages/common/HomePage'
import { useEffect } from "react";
import { bootstrapAuth } from "@/services/authBootstrap";
import SignupPage from '@/pages/Auth/SignupPage';
import LoginPage from '@/pages/Auth/LoginPage';
import ForgotPasswordPage from "@/pages/Auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/Auth/ResetPasswordPage";
import UserProfilePage from "@/pages/common/UserProfilePage";
import ChangePasswordPage from '@/pages/Auth/ChangePasswordPage';
import AddCategoryPage from "@/pages/Admin/AddCategoryPage";
import CategoryStatusPage from "@/pages/Admin/CategoryStatusPage"
import AdminDashboard from "@/pages/Admin/AdminDashboard";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import AdminLayout from "@/components/layout/AdminLayout";
import UserLayout from "@/components/layout/UserLayout";
import UserDashboardPage from "@/pages/Auth/UserDashboardPage";
import BuyerProductListPage from '@/pages/common/BuyerProductListPage';
import VendorDashboard from "@/pages/Vendor/VendorDashboard";
import AddProductPage from "@/pages/Vendor/AddProductPage";
import VendorLayout from "@/components/layout/VendorLayout";
import VendorProductsPage from "@/pages/Vendor/VendorProductsPage"
import VendorEditProductPage from "@/pages/Vendor/VendorEditProductPage"
import ProductDetailsPage from "@/pages/common/ProductDetailsPage";
import CategoryListPage from "@/pages/common/CategoryListPage";
import NotFoundPage from '@/pages/common/NotFoundPage';
import { useSessionWatcher } from "@/hooks/useSessionWatcher";
import UpdateProfilePage from "@/pages/common/UpdateProfilePage";
import UnauthorizedPage from '@/pages/common/UnauthorizedPage';



export default function AppRoutes() {

  useSessionWatcher(10000);

   useEffect(() => {
    bootstrapAuth();
  }, []);
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      
      {/* Auth */}
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      
      {/* <Route path="/profile" element={<UserProfilePage />} /> */}
      {/* 
      <Route path="/change-password" element={<ChangePasswordPage />} />

      <Route path="/categories" element={<CategoryListPage />} /> */}

      <Route path="/user" element={
        <RoleProtectedRoute role="buyer">
          <UserLayout />
        </RoleProtectedRoute>
      }>
        <Route index element={<UserDashboardPage />} />
        <Route path="categories" element={<CategoryListPage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
        <Route path="profile" element={<UserProfilePage />} />
        <Route path="products" element={<BuyerProductListPage />} />
        <Route path="update-profile" element={<UpdateProfilePage />} />

      </Route>

      <Route
        path="/product/:id"
        element={
          <RoleProtectedRoute role={["admin", "buyer"]}>
            <ProductDetailsPage />
          </RoleProtectedRoute>
        }
      />
  


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
        <Route path="products" element={<BuyerProductListPage />} />
        <Route path="category/add" element={<AddCategoryPage />} />
        <Route path="categories/status" element={<CategoryStatusPage />} />
        <Route path="products" element={<BuyerProductListPage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
        <Route path="profile" element={<UserProfilePage />} />
         <Route path="update-profile" element={<UpdateProfilePage />} />
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
         <Route path="update-profile" element={<UpdateProfilePage />} />
      </Route>

      {/* NOT FOUND */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}





