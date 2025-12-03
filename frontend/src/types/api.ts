// src/types/api.ts
export type ApiResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
};

export type ApiErrorDetail = {
  message: string;
  path?: string[]; // Joi-style path
  type?: string;
};

export type ApiErrorBody = {
  success: false;
  message: string;
  data?: { errors?: ApiErrorDetail[] } | any;
};

// top-level API shapes
export type ApiEnvelope<T = any> = {
success: boolean;
message: string;
data?: T;
};


// normalized result returned by apiClient
export type ApiResult<T> = {
  data: T | null;
  message?: string;
  error: {
    message: string;
    fields?: any;
  } | null;
};


export type ApiClientError = {
message: string;
fields?: Record<string, string>;
raw?: any;
};

export interface SignupSuccessResponse {
  message: string;
  data: {
    user: {
      _id: string;
      name: string;
      email: string;
      role: "buyer" | "vendor" | "admin";
      phoneNumber: string;
    };
  };
}
// src/types/api.ts
export type ApiError = {
  message: string;
  fields?: Record<string, string>;
};

