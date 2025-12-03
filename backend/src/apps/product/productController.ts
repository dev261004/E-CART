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
import {createProductValidation} from './productValidation';
import { uploadMultipleToCloudinary } from "../../services/cloudinaryService";
import AppError from "../../utils/AppError";
import createResponse from "../../utils/createResponse";
import { ProductDocument } from '../../model/productModel';


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

    return createResponse(res, 201, messages.SUCCESS.PRODUCT_CREATED, product);
  } catch (err: any) {
    if (err instanceof AppError) {
      return createResponse(res, err.status, err.message);
    }
    console.error('createProductController error:', err);
    return createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR);
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

    // ensure product exists
    const product = await getProductById(id);
    if (!product) {
      throw new AppError(404, messages.ERROR.PRODUCT_NOT_FOUND);
    }

    // ownership check
    const productVendorId = getVendorIdFromProduct(product.vendor);
    if (productVendorId !== user.userId) {
      throw new AppError(403, messages.ERROR.FORBIDDEN);
    }

    const updated = await updateProduct(id, payload);
    if (!updated) {
      throw new AppError(404, messages.ERROR.PRODUCT_NOT_FOUND);
    }

    return createResponse(res, 200, messages.SUCCESS.PRODUCT_UPDATED, updated);
  } catch (err: any) {
    if (err instanceof AppError) {
      return createResponse(res, err.status, err.message);
    }
    console.error('updateProductController error:', err);
    return createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR);
  }
};

// Public (buyers and guests) can view product details
export const getProductController = async (
  req: Request<{ id: string }, ApiResponse>,
  res: Response<ApiResponse>
) => {
  try {
    const { id } = req.params;

    const product = await getProductById(id);

    if (!product) {
      throw new AppError(404, messages.ERROR.PRODUCT_NOT_FOUND);
    }

    const successMessage =
      messages.SUCCESS.PRODUCT_FETCHED ??
      (messages.SUCCESS.PRODUCT_CREATED
        ? messages.SUCCESS.PRODUCT_CREATED.replace('created', 'fetched')
        : "Product fetched");

    return createResponse(res, 200, successMessage, product);

  } catch (err: any) {
    if (err instanceof AppError) {
      return createResponse(res, err.status, err.message);
    }

    console.error("getProductController error:", err);
    return createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR);
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

    return createResponse(res, 200, successMessage, result);
  } catch (err: any) {
    if (err instanceof AppError) {
      return createResponse(res, err.status, err.message);
    }
    console.error('listProductsController error:', err);
    return createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR);
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

    return createResponse(res, 200, messages.SUCCESS.PRODUCT_DELETED);
  } catch (err: any) {
    if (err instanceof AppError) {
      return createResponse(res, err.status, err.message);
    }
    console.error('deleteProductController error:', err);
    return createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR);
  }
};

export const uploadProductImagesController = async (req: any, res: any) => {
  try {
    // Auth middleware should have run — double-check user
    const user = req.user;
    if (!user) {
      throw new AppError(401, messages.ERROR.UNAUTHORIZED);
    }

    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      throw new AppError(400, 'No images provided');
    }

    
    // uploadMultipleToCloudinary should return an array of results with `secure_url`
    const results = await uploadMultipleToCloudinary(files, 'products');

    const secureUrls = (results || []).map((r: any) => r.secure_url).filter(Boolean);

    return createResponse(res, 200, 'Images uploaded', { urls: secureUrls });
  } catch (err: any) {
    if (err instanceof AppError) {
      return createResponse(res, err.status, err.message);
    }
    console.error('uploadProductImagesController error:', err);
    return createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR);
  }
};

// src/apps/product/productController.ts 
export const createWithImagesController = async (
  req: Request,
  res: Response<ApiResponse>
) => {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError(401, messages.ERROR.UNAUTHORIZED);
    }

    const files = req.files as Express.Multer.File[] | undefined;

    // 1) Upload to Cloudinary (if files present)
    let imageUrls: string[] = [];
    let uploadedResults: any[] = [];
    if (files && files.length > 0) {
      uploadedResults = await uploadMultipleToCloudinary(files, `products/${user.userId}`);
      imageUrls = uploadedResults.map((r: any) => r.secure_url).filter(Boolean);
    }

    // 2) Build payload (multipart body fields are strings)
    const raw = req.body || {};
    const payloadCandidate: any = {
      vendor: user.userId,
      title: raw.title,
      description: raw.description ?? '',
      price: raw.price !== undefined ? Number(raw.price) : undefined,
      category: raw.category,
      images: imageUrls,
      stock: raw.stock !== undefined ? Number(raw.stock) : undefined,
      isActive:
        raw.isActive !== undefined
          ? raw.isActive === 'true' || raw.isActive === '1'
          : undefined
    };

    // 3) Validate with Joi (allow conversion)
    const { error, value } = createProductValidation.validate(payloadCandidate, {
      abortEarly: true,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      // OPTIONAL: cleanup uploaded images to avoid orphans.
      // e.g. await deleteFromCloudinary(uploadedResults.map(r => r.public_id));
      throw new AppError(400, error.details?.[0]?.message || messages.ERROR.REQUIRED_FIELDS);
    }

    // Ensure vendor is the authenticated user and images list is set
    const finalPayload = value as IProductCreate;
    finalPayload.vendor = user.userId;
    finalPayload.images = imageUrls;

    // 4) Create product
    const product = await createProduct(finalPayload);

    return createResponse(res, 201, messages.SUCCESS.PRODUCT_CREATED, product);
  } catch (err: any) {
    if (err instanceof AppError) {
      return createResponse(res, err.status, err.message);
    }
    console.error('createWithImagesController error:', err);
    return createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR);
  }
};

// GET /api/product/my-products  (vendor only)

// simple helper to parse boolean-ish values


export const listVendorProductsController = async (
  req: Request<{}, ApiResponse, {}, IProductQuery>,
  res: Response<ApiResponse>
) => {
  try {
    const user = req.user;
    if (!user) throw new AppError(401, messages.ERROR.UNAUTHORIZED);

    const q = req.query as IProductQuery;
    const result = await listProductsByVendor(user.userId, q);

    return createResponse(res, 200, messages.SUCCESS.PRODUCT_LIST ?? 'Products fetched successfully', result);
  } catch (err: any) {
    if (err instanceof AppError) return createResponse(res, err.status, err.message);
    console.error('listVendorProductsController error:', err);
    return createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR);
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

    return createResponse(
      res,
      200,
      messages.SUCCESS.PRODUCT_LIST ?? 'Products fetched successfully',
      result
    );
  } catch (err: any) {
    if (err instanceof AppError) {
      return createResponse(res, err.status, err.message);
    }
    console.error('listProductsByCategoryNamesController error:', err);
    return createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR);
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

    return createResponse(res, 200, messages.SUCCESS.PRODUCT_LIST ?? 'Products fetched successfully', result);
  } catch (err: any) {
    if (err instanceof AppError) {
      return createResponse(res, err.status, err.message);
    }
    console.error('listProductsByCategoryIdsController error:', err);
    return createResponse(res, 500, err.message ||messages.ERROR.SERVER_ERROR);
  }
};

