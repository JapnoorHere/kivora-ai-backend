import express from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { loginLimiter, signupLimiter } from '../../middlewares/rate-limit.middleware.js';
import { signupSchema, loginSchema } from './auth.validator.js';

const router = express.Router();

// Route to handle standard user signup
router.post('/signup', signupLimiter, validate(signupSchema), authController.handleSignup);

// Route to handle standard user login
router.post('/login', loginLimiter, validate(loginSchema), authController.handleLogin);

// Route to handle user logout
router.post('/logout', authController.handleLogout);

// Route the client uses to restore a session on page load
router.get('/me', protect, authController.handleGetMe);

export default router;
