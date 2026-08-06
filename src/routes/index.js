import express from 'express';
import recipeRoutes from '../modules/recipe/recipe.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import feedbackRoutes from '../modules/feedback/feedback.routes.js';
import settingsRoutes from '../modules/settings/settings.routes.js';
import logsRoutes from '../modules/logs/logs.routes.js';
import userRoutes from '../modules/user/user.routes.js';

const router = express.Router();

// Mount all feature-specific routes
router.use('/recipes', recipeRoutes);
router.use('/auth', authRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/settings', settingsRoutes);
router.use('/logs', logsRoutes);
router.use('/user', userRoutes);

export default router;
