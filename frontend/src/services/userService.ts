import { callApi } from "@/utils/apiClient";
import api from "@/services/api";
import type { ApiResult } from "@/types/api";
import type { SignupResponseData, LoginResponseData } from "@/types/user";
import { userProfileSchema, type UserProfile } from "@/validation/profileSchema";
import type { UpdateProfilePayload, UpdateProfileResult } from "@/types/profile";
export type SignupPayload = {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: "buyer" | "vendor";
};

export type LoginPayload = { email: string; password: string };

export async function signup(payload: SignupPayload): Promise<ApiResult<SignupResponseData>> {
  console.log("Signup payload (frontend)", payload);
 return callApi<SignupResponseData>(() =>
    api.post("/api/user/signup", payload, { headers: { "X-Encrypt": "1" } })
  );
} 

export async function login(
  payload: LoginPayload
): Promise<ApiResult<LoginResponseData>> {
  return callApi<LoginResponseData>(() =>
    api.post(
      "/api/user/login",
      payload,
      {
        withCredentials: true,
        headers: {
          "X-Encrypt": "1"   // 🔐 REQUIRED → triggers encryption
        }
      }
    )
  );
}


export interface GetProfileResponseData extends UserProfile {}

export async function getProfile(): Promise<ApiResult<GetProfileResponseData>> {
  return callApi<GetProfileResponseData>(() =>
    api.get("/api/user/profile", {
      headers: {
        "X-Encrypt": "1" // 🔐 tell backend + interceptor
      }
    })
  );
}



export const updateProfile = async (
  payload: UpdateProfilePayload,
  avatarFile: File | null,
  removeAvatar?: boolean
): Promise<ApiResult<UpdateProfileResult>> => {
  try {
    const fd = new FormData();

    Object.entries(payload).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        fd.append(key, String(val));
      }
    });

    if (avatarFile) {
      fd.append("avatar", avatarFile);
    }

    // 👇 If user clicked "Remove photo" and didn't select a new file
    if (removeAvatar && !avatarFile) {
      fd.append("removeAvatar", "true");
    }

    const res = await api.patch("/api/user/update", fd, {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
    });

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
      server?.message ?? err?.message ?? "Failed to update profile";
    const fields = server?.data?.errors || server?.errors || undefined;
    return { data: null, message: undefined, error: { message, fields } };
  }
};



