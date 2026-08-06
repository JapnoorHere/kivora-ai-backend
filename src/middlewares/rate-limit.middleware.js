import rateLimit from 'express-rate-limit';
import { tooManyRequests } from '../errors/index.js';
import { MESSAGES, ERROR_CODES } from '../constants/index.js';

const ipLimitHandler = (message, code) => (req, res, next) => {
  next(tooManyRequests(message, code));
};

// Pre-auth, so these fall back to the library's default IP key — there is no req.user
// to charge yet. Only failed attempts count against the login budget, so a legitimate
// user signing in repeatedly is never locked out.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: ipLimitHandler(MESSAGES.AUTH.TOO_MANY_ATTEMPTS, ERROR_CODES.AUTH_TOO_MANY_ATTEMPTS),
});

export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: ipLimitHandler(MESSAGES.AUTH.TOO_MANY_SIGNUPS, ERROR_CODES.AUTH_TOO_MANY_SIGNUPS),
});

// Applied after `protect`, so req.user is always populated — limits are per-user, not per-IP,
// since AI generation cost is what we're actually protecting against.
export const aiGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user._id.toString(),
  handler: (req, res, next) => {
    next(tooManyRequests(MESSAGES.APP.RATE_LIMIT_EXCEEDED, ERROR_CODES.RATE_LIMIT_EXCEEDED));
  },
});
