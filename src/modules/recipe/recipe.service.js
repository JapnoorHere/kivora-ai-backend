import { generateRecipe } from '../ai/ai.service.js';
import { Recipe } from './recipe.model.js';
import { notFound } from '../../errors/index.js';
import { MESSAGES, ERROR_CODES } from '../../constants/index.js';
import { serialize, serializeMany } from '../../utils/serialize.js';

export const createAILedRecipe = async (params, userId) => {
  const generatedData = await generateRecipe(params);
  const recipe = await Recipe.create({ ...generatedData, createdBy: userId });
  return serialize(recipe.toObject());
};

export const fetchAllRecipes = async (userId) => {
  const recipes = await Recipe.find({ createdBy: userId })
    .sort({ createdAt: -1 })
    .lean();
  return serializeMany(recipes);
};

export const fetchRecipeById = async (id, userId) => {
  const recipe = await Recipe.findOne({ _id: id, createdBy: userId }).lean();
  if (!recipe) {
    throw notFound(MESSAGES.RECIPE.NOT_FOUND(id), ERROR_CODES.RECIPE_NOT_FOUND);
  }
  return serialize(recipe);
};
