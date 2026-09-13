import { generateRecipe, generateModifiedRecipe } from '../ai/ai.service.js';
import { resolveAiContext, consumeFreeQuota } from '../settings/settings.service.js';
import { resolveRecipePhotos } from '../media/recipe-photos.service.js';
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

  const { photo, ingredients } = await resolveRecipePhotos(recipeFields);
  const recipe = await Recipe.create({ ...recipeFields, ingredients, photo, createdBy: userId });

  // Count this against the free tier only now that a recipe genuinely exists.
  // BYOK users are unlimited and skip it.
  if (!aiContext.usingPersonalKey) {
    await consumeFreeQuota(userId);
  }

  return serialize(recipe.toObject());
};

export const fetchAllRecipes = async (userId, { page = 1, limit = 20 } = {}) => {
  const filter = { createdBy: userId };
  const [recipes, total] = await Promise.all([
    Recipe.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Recipe.countDocuments(filter),
  ]);

  return {
    items: serializeMany(recipes),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

export const getRecipeStats = async (userId) => {
  const [result] = await Recipe.aggregate([
    { $match: { createdBy: userId } },
    {
      $group: {
        _id: null,
        totalRecipes: { $sum: 1 },
        totalMinutes: { $sum: { $add: ['$prepTime', '$cookTime'] } },
        cuisines: { $addToSet: '$cuisine' },
      },
    },
  ]);

  if (!result) {
    return { totalRecipes: 0, totalMinutes: 0, distinctCuisines: 0 };
  }

  return {
    totalRecipes: result.totalRecipes,
    totalMinutes: result.totalMinutes || 0,
    distinctCuisines: result.cuisines.filter(Boolean).length,
  };
};

export const deleteRecipe = async (id, userId) => {
  const deleted = await Recipe.findOneAndDelete({ _id: id, createdBy: userId }).lean();
  if (!deleted) {
    throw notFound(MESSAGES.RECIPE.NOT_FOUND(id), ERROR_CODES.RECIPE_NOT_FOUND);
  }
  return { id };
};

export const clearRecipes = async (userId) => {
  const { deletedCount } = await Recipe.deleteMany({ createdBy: userId });
  return { deletedCount: deletedCount || 0 };
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
  const { photo, ingredients } = await resolveRecipePhotos(generatedData);
  const recipe = await Recipe.create({
    ...generatedData,
    ingredients,
    photo,
    createdBy: userId,
    sourceRecipeId: originalRecipe._id,
  });

  if (!aiContext.usingPersonalKey) {
    await consumeFreeQuota(userId);
  }

  return serialize(recipe.toObject());
};
