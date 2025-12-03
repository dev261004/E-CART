// src/apps/product/productValidation.ts
import Joi from 'joi';
import messages from '../../utils/messages';
import { listProductsByCategoryIdsController } from './productController';

// Basic title pattern: allow letters, numbers, spaces, - and & . , ()
const titlePattern = /^[A-Za-z0-9\s\-\&\:\'\.\,\(\)]+$/;

// URL pattern for cloudinary (basic)
const urlPattern = /^(https?:\/\/)[^\s/$.?#].[^\s]*$/i;

export const createProductValidation = Joi.object({
  vendor: Joi.string()
    .hex()
    .length(24)
    .optional()
    .messages({
      
      //'string.empty': messages.ERROR.REQUIRED_FIELDS,
      'string.length': messages.ERROR.VENDOR_ID_INVALID,
      'string.hex': messages.ERROR.VENDOR_ID_INVALID,
     // 'any.required': messages.ERROR.REQUIRED_FIELDS
    }),

  title: Joi.string()
    .pattern(titlePattern)
    .min(2)
    .max(120)
    .required()
    .messages({
      'string.base':messages.ERROR.TITLE_NAME_TYPE,
      'string.empty': messages.ERROR.TITLE_REQUIRED,
      'string.pattern.base': messages.ERROR.TITLE_INVALID,
      'string.min': messages.ERROR.TITLE_TOO_SHORT,
      'string.max': messages.ERROR.TITLE_TOO_LONG,
      'any.required': messages.ERROR.TITLE_REQUIRED
    }),

  description: Joi.string()
    .max(2000)
    .min(5)
    .allow('', null)
    .optional()
    .messages({
      'string.max': messages.ERROR.DESCRIPTION_TOO_LONG_PRODUCT
    }),

  price: Joi.number()
    .precision(2)
    .min(0)
    .required()
    .messages({
      'number.base': messages.ERROR.PRICE_NUMBER,
      'number.min': messages.ERROR.PRICE_MIN,
      'any.required': messages.ERROR.PRICE_REQUIRED
    }),

  category: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      'string.empty': messages.ERROR.REQUIRED_FIELDS,
      'string.length': messages.ERROR.CATEGORY_ID_INVALID,
      'string.hex': messages.ERROR.CATEGORY_ID_INVALID,
      'any.required': messages.ERROR.REQUIRED_FIELDS
    }),

  images: Joi.array()
    .items(
      Joi.string()
        .pattern(urlPattern)
        .messages({ 'string.pattern.base': messages.ERROR.IMAGE_INVALID_URL })
    )
    .max(5)
    .optional()
    .messages({
      'array.max': messages.ERROR.IMAGES_MAX
    }),

  stock: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': messages.ERROR.STOCK_NUMBER,
      'number.min': messages.ERROR.STOCK_MIN
    }),

  isActive: Joi.boolean().optional()
});

export const updateProductValidation = Joi.object({
  title: Joi.string()
    .pattern(titlePattern)
    .min(2)
    .max(120)
    .optional()
    .messages({
      'string.pattern.base': messages.ERROR.TITLE_INVALID,
      'string.min': messages.ERROR.TITLE_TOO_SHORT,
      'string.max': messages.ERROR.TITLE_TOO_LONG
    }),

  description: Joi.string()
    .max(2000)
    .allow('', null)
    .optional()
    .messages({
      'string.max': messages.ERROR.DESCRIPTION_TOO_LONG_PRODUCT
    }),

  price: Joi.number()
    .precision(2)
    .min(0)
    .optional()
    .messages({
      'number.base': messages.ERROR.PRICE_NUMBER,
      'number.min': messages.ERROR.PRICE_MIN
    }),

  category: Joi.string()
    .hex()
    .length(24)
    .optional()
    .messages({
      'string.length': messages.ERROR.CATEGORY_ID_INVALID,
      'string.hex': messages.ERROR.CATEGORY_ID_INVALID
    }),

  images: Joi.array()
    .items(
      Joi.string()
        .pattern(urlPattern)
        .messages({ 'string.pattern.base': messages.ERROR.IMAGE_INVALID_URL })
    )
    .max(10)
    .optional()
    .messages({
      'array.max': messages.ERROR.IMAGES_MAX
    }),

  stock: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': messages.ERROR.STOCK_NUMBER,
      'number.min': messages.ERROR.STOCK_MIN
    }),

  isActive: Joi.boolean().optional()
}).min(1); // require at least one field to update

export const idParamValidation = Joi.object({
  id: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      'string.empty': messages.ERROR.PRODUCT_ID_INVALID,
      'string.length': messages.ERROR.PRODUCT_ID_INVALID,
      'string.hex': messages.ERROR.PRODUCT_ID_INVALID,
      'any.required': messages.ERROR.PRODUCT_ID_INVALID
    })
});

/**
 * Query validation for listing/searching products
 * supports pagination, search text, category filter, price range, isActive and vendor filter
 */
// validators/product.validator.ts


export const listProductsValidation = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.base': messages.ERROR.PAGE_NUMBER_INVALID,
      'number.integer': messages.ERROR.PAGE_NUMBER_INVALID,
      'number.min': messages.ERROR.PAGE_NUMBER_INVALID,
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .messages({
      'number.base': messages.ERROR.LIMIT_NUMBER_INVALID,
      'number.integer': messages.ERROR.LIMIT_NUMBER_INVALID,
      'number.min': messages.ERROR.LIMIT_NUMBER_INVALID,
      'number.max': messages.ERROR.LIMIT_NUMBER_INVALID,
    }),

  search: Joi.string()
    .max(200)
    .allow('', null)
    .optional()
    .messages({
      'string.base': messages.ERROR.INVALID_FIELD_TYPE,
      'string.max': messages.ERROR.SEARCH_TOO_LONG || messages.ERROR.INVALID_FIELD_TYPE,
    }),

  category: Joi.string()
    .hex()
    .length(24)
    .optional()
    .messages({
      'string.base': messages.ERROR.CATEGORY_ID_INVALID,
      'string.empty': messages.ERROR.EMPTY_CATEGORY_NAME,
      'string.length': messages.ERROR.CATEGORY_ID_INVALID,
      'string.hex': messages.ERROR.CATEGORY_ID_INVALID,
    }),

  minPrice: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.base': messages.ERROR.PRICE_NUMBER,
      'number.min': messages.ERROR.PRICE_NUMBER,
    }),

  maxPrice: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.base': messages.ERROR.PRICE_NUMBER,
      'number.min': messages.ERROR.PRICE_NUMBER,
    }),

  isActive: Joi.boolean()
    // common variants clients send in query strings
    .truthy('true')
    .truthy('1')
    .truthy('yes')
    .truthy('"true"')
    .truthy("'true'")
    .falsy('false')
    .falsy('0')
    .falsy('no')
    .falsy('"false"')
    .falsy("'false'")
    .optional()
    .messages({
      'boolean.base': messages.ERROR.INVALID_FIELD_TYPE,
    }),

  vendor: Joi.string()
    .hex()
    .length(24)
    .optional()
    .messages({
      'string.base': messages.ERROR.VENDOR_ID_INVALID,
      'string.length': messages.ERROR.VENDOR_ID_INVALID,
      'string.hex': messages.ERROR.VENDOR_ID_INVALID,
    }),

  sortBy: Joi.string()
    .valid('createdAt', 'price', 'title', 'stock', 'updatedAt')
    .optional()
    .messages({
      'string.base': messages.ERROR.INVALID_FIELD_TYPE,
      'any.only': messages.ERROR.INVALID_SORT_FIELD || 'Invalid sort field',
    }),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .messages({
      'string.base': messages.ERROR.INVALID_FIELD_TYPE,
      'any.only': messages.ERROR.INVALID_SORT_ORDER || 'sortOrder must be "asc" or "desc"',
    }),

    stock: Joi.number()
  .integer()
  .min(0)
  .optional()
  .messages({
    'number.base': messages.ERROR.STOCK_NUMBER_INVALID || messages.ERROR.INVALID_FIELD_TYPE,
    'number.integer': messages.ERROR.STOCK_NUMBER_INTEGER || messages.ERROR.INVALID_FIELD_TYPE,
    'number.min': messages.ERROR.STOCK_NUMBER_INVALID || messages.ERROR.INVALID_FIELD_TYPE,
  }),

});

// Accepts array of category names (strings)
export const categoryNamesValidation = Joi.object({
  categories: Joi.array()
    .items(
      Joi.string()
        .min(1)
        .max(100)
        .messages({ 'string.empty': 'Category name cannot be empty' })
    )
    .min(1)
    .required()
    .messages({
      'array.base': 'categories must be an array of category names',
      'array.min': 'At least one category name is required',
      'any.required': 'categories is required'
    })
});

export const categoryIdsValidation = Joi.object({
  categories: Joi.array()
    .items(
      Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
          'string.base': messages.ERROR.INVALID_CATEGORY_ID,
          'string.length': messages.ERROR.INVALID_CATEGORY_ID,
          'string.hex': messages.ERROR.INVALID_CATEGORY_ID,
          'any.required': messages.ERROR.INVALID_CATEGORY_ID
        })
    )
    .min(1)
    .required()
    .messages({
      'array.base': messages.ERROR.REQUIRED_FIELDS,
      'array.min': messages.ERROR.REQUIRED_FIELDS,
      'any.required': messages.ERROR.REQUIRED_FIELDS
    })
});

export const listVendorProductsValidation = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.base': messages.ERROR.PAGE_NUMBER_INVALID,
      'number.integer': messages.ERROR.PAGE_NUMBER_INVALID,
      'number.min': messages.ERROR.PAGE_NUMBER_INVALID,
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .messages({
      'number.base': messages.ERROR.LIMIT_NUMBER_INVALID,
      'number.integer': messages.ERROR.LIMIT_NUMBER_INVALID,
      'number.min': messages.ERROR.LIMIT_NUMBER_INVALID,
      'number.max': messages.ERROR.LIMIT_NUMBER_INVALID,
    }),

  search: Joi.string().max(200).allow('', null).optional().messages({
    'string.base': messages.ERROR.INVALID_FIELD_TYPE,
    'string.max': messages.ERROR.SEARCH_TOO_LONG || messages.ERROR.INVALID_FIELD_TYPE,
  }),

  // allow single string or array of strings (for multi-category)
  category: Joi.alternatives().try(
    Joi.string().hex().length(24),
    Joi.array().items(Joi.string().hex().length(24))
  ).optional().messages({
    'string.hex': messages.ERROR.CATEGORY_ID_INVALID,
    'string.length': messages.ERROR.CATEGORY_ID_INVALID,
    'array.base': messages.ERROR.CATEGORY_ID_INVALID,
  }),

  minPrice: Joi.number().min(0).optional().messages({
    'number.base': messages.ERROR.PRICE_NUMBER,
    'number.min': messages.ERROR.PRICE_NUMBER,
  }),
  maxPrice: Joi.number().min(0).optional().messages({
    'number.base': messages.ERROR.PRICE_NUMBER,
    'number.min': messages.ERROR.PRICE_NUMBER,
  }),

  isActive: Joi.boolean()
    .truthy('true').truthy('1').truthy('yes').truthy('"true"').truthy("'true'")
    .falsy('false').falsy('0').falsy('no').falsy('"false"').falsy("'false'")
    .optional()
    .messages({
      'boolean.base': messages.ERROR.INVALID_FIELD_TYPE,
    }),

  sortBy: Joi.string().valid('createdAt', 'price', 'title', 'rating', 'updatedAt').optional()
    .messages({
      'any.only': messages.ERROR.INVALID_SORT_FIELD || 'Invalid sort field',
    }),

  sortOrder: Joi.string().valid('asc', 'desc').optional()
    .messages({
      'any.only': messages.ERROR.INVALID_SORT_ORDER || 'sortOrder must be "asc" or "desc"',
    }),
});
