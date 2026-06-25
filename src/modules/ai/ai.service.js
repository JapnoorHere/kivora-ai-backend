import { GoogleGenAI } from '@google/genai';
import { config } from '../../config/env.config.js';
import { internalServer } from '../../errors/index.js';
import { logError } from '../../utils/logger.js';

// Initialize the Google Gen AI client
const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });

/**
 * Generate a recipe based on ingredients and optional constraints.
 * @param {Object} params
 * @param {string[]} params.ingredients - List of available ingredients
 * @param {string} [params.cuisine] - Type of cuisine (e.g., Italian, Indian)
 * @param {number} [params.maxTime] - Maximum preparation + cooking time in minutes
 * @param {string[]} [params.dietaryRestrictions] - Dietary restrictions (e.g., vegan, gluten-free)
 * @returns {Promise<Object>} The generated recipe object
 */
export const generateRecipe = async ({ ingredients, cuisine, maxTime, dietaryRestrictions }) => {
  try {
    const prompt = `
Generate a recipe using the following details:
- Available Ingredients: ${ingredients.join(', ')}
${cuisine ? `- Cuisine Type: ${cuisine}` : ''}
${maxTime ? `- Maximum Total Time (Prep + Cook): ${maxTime} minutes` : ''}
${dietaryRestrictions && dietaryRestrictions.length > 0 ? `- Dietary Restrictions: ${dietaryRestrictions.join(', ')}` : ''}

You can include basic pantry items like salt, pepper, oil, water, and basic spices even if they are not listed in the available ingredients.

You MUST respond with a single JSON object matching the following structure:
{
  "title": "Name of the recipe",
  "description": "A brief, appetizing 1-2 sentence description of the dish",
  "prepTime": 15, // number representing minutes
  "cookTime": 20, // number representing minutes
  "servings": 2, // number of servings
  "difficulty": "Easy", // "Easy", "Medium", or "Hard"
  "ingredients": [
    { "name": "Ingredient name", "amount": "Quantity/measurement (e.g. 200g, 1 tbsp)" }
  ],
  "instructions": [
    "Step 1 instruction",
    "Step 2 instruction"
  ],
  "nutritionalInfo": {
    "calories": 350, // number
    "protein": "25g", // string with unit
    "carbs": "40g", // string with unit
    "fat": "10g" // string with unit
  }
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = typeof response.text === 'function' ? response.text() : response.text;
    if (!responseText) {
      throw internalServer('Empty response received from AI model');
    }

    // Parse the JSON output from the model
    const recipeData = JSON.parse(responseText);
    return recipeData;
  } catch (error) {
    logError('Gemini API Error', error);
    throw internalServer(`Failed to generate recipe from AI: ${error.message}`);
  }
};
