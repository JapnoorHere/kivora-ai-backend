export const ERROR_CODES = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  ENDPOINT_NOT_FOUND: 'ENDPOINT_NOT_FOUND',
  INVALID_OBJECT_ID: 'INVALID_OBJECT_ID',
  AUTH_EMAIL_TAKEN: 'AUTH_EMAIL_TAKEN',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_MISSING: 'AUTH_SESSION_MISSING',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_ACCOUNT_DELETED: 'AUTH_ACCOUNT_DELETED',
  RECIPE_NOT_FOUND: 'RECIPE_NOT_FOUND',
  RECIPE_AI_EMPTY_RESPONSE: 'RECIPE_AI_EMPTY_RESPONSE',
  RECIPE_AI_FAILED: 'RECIPE_AI_FAILED',
};

export const MESSAGES = {
  AUTH: {
    EMAIL_TAKEN: 'Email is already registered to another account',
    INVALID_CREDENTIALS: 'Invalid email or password',
    SESSION_MISSING: 'Authentication session is missing or expired. Please login again.',
    TOKEN_INVALID: 'Authentication token is expired or invalid. Access denied.',
    ACCOUNT_DELETED: 'The account associated with this token no longer exists.',
    SIGNUP_SUCCESS: 'User registered successfully',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
  },
  RECIPE: {
    GENERATED: 'Recipe generated and saved successfully',
    FETCHED_ALL: 'Recipes retrieved successfully',
    FETCHED_ONE: 'Recipe retrieved successfully',
    NOT_FOUND: (id) => `Recipe with ID "${id}" was not found`,
    AI_EMPTY_RESPONSE: 'Empty response received from AI model',
    AI_FAILED: (msg) => `Failed to generate recipe from AI: ${msg}`,
  },
  APP: {
    HEALTH_OK: 'Kivora AI Backend is running smoothly',
    ENDPOINT_NOT_FOUND: (method, path) => `Endpoint not found: ${method} ${path}`,
    VALIDATION_FAILED: 'Validation failed',
    INVALID_OBJECT_ID: 'Invalid resource ID format',
  },
};
