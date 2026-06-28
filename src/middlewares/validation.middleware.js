import { badRequest } from '../errors/index.js';
import { MESSAGES, ERROR_CODES } from '../constants/index.js';

export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { value, error } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return next(badRequest(MESSAGES.APP.VALIDATION_FAILED, errors, ERROR_CODES.VALIDATION_FAILED));
    }

    req[source] = value;
    next();
  };
};
