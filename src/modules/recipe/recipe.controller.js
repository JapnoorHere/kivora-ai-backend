import * as recipeService from './recipe.service.js';
import { sendSuccess } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { HTTP_STATUS } from '../../constants/index.js';

/**
 * Endpoint to generate a recipe using AI and save it.
 * POST /api/v1/recipes/generate
 */
export const handleGenerateRecipe = asyncHandler(async (req, res) => {
  const { ingredients, cuisine, maxTime, dietaryRestrictions } = req.body;

  const recipe = await recipeService.createAILedRecipe({
    ingredients,
    cuisine,
    maxTime,
    dietaryRestrictions,
  });

  return sendSuccess(res, 'Recipe generated and saved successfully', recipe, HTTP_STATUS.CREATED);
});

/**
 * Endpoint to get all saved recipes.
 * GET /api/v1/recipes
 */
export const handleGetAllRecipes = asyncHandler(async (req, res) => {
  const recipes = await recipeService.fetchAllRecipes();
  return sendSuccess(res, 'Recipes retrieved successfully', recipes);
});

/**
 * Endpoint to get a specific recipe by ID.
 * GET /api/v1/recipes/:id
 */
export const handleGetRecipeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const recipe = await recipeService.fetchRecipeById(id);
  return sendSuccess(res, 'Recipe retrieved successfully', recipe);
});
