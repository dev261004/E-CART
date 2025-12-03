// File: src/validation/loginSchema.ts
import { z } from "zod";
import messages from "@/utils/messages";

const localPartRegex = /^[A-Za-z][A-Za-z0-9._%+-]*$/;
const domainRegex = /^[A-Za-z][A-Za-z0-9-]*(?:\.[A-Za-z][A-Za-z0-9-]*)+$/;

export const loginSchema = z.object({
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
  password: z.string().min(1, { message: messages.ERROR.REQUIRED_FIELDS }),
});

export type LoginInput = z.infer<typeof loginSchema>;
