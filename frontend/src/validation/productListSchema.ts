// src/validation/productListSchema.ts
import { z } from "zod";

export const productListFilterSchema = z.object({
  search: z
    .string()
    .max(200, "Search text is too long")
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined)),

  category: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined)),

  minPrice: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : "")),

  maxPrice: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : "")),

  sortBy: z
    .enum(["createdAt", "price", "title", "stock", "updatedAt"])
    .optional(),

  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type ProductListFilterInput = z.infer<typeof productListFilterSchema>;
    