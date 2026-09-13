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
  const { page, limit } = req.validatedQuery ?? {};
  const result = await recipeService.fetchAllRecipes(req.user._id, { page, limit });
  return sendSuccess(res, MESSAGES.RECIPE.FETCHED_ALL, result);
});

export const handleGetRecipeStats = asyncHandler(async (req, res) => {
  const stats = await recipeService.getRecipeStats(req.user._id);
  return sendSuccess(res, MESSAGES.RECIPE.STATS_FETCHED, stats);
});

export const handleGetRecipeById = asyncHandler(async (req, res) => {
  const recipe = await recipeService.fetchRecipeById(req.params.id, req.user._id);
  return sendSuccess(res, MESSAGES.RECIPE.FETCHED_ONE, recipe);
});

export const handleDeleteRecipe = asyncHandler(async (req, res) => {
  const result = await recipeService.deleteRecipe(req.params.id, req.user._id);
  return sendSuccess(res, MESSAGES.RECIPE.DELETED, result);
});

export const handleClearRecipes = asyncHandler(async (req, res) => {
  const result = await recipeService.clearRecipes(req.user._id);
  return sendSuccess(res, MESSAGES.RECIPE.CLEARED, result);
});
