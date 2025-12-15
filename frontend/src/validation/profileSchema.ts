// src/validation/profileSchema.ts
import { z } from "zod";

export const userProfileSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "vendor", "buyer"]),
 

  phoneNumber: z.string().optional().nullable(),
  profileImage: z.string().url().optional().nullable(),

  addressLine1: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
