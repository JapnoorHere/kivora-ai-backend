import { User } from '../modules/user/user.model.js';
import { verifyToken } from '../utils/token.js';
import { unauthorized } from '../errors/index.js';
import { asyncHandler } from '../utils/async-handler.js';

/**
 * Express middleware to enforce JWT authentication on routes.
 * Inspects "Authorization: Bearer <token>" header, resolves the user,
 * and attaches the Mongoose user document to req.user.
 */
export const protect = asyncHandler(async (req, res, next) => {
  // 1. Get token from HttpOnly cookies
  const token = req.cookies?.token;

  // 2. Validate existence
  if (!token) {
    throw unauthorized('Authentication session is missing or expired. Please login again.');
  }

  let decoded;
  try {
    // 4. Verify token signature and expiration
    decoded = verifyToken(token);
  } catch (error) {
    throw unauthorized('Authentication token is expired or invalid. Access denied.');
  }

  // 5. Query user in database
  const user = await User.findById(decoded.id).select('-password'); // Exclude password from request context
  if (!user) {
    throw unauthorized('The account associated with this token no longer exists.');
  }

  // 6. Attach resolved user context to request
  req.user = user;
  next();
});
