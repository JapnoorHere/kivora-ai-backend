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
  RECIPE_AI_QUOTA_EXCEEDED: 'RECIPE_AI_QUOTA_EXCEEDED',
  RECIPE_INVALID_DISH: 'RECIPE_INVALID_DISH',
  RECIPE_DIET_MISMATCH: 'RECIPE_DIET_MISMATCH',
  RECIPE_DIET_MISMATCH_MODIFICATION: 'RECIPE_DIET_MISMATCH_MODIFICATION',
  RECIPE_FREE_LIMIT_REACHED: 'RECIPE_FREE_LIMIT_REACHED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SETTINGS_INVALID_API_KEY: 'SETTINGS_INVALID_API_KEY',
  SETTINGS_PROVIDER_NOT_CONNECTED: 'SETTINGS_PROVIDER_NOT_CONNECTED',
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
    MODIFIED: 'Recipe updated and saved successfully',
    FETCHED_ALL: 'Recipes retrieved successfully',
    FETCHED_ONE: 'Recipe retrieved successfully',
    NOT_FOUND: (id) => `Recipe with ID "${id}" was not found`,
    // Kept generic on purpose — never interpolate the raw upstream (Gemini) error
    // message here, it can leak internal details straight to the user's toast.
    // Full details always go to logError() server-side instead.
    AI_EMPTY_RESPONSE: 'We couldn\'t generate your recipe right now. Please try again in a moment.',
    AI_FAILED: 'We couldn\'t generate your recipe right now. Please try again in a moment.',
    AI_QUOTA_EXCEEDED: 'Our recipe engine is temporarily at capacity. Please try again shortly.',
    INVALID_DISH: 'That doesn\'t look like a real dish. Try a specific recipe name, like "Butter Chicken" or "Margherita Pizza".',
    DIET_MISMATCH: 'The AI could not generate a recipe that honors your dietary preference. Please try again.',
    DIET_MISMATCH_MODIFICATION: 'That change conflicts with this recipe\'s dietary preference. Please adjust your request.',
    FREE_LIMIT_REACHED: (limit) => `You've used all ${limit} free recipes today. Add your own API key in Settings for unlimited recipes, or come back tomorrow.`,
  },
  FEEDBACK: {
    SUBMITTED: 'Feedback submitted successfully',
  },
  SETTINGS: {
    FETCHED: 'AI settings retrieved successfully',
    KEY_SAVED: 'API key connected successfully',
    KEY_REMOVED: 'API key removed successfully',
    PREFERRED_UPDATED: 'Active AI provider updated',
    INVALID_API_KEY: (provider) => `That ${provider === 'gemini' ? 'Gemini' : 'Groq'} API key could not be verified. Double-check it and try again.`,
    PROVIDER_NOT_CONNECTED: (provider) => `You haven't connected a ${provider === 'gemini' ? 'Gemini' : 'Groq'} key yet.`,
  },
  LOGS: {
    FETCHED_ERRORS: 'Error history retrieved successfully',
    FETCHED_AI: 'AI interaction history retrieved successfully',
  },
  USER: {
    PREFERENCES_FETCHED: 'Preferences retrieved successfully',
    PREFERENCES_SAVED: 'Preferences saved successfully',
  },
  APP: {
    HEALTH_OK: 'Kivora AI Backend is running smoothly',
    ENDPOINT_NOT_FOUND: (method, path) => `Endpoint not found: ${method} ${path}`,
    VALIDATION_FAILED: 'Validation failed',
    INVALID_OBJECT_ID: 'Invalid resource ID format',
    RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
  },
};
