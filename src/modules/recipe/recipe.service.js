import { generateRecipe } from '../ai/ai.service.js';
import { Recipe } from './recipe.model.js';
import { notFound } from '../../errors/index.js';

/**
 * Generates a recipe using AI and saves it to the database.
 * @param {Object} params - Generation parameters
 * @returns {Promise<Object>} The saved recipe document
 */
export const createAILedRecipe = async (params) => {
  // Call AI service to generate structured recipe details
  const generatedData = await generateRecipe(params);

  // Save the recipe to MongoDB
  const newRecipe = new Recipe(generatedData);
  const savedRecipe = await newRecipe.save();

  return savedRecipe;
};

/**
 * Retrieves all saved recipes, sorted by latest created first.
 * @returns {Promise<Array>} List of recipes
 */
export const fetchAllRecipes = async () => {
  return await Recipe.find().sort({ createdAt: -1 });
};

/**
 * Retrieves a single recipe by its unique database ID.
 * @param {string} id - Mongoose document ID
 * @returns {Promise<Object>} The recipe document
 */
export const fetchRecipeById = async (id) => {
  const recipe = await Recipe.findById(id);
  if (!recipe) {
    throw notFound(`Recipe with ID "${id}" was not found`);
  }
  return recipe;
};
