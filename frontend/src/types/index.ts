// src/types/index.ts
export type Role = "admin" | "vendor" | "buyer";

export type NewUser = {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  phoneNumber: string;
  role: Role;
};
