import { HTTP_STATUS } from '../constants/index.js';

export const sendSuccess = (res, message, data = null, statusCode = HTTP_STATUS.OK) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data != null && { data }),
  });
};
