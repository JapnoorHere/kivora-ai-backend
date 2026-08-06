import { User } from '../modules/user/user.model.js';
import { isSessionTokenRevoked } from '../modules/auth/auth.service.js';
import { verifyToken } from '../utils/token.js';
import { unauthorized } from '../errors/index.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AUTH_COOKIE_NAME } from '../utils/cookie.util.js';
import { MESSAGES, ERROR_CODES } from '../constants/index.js';

export const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token) {
    throw unauthorized(MESSAGES.AUTH.SESSION_MISSING, ERROR_CODES.AUTH_SESSION_MISSING);
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    throw unauthorized(MESSAGES.AUTH.TOKEN_INVALID, ERROR_CODES.AUTH_TOKEN_INVALID);
  }

  if (await isSessionTokenRevoked(decoded.jti)) {
    throw unauthorized(MESSAGES.AUTH.TOKEN_REVOKED, ERROR_CODES.AUTH_TOKEN_REVOKED);
  }

  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    throw unauthorized(MESSAGES.AUTH.ACCOUNT_DELETED, ERROR_CODES.AUTH_ACCOUNT_DELETED);
  }

  req.user = user;
  next();
});
