export const createError = (message, statusCode, errors = null, code = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
  error.isOperational = true;
  if (errors) error.errors = errors;
  if (code) error.code = code;
  if (Error.captureStackTrace) Error.captureStackTrace(error, createError);
  return error;
};
