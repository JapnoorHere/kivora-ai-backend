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

    if (source === 'query') {
      // Express 5 makes req.query a getter — assigning to it throws. Hand the
      // validated/coerced value to the controller on req.validatedQuery instead.
      req.validatedQuery = value;
    } else {
      req[source] = value;
    }
    next();
  };
};
