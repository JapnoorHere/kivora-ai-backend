import { generateRecipe, generateModifiedRecipe } from '../ai/ai.service.js';
import { resolveAiContext } from '../settings/settings.service.js';
import { Recipe } from './recipe.model.js';
import { badRequest, notFound } from '../../errors/index.js';
import { MESSAGES, ERROR_CODES } from '../../constants/index.js';
import { serialize, serializeMany } from '../../utils/serialize.js';

// Simple keyword scan used to catch obvious dietary conflicts deterministically,
// cheaper and more reliable than trusting the model to self-report every time.
const NON_VEG_KEYWORDS = ['chicken', 'mutton', 'beef', 'pork', 'fish', 'meat', 'egg', 'prawn', 'shrimp'];
const NON_VEGAN_KEYWORDS = [...NON_VEG_KEYWORDS, 'milk', 'cheese', 'butter', 'cream', 'yogurt', 'honey', 'ghee'];

const textConflictsWithDiet = (text, dietaryPreference) => {
  const keywords = dietaryPreference === 'vegan' ? NON_VEGAN_KEYWORDS : dietaryPreference === 'veg' ? NON_VEG_KEYWORDS : [];
  const lowerText = text.toLowerCase();
  return keywords.some((keyword) => lowerText.includes(keyword));
};

export const createAILedRecipe = async (params, userId) => {
  const aiContext = await resolveAiContext(userId);
  const generatedData = await generateRecipe(params, aiContext);
  const { isValidDish, matchesDietaryPreference, ...recipeFields } = generatedData;

  if (!isValidDish) {
    throw badRequest(MESSAGES.RECIPE.INVALID_DISH, null, ERROR_CODES.RECIPE_INVALID_DISH);
  }
  if (!matchesDietaryPreference) {
    throw badRequest(MESSAGES.RECIPE.DIET_MISMATCH, null, ERROR_CODES.RECIPE_DIET_MISMATCH);
  }

  const recipe = await Recipe.create({ ...recipeFields, createdBy: userId });
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

export const modifyRecipe = async (id, { modificationText, targetLanguage }, userId) => {
  const originalRecipe = await Recipe.findOne({ _id: id, createdBy: userId }).lean();
  if (!originalRecipe) {
    throw notFound(MESSAGES.RECIPE.NOT_FOUND(id), ERROR_CODES.RECIPE_NOT_FOUND);
  }

  if (modificationText && textConflictsWithDiet(modificationText, originalRecipe.dietaryPreference)) {
    throw badRequest(MESSAGES.RECIPE.DIET_MISMATCH_MODIFICATION, null, ERROR_CODES.RECIPE_DIET_MISMATCH_MODIFICATION);
  }

  const aiContext = await resolveAiContext(userId);
  const generatedData = await generateModifiedRecipe({ originalRecipe, modificationText, targetLanguage }, aiContext);
  const recipe = await Recipe.create({
    ...generatedData,
    createdBy: userId,
    sourceRecipeId: originalRecipe._id,
  });
  return serialize(recipe.toObject());
};
