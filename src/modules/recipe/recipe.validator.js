import Joi from 'joi';

export const listRecipesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const generateRecipeSchema = Joi.object({
  dishName: Joi.string().trim().min(2).max(120).required(),
  cuisine: Joi.string().trim().max(50).optional(),
  dietaryPreference: Joi.string().valid('veg', 'nonveg', 'vegan').required(),
  servings: Joi.number().integer().min(1).max(20).required(),
  exclusions: Joi.string().trim().max(300).allow('').optional(),
  language: Joi.string().valid('en', 'hi', 'pa').default('en'),
});

export const modifyRecipeSchema = Joi.object({
  modificationText: Joi.string().trim().max(500).optional(),
  targetLanguage: Joi.string().valid('en', 'hi', 'pa').optional(),
})
  .or('modificationText', 'targetLanguage')
  .messages({
    'object.missing': 'Provide either modificationText or targetLanguage',
  });
