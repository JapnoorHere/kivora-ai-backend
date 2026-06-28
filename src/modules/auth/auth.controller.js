import * as authService from './auth.service.js';
import { sendSuccess } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { HTTP_STATUS, MESSAGES } from '../../constants/index.js';
import { config } from '../../config/env.config.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.env === 'production',
  // 'none' required for cross-origin requests in production; 'lax' works on localhost
  sameSite: config.env === 'production' ? 'none' : 'lax',
  maxAge: 24 * 60 * 60 * 1000,
};

export const handleSignup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const result = await authService.signupUser({ name, email, password });

  // Token lives in the cookie only — never returned in the response body
  res.cookie('token', result.token, COOKIE_OPTIONS);
  return sendSuccess(res, MESSAGES.AUTH.SIGNUP_SUCCESS, { user: result.user }, HTTP_STATUS.CREATED);
});

export const handleLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser({ email, password });

  res.cookie('token', result.token, COOKIE_OPTIONS);
  return sendSuccess(res, MESSAGES.AUTH.LOGIN_SUCCESS, { user: result.user });
});

export const handleLogout = asyncHandler(async (req, res) => {
  res.clearCookie('token', { ...COOKIE_OPTIONS, maxAge: 0 });
  return sendSuccess(res, MESSAGES.AUTH.LOGOUT_SUCCESS);
});
