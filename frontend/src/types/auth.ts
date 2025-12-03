// src/types/auth.ts

export interface IResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
  resetToken: string; 
}


export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponseData {
  accessToken?: string;
  refreshToken?: string;
}
