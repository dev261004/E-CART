// src/apps/auth/authValidation.ts
import Joi from "joi";
import messages from "../../utils/messages";

const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,16}$/;

export const forgotPasswordValidation = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.empty": messages.ERROR.REQUIRED_FIELDS,
      "string.email": messages.ERROR.INVALID_EMAIL,
      "any.required": messages.ERROR.REQUIRED_FIELDS
    })
});

export const resetPasswordValidation = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.empty": messages.ERROR.REQUIRED_FIELDS,
      "string.email": messages.ERROR.INVALID_EMAIL,
      "any.required": messages.ERROR.REQUIRED_FIELDS
    }),

  otp: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.empty": messages.ERROR.OTP_REQUIRED,
      "string.length": messages.ERROR.INVALID_OTP,
      "string.pattern.base": messages.ERROR.INVALID_OTP,
      "any.required": messages.ERROR.OTP_REQUIRED
    }),

  newPassword: Joi.string()
    .pattern(passwordPattern)
    .required()
    .messages({
      "string.pattern.base":
        "Password must be 8-16 characters and include uppercase, lowercase, number, and special character",
      "any.required": messages.ERROR.REQUIRED_FIELDS
    }),
     resetToken: Joi.string().min(10).required(),
});

export const requestResetValidation = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": messages.ERROR.REQUIRED_FIELDS,
    "string.email": messages.ERROR.INVALID_EMAIL
  })
});


export const changePasswordValidation = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      "string.empty": messages.ERROR.REQUIRED_FIELDS,
      "any.required": messages.ERROR.REQUIRED_FIELDS
    }),

  newPassword: Joi.string()
    .pattern(passwordPattern)
    .required()
    .messages({
      "string.empty": messages.ERROR.REQUIRED_FIELDS,
      "string.pattern.base":
        "Password must be 8-16 characters and include uppercase, lowercase, number, and special character",
      "any.required": messages.ERROR.REQUIRED_FIELDS
    })
})
  // cross-field rule: newPassword != currentPassword
  .custom((value, helpers) => {
    if (value.currentPassword === value.newPassword) {
      return helpers.error("any.custom");
    }
    return value;
  })
  .messages({
    "any.custom": messages.ERROR.PASSWORD_SAME_AS_OLD
  });
