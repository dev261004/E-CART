
// src/validation/forgotResetPasswordSchema.ts
import { z } from "zod";
import messages from "@/utils/messages";
const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,16}$/;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),

  otp: z
    .string()
    .min(1, "OTP is required")
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be 6 digits"),

  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(16, "Password must be at most 16 characters")
    .regex(
      passwordPattern,
      "Password must be 8–16 chars & include uppercase, lowercase, number, and special character"
    ),

  confirmPassword: z
    .string()
    .min(1, { message: messages.ERROR.REQUIRED_FIELDS }),
})
.refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: messages.ERROR.PASSWORD_MISMATCH,
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
