import Joi from 'joi';
import messages from '../../utils/messages';

// Allow: letters, numbers, hyphen, underscore, space (no leading/trailing space)
const namePattern = /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/;

//create category validation
export const createCategoryValidation = Joi.object({
  name: Joi.string()
    .pattern(namePattern)
    .min(2)
    .max(80)
    .required()
    .messages({
       'string.base': messages.ERROR.INVALID_CATEGORY_NAME_TYPE,

      'string.empty': messages.ERROR.REQUIRED_FIELDS,
      'string.pattern.base': messages.ERROR.INVALID_CATEGORY_NAME ,
      'string.min': messages.ERROR.CATEGORY_NAME_TOO_SHORT ,
      'string.max': messages.ERROR.CATEGORY_NAME_TOO_LONG ,
      'any.required': messages.ERROR.REQUIRED_FIELDS
    }),

  description: Joi.string()
    .max(500)
    .allow('', null)
    .messages({
      'string.max': messages.ERROR.DESCRIPTION_TOO_LONG 
    }),

  isActive: Joi.boolean().optional()
});


export const updateCategoryValidation = Joi.object({
  name: Joi.string()
    .pattern(namePattern)
    .min(2)
    .max(80)
    .optional()
    .messages({
      'string.pattern.base': messages.ERROR.INVALID_CATEGORY_NAME ,
      'string.min': messages.ERROR.CATEGORY_NAME_TOO_SHORT ,
      'string.max': messages.ERROR.CATEGORY_NAME_TOO_LONG 
    }),

  description: Joi.string()
    .max(500)
    .allow('', null)
    .optional()
    .messages({
      'string.max': messages.ERROR.DESCRIPTION_TOO_LONG 
    }),

  isActive: Joi.boolean().optional()
});


export const idParamValidation = Joi.object({
  id: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      'string.base': messages.ERROR.INVALID_CATEGORY_ID,  
      'string.empty': messages.ERROR.CATEGORY_NOT_FOUND,
      'string.length': messages.ERROR.INVALID_CATEGORY_ID,
      'string.hex': messages.ERROR.CATEGORY_NOT_FOUND,
      'any.required': messages.ERROR.CATEGORY_NOT_FOUND
    })
});


export const setActiveValidation = Joi.object({
  isActive: Joi.boolean()
    .required()
    .messages({
      'any.required': messages.ERROR.REQUIRED_FIELDS,
      'boolean.base': messages.ERROR.INVALID_FIELD_TYPE 
    })
});


export const listCategoryValidation = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.base': messages.ERROR.PAGE_NUMBER_INVALID || messages.ERROR.INVALID_FIELD_TYPE,
      'number.integer': messages.ERROR.PAGE_NUMBER_INVALID || messages.ERROR.INVALID_FIELD_TYPE,
      'number.min': messages.ERROR.PAGE_NUMBER_INVALID || messages.ERROR.INVALID_FIELD_TYPE,
      'any.required': messages.ERROR.PAGE_NUMBER_INVALID || messages.ERROR.INVALID_FIELD_TYPE,
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .messages({
      'number.base': messages.ERROR.LIMIT_NUMBER_INVALID || messages.ERROR.INVALID_FIELD_TYPE,
      'number.integer': messages.ERROR.LIMIT_NUMBER_INVALID || messages.ERROR.INVALID_FIELD_TYPE,
      'number.min': messages.ERROR.LIMIT_NUMBER_INVALID || messages.ERROR.INVALID_FIELD_TYPE,
      'number.max': messages.ERROR.LIMIT_NUMBER_INVALID || messages.ERROR.INVALID_FIELD_TYPE,
      'any.required': messages.ERROR.LIMIT_NUMBER_INVALID || messages.ERROR.INVALID_FIELD_TYPE,
    }),

  search: Joi.string()
    .max(100)
    .allow('', null)
    .optional()
    .messages({
      'string.base': messages.ERROR.INVALID_FIELD_TYPE,
      'string.max': messages.ERROR.SEARCH_TOO_LONG || messages.ERROR.INVALID_FIELD_TYPE,
      'any.required': messages.ERROR.INVALID_FIELD_TYPE,
    }),

  isActive: Joi.boolean()
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
      'any.required': messages.ERROR.INVALID_FIELD_TYPE,
    }),

  // whitelist sort fields for safety
  sortBy: Joi.string()
    .valid('name', 'createdAt')
    .optional()
    .default('createdAt')
    .messages({
      'string.base': messages.ERROR.INVALID_FIELD_TYPE,
      'any.only': messages.ERROR.INVALID_SORT_FIELD || 'Invalid sort field',
      'any.required': messages.ERROR.INVALID_FIELD_TYPE,
    }),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .default('desc')
    .messages({
      'string.base': messages.ERROR.INVALID_FIELD_TYPE,
      'any.only': messages.ERROR.INVALID_SORT_ORDER || 'sortOrder must be "asc" or "desc"',
      'any.required': messages.ERROR.INVALID_FIELD_TYPE,
    }),
});


