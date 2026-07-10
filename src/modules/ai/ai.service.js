import { GoogleGenAI } from '@google/genai';
import Joi from 'joi';
import { config } from '../../config/env.config.js';
import { internalServer, tooManyRequests } from '../../errors/index.js';
import { logError } from '../../utils/logger.js';
import { MESSAGES, ERROR_CODES } from '../../constants/index.js';

const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });

const isQuotaExceededError = (error) => {
  const text = String(error?.message || '');
  return text.includes('RESOURCE_EXHAUSTED') || text.includes('"code":429') || /quota/i.test(text);
};

// Never surface `error.message` to the client here — it's the raw upstream (Gemini)
// error text and can contain internal details. Log it, throw a generic message instead.
const throwSanitizedAiError = (error) => {
  if (error.isOperational) throw error;
  logError('Gemini API Error', error);
  if (isQuotaExceededError(error)) {
    throw tooManyRequests(MESSAGES.RECIPE.AI_QUOTA_EXCEEDED, ERROR_CODES.RECIPE_AI_QUOTA_EXCEEDED);
  }
  throw internalServer(MESSAGES.RECIPE.AI_FAILED, ERROR_CODES.RECIPE_AI_FAILED);
};

const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi',
  pa: 'Punjabi',
};

const DIET_DESCRIPTIONS = {
  veg: 'vegetarian — no meat, poultry, fish, or egg',
  nonveg: 'no dietary restriction — meat, poultry, fish, and egg are all fine',
  vegan: 'vegan — no meat, poultry, fish, egg, dairy, or honey',
};

const RECIPE_CONTENT_PROPERTIES = {
  title: { type: 'STRING' },
  description: { type: 'STRING' },
  prepTime: { type: 'INTEGER' },
  cookTime: { type: 'INTEGER' },
  servings: { type: 'INTEGER' },
  difficulty: { type: 'STRING', enum: ['Easy', 'Medium', 'Hard'] },
  ingredients: {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING' },
        amount: { type: 'STRING' },
      },
      required: ['name', 'amount'],
    },
  },
  instructions: {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        stepNumber: { type: 'INTEGER' },
        instruction: { type: 'STRING' },
        timeRequired: { type: 'STRING' },
      },
      required: ['stepNumber', 'instruction'],
    },
  },
  nutritionalInfo: {
    type: 'OBJECT',
    properties: {
      calories: { type: 'INTEGER' },
      protein: { type: 'STRING' },
      carbs: { type: 'STRING' },
      fat: { type: 'STRING' },
    },
  },
};

const RECIPE_CONTENT_REQUIRED = ['title', 'description', 'prepTime', 'cookTime', 'servings', 'difficulty', 'ingredients', 'instructions'];

const GENERATE_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    isValidDish: { type: 'BOOLEAN' },
    matchesDietaryPreference: { type: 'BOOLEAN' },
    ...RECIPE_CONTENT_PROPERTIES,
  },
  required: ['isValidDish', 'matchesDietaryPreference', ...RECIPE_CONTENT_REQUIRED],
};

const MODIFY_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: RECIPE_CONTENT_PROPERTIES,
  required: RECIPE_CONTENT_REQUIRED,
};

// Defense in depth beyond responseSchema — catches truncated/malformed responses before they hit Mongo
const recipeContentJoiSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  prepTime: Joi.number().required(),
  cookTime: Joi.number().required(),
  servings: Joi.number().required(),
  difficulty: Joi.string().valid('Easy', 'Medium', 'Hard').required(),
  ingredients: Joi.array().items(Joi.object({ name: Joi.string().required(), amount: Joi.string().required() })).min(1).required(),
  instructions: Joi.array().items(Joi.object({
    stepNumber: Joi.number().required(),
    instruction: Joi.string().required(),
    timeRequired: Joi.string().optional(),
  })).min(1).required(),
  nutritionalInfo: Joi.object({
    calories: Joi.number().optional(),
    protein: Joi.string().optional(),
    carbs: Joi.string().optional(),
    fat: Joi.string().optional(),
  }).optional(),
}).unknown(true);

const callGemini = async (prompt, responseSchema) => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema,
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw internalServer(MESSAGES.RECIPE.AI_EMPTY_RESPONSE, ERROR_CODES.RECIPE_AI_EMPTY_RESPONSE);
  }

  return JSON.parse(responseText);
};

export const generateRecipe = async ({ dishName, cuisine, dietaryPreference, servings, exclusions, language }) => {
  try {
    const languageName = LANGUAGE_NAMES[language];
    const prompt = `
Generate a recipe for the dish: "${dishName}".
- Cuisine: ${cuisine || 'whichever cuisine this dish traditionally belongs to'}
- Dietary preference: strictly ${DIET_DESCRIPTIONS[dietaryPreference]}
- Servings: ${servings}
${exclusions ? `- Exclusions/allergies to avoid entirely: ${exclusions}` : ''}
- Write the entire recipe (title, description, ingredient names, instructions) in ${languageName}.

Set "isValidDish" to false if "${dishName}" is not a recognizable food dish (gibberish, a non-food item, or too vague to cook) — in that case the other fields can be minimal.
Set "matchesDietaryPreference" to false only if you were not able to honor the dietary preference above.

You can include basic pantry items like salt, pepper, oil, water, and basic spices even if not explicitly mentioned.
Number "instructions" sequentially starting at 1, and include a realistic "timeRequired" (e.g. "5 mins") for steps where it's meaningful.
`;

    const parsed = await callGemini(prompt, GENERATE_RESPONSE_SCHEMA);

    if (parsed.isValidDish && parsed.matchesDietaryPreference) {
      const { error } = recipeContentJoiSchema.validate(parsed);
      if (error) {
        logError('Gemini response failed shape validation', error);
        throw internalServer(MESSAGES.RECIPE.AI_FAILED, ERROR_CODES.RECIPE_AI_FAILED);
      }
    }

    return { ...parsed, cuisine, dietaryPreference, language };
  } catch (error) {
    throwSanitizedAiError(error);
  }
};

export const generateModifiedRecipe = async ({ originalRecipe, modificationText, targetLanguage }) => {
  try {
    const language = targetLanguage || originalRecipe.language;
    const languageName = LANGUAGE_NAMES[language];
    const originalContent = JSON.stringify({
      title: originalRecipe.title,
      description: originalRecipe.description,
      prepTime: originalRecipe.prepTime,
      cookTime: originalRecipe.cookTime,
      servings: originalRecipe.servings,
      difficulty: originalRecipe.difficulty,
      ingredients: originalRecipe.ingredients,
      instructions: originalRecipe.instructions,
      nutritionalInfo: originalRecipe.nutritionalInfo,
    });

    const prompt = targetLanguage
      ? `
Translate the following recipe faithfully into ${languageName}. Preserve quantities, step order, and structure exactly — this is a translation, not a new recipe.

Recipe (JSON): ${originalContent}
`
      : `
Here is an existing recipe (JSON): ${originalContent}

Apply this change requested by the user: "${modificationText}"

Keep everything else the same unless the change requires updating it. Write the recipe in ${languageName}.
`;

    const parsed = await callGemini(prompt, MODIFY_RESPONSE_SCHEMA);

    const { error } = recipeContentJoiSchema.validate(parsed);
    if (error) {
      logError('Gemini response failed shape validation', error);
      throw internalServer(MESSAGES.RECIPE.AI_FAILED, ERROR_CODES.RECIPE_AI_FAILED);
    }

    return { ...parsed, cuisine: originalRecipe.cuisine, dietaryPreference: originalRecipe.dietaryPreference, language };
  } catch (error) {
    throwSanitizedAiError(error);
  }
};
