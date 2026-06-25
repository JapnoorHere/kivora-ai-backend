import { badRequest } from '../errors/index.js';

/**
 * Express middleware to validate request data against a Joi schema.
 * @param {Object} schema - Joi schema object
 * @param {string} [source='body'] - The property of req to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { value, error } = schema.validate(req[source], {
      abortEarly: false, // Include all errors, not just the first one
      stripUnknown: true, // Remove keys that are not defined in the schema
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return next(badRequest('Validation failed', errors));
    }

    // Replace request data with validated/sanitized value
    req[source] = value;
    next();
  };
};
