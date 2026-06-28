import { createError } from './custom-error.js';
import { HTTP_STATUS } from '../constants/index.js';

export const badRequest = (message = 'Bad Request', errors = null, code = null) => {
  return createError(message, HTTP_STATUS.BAD_REQUEST, errors, code);
};

export const notFound = (message = 'Resource Not Found', code = null) => {
  return createError(message, HTTP_STATUS.NOT_FOUND, null, code);
};

export const unauthorized = (message = 'Unauthorized', code = null) => {
  return createError(message, HTTP_STATUS.UNAUTHORIZED, null, code);
};

export const forbidden = (message = 'Forbidden', code = null) => {
  return createError(message, HTTP_STATUS.FORBIDDEN, null, code);
};

export const conflict = (message = 'Conflict', code = null) => {
  return createError(message, HTTP_STATUS.CONFLICT, null, code);
};

export const internalServer = (message = 'Internal Server Error', code = null) => {
  return createError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, null, code);
};
