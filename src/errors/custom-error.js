/**
 * Factory function to create custom operational errors.
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Array|Object} [errors] - Specific validation errors or details
 * @returns {Error} A decorated Error instance
 */
export const createError = (message, statusCode, errors = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
  error.isOperational = true;
  if (errors) {
    error.errors = errors;
  }
  
  if (Error.captureStackTrace) {
    Error.captureStackTrace(error, createError);
  }
  
  return error;
};
