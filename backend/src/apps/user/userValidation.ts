import Joi from 'joi';
import messages from '../../utils/messages';

const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,16}$/;


const namePattern = /^[A-Za-z]+( [A-Za-z]+)*$/;

//const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;


export const signupValidation = Joi.object({
  name: Joi.string()
    .pattern(namePattern)
    .required()
    .messages({
      "string.empty": messages.ERROR.REQUIRED_FIELDS,
      "any.required": messages.ERROR.REQUIRED_FIELDS,
      "string.pattern.base": "Name must contain only alphabets (A-Z a-z)",
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.empty": messages.ERROR.REQUIRED_FIELDS,
      "string.email": messages.ERROR.INVALID_EMAIL,
      "any.required": messages.ERROR.REQUIRED_FIELDS,
    }),

  password: Joi.string()
    .pattern(passwordPattern)
    .required()
    .messages({
      "string.empty": messages.ERROR.REQUIRED_FIELDS,
      "string.pattern.base":
        "Password must be 8-16 characters and include uppercase, lowercase, number, and special character",
      "any.required": messages.ERROR.REQUIRED_FIELDS,
    }),

  phoneNumber: Joi.string()
    .min(10)
    .required()
    .messages({
      "string.empty": messages.ERROR.REQUIRED_FIELDS,
      "string.min": "Phone number must be at least 10 digits",
      "any.required": messages.ERROR.REQUIRED_FIELDS,
    }),

  role: Joi.string()
    .valid("vendor", "buyer")
    .required()
    .messages({
      "any.only": "Role must be vendor or buyer",
      "any.required": messages.ERROR.REQUIRED_FIELDS,
    })
});

export const loginValidation = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.empty": messages.ERROR.REQUIRED_FIELDS,
      "string.email": messages.ERROR.INVALID_EMAIL,
      "any.required": messages.ERROR.REQUIRED_FIELDS,
    }),

  password: Joi.string()
    .required()
    .messages({
      "string.empty": messages.ERROR.REQUIRED_FIELDS,
      "any.required": messages.ERROR.REQUIRED_FIELDS,
    })
});

export const userIdParamValidation = Joi.object({
  id: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      "string.base": "User id must be a string",
      "string.empty": "User id is required",
      "string.hex": "User id is invalid",
      "string.length": "User id is invalid",
      "any.required": "User id is required"
    })
});


export const updateProfileValidation = Joi.object({
  name: Joi.string()
    .pattern(namePattern)
    .trim()
    .optional()
    .messages({
      "string.base": messages.ERROR.INVALID_FIELD_TYPE,
      "string.min":  "Name is too short",
      "string.max": "Name is too long",
    }),

  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional()
    .messages({
      "string.base": messages.ERROR.INVALID_FIELD_TYPE,
      "string.pattern.base":
        "Phone must be 10 digits",
    }),

  addressLine1: Joi.string().max(200).allow("", null).optional(),
  addressLine2: Joi.string().max(200).allow("", null).optional(),
  city: Joi.string().max(100).allow("", null).optional(),
  state: Joi.string().max(100).allow("", null).optional(),
  postalCode: Joi.string().max(6).allow("", null).optional(),
  country: Joi.string().max(100).allow("", null).optional(),
  removeAvatar: Joi.boolean()
    .truthy("true")
    .falsy("false")
    .optional(),
  // we do NOT validate profileImage here, it comes from file upload
}).min(1); // at least one field must be present







