// src/validation/productSchema.ts
import { z } from "zod";
import messages from "@/utils/messages";

// title pattern similar to backend titlePattern (simplified)
const titlePattern = /^[A-Za-z0-9\s\.\-&,()]+$/;

// URL pattern (simple)
const urlPattern = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i;

export const productSchema = z.object({
  title: z.string()
    .min(2, { message: messages.ERROR.TITLE_MIN })
    .max(120, { message: messages.ERROR.TITLE_MAX })
    .regex(titlePattern, { message: messages.ERROR.TITLE_INVALID })
    .transform(s => s.trim()),

  description: z.string()
    .min(5, { message: messages.ERROR.DESCRIPTION_MIN })
    .max(2000, { message: messages.ERROR.DESCRIPTION_MAX })
    .optional()
    .or(z.literal("")),

  price: z.preprocess(
    (v) => typeof v === "string" ? Number(v) : v,
    z.number().min(10, { message: messages.ERROR.PRICE_MIN })
  ),

  category: z.string()
    .length(24, { message: messages.ERROR.CATEGORY_REQUIRED }),

  images: z.array(
    z.string().regex(urlPattern, { message: messages.ERROR.IMAGE_URL_INVALID })
  )
  .max(5, { message: messages.ERROR.IMAGE_MAX })
  .optional(),

  stock: z.preprocess(
    (v) => (v === "" || v === null || v === undefined) ? undefined : Number(v),
    z.number()
      .int()
      .min(1, { message: messages.ERROR.STOCK_MIN })
      .max(100, { message: messages.ERROR.STOCK_MAX })
      .optional()
  ),

  isActive: z.boolean().optional()
});

export const productIdSchema = z
  .string()
  .min(1, "Product id is required")
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid product id");
  
export type ProductInput = z.infer<typeof productSchema>;
