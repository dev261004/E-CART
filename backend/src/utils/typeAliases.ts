// src/typealias/typealias.ts
import { IUser } from "../model/userModel";
// Roles
export type TRole = "admin" | "vendor" | "buyer";

export interface IAppError {
  status: number;
  message: string;
  keyErrorField?: string;
  isOperational: boolean;
}


// JWT Token Payload Types
export interface IAccessTokenPayload {
  userId: string;
  role: TRole;
  iat?: number;
  exp?: number;
   sessionId: string;
}

export interface IRefreshTokenPayload {
  userId: string;
  iat?: number;
  exp?: number;
    role: string;
  sessionId: string;
    type: "refresh";
}

// Standard API Response Type
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// USER REQUEST DTOs
export interface IUserSignup {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: Exclude<TRole, "admin">; // only vendor/buyer can sign up
}

export interface IUserLogin {
  email: string;
  password: string;
}



// CATEGORY Request DTO
export interface ICategoryCreate {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface ICategoryUpdate {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface ICategoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}




// PRODUCT Request DTO
export interface IProductCreate {
  // vendor is optional in DTO because controller will override with req.user.userId
  vendor?: string;        // vendor id (string). controller will set this from req.user
  title: string;
  price: number;
  description?: string;
  category: string;       // Category ID (string)
  images?: string[];      // optional: cloudinary URLs
  stock?: number;
  isActive?: boolean;
}

export interface IProductUpdate {
  title?: string;
  price?: number;
  description?: string;
  category?: string;
  images?: string[];
  stock?: number;
  removeImages?: string[]   // existing image URLs to delete
  
  isActive?: boolean;
}

export interface IProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  vendor?: string;
  minPrice?: number;
  maxPrice?: number;
    // stock?: number | string; 
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}


// Pagination (if needed later)
export interface IPaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
}



// src/types/authTypes.ts
export interface IForgotPasswordRequest {
  email: string;
}

export interface IResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
  resetToken: string; 
}


export interface IResetRequest{
  email: string;
  otp: string;
}

export interface IChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPayload {
  otp: string;
  email: string;
}

export type UpdateProfileResult = Pick<
  IUser,
  "_id" | "name" | "email" | "phoneNumber" | "role"
> & {
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
  profileImage?: string | null;
}

export interface UpdateProfileRequestBody {
  name?: string;
  phoneNumber?: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  removeAvatar?: boolean | string;
}

