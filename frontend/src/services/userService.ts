import { callApi } from "@/utils/apiClient";
import api from "@/services/api";
import type { ApiResult } from "@/types/api";
import type { SignupResponseData, LoginResponseData } from "@/types/user";
import { userProfileSchema, type UserProfile } from "@/validation/profileSchema";
export type SignupPayload = {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: "buyer" | "vendor";
};

export type LoginPayload = { email: string; password: string };

export async function signup(payload: SignupPayload): Promise<ApiResult<SignupResponseData>> {
  return callApi<SignupResponseData>(() => api.post("/api/user/signup", payload));
}

export async function login(payload: LoginPayload): Promise<ApiResult<LoginResponseData>> {
  // login often sets refresh cookie; we request with credentials
  return callApi<LoginResponseData>(() => api.post("/api/user/login", payload, { withCredentials: true }));
}

export interface GetProfileResponseData extends UserProfile {}

export async function getProfile() {
  // adjust base path if your auth router prefix is different
  const res = await api.get("/api/user/profile");
  return res.data as ApiResult<GetProfileResponseData>;
}