// src/types/profile.ts
import type { TRole } from "@/types/user";


// src/types/profile.ts
export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "vendor" | "buyer";
 

  phoneNumber?: string | null;
  profileImage?: string | null;

  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// This is what your getProfile service should return
export type GetProfileResponseData = UserProfile;



export type UpdateProfileResult = {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  role: TRole;
  profileImage?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

export interface UpdateProfilePayload {
  name?: string;
  phoneNumber?: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  profileImage?: string | null; // backend supports this through Cloudinary upload
}
