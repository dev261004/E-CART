// src/apps/category/categoryRoute.ts

import { Router } from 'express';
import auth from '../../middleware/auth';
import { allowRole } from '../../middleware/roles';
import validate from '../../middleware/validate';

import {
  createCategoryValidation,
  updateCategoryValidation,
  idParamValidation,
  setActiveValidation,
  listCategoryValidation
} from './categoryValidation';

import {    
  createCategoryController,
  updateCategoryController,
  getCategoryController,
  listCategoriesController,
  setCategoryActiveController,
  deleteCategoryController
} from './categoryController';
import  methodNotAllowed  from "../../utils/methodNotFound"

const router = Router();

router
  .route('/')
  .get(
    auth,
    validate(listCategoryValidation, 'query'),
    listCategoriesController
  )
  .all(methodNotAllowed);

router
  .route('/create/')
  .post(
    auth,
    allowRole('admin'),
    validate(createCategoryValidation, 'body'),
    createCategoryController
  )
  .all(methodNotAllowed);



router
  .route('/active/:id')
  .patch(
    auth,
    allowRole('admin'),
    validate(idParamValidation, 'params'),
    validate(setActiveValidation, 'body'),
    setCategoryActiveController
  )
  .all(methodNotAllowed);

router
  .route('/:id')
  .get(
    auth,
    allowRole('admin'),
    validate(idParamValidation, 'params'),
    getCategoryController
  )
  .all(methodNotAllowed);

router
  .route('/update/:id')
  .put(
    auth,
    allowRole('admin'),
    validate(idParamValidation, 'params'),
    validate(updateCategoryValidation, 'body'),
    updateCategoryController
  )
  .all(methodNotAllowed);

router
  .route('/delete/:id')
  .delete(
    auth,
    allowRole('admin'),
    validate(idParamValidation, 'params'),
    deleteCategoryController
  )
  .all(methodNotAllowed);





export default router;
