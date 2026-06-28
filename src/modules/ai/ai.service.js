import { GoogleGenAI } from '@google/genai';
import { config } from '../../config/env.config.js';
import { internalServer } from '../../errors/index.js';
import { logError } from '../../utils/logger.js';
import { MESSAGES, ERROR_CODES } from '../../constants/index.js';

const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });

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
  "prepTime": 15,
  "cookTime": 20,
  "servings": 2,
  "difficulty": "Easy",
  "ingredients": [
    { "name": "Ingredient name", "amount": "Quantity/measurement (e.g. 200g, 1 tbsp)" }
  ],
  "instructions": [
    "Step 1 instruction",
    "Step 2 instruction"
  ],
  "nutritionalInfo": {
    "calories": 350,
    "protein": "25g",
    "carbs": "40g",
    "fat": "10g"
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

    const responseText = response.text;
    if (!responseText) {
      throw internalServer(MESSAGES.RECIPE.AI_EMPTY_RESPONSE, ERROR_CODES.RECIPE_AI_EMPTY_RESPONSE);
    }

    return JSON.parse(responseText);
  } catch (error) {
    logError('Gemini API Error', error);
    throw internalServer(MESSAGES.RECIPE.AI_FAILED(error.message), ERROR_CODES.RECIPE_AI_FAILED);
  }
};
