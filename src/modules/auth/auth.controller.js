import * as authService from './auth.service.js';
import { sendSuccess } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { HTTP_STATUS, MESSAGES } from '../../constants/index.js';
import { AUTH_COOKIE_NAME, buildAuthCookieOptions, authCookieClearOptions } from '../../utils/cookie.util.js';

export const handleSignup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const result = await authService.signupUser({ name, email, password });

  // Token lives in the cookie only — never returned in the response body
  res.cookie(AUTH_COOKIE_NAME, result.token, buildAuthCookieOptions(result.token));
  return sendSuccess(res, MESSAGES.AUTH.SIGNUP_SUCCESS, { user: result.user }, HTTP_STATUS.CREATED);
});

export const handleLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser({ email, password });

  res.cookie(AUTH_COOKIE_NAME, result.token, buildAuthCookieOptions(result.token));
  return sendSuccess(res, MESSAGES.AUTH.LOGIN_SUCCESS, { user: result.user });
});

export const handleLogout = asyncHandler(async (req, res) => {
  await authService.revokeSessionToken(req.cookies?.[AUTH_COOKIE_NAME]);

  res.clearCookie(AUTH_COOKIE_NAME, authCookieClearOptions());
  return sendSuccess(res, MESSAGES.AUTH.LOGOUT_SUCCESS);
});

// The auth cookie is HttpOnly, so the browser can never inspect its own session —
// this is the only way the client can learn whether it is still signed in.
export const handleGetMe = asyncHandler(async (req, res) => {
  return sendSuccess(res, MESSAGES.AUTH.SESSION_ACTIVE, { user: authService.buildAuthUserView(req.user) });
});
