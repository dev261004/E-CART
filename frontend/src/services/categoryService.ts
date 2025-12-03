

// src/services/categoryService.ts
import api from "@/services/api";
import type { ICategoryCreate, CreateCategoryResponse,ICategoryQuery,IListCategoriesResult } from "@/types/category";
import type { ApiResult } from "@/types/api";

/**
 * createCategory - calls backend create category endpoint
 * Returns ApiResult<CreateCategoryResponse>
 */
const createCategory = async (payload: ICategoryCreate): Promise<ApiResult<CreateCategoryResponse>> => {
  try {
    // Adjust endpoint if your backend uses different base path
    const res = await api.post("/api/category/create", payload);
    // normalized envelope: { success, message, data }
    const envelope = res.data ?? {};
    return {
      data: envelope.data ?? envelope,
      message: envelope.message,
      error: null
    };
  } catch (err: any) {
    // Normalize error into ApiResult.error: { message, fields? }
    const server = err?.response?.data;
    const message = server?.message ?? err?.message ?? "Something went wrong";
    const fields = server?.data?.errors || server?.errors || undefined;
    return {
      data: null,
      message: undefined,
      error: {
        message,
        fields
      }
    };
  }
};

const getCategories = async (query: ICategoryQuery = {}): Promise<ApiResult<IListCategoriesResult>> => {
  try {
    // Pass through sortBy and sortOrder as-is (backend whitelist expected)
    const res = await api.get("/api/category", { params: query });
    const envelope = res.data ?? {};
    return {
      data: envelope.data ?? null,
      message: envelope.message,
      error: null,
    };
  } catch (err: any) {
    const server = err?.response?.data;
    const message = server?.message ?? err?.message ?? "Failed to fetch categories";
    const fields = server?.data?.errors || server?.errors || undefined;
    return {
      data: null,
      message: undefined,
      error: { message, fields },
    };
  }
};

async function setCategoryActive(id: string, isActive: boolean): Promise<ApiResult<any>> {
  const res = await api.patch(`/api/category/active/${id}`, { isActive });
  return res.data;
}
export default {
  createCategory,
  getCategories,
  setCategoryActive
};
