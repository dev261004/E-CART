// src/constants/messages.ts

const messages = {
  SUCCESS: {
    USER_CREATED: "User registered successfully",
    LOGIN_SUCCESS: "Login successful",
  },

  ERROR: {
    REQUIRED_FIELDS: "Please fill all required fields",
    INVALID_EMAIL: "Email format is invalid",
    EMAIL_EXISTS: "Email already exists",
    INVALID_CREDENTIALS: "Invalid email or password",
    USER_NOT_FOUND: "User not exists with this email check email",
    SERVER_ERROR: "Something went wrong. Please try again.",

    // signup-specific
    NAME_INVALID: "Name must contain only alphabets (A-Z a-z)",
    PASSWORD_INVALID:
      "Password must be 8-16 characters and include uppercase, lowercase, number, and special character",
    PHONE_INVALID: "Phone number must contain only numbers and it should be 10 digits",
    PHONE_MIN: "Phone number must be at least 10 digits",
    PHONE_MAX: "Phone number not more than 10 digits",
    ROLE_INVALID: "Role must be vendor or buyer",
    PASSWORD_MISMATCH: "Passwords must match",

    CATEGORY_NAME_MIN: "Category name must be at least 2 characters",
CATEGORY_NAME_MAX: "Category name must be at most 80 characters",
CATEGORY_DESCRIPTION_MAX: "Description can be at most 500 characters",


    // -------- PRODUCT ERRORS --------
    TITLE_MIN: "Title must be at least 2 characters",
    TITLE_MAX: "Title must be at most 120 characters",
    TITLE_INVALID: "Title contains invalid characters",

    DESCRIPTION_MIN: "Description must be at least 5 characters",
    DESCRIPTION_MAX: "Description can be at most 2000 characters",

    PRICE_MIN: "Price must be above 0",

    CATEGORY_REQUIRED: "Please select a category",

    IMAGE_URL_INVALID: "Image must be a valid URL",
    IMAGE_MAX: "Maximum 5 images allowed",

    STOCK_MIN: "Stock must be at least 1",
    STOCK_MAX: "Stock can be at most 100",
  },
} as const;

export default messages;
export type Messages = typeof messages;
