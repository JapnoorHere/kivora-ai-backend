import { forbidden } from '../errors/index.js';
import { config } from '../config/env.config.js';
import { MESSAGES, ERROR_CODES } from '../constants/index.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// The session lives in a cookie, so the browser attaches it to cross-site requests
// too. CORS alone does not stop that: a plain <form> POST is a "simple" request that
// is sent before any preflight. Browsers always set Origin on non-safe requests, so
// rejecting a mismatched Origin closes the CSRF path. A *missing* Origin means a
// non-browser client (curl, Bruno) which has no ambient cookie to be tricked with.
export const verifyOrigin = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const origin = req.get('origin');
  if (origin && !config.cors.origins.includes(origin)) {
    return next(forbidden(MESSAGES.APP.CSRF_ORIGIN_REJECTED, ERROR_CODES.CSRF_ORIGIN_REJECTED));
  }

  return next();
};
