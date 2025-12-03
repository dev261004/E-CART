// src/validation/profileSchema.ts
import { z } from "zod";

export const userProfileSchema = z.object({
  _id: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional().nullable(),
  role: z.enum(["admin", "vendor", "buyer"]),
  isActive: z.boolean().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  // add more optional fields if your backend returns them:
  // address: z.string().optional().nullable(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
