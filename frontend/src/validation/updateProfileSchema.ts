import { z } from "zod";

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .regex(/^[A-Za-z\s]+$/, "Name can only contain letters and spaces")
      .min(2, "Name is too short")
      .max(50, "Name is too long")
      .optional()
      .or(z.literal("")),

    phoneNumber: z
      .string()
      .trim()
      .regex(/^\d{10}$/, "Phone must be 10 digits")
      .optional()
      .or(z.literal("")),

    addressLine1: z
      .string()
      .trim()
      .max(200, "Address is too long")
      .optional()
      .or(z.literal("")),

    addressLine2: z
      .string()
      .trim()
      .max(200, "Address is too long")
      .optional()
      .or(z.literal("")),

    city: z
      .string()
      .trim()
      .regex(/^[A-Za-z\s]*$/, "City can only contain letters and spaces")
      .max(100, "City name is too long")
      .optional()
      .or(z.literal("")),

    state: z
      .string()
      .trim()
      .regex(/^[A-Za-z\s]*$/, "State can only contain letters and spaces")
      .max(100, "State name is too long")
      .optional()
      .or(z.literal("")),

    postalCode: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Postal code must be 6 digits")
      .optional()
      .or(z.literal("")),

    country: z
      .string()
      .trim()
      .regex(/^[A-Za-z\s]*$/, "Country can only contain letters and spaces")
      .max(100, "Country name is too long")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      // must have at least one non-empty field
      return Object.values(data).some(
        (v) => v !== undefined && String(v).trim() !== ""
      );
    },
    {
      message: "Please update at least one field",
      path: ["global"],
    }
  );

export type UpdateProfileFormInput = z.infer<typeof updateProfileSchema>;
















