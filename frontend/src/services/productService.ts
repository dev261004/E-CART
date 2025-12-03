// src/services/productService.ts
import api from "@/services/api";
import type {
  IProductCreate,
  CreateProductResponse,
  IProductsListResult,
  IProductQuery,
  GetProductByIdResponseData,
} from "@/types/product";
import type { ApiResult } from "@/types/api";

// CREATE PRODUCT
const createProduct = async (
  payload: IProductCreate
): Promise<ApiResult<CreateProductResponse>> => {
  try {
    const res = await api.post("/api/product/create", payload, {
      withCredentials: true,
    });
    const envelope = res?.data ?? {};
    return {
      data: envelope.data ?? envelope,
      message: envelope.message,
      error: null,
    };
  } catch (err: any) {
    const server = err?.response?.data;
    const message =
      server?.message ?? err?.message ?? "Failed to create product";
    const fields = server?.data?.errors || server?.errors || undefined;
    return { data: null, message: undefined, error: { message, fields } };
  }
};

// UPLOAD IMAGES
const uploadImages = async (
  files: File[]
): Promise<ApiResult<string[]>> => {
  if (!files || files.length === 0) {
    return { data: [], message: "No files to upload", error: null };
  }

  try {
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));

    const res = await api.post("/api/product/upload-images", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    });

    const envelope = res?.data ?? {};
    const urls: string[] = envelope?.data?.urls ?? envelope?.data ?? [];

    if (!Array.isArray(urls)) {
      return {
        data: null,
        message: "Unexpected response from upload endpoint",
        error: { message: "Unexpected response format" },
      };
    }

    return {
      data: urls,
      message: envelope.message ?? "Images uploaded",
      error: null,
    };
  } catch (err: any) {
    const server = err?.response?.data;
    const message =
      server?.message ?? err?.message ?? "Image upload failed";
    return {
      data: null,
      message: undefined,
      error: { message, fields: server?.data },
    };
  }
};

// GET PRODUCT BY ID
const getProductById = async (
  id: string
): Promise<ApiResult<GetProductByIdResponseData>> => {
  try {
    // Adjust path if your backend route is different
    const res = await api.get(`/api/product/${id}`, { withCredentials: true });
    return {
      data: res.data.data,    
      message: res.data.message,
      error: null
    };
  } catch (err: any) {
    const server = err?.response?.data;
    const message =
      server?.message ?? err?.message ?? "Failed to fetch product";
    const fields = server?.data?.errors || server?.errors || undefined;
    return { data: null, message: undefined, error: { message, fields } };
  }
};

// VENDOR PRODUCTS LIST
const getVendorProducts = async (
  query: Partial<IProductQuery> = {}
): Promise<ApiResult<IProductsListResult>> => {
  try {
    // Ensure numeric defaults to avoid Joi error from backend
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
          : query.isActive ?? undefined,
      sortBy: query.sortBy ?? undefined,
      sortOrder: query.sortOrder ?? undefined,
    };

    const res = await api.get("/api/product/my-products", {
      params,
      withCredentials: true,
    });
    const envelope = res?.data ?? {};
    return {
      data: envelope.data ?? envelope,
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

// UPDATE PRODUCT
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
    return {
      data: envelope.data ?? envelope,
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
  const res = await api.get("/api/product/", {
    // adjust base path if your router is mounted differently
    params: query,
  });
  return res.data;
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
