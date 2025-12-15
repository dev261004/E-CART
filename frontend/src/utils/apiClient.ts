import api from "@/services/api";
import { mapServerErrors } from "@/utils/errorMapper";
import type { ApiResult, ApiClientError } from "@/types/api";

/**
 * callApi: run any axios call and normalize the result to ApiResult<T>
 * Use the generic T to indicate the expected `data` shape (not the full envelope)
 */



export async function callApi<T>(
  fn: () => Promise<any>
): Promise<ApiResult<T>> {
  try {
    const res = await fn();
    const apiResponse = res.data;

    // 🔐 Normalize encrypted responses
    if (apiResponse && apiResponse.decrypted !== undefined) {
      return {
        data: apiResponse.decrypted as T,
        message: apiResponse.message,
        error: null,
      };
    }

    // 🔓 Normal response
    return {
      data: apiResponse.data ?? null,
      message: apiResponse.message,
      error: null,
    };
  } catch (err: any) {
    const serverBody = err?.response?.data;

    return {
      data: null,
      error: {
        message: serverBody?.message ?? err?.message ?? "Something went wrong",
        fields: mapServerErrors(serverBody) || undefined,
      },
    };
  }
}