import express from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { signupSchema, loginSchema } from './auth.validator.js';

const router = express.Router();

// Route to handle standard user signup
router.post('/signup', validate(signupSchema), authController.handleSignup);

// Route to handle standard user login
router.post('/login', validate(loginSchema), authController.handleLogin);

// Route to handle user logout
router.post('/logout', authController.handleLogout);

export default router;
