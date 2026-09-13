import express from 'express';
import * as recipeController from './recipe.controller.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { validateObjectId } from '../../middlewares/validate-object-id.middleware.js';
import { aiGenerationLimiter } from '../../middlewares/rate-limit.middleware.js';
import { generateRecipeSchema, modifyRecipeSchema, listRecipesSchema } from './recipe.validator.js';

const router = express.Router();

router.use(protect);

router.post('/generate', aiGenerationLimiter, validate(generateRecipeSchema), recipeController.handleGenerateRecipe);
router.get('/', validate(listRecipesSchema, 'query'), recipeController.handleGetAllRecipes);
// Static path — must be declared before the `/:id` param route.
router.get('/stats', recipeController.handleGetRecipeStats);
router.delete('/', recipeController.handleClearRecipes);
router.get('/:id', validateObjectId('id'), recipeController.handleGetRecipeById);
router.post('/:id/modify', validateObjectId('id'), aiGenerationLimiter, validate(modifyRecipeSchema), recipeController.handleModifyRecipe);
router.delete('/:id', validateObjectId('id'), recipeController.handleDeleteRecipe);

export default router;
