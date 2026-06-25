import { HTTP_STATUS } from '../constants/index.js';

/**
 * Send a success response.
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Object|Array} data - Data to send back to client
 * @param {number} statusCode - HTTP Status code (default 200)
 */
export const sendSuccess = (res, message, data = null, statusCode = HTTP_STATUS.OK) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data && { data }),
  });
};

/**
 * Send an error response (for manual/non-global error cases if needed).
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {Array|Object} errors - Detailed errors list (e.g. Joi validation fields)
 * @param {number} statusCode - HTTP Status code (default 400)
 */
export const sendError = (res, message, errors = null, statusCode = HTTP_STATUS.BAD_REQUEST) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};
