// src/apps/product/productController.ts
import { Request, Response } from 'express';
import {
  createProduct,
  updateProduct,
  getProductById,
  listProducts,
  deleteProduct,
  listProductsByVendor,
  listProductsByCategoryNames,
  listProductsByCategoryIds
} from './productService';
import messages from '../../utils/messages';
import {
  ApiResponse,
  IProductCreate,
  IProductUpdate,
  IProductQuery
} from '../../utils/typeAliases';
import { createProductValidation } from './productValidation';
import { uploadMultipleToCloudinary } from "../../services/cloudinaryService";
import AppError from "../../utils/AppError";
import createResponse from "../../utils/createResponse";
import { ProductDocument } from '../../model/productModel';

import Product from "../../model/productModel";
const getVendorIdFromProduct = (vendor: any): string => {
  if (!vendor) return '';
  // if not populated, vendor is ObjectId or string
  if (typeof vendor === 'string') return vendor;
  if (vendor._id) return vendor._id.toString();
  return String(vendor);
};

export const createProductController = async (
  req: Request<{}, ApiResponse, IProductCreate>,
  res: Response<ApiResponse>
) => {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError(401, messages.ERROR.UNAUTHORIZED);
    }

    // enforce vendor is the authenticated user
    const payload: IProductCreate = {
      ...req.body,
      vendor: user.userId
    };

    const product = await createProduct(payload);

    return await createResponse(res, 201, messages.SUCCESS.PRODUCT_CREATED, product, true);
  } catch (err: any) {
    if (err instanceof AppError) {
      return await createResponse(res, err.status, err.message, undefined, false);
    }
    console.error('createProductController error:', err);
    return await createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR, undefined, false);
  }
};

// Vendor updates a product - ownership enforced here
export const updateProductController = async (
  req: Request<{ id: string }, ApiResponse, IProductUpdate>,
  res: Response<ApiResponse>
) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const user = req.user;

    if (!user) {
      throw new AppError(401, messages.ERROR.UNAUTHORIZED);
    }

    // 1️⃣ ensure product exists
    const product = await getProductById(id);
    if (!product) {
      throw new AppError(404, messages.ERROR.PRODUCT_NOT_FOUND);
    }

    // 2️⃣ ownership check
    const productVendorId = getVendorIdFromProduct(product.vendor);
    if (productVendorId !== user.userId) {
      throw new AppError(403, messages.ERROR.FORBIDDEN);
    }

    /* ----------------------------------
       IMAGE REMOVAL ONLY (NO UPLOAD HERE)
    ---------------------------------- */

    // ✅ IMAGE MERGE LOGIC (remove + add)
    let finalImages = [...(product.images ?? [])];

    // 1️⃣ remove images
    if (payload.removeImages) {
      const removeList = Array.isArray(payload.removeImages)
        ? payload.removeImages
        : [payload.removeImages];

      finalImages = finalImages.filter(
        (img) => !removeList.includes(img)
      );
    }

    // 2️⃣ add new images (from frontend payload.images)
    if (Array.isArray(payload.images) && payload.images.length > 0) {
      finalImages.push(...payload.images);
    }

    // 3️⃣ assign back
    payload.images = finalImages;
console.log("FINAL IMAGES:", payload.images);

    // cleanup
    delete payload.removeImages;

    // 3️⃣ normalize title if provided
    if (payload.title && typeof payload.title === "string") {
      payload.title = payload.title.trim();
    }

    const updated = await updateProduct(id, payload);

    return await createResponse(
      res,
      200,
      messages.SUCCESS.PRODUCT_UPDATED,
      updated,
      true
    );
  } catch (err: any) {
    if (err instanceof AppError) {
      return await createResponse(
        res,
        err.status,
        err.message,
        undefined,
        false
      );
    }
    console.error("updateProductController error:", err);
    return await createResponse(
      res,
      500,
      err.message || messages.ERROR.SERVER_ERROR,
      undefined,
      false
    );
  }
};


// Public (buyers and guests) can view product details
export const getProductController = async (
  req: Request<{ id: string }, ApiResponse>,
  res: Response<ApiResponse>
) => {
  try {
    const { id } = req.params;
    // const raw = await Product.findById(id).select("vendor").lean();
    // console.log("RAW product vendor from DB:", raw);
    const product = await getProductById(id);

    // console.log('Product vendor field:', product?.vendor);
    if (!product) {
      throw new AppError(404, messages.ERROR.PRODUCT_NOT_FOUND);
    }

    const successMessage =
      messages.SUCCESS.PRODUCT_FETCHED ??
      (messages.SUCCESS.PRODUCT_CREATED
        ? messages.SUCCESS.PRODUCT_CREATED.replace('created', 'fetched')
        : "Product fetched");

    return await createResponse(res, 200, successMessage, product, true);

  } catch (err: any) {
    if (err instanceof AppError) {
      return await createResponse(res, err.status, err.message, undefined, false);
    }

    console.error("getProductController error:", err);
    return await createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR, undefined, false);
  }
};

///Public listing
export const listProductsController = async (
  req: Request<{}, ApiResponse, {}, IProductQuery>,
  res: Response<ApiResponse>
) => {
  try {
    console.log('req.query =', req.query);

    const q: IProductQuery = req.query as any;
    const result = await listProducts(q);

    const successMessage =
      (messages.SUCCESS as any).PRODUCT_LIST ??
      (messages.SUCCESS.CATEGORY_LIST ? messages.SUCCESS.CATEGORY_LIST.replace('Categories', 'Products') : 'Products fetched');

    return await createResponse(res, 200, successMessage, result, true);
  } catch (err: any) {
    if (err instanceof AppError) {
      return await createResponse(res, err.status, err.message, undefined, false);
    }
    console.error('listProductsController error:', err);
    return await createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR, undefined, false);
  }
};


//Vendor deletes product (ownership enforced)
export const deleteProductController = async (
  req: Request<{ id: string }, ApiResponse>,
  res: Response<ApiResponse>
) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
      throw new AppError(401, messages.ERROR.UNAUTHORIZED);
    }

    const product = await getProductById(id);
    if (!product) {
      throw new AppError(404, messages.ERROR.PRODUCT_NOT_FOUND);
    }

    const productVendorId = getVendorIdFromProduct(product.vendor);
    if (productVendorId !== user.userId) {
      throw new AppError(403, messages.ERROR.FORBIDDEN);
    }

    await deleteProduct(id);

    return await createResponse(res, 200, messages.SUCCESS.PRODUCT_DELETED);
  } catch (err: any) {
    if (err instanceof AppError) {
      return await createResponse(res, err.status, err.message);
    }
    console.error('deleteProductController error:', err);
    return await createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR);
  }
};

export const uploadProductImagesController = async (req: any, res: any) => {
  try {
    // auth middleware should have populated req.user
    const user = req.user;
    if (!user) {
      throw new AppError(401, messages.ERROR.UNAUTHORIZED);
    }

    // Multer populates req.files (array) when upload.array(...) or specific fields used
    const files = (req.files as Express.Multer.File[] | undefined) || (req.file ? [req.file] : undefined);

    if (!files || files.length === 0) {
      throw new AppError(400, "No images provided");
    }

    // Upload images to Cloudinary (or S3) - ensure this function accepts array of buffers/files
    const results = await uploadMultipleToCloudinary(files, "products");

    const secureUrls = (results || [])
      .map((r: any) => r?.secure_url)
      .filter(Boolean);

    // Respond with encrypted payload (urls) — createResponse will encrypt the data
    return await createResponse(res, 200, "Images uploaded", { urls: secureUrls }, true);
  } catch (err: any) {
    if (err instanceof AppError) {
      // For errors keep encryption=false so it's easy to debug
      return await createResponse(res, err.status, err.message, undefined, false);
    }
    console.error("uploadProductImagesController error:", err);
    return await createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR, undefined, false);
  }
};


export const listVendorProductsController = async (
  req: Request<{}, ApiResponse, {}, IProductQuery>,
  res: Response<ApiResponse>
) => {
  try {
    const user = req.user;
    if (!user) throw new AppError(401, messages.ERROR.UNAUTHORIZED);

    const q = req.query as IProductQuery;
    const result = await listProductsByVendor(user.userId, q);

    return await createResponse(res, 200, messages.SUCCESS.PRODUCT_LIST ?? 'Products fetched successfully', result, true);
  } catch (err: any) {
    if (err instanceof AppError) return await createResponse(res, err.status, err.message, undefined, false);
    console.error('listVendorProductsController error:', err);
    return await createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR, undefined, false);
  }
};


export const listProductsByCategoryNamesController = async (
  req: Request<{}, ApiResponse, { categories: string[] }>,
  res: Response<ApiResponse>
) => {
  try {
    const { categories } = req.body;

    // Defensive check (Joi should normally handle this)
    if (!Array.isArray(categories) || categories.length === 0) {
      throw new AppError(400, messages.ERROR.REQUIRED_FIELDS, 'categories');
    }

    const result = await listProductsByCategoryNames(categories);

    return await createResponse(
      res,
      200,
      messages.SUCCESS.PRODUCT_LIST ?? 'Products fetched successfully',
      result,
      true
    );
  } catch (err: any) {
    if (err instanceof AppError) {
      return await createResponse(res, err.status, err.message, undefined, false);
    }
    console.error('listProductsByCategoryNamesController error:', err);
    return await createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR, undefined, false);
  }
};

export const listProductsByCategoryIdsController = async (
  req: Request<{}, ApiResponse, { categories: string[] }>,
  res: Response<ApiResponse>
) => {
  try {
    const { categories } = req.body;

    // defensive (Joi should normally validate)
    if (!Array.isArray(categories) || categories.length === 0) {
      throw new AppError(400, messages.ERROR.REQUIRED_FIELDS, 'categories');
    }

    const result = await listProductsByCategoryIds(categories);

    return await createResponse(res, 200, messages.SUCCESS.PRODUCT_LIST ?? 'Products fetched successfully', result, true);
  } catch (err: any) {
    if (err instanceof AppError) {
      return await createResponse(res, err.status, err.message, undefined, false);
    }
    console.error('listProductsByCategoryIdsController error:', err);
    return await createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR, undefined, false);
  }
};

