// src/validation/categorySchema.ts
import { z } from "zod";
import messages from "@/utils/messages";

// Name pattern similar to backend namePattern: /^[A-Za-z]+( [A-Za-z]+)*$/
const namePattern = /^[A-Za-z]+( [A-Za-z]+)*$/;

export const categorySchema = z.object({
  name: z
    .string()
    .min(2, { message: messages.ERROR.CATEGORY_NAME_MIN })
    .max(80, { message: messages.ERROR.CATEGORY_NAME_MAX })
    .regex(namePattern, { message: messages.ERROR.NAME_INVALID })
    .transform((s) => s.trim()),

  description: z
    .string()
    .max(500, { message: messages.ERROR.CATEGORY_DESCRIPTION_MAX })
    .optional()
    .or(z.literal("")), // allow empty string

  isActive: z.boolean().optional()
});

export const listCategorySchema = z.object({
  page: z
    .preprocess(
      (v) => (typeof v === "string" && v.trim() ? Number(v) : v),
      z.number().int().min(1).optional()
    )
    .optional()
    .default(1),

  limit: z
    .preprocess(
      (v) => (typeof v === "string" && v.trim() ? Number(v) : v),
      z.number().int().min(1).max(100)
    )
    .optional()
    .default(10),

  search: z.string().max(100).optional().or(z.literal("")).optional(),

  isActive: z.union([z.boolean(), z.string()]).optional(),

  sortBy: z.union([z.literal("name"), z.literal("createdAt")]).optional(),

  sortOrder: z.union([z.literal("asc"), z.literal("desc")]).optional(),
});

export type ListCategoryQuery = z.infer<typeof listCategorySchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
