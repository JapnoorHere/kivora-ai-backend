import mongoose from 'mongoose';
import { badRequest } from '../errors/index.js';
import { MESSAGES, ERROR_CODES } from '../constants/index.js';

export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params[paramName])) {
      return next(badRequest(MESSAGES.APP.INVALID_OBJECT_ID, null, ERROR_CODES.INVALID_OBJECT_ID));
    }
    next();
  };
};
