import { createError } from './custom-error.js';
import { HTTP_STATUS } from '../constants/index.js';

export const badRequest = (message = 'Bad Request', errors = null) => {
  return createError(message, HTTP_STATUS.BAD_REQUEST, errors);
};

export const notFound = (message = 'Resource Not Found') => {
  return createError(message, HTTP_STATUS.NOT_FOUND);
};

export const unauthorized = (message = 'Unauthorized') => {
  return createError(message, HTTP_STATUS.UNAUTHORIZED);
};

export const forbidden = (message = 'Forbidden') => {
  return createError(message, HTTP_STATUS.FORBIDDEN);
};

export const internalServer = (message = 'Internal Server Error') => {
  return createError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
};
