// File: src/hooks/useServerErrors.ts
import { useCallback, useState } from "react";
import { mapServerErrors } from "@/utils/errorMapper"; // adjust path if needed

// All errors are stored as field -> message
// Special key: "global" for non-field-specific errors.
export type ServerErrorMap = Record<string, string>;

export function useServerErrors() {
  const [errors, setErrors] = useState<ServerErrorMap>({});

  // Replace all errors at once (useful for Zod or bulk mapping)
  const setErrorsObject = useCallback((errs: ServerErrorMap | null | undefined) => {
    setErrors(errs ?? {});
  }, []);

  // Handle an Axios-like error from the server
  // Example usage: catch(err) { handleServerError(err); }
  const handleServerError = useCallback((error: any) => {
    const serverData = error?.response?.data ?? error;
    const mapped = mapServerErrors(serverData);
    setErrors(mapped);
  }, []);

  // Get a single field error (returns "" if none)
  const getError = useCallback(
    (field: string): string => {
      return errors[field] ?? "";
    },
    [errors]
  );

  // Manually set a single field error
  const setFieldError = useCallback((field: string, message: string) => {
    setErrors((prev) => ({
      ...prev,
      [field]: message,
    }));
  }, []);

  // Clear a single field error
  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const hasError = Object.keys(errors).length > 0;
  const globalError = errors.global ?? "";

  return {
    errors,
    setErrorsObject,
    handleServerError,
    getError,
    setFieldError,
    clearFieldError,
    clearErrors,
    hasError,
    globalError,
  };
}

export type UseServerErrorsReturn = ReturnType<typeof useServerErrors>;
