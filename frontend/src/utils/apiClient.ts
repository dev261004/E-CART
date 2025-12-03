import api from "@/services/api";
import { mapServerErrors } from "@/utils/errorMapper";
import type { ApiResult, ApiClientError } from "@/types/api";

/**
 * callApi: run any axios call and normalize the result to ApiResult<T>
 * Use the generic T to indicate the expected `data` shape (not the full envelope)
 */
export async function callApi<T = any>(fn: () => Promise<any>): Promise<ApiResult<T>> {
  try {
    const res = await fn();
    // If backend wraps { success, message, data }
    const envelope = res?.data;
    // Prefer envelope.data when available, otherwise use envelope itself
    const payload = envelope?.data ?? envelope;

    // If payload is undefined/null, return empty data object typed as T
    // but better to rely on explicit typing in callers.
    return { data: payload as T, error: null };
  } catch (err: any) {
    const serverBody = err?.response?.data;

    // map server validation details to a field map using your existing mapper
    const fields = mapServerErrors(serverBody);

    const error: ApiClientError = {
      message: serverBody?.message ?? err?.message ?? "Something went wrong",
      fields: fields || undefined,
      raw: serverBody,
    };

    return { data: null, error };
  }
}