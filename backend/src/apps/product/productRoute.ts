// src/apps/product/productRoute.ts
import { Router } from 'express';
import auth from '../../middleware/auth';
import { allowRole } from '../../middleware/roles';
import validate from '../../middleware/validate';
import upload from "../../middleware/upload";
import {
  createProductValidation,
  updateProductValidation,
  idParamValidation,
  listProductsValidation,
  categoryNamesValidation,
  categoryIdsValidation,
  listVendorProductsValidation
} from './productValidation';

import {
  createProductController,
  updateProductController,
  getProductController,
  listProductsController,
  deleteProductController,
  uploadProductImagesController,
  createWithImagesController,
  listVendorProductsController,
  listProductsByCategoryNamesController,
  listProductsByCategoryIdsController
} from './productController';
import  methodNotAllowed  from "../../utils/methodNotFound"


const router = Router();


router
  .route('/')
  .get(validate(listProductsValidation, 'query'), listProductsController) // list (public)
  .all(methodNotAllowed);

//Upload product images (vendor only)
router
  .route('/upload-images')
  .post(
    auth,
    allowRole('vendor'),
    upload.array('images',5),
    uploadProductImagesController
  )
  .all(methodNotAllowed);


 //Combined create-with-images endpoint (vendor only)
router
  .route('/create-with-images')
  .post(
    auth,
    allowRole('vendor'),
    upload.array('images', 5),
    createWithImagesController
  )
  .all(methodNotAllowed);


 // Vendor's own products
router
  .route('/my-products')
  .get(auth, allowRole('vendor'), validate(listVendorProductsValidation, 'query'), listVendorProductsController)
  .all(methodNotAllowed);

// Public listing by category names
router
  .route('/by-category-names')
  .post(validate(categoryNamesValidation, 'body'), listProductsByCategoryNamesController)
  .all(methodNotAllowed);

//Public category-by-name listing
router
  .route('/category/:name')
  .get(listProductsByCategoryNamesController) 
  .all(methodNotAllowed);

// Routes that work on the collection of products
router
  .route('/create/')
  .post(auth, allowRole('vendor'), validate(createProductValidation, 'body'), createProductController)
  .all(methodNotAllowed);

router
  .route('/by-category-ids')
  .post(validate(categoryIdsValidation, 'body'), listProductsByCategoryIdsController)
  .all(methodNotAllowed);


router
  .route('/update/:id')
  .put(
    auth,
    allowRole('vendor'),
    validate(idParamValidation, 'params'),
    validate(updateProductValidation, 'body'),
    updateProductController
  )
  .all(methodNotAllowed);

router
  .route('/delete/:id')
  .delete(auth, allowRole('vendor'), validate(idParamValidation, 'params'), deleteProductController)
  .all(methodNotAllowed);

// Routes that work on a specific product by ID
router
  .route('/:id')
  .get(validate(idParamValidation, 'params'), getProductController) // public
  .all(methodNotAllowed);



export default router;
