import { GoogleGenAI } from '@google/genai';
import Joi from 'joi';
import { config } from '../../config/env.config.js';
import { internalServer, tooManyRequests } from '../../errors/index.js';
import { logError } from '../../utils/logger.js';
import { MESSAGES, ERROR_CODES } from '../../constants/index.js';
import { recordAiInteraction } from '../logs/logs.service.js';
import { getRequestId } from '../../utils/request-context.js';

const GEMINI_MODEL = 'gemini-2.0-flash';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// A hung upstream call otherwise holds the HTTP connection (and, on Gemini, the
// billing meter) open indefinitely. Verify is a one-token round trip, so it gets
// a much shorter leash.
const AI_TIMEOUT_MS = 60_000;
const VERIFY_TIMEOUT_MS = 15_000;

const isQuotaExceededError = (error) => {
  if (error?.status === 429) return true;
  const text = String(error?.message || '');
  return text.includes('RESOURCE_EXHAUSTED') || text.includes('"code":429') || /quota/i.test(text);
};

const isTimeoutError = (error) => {
  if (error?.name === 'AbortError' || error?.name === 'TimeoutError') return true;
  return /timed?\s*out|timeout|aborted|ETIMEDOUT|deadline/i.test(String(error?.message || ''));
};

// Never surface `error.message` to the client here — it's the raw upstream (Gemini/Groq)
// error text and can contain internal details. Log it, throw a generic message instead.
const throwSanitizedAiError = (error) => {
  if (error.isOperational) throw error;
  logError('AI provider error', error);
  if (isTimeoutError(error)) {
    throw internalServer(MESSAGES.RECIPE.AI_TIMEOUT, ERROR_CODES.RECIPE_AI_TIMEOUT);
  }
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
        title: { type: 'STRING' },
        instruction: { type: 'STRING' },
        timeRequired: { type: 'STRING' },
        ingredientsUsed: { type: 'ARRAY', items: { type: 'STRING' } },
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
  prepNotes: {
    type: 'OBJECT',
    properties: {
      beforeYouStart: { type: 'ARRAY', items: { type: 'STRING' } },
      proTips: { type: 'ARRAY', items: { type: 'STRING' } },
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

// Groq has no equivalent of Gemini's responseSchema constraint, so the exact shape
// is spelled out in the prompt instead and enforced afterwards by Joi below.
const RECIPE_CONTENT_SHAPE = `  "title": string,
  "description": string,
  "prepTime": number (minutes),
  "cookTime": number (minutes),
  "servings": number,
  "difficulty": "Easy" | "Medium" | "Hard",
  "ingredients": [{ "name": string, "amount": string }],
  "instructions": [{ "stepNumber": number, "title": string, "instruction": string, "timeRequired": string, "ingredientsUsed": string[] }],
  "nutritionalInfo": { "calories": number, "protein": string, "carbs": string, "fat": string },
  "prepNotes": { "beforeYouStart": string[], "proTips": string[] }`;

const JSON_SHAPE_INSTRUCTIONS = `
Respond with ONLY a single valid JSON object (no markdown fences, no extra text) with exactly this shape:
{
  "isValidDish": boolean,
  "matchesDietaryPreference": boolean,
${RECIPE_CONTENT_SHAPE}
}
`;

const JSON_SHAPE_INSTRUCTIONS_MODIFY = `
Respond with ONLY a single valid JSON object (no markdown fences, no extra text) with exactly this shape:
{
${RECIPE_CONTENT_SHAPE}
}
`;

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
    title: Joi.string().max(80).optional(),
    instruction: Joi.string().required(),
    timeRequired: Joi.string().optional(),
    ingredientsUsed: Joi.array().items(Joi.string()).optional(),
  })).min(1).required(),
  nutritionalInfo: Joi.object({
    calories: Joi.number().optional(),
    protein: Joi.string().optional(),
    carbs: Joi.string().optional(),
    fat: Joi.string().optional(),
  }).optional(),
  prepNotes: Joi.object({
    beforeYouStart: Joi.array().items(Joi.string()).optional(),
    proTips: Joi.array().items(Joi.string()).optional(),
  }).optional(),
}).unknown(true);

const callGemini = async (prompt, responseSchema, apiKey) => {
  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema,
      httpOptions: { timeout: AI_TIMEOUT_MS },
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw internalServer(MESSAGES.RECIPE.AI_EMPTY_RESPONSE, ERROR_CODES.RECIPE_AI_EMPTY_RESPONSE);
  }

  return JSON.parse(responseText);
};

const callGroq = async (prompt, apiKey) => {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    const error = new Error(`Groq API error (${response.status}): ${errorBody}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw internalServer(MESSAGES.RECIPE.AI_EMPTY_RESPONSE, ERROR_CODES.RECIPE_AI_EMPTY_RESPONSE);
  }

  return JSON.parse(content);
};

const callProvider = async ({ provider, apiKey }, prompt, responseSchema, groqShapeInstructions) => {
  if (provider === 'groq') {
    return callGroq(`${prompt}\n${groqShapeInstructions}`, apiKey);
  }
  return callGemini(prompt, responseSchema, apiKey);
};

/** Cheap round-trip used by the settings page to verify a key before it's saved. */
export const verifyApiKey = async (provider, apiKey) => {
  try {
    if (provider === 'groq') {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: 'user', content: 'Reply with the single word: OK' }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      });
      return response.ok;
    }

    const client = new GoogleGenAI({ apiKey });
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: 'Reply with the single word: OK',
      config: { httpOptions: { timeout: VERIFY_TIMEOUT_MS } },
    });
    return Boolean(response.text);
  } catch (error) {
    return false;
  }
};

/** Shared write-path for both generate/modify — never throws, runs from a `finally`. */
const logAiCall = ({ aiContext, action, model, input, startedAt, outcome }) => {
  recordAiInteraction({
    requestId: getRequestId(),
    userId: aiContext.userId,
    action,
    provider: aiContext.provider,
    model,
    usingPersonalKey: Boolean(aiContext.usingPersonalKey),
    input,
    success: outcome.success,
    durationMs: Date.now() - startedAt,
    errorReason: outcome.errorReason,
    errorDetail: outcome.errorDetail,
    rawResponseSnippet: outcome.rawResponseSnippet,
  });
};

export const generateRecipe = async ({ dishName, cuisine, dietaryPreference, servings, exclusions, language }, aiContext) => {
  const startedAt = Date.now();
  const model = aiContext.provider === 'groq' ? GROQ_MODEL : GEMINI_MODEL;
  // success = "the AI call itself came back usable", independent of whether the
  // recipe was later rejected for being an invalid dish / diet mismatch — that
  // business-logic rejection still lands in errorReason and gets its own entry
  // in the error log (via recipe.service.js throwing badRequest).
  const outcome = { success: false, errorReason: null, errorDetail: null, rawResponseSnippet: null };

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
Give every instruction a short "title" — 3 to 6 words, imperative, naming the action (e.g. "Sear the chicken", "Simmer the sauce"). It is a label for the step, not a restatement of it.
For each instruction, set "ingredientsUsed" to the exact "name" values from the ingredients array that the step actually uses (an empty array if none).
Fill "prepNotes.beforeYouStart" with 2 to 4 short setup/prep tips and "prepNotes.proTips" with 2 to 4 technique tips, written in ${languageName}.
`;

    const parsed = await callProvider(aiContext, prompt, GENERATE_RESPONSE_SCHEMA, JSON_SHAPE_INSTRUCTIONS);
    outcome.rawResponseSnippet = JSON.stringify(parsed).slice(0, 4000);

    if (parsed.isValidDish && parsed.matchesDietaryPreference) {
      const { error } = recipeContentJoiSchema.validate(parsed);
      if (error) {
        outcome.errorReason = 'shape_validation_failed';
        outcome.errorDetail = error.message;
        logError('AI response failed shape validation', error);
        throw internalServer(MESSAGES.RECIPE.AI_FAILED, ERROR_CODES.RECIPE_AI_FAILED);
      }
    } else {
      outcome.errorReason = !parsed.isValidDish ? 'invalid_dish' : 'diet_mismatch';
    }

    outcome.success = true;
    return { ...parsed, cuisine, dietaryPreference, language };
  } catch (error) {
    if (!outcome.errorReason) {
      outcome.errorReason = isTimeoutError(error)
        ? 'timeout'
        : isQuotaExceededError(error)
          ? 'quota_exceeded'
          : 'provider_error';
    }
    outcome.errorDetail = outcome.errorDetail || String(error.message || '').slice(0, 500);
    throwSanitizedAiError(error);
  } finally {
    logAiCall({
      aiContext,
      action: 'generate',
      model,
      input: { dishName, cuisine, dietaryPreference, servings, exclusions, language },
      startedAt,
      outcome,
    });
  }
};

export const generateModifiedRecipe = async ({ originalRecipe, modificationText, targetLanguage }, aiContext) => {
  const startedAt = Date.now();
  const model = aiContext.provider === 'groq' ? GROQ_MODEL : GEMINI_MODEL;
  const outcome = { success: false, errorReason: null, errorDetail: null, rawResponseSnippet: null };

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
Translate the following recipe faithfully into ${languageName}. Preserve quantities, step order, each step's short "title" and "ingredientsUsed", the "prepNotes", and structure exactly — this is a translation, not a new recipe.

Recipe (JSON): ${originalContent}
`
      : `
Here is an existing recipe (JSON): ${originalContent}

Apply this change requested by the user: "${modificationText}"

Keep everything else the same unless the change requires updating it. Write the recipe in ${languageName}.
`;

    const parsed = await callProvider(aiContext, prompt, MODIFY_RESPONSE_SCHEMA, JSON_SHAPE_INSTRUCTIONS_MODIFY);
    outcome.rawResponseSnippet = JSON.stringify(parsed).slice(0, 4000);

    const { error } = recipeContentJoiSchema.validate(parsed);
    if (error) {
      outcome.errorReason = 'shape_validation_failed';
      outcome.errorDetail = error.message;
      logError('AI response failed shape validation', error);
      throw internalServer(MESSAGES.RECIPE.AI_FAILED, ERROR_CODES.RECIPE_AI_FAILED);
    }

    outcome.success = true;
    return { ...parsed, cuisine: originalRecipe.cuisine, dietaryPreference: originalRecipe.dietaryPreference, language };
  } catch (error) {
    if (!outcome.errorReason) {
      outcome.errorReason = isTimeoutError(error)
        ? 'timeout'
        : isQuotaExceededError(error)
          ? 'quota_exceeded'
          : 'provider_error';
    }
    outcome.errorDetail = outcome.errorDetail || String(error.message || '').slice(0, 500);
    throwSanitizedAiError(error);
  } finally {
    logAiCall({
      aiContext,
      action: 'modify',
      model,
      input: { modificationText: modificationText || null, targetLanguage: targetLanguage || null, sourceRecipeId: originalRecipe._id },
      startedAt,
      outcome,
    });
  }
};
