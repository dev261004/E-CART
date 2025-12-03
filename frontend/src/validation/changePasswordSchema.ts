// src/validation/changePasswordSchema.ts
import { z } from "zod";

export const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,16}$/;

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required"),

    newPassword: z
      .string()
      .regex(
        passwordRegex,
        "Password must be 8–16 characters and include uppercase, lowercase, number, and special character"
      ),

    confirmNewPassword: z
      .string()
      .min(1, "Please confirm your new password"),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword === data.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "New password must be different from the old password",
        path: ["newPassword"],
      });
    }

    if (data.newPassword !== data.confirmNewPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmNewPassword"],
      });
    }
  });

export type ChangePasswordFormInput = z.infer<typeof changePasswordSchema>;
