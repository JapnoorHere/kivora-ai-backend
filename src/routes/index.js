import express from 'express';
import recipeRoutes from '../modules/recipe/recipe.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';

const router = express.Router();

// Mount all feature-specific routes
router.use('/recipes', recipeRoutes);
router.use('/auth', authRoutes);

// Future routes can be registered here:
// router.use('/users', userRoutes);

export default router;
