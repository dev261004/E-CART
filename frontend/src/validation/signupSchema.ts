import { z } from "zod";
import messages from "@/utils/messages";

const localPartRegex = /^[A-Za-z][A-Za-z0-9._%+-]*$/;
const domainRegex = /^[A-Za-z][A-Za-z0-9-]*(?:\.[A-Za-z][A-Za-z0-9-]*)+$/;

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: messages.ERROR.REQUIRED_FIELDS })
      .refine((val) => /^[A-Za-z]+( [A-Za-z]+)*$/.test(val), { message: messages.ERROR.NAME_INVALID }),

    email: z
      .string()
      .min(1, { message: messages.ERROR.REQUIRED_FIELDS })
      .email({ message: messages.ERROR.INVALID_EMAIL })
      .refine((val) => {
        const parts = val.split("@");
        if (parts.length !== 2) return false;
        const [local, domain] = parts;

        // local part must start with a letter
        if (!localPartRegex.test(local)) return false;

        // domain must start with a letter in every label (and contain at least one dot)
        if (!domainRegex.test(domain)) return false;

        return true;
      }, { message: messages.ERROR.INVALID_EMAIL }),

    password: z
      .string()
      .min(1, { message: messages.ERROR.REQUIRED_FIELDS })
      .refine((val) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,16}$/.test(val), { message: messages.ERROR.PASSWORD_INVALID }),

    confirmPassword: z
      .string()
      .min(1, { message: messages.ERROR.REQUIRED_FIELDS }),

    phoneNumber: z
      .string()
      .refine((val) => /^\d{10}$/.test(val), { message: messages.ERROR.PHONE_INVALID }),

    role: z.enum(["vendor", "buyer"] as const).refine(val => ["vendor", "buyer"].includes(val), { message: messages.ERROR.ROLE_INVALID }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: messages.ERROR.PASSWORD_MISMATCH,
  });

export type SignupInput = z.infer<typeof signupSchema>;
