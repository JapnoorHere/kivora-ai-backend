import express from 'express';
import * as recipeController from './recipe.controller.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { generateRecipeSchema } from './recipe.validator.js';

const router = express.Router();

// Enforce authentication on all recipe operations
router.use(protect);

// Route to generate and save a new recipe using AI
router.post('/generate', validate(generateRecipeSchema), recipeController.handleGenerateRecipe);

// Route to get all saved recipes
router.get('/', recipeController.handleGetAllRecipes);

// Route to get a specific recipe by ID
router.get('/:id', recipeController.handleGetRecipeById);

export default router;
