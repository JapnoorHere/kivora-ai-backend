import { config } from '../config/env.config.js';
import { getTokenExpiry } from './token.js';

export const AUTH_COOKIE_NAME = 'token';

const BASE_OPTIONS = {
  httpOnly: true,
  secure: config.env === 'production',
  // 'none' required for cross-origin requests in production; 'lax' works on localhost
  sameSite: config.env === 'production' ? 'none' : 'lax',
  path: '/',
};

// The cookie is pinned to the token's own `exp` — a mismatch would either log the
// user out early or leave a cookie the server has already stopped accepting.
export const buildAuthCookieOptions = (token) => {
  const expiresAt = getTokenExpiry(token);
  return expiresAt ? { ...BASE_OPTIONS, expires: expiresAt } : { ...BASE_OPTIONS };
};

export const authCookieClearOptions = () => ({ ...BASE_OPTIONS });
