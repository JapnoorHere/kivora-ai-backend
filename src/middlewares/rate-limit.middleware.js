import rateLimit from 'express-rate-limit';
import { tooManyRequests } from '../errors/index.js';
import { MESSAGES, ERROR_CODES } from '../constants/index.js';

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
