// src/types/product.ts
export interface IProduct {
  _1d(_1d: any): void;
  _id: string;
  title: string;
  description?: string;
  price: number;
  category?: { _id: string; name: string } | string;
  images?: string[];
  vendor: string;
  stock?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IProductCreate {
  vendor?: string;
  title: string;
  description?: string;
  price: number;
  category: string;
  images?: string[];
  stock?: number;
  isActive?: boolean;
}

export interface IProductsListResult {
  items: IProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
export type ListProductsResponseData = IProductsListResult;
export type IProductQuery = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean | string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export interface CreateProductResponse {
  _id: string;
  title: string;
  description?: string;
  price: number;
  category: string;
  vendor: string;
  images?: string[];
  stock?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

 // src/types/product.ts (for example)

export interface IGetProductVendor {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: "vendor" | "buyer" | "admin"; // adjust if you have a Role type
  resetOtp?: string | null;
  resetOtpExpires?: string | null; // ISO date string
}

export interface IGetProductCategory {
  _id: string;
  name: string;
  isActive: boolean;
}

export interface GetProductByIdResponseData {
  _id: string;
  vendor: IGetProductVendor;
  title: string;
  description: string;
  price: number;
  category: IGetProductCategory;
  images: string[];
  stock: number;
  isActive: boolean;
}
