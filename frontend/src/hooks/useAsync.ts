// src/hooks/useAsync.ts
import { useState, useCallback } from "react";

export function useAsync<TData = any, TError = { message?: string; fields?: any }>() {
  const [loading, setLoading] = useState(false);

  const run = useCallback(
    async (fn: () => Promise<TData>): Promise<{ data: TData | null; error: TError | null }> => {
      setLoading(true);
      try {
        const data = await fn();
        setLoading(false);
        return { data, error: null };
      } catch (err: any) {
        setLoading(false);
        const server = err?.response?.data;
        const message = server?.message ?? err?.message ?? "Something went wrong";
        const fields = server?.data?.errors || server?.errors || undefined;
        const normalizedError = { message, fields } as unknown as TError;
        return { data: null, error: normalizedError };
      }
    },
    []
  );

  return { loading, run };
}
