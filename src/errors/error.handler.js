import { config } from '../config/env.config.js';
import { HTTP_STATUS } from '../constants/index.js';
import { logError } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // Log the error internally using custom formatted logger
  logError(`API Error on ${req.method} ${req.path} (status: ${statusCode})`, err);

  // If it's not our custom error and we're in production, mask it
  if (!err.isOperational && config.env === 'production') {
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    message = 'Something went wrong on our end. Please try again later.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};
