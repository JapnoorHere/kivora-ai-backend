/**
 * Wraps an async Express route handler to catch errors and forward them to the next middleware.
 * @param {Function} fn - The asynchronous request handler function
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
