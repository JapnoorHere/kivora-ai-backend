import express from 'express';
import * as recipeController from './recipe.controller.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { validateObjectId } from '../../middlewares/validate-object-id.middleware.js';
import { aiGenerationLimiter } from '../../middlewares/rate-limit.middleware.js';
import { generateRecipeSchema, modifyRecipeSchema } from './recipe.validator.js';

const router = express.Router();

router.use(protect);

router.post('/generate', aiGenerationLimiter, validate(generateRecipeSchema), recipeController.handleGenerateRecipe);
router.get('/', recipeController.handleGetAllRecipes);
router.get('/:id', validateObjectId('id'), recipeController.handleGetRecipeById);
router.post('/:id/modify', validateObjectId('id'), aiGenerationLimiter, validate(modifyRecipeSchema), recipeController.handleModifyRecipe);

export default router;
