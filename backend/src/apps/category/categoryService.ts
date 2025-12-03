// src/apps/category/categoryService.ts

import Category, { CategoryDocument } from '../../model/categoryModel';
import {
  ICategoryCreate,
  ICategoryUpdate,
  ICategoryQuery
} from '../../utils/typeAliases';
import messages from '../../utils/messages';
import mongoose from 'mongoose';
import AppError from "../../utils/AppError";
import { parseBoolean } from '../../utils/parseBoolean';
import createResponse from "../../utils/createResponse";

export const isValidId = (id: string): boolean => {
  return mongoose.isValidObjectId(id);
};

// Create a new category
export const createCategory = async (
  payload: ICategoryCreate
): Promise<CategoryDocument> => {
  let { name, description, isActive } = payload;

   name = name.trim();
   name=name.charAt(0).toUpperCase()+name.slice(1);

  if (!name || String(name).trim().length === 0) {
    throw new AppError(400, messages.ERROR.REQUIRED_FIELDS, 'name');
  }

  // Case-insensitive duplicate check
  const exists = await Category.exists({
    name:  new RegExp(`^${name}$`, "i") 
  });

  if (exists) {
    throw new AppError(409, messages.ERROR.CATEGORY_EXISTS, 'name');
  }

  return await Category.create({
    name,
    description: description ?? "",
    isActive: typeof isActive === "boolean" ? isActive : true
  });
};


// Update category by id
export const updateCategory = async (
  id: string,
  payload: ICategoryUpdate
): Promise<CategoryDocument> => {
  // Validate MongoDB ObjectId
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(400, messages.ERROR.INVALID_CATEGORY_ID, 'id');
  }

  // Check if category exists
  const existing = await Category.findById(id).exec();
  if (!existing) {
    throw new AppError(404, messages.ERROR.CATEGORY_NOT_FOUND, 'id');
  }

  // If name is provided, check for duplicates
  if (payload.name) {
    const nameTrimmed = payload.name.trim();
    payload.name=payload.name.charAt(0).toUpperCase()+payload.name.slice(1);

    // Only check duplicate if name is actually changed
    if (existing.name.trim().toLowerCase() !== nameTrimmed.toLowerCase()) {
      const dup = await Category.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${nameTrimmed}$`, "i") }
      }).exec();

      if (dup) {
        throw new AppError(409, messages.ERROR.CATEGORY_EXISTS, 'name');
      }
    }

    payload.name = nameTrimmed;
  }

  // Update document
  const updated = await Category.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true }
  ).exec();

  if (!updated) {
    throw new AppError(404, messages.ERROR.CATEGORY_NOT_FOUND, 'id');
  }

  return updated;
};

// Get category by id
export const getCategoryById = async (
  id: string
): Promise<CategoryDocument | null> => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(400, messages.ERROR.INVALID_CATEGORY_ID, 'id');
  }

  return Category.findById(id)
    .select('-createdAt -updatedAt -__v')
    .exec();
};

//List categories (no pagination) with optional search and isActive filter.
// services/category.service.ts (updated)
export const listCategories = async (query: ICategoryQuery) => {
  const page = Number.isFinite(Number(query?.page)) && Number(query!.page) > 0 ? Number(query!.page) : 1;
  let limit = Number.isFinite(Number(query?.limit)) && Number(query!.limit) > 0 ? Number(query!.limit) : 10;
  limit = Math.min(limit, 100);
  const skip = (page - 1) * limit;

  const filter: any = {};

  // Defensive boolean parsing
  const parsedIsActive = parseBoolean((query as any)?.isActive);
  console.log('[listCategories] raw isActive:', (query as any)?.isActive, 'parsedIsActive:', parsedIsActive);

  if (typeof parsedIsActive === 'boolean') {
    filter.isActive = parsedIsActive;
  }

  // Search
  if (query?.search) {
    const q = String(query.search).trim();
    if (q.length > 0) filter.name = { $regex: q, $options: 'i' };
  }

  // Sorting: read from query, validate against allowed fields
  const ALLOWED_SORT_FIELDS = new Set(['name', 'createdAt']);
  const rawSortBy = (query as any)?.sortBy;
  const rawSortOrder = (query as any)?.sortOrder;

  const sortBy = typeof rawSortBy === 'string' && ALLOWED_SORT_FIELDS.has(rawSortBy) ? rawSortBy : 'createdAt';
  const sortOrder = (typeof rawSortOrder === 'string' && rawSortOrder.toLowerCase() === 'asc') ? 1 : -1;

  const sortObj: any = { [sortBy]: sortOrder };

  console.log('[listCategories] filter:', filter, 'sortObj:', sortObj, 'page:', page, 'limit:', limit, 'skip:', skip);

  const [items, total] = await Promise.all([
    Category.find(filter)
      // Note: you're excluding createdAt and updatedAt in projection. This is ok for returning results;
      // sorting still works because DB uses the field even if it's excluded from the response.
      .select('-createdAt -updatedAt -__v')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    Category.countDocuments(filter).exec(),
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

//Set isActive flag for category
export const setCategoryActive = async (
  id: string,
  isActive: boolean
): Promise<CategoryDocument | null> => {
  const updated = await Category.findByIdAndUpdate(
    id,
    { $set: { isActive } },
    { new: true }
  ).exec();

  return updated;
};

// Delete category
export const deleteCategory = async (
  id: string
): Promise<CategoryDocument | null> => {
  const removed = await Category.findByIdAndDelete(id).exec();
  return removed;
};
