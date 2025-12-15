// src/utils/messages.ts

const messages = {
  SUCCESS: {
    USER_CREATED: "User registered successfully",
    LOGIN_SUCCESS: "Login successful",
    USER_PROFILE_FETCHED: "User profile fetched successfully",

    LOGOUT_SUCCESS: "Logged out successfully",
    OTP_VERIFIED:"OTP verified successfully",
    OTP_SENT: "OTP sent successfully",
    OTP_RESENT: "OTP resent successfully",
    PASSWORD_RESET_SUCCESS: "Password reset successfully",

    PASSWORD_CHANGED: "Password changed successfully",
     
    CATEGORY_CREATED: "Category created successfully",
    CATEGORY_UPDATED: "Category updated successfully",
    CATEGORY_DELETED: "Category deleted successfully",
    CATEGORY_FETCHED: "Category fetched successfully",
    CATEGORY_LIST: "Categories fetched successfully",

    PRODUCT_CREATED: "Product created successfully",
    PRODUCT_UPDATED: "Product updated successfully",
    PRODUCT_DELETED: "Product deleted successfully",
    PRODUCT_FETCHED: "Product fetched successfully",
    PRODUCT_LIST: "Products fetched successfully"
  },

  ERROR: {

    ENCRYPTIION_KEY_LENGTH_INVALID:"ENCRYPTION_KEY must be 32 bytes (64 hex chars) for aes-256-cbc",
    ENCRYPTIION_IV_LENGTH_INVALID:"ENCRYPTION_IV must be 16 bytes (32 hex chars) for aes-256-cbc",
    ENCRYPTION_ENV_VARS_MISSING:"ENCRYPTION_KEY or ENCRYPTION_IV missing in .env",
    REQUIRED_FIELDS: "Please fill all required fields",
    INVALID_EMAIL: "Email format is invalid",
    EMAIL_EXISTS: "Email already exists",
    INVALID_CREDENTIALS: "Invalid email or password",
    USER_NOT_FOUND: "User not exists with this email check email",
     INVALID_OLD_PASSWORD: "Current password is incorrect",
    PASSWORD_SAME_AS_OLD: "New password must be different from current password",
     
    OTP_REQUIRED: "OTP is required",
    INVALID_OTP:"OTP is invalid try again",
    OTP_EXPIRED:"OTP expired genrate new otp",
    
    METHOD_NOT_ALLOWED: "This HTTP method is not allowed for this route",

    INVALID_CATEGORY_NAME_TYPE: "Category name must be a string",
    
    INVALID_USER_ID: "Invalid user id. Check again.",
    INVALID_PRODUCT_ID: "Invalid product id. Check again.",
    CATEGORY_NOT_FOUND: "Category not found",
    INVALID_CATEGORY_ID:"Category id is inavlid check again",
    CATEGORY_EXISTS: "Category with this name already exists",

    PRODUCT_NOT_FOUND: "Product not found",

    UNAUTHORIZED: "Unauthorized access",
    FORBIDDEN: "You do not have permission to perform this action",
    TOKEN_EXPIRED: "Token has expired",
    INVALID_TOKEN: "Invalid token",

    SERVER_ERROR: "Something went wrong. Please try again.",

    // Validation-specific messages (category)
    EMPTY_CATEGORY_NAME:"categpry name not be empty",
    INVALID_CATEGORY_NAME: "Category name contains invalid characters",
    CATEGORY_NAME_TOO_SHORT: "Category name must be at least 2 characters",
    CATEGORY_NAME_TOO_LONG: "Category name must be at most 80 characters",
    DESCRIPTION_TOO_LONG: "Description can be at most 500 characters",
    INVALID_FIELD_TYPE: "Invalid field type",

    INVALID_SORT_ORDER:'sortOrder must be "asc" or "desc" ',
    INVALID_SORT_FIELD:'Invalid sort field',
    SEARCH_TOO_LONG:"maximum character exeeded",

    STOCK_NUMBER_INVALID:"stock must be grater than 0",
    STOCK_NUMBER_INTEGER:"stock must be integer",

    // Validation-specific messages (product)
    TITLE_NAME_TYPE: "Title name must be a string",
    TITLE_REQUIRED: "Title is required",
    TITLE_INVALID: "Title contains invalid characters",
    TITLE_TOO_SHORT: "Title must be at least 2 characters",
    TITLE_TOO_LONG: "Title must be at most 120 characters",

    DESCRIPTION_TOO_LONG_PRODUCT: "Description can be at most 2000 characters",

    PRICE_REQUIRED: "Price is required",
    PRICE_NUMBER: "Price must be a number",
    PRICE_MIN: "Price must be at least 0",

    IMAGE_INVALID_URL: "Image must be a valid URL",
    IMAGES_MAX: "You can upload at most 5 images",

    STOCK_NUMBER: "Stock must be a number",
    STOCK_MIN: "Stock cannot be negative",

    VENDOR_ID_INVALID: "Vendor id is invalid",
    CATEGORY_ID_INVALID: "Category id is invalid",
    PRODUCT_ID_INVALID: "Product id is invalid",

    PAGE_NUMBER_INVALID: "Page must be a number and at least 1",
    LIMIT_NUMBER_INVALID: "Limit must be a number between 1 and 100",
   
  }
};

export default messages;
