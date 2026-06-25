import * as authService from './auth.service.js';
import { sendSuccess } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { HTTP_STATUS } from '../../constants/index.js';
import { config } from '../../config/env.config.js';

// Configuration for secure session cookies
const COOKIE_OPTIONS = {
  httpOnly: true, // Prevents client-side JS from reading the cookie
  secure: config.env === 'production', // Send cookie only over HTTPS in production
  sameSite: config.env === 'production' ? 'none' : 'lax', // Use Lax on localhost, None for production cross-origin
  maxAge: 24 * 60 * 60 * 1000, // Expires in 24 hours (matches config)
};

/**
 * Controller to handle new user registration.
 * POST /api/v1/auth/signup
 */
export const handleSignup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const result = await authService.signupUser({ name, email, password });

  // Attach token inside HttpOnly cookie
  res.cookie('token', result.token, COOKIE_OPTIONS);

  // Return user profile metadata (no token returned in body)
  return sendSuccess(res, 'User registered successfully', { user: result.user }, HTTP_STATUS.CREATED);
});

/**
 * Controller to handle user login.
 * POST /api/v1/auth/login
 */
export const handleLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.loginUser({ email, password });

  // Attach token inside HttpOnly cookie
  res.cookie('token', result.token, COOKIE_OPTIONS);

  // Return user profile metadata (no token returned in body)
  return sendSuccess(res, 'Login successful', { user: result.user });
});

/**
 * Controller to handle user logout (clears cookie).
 * POST /api/v1/auth/logout
 */
export const handleLogout = asyncHandler(async (req, res) => {
  // Clear the cookie by setting maxAge to 0
  res.clearCookie('token', {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });

  return sendSuccess(res, 'Logout successful');
});
