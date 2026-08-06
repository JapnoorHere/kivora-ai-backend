import Joi from 'joi';

export const savePreferencesSchema = Joi.object({
  dietaryPreference: Joi.string().valid('veg', 'nonveg', 'vegan').required(),
  favoriteCuisines: Joi.array().items(Joi.string().trim().min(1).max(40)).min(1).max(10).required(),
  favoriteDishes: Joi.array().items(Joi.string().trim().min(1).max(60)).max(5).default([]),
  preferredLanguage: Joi.string().valid('en', 'hi', 'pa').required(),
});
