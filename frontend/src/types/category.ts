// src/types/category.ts
export interface ICategoryCreate {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface ICategory {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICategoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean | string;
  sortBy?: "name" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface IListCategoriesResult {
  items: ICategory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
/**
 * API response shape for creating category (matches backend createCategoryController)
 */
export interface CreateCategoryResponse extends ICategory {}
