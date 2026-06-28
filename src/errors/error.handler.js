import { config } from '../config/env.config.js';
import { HTTP_STATUS } from '../constants/index.js';
import { logError } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;
  let code = err.code || null;

  logError(`API Error on ${req.method} ${req.path} (status: ${statusCode})`, err);

  if (!err.isOperational && config.env === 'production') {
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    message = 'Something went wrong on our end. Please try again later.';
    code = null;
    errors = null;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(code && { code }),
    ...(errors && { errors }),
    ...(req.requestId && { requestId: req.requestId }),
  });
};
