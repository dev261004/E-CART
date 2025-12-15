// src/apps/category/categoryController.ts

import { Request, Response } from 'express';
import {
  createCategory,
  updateCategory,
  getCategoryById,
  listCategories,
  setCategoryActive,
  deleteCategory
} from './categoryService';
import messages from '../../utils/messages';
import {
  ApiResponse,
  ICategoryCreate,
  ICategoryUpdate,
  ICategoryQuery
} from '../../utils/typeAliases';
import AppError from "../../utils/AppError";
import createResponse from "../../utils/createResponse";
import { CategoryDocument } from '../../model/categoryModel';


export const createCategoryController = async (
  req: Request<{}, ApiResponse, ICategoryCreate>,
  res: Response<ApiResponse>
) => {
  try {
    const payload = req.body;

    const category = await createCategory(payload);

    return await createResponse(res, 201, messages.SUCCESS.CATEGORY_CREATED, category,true);

  } catch (err: any) {
    if (err instanceof AppError) {
      return await createResponse(res, err.status, err.message,undefined,false);
    }

    return await createResponse(res, 400, err.message || messages.ERROR.SERVER_ERROR,undefined,false);
  }
};


export const updateCategoryController = async (
  req: Request<{ id: string }, ApiResponse, ICategoryUpdate>,
  res: Response<ApiResponse>
) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    const updated = await updateCategory(id, payload);

    return await createResponse(res, 200, messages.SUCCESS.CATEGORY_UPDATED, updated,true);
  } catch (err: any) {
    if (err instanceof AppError) {
      // AppError contains proper status and message
      return await createResponse(res, err.status, err.message,undefined,false);
    }
    // unexpected
    console.error('updateCategoryController error:', err);
    return await createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR,undefined,false);
  }
};

export const getCategoryController = async (
  req: Request<{ id: string }, ApiResponse>,
  res: Response<ApiResponse>
) => {
  try {
    const { id } = req.params;

    const category = await getCategoryById(id);
    if (!category) {
      // service may return null; normalize to AppError for consistent handling
      throw new AppError(404, messages.ERROR.CATEGORY_NOT_FOUND);
    }

    return await createResponse(res, 200, messages.SUCCESS.CATEGORY_FETCHED, category,true);
  } catch (err: any) {
    if (err instanceof AppError) {
      return await createResponse(res, err.status, err.message,undefined,false);
    }
    console.error('getCategoryController error:', err);
    return await createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR,undefined,false);
  }
};

export const listCategoriesController = async (
  req: Request<{}, ApiResponse, {}, ICategoryQuery>,
  res: Response<ApiResponse>
) => {
  try {
    const q: ICategoryQuery = req.query as any;

    // Prevent caching while debugging so clients/proxies won't return 304 based on ETag/If-None-Match.
    // Remove or relax this in production if you want caching.
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const result = await listCategories(q);

    return await createResponse(res, 200, messages.SUCCESS.CATEGORY_LIST, result,true);
  } catch (err: any) {
    if (err instanceof AppError) {
      return await createResponse(res, err.status, err.message,undefined,false);
    }
    console.error('listCategoriesController error:', err);
    return await createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR,undefined,false);
  }
};



export const setCategoryActiveController = async (
  req: Request<{ id: string }, ApiResponse, { isActive: boolean }>,
  res: Response<ApiResponse>
) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const updated = await setCategoryActive(id, isActive);
    if (!updated) {
      throw new AppError(404, messages.ERROR.CATEGORY_NOT_FOUND);
    }

    return await createResponse(res, 200, messages.SUCCESS.CATEGORY_UPDATED, updated,true);
  } catch (err: any) {
    if (err instanceof AppError) {
      return await createResponse(res, err.status, err.message,undefined,false);
    }
    console.error('setCategoryActiveController error:', err);
    return await createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR,undefined,false);
  }
};

export const deleteCategoryController = async (
  req: Request<{ id: string }, ApiResponse>,
  res: Response<ApiResponse>
) => {
  try {
    const { id } = req.params;

    const removed = await deleteCategory(id);
    if (!removed) {
      throw new AppError(404, messages.ERROR.CATEGORY_NOT_FOUND);
    }

    return await createResponse(res, 200, messages.SUCCESS.CATEGORY_DELETED,undefined,false);
  } catch (err: any) {
    if (err instanceof AppError) {
      return await createResponse(res, err.status, err.message,undefined,false);
    }
    console.error('deleteCategoryController error:', err);
    return await createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR,undefined,false);
  }
};

