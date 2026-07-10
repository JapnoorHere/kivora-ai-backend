import * as recipeService from './recipe.service.js';
import { sendSuccess } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { HTTP_STATUS, MESSAGES } from '../../constants/index.js';

export const handleGenerateRecipe = asyncHandler(async (req, res) => {
  const { dishName, cuisine, dietaryPreference, servings, exclusions, language } = req.body;
  const recipe = await recipeService.createAILedRecipe(
    { dishName, cuisine, dietaryPreference, servings, exclusions, language },
    req.user._id,
  );
  return sendSuccess(res, MESSAGES.RECIPE.GENERATED, recipe, HTTP_STATUS.CREATED);
});

export const handleModifyRecipe = asyncHandler(async (req, res) => {
  const { modificationText, targetLanguage } = req.body;
  const recipe = await recipeService.modifyRecipe(
    req.params.id,
    { modificationText, targetLanguage },
    req.user._id,
  );
  return sendSuccess(res, MESSAGES.RECIPE.MODIFIED, recipe, HTTP_STATUS.CREATED);
});

export const handleGetAllRecipes = asyncHandler(async (req, res) => {
  const recipes = await recipeService.fetchAllRecipes(req.user._id);
  return sendSuccess(res, MESSAGES.RECIPE.FETCHED_ALL, recipes);
});

export const handleGetRecipeById = asyncHandler(async (req, res) => {
  const recipe = await recipeService.fetchRecipeById(req.params.id, req.user._id);
  return sendSuccess(res, MESSAGES.RECIPE.FETCHED_ONE, recipe);
});
