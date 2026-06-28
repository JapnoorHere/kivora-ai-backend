import { User } from '../modules/user/user.model.js';
import { verifyToken } from '../utils/token.js';
import { unauthorized } from '../errors/index.js';
import { asyncHandler } from '../utils/async-handler.js';
import { MESSAGES, ERROR_CODES } from '../constants/index.js';

export const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    throw unauthorized(MESSAGES.AUTH.SESSION_MISSING, ERROR_CODES.AUTH_SESSION_MISSING);
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    throw unauthorized(MESSAGES.AUTH.TOKEN_INVALID, ERROR_CODES.AUTH_TOKEN_INVALID);
  }

  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    throw unauthorized(MESSAGES.AUTH.ACCOUNT_DELETED, ERROR_CODES.AUTH_ACCOUNT_DELETED);
  }

  req.user = user;
  next();
});
