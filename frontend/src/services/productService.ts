// src/services/productService.ts
import api from "@/services/api";
import type {
  IProductCreate,
  CreateProductResponse,
  IProductsListResult,
  IProductQuery,
  IProductDetail,
  GetProductByIdResponseData,
} from "@/types/product";
import type { ApiResult } from "@/types/api";

// CREATE PRODUCT

export const createProduct = async (
  payload: IProductCreate
): Promise<ApiResult<CreateProductResponse>> => {
  try {
    const res = await api.post(
      "/api/product/create",
      payload,
      {
        withCredentials: true,
        headers: {
          "X-Encrypt": "1", // 🔐 REQUIRED
        },
      }
    );

    const envelope = res?.data ?? {};

    // 🔐 prefer decrypted payload
    const data =
      (envelope as any).decrypted ?? envelope.data ?? null;

    return {
      data,
      message: envelope.message,
      error: null,
    };
  } catch (err: any) {
    const server = err?.response?.data;
    const message =
      server?.message ?? err?.message ?? "Failed to create product";
    const fields =
      server?.data?.errors || server?.errors || undefined;

    return {
      data: null,
      message: undefined,
      error: { message, fields },
    };
  }
};


// UPLOAD IMAGES
const uploadImages = async (files: File[]): Promise<ApiResult<string[]>> => {
  try {
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));

    const res = await api.post("/api/product/upload-images", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    });

    const envelope = res?.data ?? {};

    // 🔐 IMPORTANT FIX
    const payload =
      (envelope as any).decrypted ?? envelope.data ?? null;

    const urls = payload?.urls ?? payload;

    if (!Array.isArray(urls)) {
      console.error("Upload payload:", payload);
      return {
        data: null,
        error: { message: "Invalid upload response format" },
      };
    }

    return {
      data: urls,
      message: envelope.message,
      error: null,
    };
  } catch (err: any) {
    return {
      data: null,
      error: { message: err?.message || "Image upload failed" },
    };
  }
};




// GET PRODUCT BY ID
export const getProductById = async (
  id: string
): Promise<ApiResult<IProductDetail>> => {
  try {
    const res = await api.get(`/api/product/${id}`, {
      withCredentials: true,
    });

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
      server?.message ?? err?.message ?? "Failed to fetch product details";
    const fields = server?.data?.errors || server?.errors || undefined;

    return {
      data: null,
      message: undefined,
      error: { message, fields },
    };
  }
};

// VENDOR PRODUCTS LIST
const getVendorProducts = async (
  query: Partial<IProductQuery> = {}
): Promise<ApiResult<IProductsListResult>> => {
  try {
    const params = {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search ?? undefined,
      category: query.category ?? undefined,
      minPrice: query.minPrice ?? undefined,
      maxPrice: query.maxPrice ?? undefined,
      isActive:
        typeof query.isActive === "boolean"
          ? query.isActive
          : undefined,
      sortBy: query.sortBy ?? undefined,
      sortOrder: query.sortOrder ?? undefined,
    };

    const res = await api.get("/api/product/my-products", {
      params,
      withCredentials: true,
    });

    const envelope = res?.data ?? {};

    // 🔐 always prefer decrypted payload
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
      server?.message ?? err?.message ?? "Failed to fetch products";

    return {
      data: null,
      message: undefined,
      error: { message, fields: server?.data },
    };
  }
};


// DELETE PRODUCT
const deleteProduct = async (
  productId: string
): Promise<ApiResult<null>> => {
  try {
    const res = await api.delete(`/api/product/delete/${productId}`, {
      withCredentials: true,
    });
    const envelope = res?.data ?? {};
    return {
      data: null,
      message: envelope.message ?? "Deleted",
      error: null,
    };
  } catch (err: any) {
    const server = err?.response?.data;
    const message = server?.message ?? err?.message ?? "Delete failed";
    return {
      data: null,
      message: undefined,
      error: { message, fields: server?.data },
    };
  }
};

const updateProduct = async (
  productId: string,
  payload: Partial<IProductCreate>
): Promise<ApiResult<any>> => {
  try {
    const res = await api.put(
      `/api/product/update/${productId}`,
      payload,
      { withCredentials: true }
    );

    const envelope = res?.data ?? {};

    // 🔐 CRITICAL FIX
    const data =
      (envelope as any).decrypted ??
      envelope.data ??
      null;

    return {
      data,
      message: envelope.message,
      error: null,
    };
  } catch (err: any) {
    const server = err?.response?.data;
    const message =
      server?.message ?? err?.message ?? "Update failed";

    return {
      data: null,
      message: undefined,
      error: { message, fields: server?.data },
    };
  }
};



async function getProducts(
  query: IProductQuery
): Promise<ApiResult<IProductsListResult>> {
  try {
    const res = await api.get("/api/product", {
      params: query,
    });

    const envelope = res?.data ?? {};

    // 🔐 ALWAYS prefer decrypted payload if present
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
      server?.message ?? err?.message ?? "Failed to fetch products";

    return {
      data: null,
      message: undefined,
      error: {
        message,
        fields: server?.data?.errors || server?.errors,
      },
    };
  }
}


export default {
  createProduct,
  uploadImages,
  getVendorProducts,
  deleteProduct,
  updateProduct,
  getProductById,
  getProducts
};
