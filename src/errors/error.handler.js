import { config } from '../config/env.config.js';
import { HTTP_STATUS, ERROR_CODES } from '../constants/index.js';
import { logError } from '../utils/logger.js';
import { recordErrorLog } from '../modules/logs/logs.service.js';

const KNOWN_ERROR_CODES = new Set(Object.values(ERROR_CODES));

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;
  // Driver-level errors (Mongo's numeric 11000, Node's 'ECONNREFUSED') also land on
  // `code` — only our own ERROR_CODES are safe to hand to the client.
  let code = KNOWN_ERROR_CODES.has(err.code) ? err.code : null;

  logError(`API Error on ${req.method} ${req.path} (status: ${statusCode})`, err);
  recordErrorLog(err, req);

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
