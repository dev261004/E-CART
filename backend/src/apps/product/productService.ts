// src/apps/product/productService.ts
import Product, { ProductDocument } from '../../model/productModel';
import Category from '../../model//categoryModel';
import { IProductCreate, IProductUpdate, IProductQuery } from '../../utils/typeAliases';
import AppError from "../../utils/AppError";
import User from '../../model/userModel';
import messages from '../../utils/messages';
import mongoose,{Types} from 'mongoose';
import { parseBoolean } from '../../utils/parseBoolean';

export const createProduct = async (payload: IProductCreate): Promise<ProductDocument> => {
  const { vendor, category, title, price } = payload;

  // Validate vendor id
  if (!mongoose.isValidObjectId(vendor)) {
    throw new AppError(400, messages.ERROR.INVALID_USER_ID, 'vendor');
  }

  // Optionally ensure vendor exists and is a vendor
  const vendorDoc = await User.findById(vendor).exec();
  if (!vendorDoc) {
    throw new AppError(404, messages.ERROR.USER_NOT_FOUND , 'vendor');
  }
  if (vendorDoc.role !== 'vendor') {
    throw new AppError(403, messages.ERROR.FORBIDDEN , 'vendor');
  }

  // Validate category id
  if (!mongoose.isValidObjectId(category)) {
    throw new AppError(400, messages.ERROR.INVALID_CATEGORY_ID , 'category');
  }

  const cat = await Category.findById(category).exec();
  if (!cat) {
    throw new AppError(404, messages.ERROR.CATEGORY_NOT_FOUND, 'category');
  }

  // Optional: normalize title (trim)
  if (typeof title === 'string') {
    payload.title = title.trim();
  }

  // Create product
  const product = await Product.create({
    ...payload,
    vendor
  });

  return product;
};

export const updateProduct = async (
  id: string,
  payload: IProductUpdate
): Promise<ProductDocument> => {
  // Validate product id
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(400, messages.ERROR.INVALID_PRODUCT_ID ?? 'Invalid product id', 'id');
  }

  // If category provided, ensure it exists
  if (payload.category !== undefined) {
    if (!mongoose.isValidObjectId(payload.category)) {
      throw new AppError(400, messages.ERROR.INVALID_CATEGORY_ID ?? 'Invalid category id', 'category');
    }
    const cat = await Category.findById(payload.category).select('-createdAt -updatedAt -__v').exec();
  
    if (!cat) {
      throw new AppError(404, messages.ERROR.CATEGORY_NOT_FOUND, 'category');
    }
  }

  // Optional: normalize title if present
  if (payload.title && typeof payload.title === 'string') {
    payload.title = payload.title.trim();
  }

  // Perform update with validators enabled
  const updated = await Product.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true }).select('-createdAt -updatedAt -__v').exec();

  if (!updated) {
    throw new AppError(404, messages.ERROR.PRODUCT_NOT_FOUND, 'id');
  }

  return updated;
};

export const getProductById = async (id: string): Promise<ProductDocument | null> => {
  return Product.findOne({ _id: id })
  .populate('vendor', '-password -refreshToken -createdAt -updatedAt -__v')
  .populate('category','-description -createdAt -updatedAt -__v')
  .select('-createdAt -updatedAt -__v')
  .exec();
  
};


const ALLOWED_SORT_FIELDS = ['createdAt', 'price', 'title', 'name', 'updatedAt']; 
// adjust fields according to your schema (title used here for product title)

export const listProducts = async (query: IProductQuery) => {
  // pagination defaults & coercion
  const page = Number.isFinite(Number(query?.page)) && Number(query!.page) > 0 ? Number(query!.page) : 1;
  let limit = Number.isFinite(Number(query?.limit)) && Number(query!.limit) > 0 ? Number(query!.limit) : 10;
  limit = Math.min(limit, 100);
  const skip = (page - 1) * limit;

  // build filter
  const filter: any = {};

  // isActive (defensive parse)
  const parsedActive = parseBoolean((query as any)?.isActive);
  if (typeof parsedActive === 'boolean') filter.isActive = parsedActive;

  // category (single or comma-separated or array) — defensive trim + ObjectId check
  if (query?.category) {
    let cats: string[] = [];
    if (typeof query.category === 'string') {
      cats = query.category.split(',').map((c) => c.trim()).filter(Boolean);
    } else if (Array.isArray(query.category)) {
      // query.category may be typed as unknown/never in some query generics; cast to any[] to safely map
      cats = (query.category as any[]).map((c) => String(c).trim()).filter(Boolean);
    }

    cats = cats.filter((id) => id.length === 24 && Types.ObjectId.isValid(id));
    if (cats.length === 1) filter.category = cats[0];
    else if (cats.length > 1) filter.category = { $in: cats };
  }

  // vendor
  if (query?.vendor) {
    const rawVendor = String(query.vendor).trim();
    if (rawVendor.length === 24 && Types.ObjectId.isValid(rawVendor)) {
      filter.vendor = rawVendor;
    } else {
      throw new AppError(400, messages.ERROR.VENDOR_ID_INVALID || 'Invalid vendor id');
    }
  }

  //search (multi-field)
  if (query?.search) {
    const q = String(query.search).trim();
    if (q.length > 0) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
      ];
    }
  }

  // price range
  const minPrice = query?.minPrice !== undefined ? Number(query.minPrice) : undefined;
  const maxPrice = query?.maxPrice !== undefined ? Number(query.maxPrice) : undefined;
  if (!Number.isNaN(minPrice as number) || !Number.isNaN(maxPrice as number)) {
    filter.price = {};
    if (!Number.isNaN(minPrice as number) && minPrice !== undefined) filter.price.$gte = minPrice;
    if (!Number.isNaN(maxPrice as number) && maxPrice !== undefined) filter.price.$lte = maxPrice;
    if (Object.keys(filter.price).length === 0) delete filter.price;
  }

  // ====== STOCK exact match (new) ======
  // if (query?.stock !== undefined && query.stock !== null && query.stock !== '') {
  //   const stockNum = Number(query.stock);
  //   if (Number.isNaN(stockNum) || !Number.isFinite(stockNum) || !Number.isInteger(stockNum) || stockNum < 0) {
  //     throw new AppError(400, messages.ERROR.STOCK_NUMBER_INVALID || 'Invalid stock value');
  //   }
  //   filter.stock = stockNum;
  // }

  // sorting
  const sortBy = typeof query?.sortBy === 'string' && ALLOWED_SORT_FIELDS.includes(query.sortBy) ? query.sortBy : 'createdAt';
  const sortOrder = query?.sortOrder === 'asc' ? 1 : -1;
  const sortObj: any = { [sortBy]: sortOrder };

  // DB queries
  const [items, total] = await Promise.all([
    Product.find(filter)
      .select('-__v -createdAt -updatedAt')
      .populate('vendor', '-password -refreshToken -createdAt -updatedAt -__v')
      .populate('category', '-description -createdAt -updatedAt -__v')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),

    Product.countDocuments(filter).exec(),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1 && totalPages > 0;

  return { items, total, page, limit, totalPages, hasNext, hasPrev };
};

export const deleteProduct = async (id: string): Promise<ProductDocument | null> => {
  const removed = await Product.findByIdAndDelete(id).exec();
  return removed;
};


export const listProductsByVendor = async (vendorId: string, query: IProductQuery) => {
  // pagination defaults
  const page = Number.isFinite(Number(query?.page)) && Number(query!.page) > 0 ? Number(query!.page) : 1;
  let limit = Number.isFinite(Number(query?.limit)) && Number(query!.limit) > 0 ? Number(query!.limit) : 10;
  limit = Math.min(limit, 100);
  const skip = (page - 1) * limit;

  const filter: any = { vendor: vendorId };

  // category: support string "id1,id2" or array
  if (query?.category) {
    let categories: string[] = [];
    if (typeof query.category === 'string') {
      categories = query.category.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(query.category)) {
      categories = (query.category as any[]).map((c: any) => String(c).trim()).filter(Boolean);
    }
    // validate ids
    categories = categories.filter(id => Types.ObjectId.isValid(id) && id.length === 24);
    if (categories.length > 0) filter.category = { $in: categories };
  }

  // isActive
  const parsedActive = parseBoolean((query as any)?.isActive);
  if (typeof parsedActive === 'boolean') filter.isActive = parsedActive;

  // price range
  const minPrice = query?.minPrice !== undefined ? Number(query.minPrice) : undefined;
  const maxPrice = query?.maxPrice !== undefined ? Number(query.maxPrice) : undefined;
  if (!isNaN(minPrice as number) || !isNaN(maxPrice as number)) {
    filter.price = {};
    if (!isNaN(minPrice as number) && minPrice !== undefined) filter.price.$gte = minPrice;
    if (!isNaN(maxPrice as number) && maxPrice !== undefined) filter.price.$lte = maxPrice;
    if (Object.keys(filter.price).length === 0) delete filter.price;
  }

  // search (multi-field: title, brand, sku, tags)
  if (query?.search) {
    const q = String(query.search).trim();
    if (q.length > 0) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
      ];
    }
  }

  // sorting whitelist
  const ALLOWED_SORT_FIELDS = ['createdAt', 'price', 'title', 'rating', 'updatedAt'];
  const sortBy = typeof query?.sortBy === 'string' && ALLOWED_SORT_FIELDS.includes(query.sortBy) ? query.sortBy : 'createdAt';
  const sortOrder = query?.sortOrder === 'asc' ? 1 : -1;
  const sortObj: any = { [sortBy]: sortOrder };

  const [items, total] = await Promise.all([
    Product.find(filter)
      .select('-__v -createdAt -updatedAt')
      .populate('category','-description -createdAt -updatedAt -__v')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    Product.countDocuments(filter).exec()
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1 && totalPages > 0;

  return {
    items,
    total,
    page,
    limit,
    totalPages,
    hasNext,
    hasPrev,
  };
};



/**
 * Escape regex metacharacters in user-supplied category name
 */
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Given an array of category names, find matching category IDs (case-insensitive exact match)
 * then return all products whose category is in that set.
 *
 * Returns { items, total }
 */
export const listProductsByCategoryNames = async (names: string[]) => {
  // sanitize & unique input names
  const cleaned = Array.from(
    new Set(
      (names || []).map((n) => (typeof n === 'string' ? n.trim() : '')).filter(Boolean)
    )
  );

  if (cleaned.length === 0) {
    return { items: [], total: 0 };
  }

  // build case-insensitive exact-match regexes safely
  const regexes = cleaned.map((n) => new RegExp(`^${escapeRegex(n)}$`, 'i'));

  // find categories
  const categories = await Category.find({ name: { $in: regexes } }).exec();

  if (!categories || categories.length === 0) {
    return { items: [], total: 0 };
  }

  const categoryIds = categories.map((c) => c._id);

  // fetch products with those category ids
  const items = await Product.find({ category: { $in: categoryIds } })
    .sort({ createdAt: -1 })
    .populate('vendor', '-password -refreshToken -createdAt -updatedAt -__v')
    .populate('category')
    .exec();

  return { items, total: items.length };
};



export const listProductsByCategoryIds = async (ids: string[]) => {
  const raw = Array.isArray(ids) ? ids : [];
  const cleaned = raw.map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean);

  if (cleaned.length === 0) {
    return { items: [], total: 0 };
  }

  // validate ids
  for (const id of cleaned) {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError(400, messages.ERROR.INVALID_CATEGORY_ID ?? 'Invalid category id', 'categories');
    }
  }

  const objectIds = cleaned.map((s) => new mongoose.Types.ObjectId(s));

  // Ensure at least one category exists (optional)
  const categories = await Category.find({ _id: { $in: objectIds } }).select('_id').exec();
  if (!categories || categories.length === 0) {
    return { items: [], total: 0 };
  }
  const foundIds = categories.map((c) => c._id);

  // fetch products belonging to these categories (only active products)
  const items = await Product.find({ category: { $in: foundIds }, isActive: true })
    .sort({ createdAt: -1 })
    .populate('vendor', '-password -refreshToken -createdAt -updatedAt -__v')
    .populate({ path: 'category', select: '-createdAt -updatedAt -__v' })
    .exec();

  return {
    items,
    total: items.length
  };
};