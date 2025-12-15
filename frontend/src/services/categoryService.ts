

// src/services/categoryService.ts
import api from "@/services/api";
import type { ICategoryCreate, CreateCategoryResponse,ICategoryQuery,IListCategoriesResult } from "@/types/category";
import type { ApiResult } from "@/types/api";

/**
 * createCategory - calls backend create category endpoint
 * Returns ApiResult<CreateCategoryResponse>
 */
export const createCategory = async (
  payload: ICategoryCreate
): Promise<ApiResult<CreateCategoryResponse>> => {
  try {
    const res = await api.post(
      "/api/category/create",
      payload,
      {
        headers: {
          "X-Encrypt": "1", // 🔐 REQUIRED
        },
      }
    );

    const envelope = res?.data ?? {};

    // 🔐 prefer decrypted payload if present
    const responseData =
      (envelope as any).decrypted ?? envelope.data ?? null;

    return {
      data: responseData,
      message: envelope.message,
      error: null,
    };
  } catch (err: any) {
    const server = err?.response?.data;
    const message =
      server?.message ?? err?.message ?? "Something went wrong";
    const fields =
      server?.data?.errors || server?.errors || undefined;

    return {
      data: null,
      message: undefined,
      error: {
        message,
        fields,
      },
    };
  }
};


export const getCategories = async (
  query: ICategoryQuery = {}
): Promise<ApiResult<IListCategoriesResult>> => {
  try {
    const res = await api.get("/api/category", {
      params: query,
    });

    const envelope = res?.data ?? {};

    // 🔐 IMPORTANT: prefer decrypted payload
    const responseData =
      (envelope as any).decrypted ?? envelope.data ?? null;

    return {
      data: responseData,
      message: envelope.message,
      error: null,
    };
  } catch (err: any) {
    const server = err?.response?.data;
    const message =
      server?.message ?? err?.message ?? "Failed to fetch categories";
    const fields =
      server?.data?.errors || server?.errors || undefined;

    return {
      data: null,
      message: undefined,
      error: { message, fields },
    };
  }
};

export const setCategoryActive = async (
  id: string,
  isActive: boolean
): Promise<ApiResult<any>> => {
  try {
    const res = await api.patch(
      `/api/category/active/${id}`,
      { isActive },
      {
        headers: {
          "X-Encrypt": "1", // 🔐 REQUIRED for PATCH with body
        },
      }
    );

    const envelope = res?.data ?? {};

    // 🔐 prefer decrypted payload if present
    const payload =
      (envelope as any).decrypted ?? envelope.data ?? null;

    return {
      data: payload,
      message: envelope.message,
      error: null,
    };
  } catch (err: any) {
    const server = err?.response?.data;
    const message =
      server?.message ?? err?.message ?? "Failed to update category";
    const fields =
      server?.data?.errors || server?.errors || undefined;

    return {
      data: null,
      message: undefined,
      error: { message, fields },
    };
  }
};

export default {
  createCategory,
  getCategories,
  setCategoryActive
};
