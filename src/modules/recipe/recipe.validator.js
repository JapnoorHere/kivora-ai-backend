import Joi from 'joi';

export const generateRecipeSchema = Joi.object({
  ingredients: Joi.array()
    .items(Joi.string().trim().required())
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one ingredient is required',
      'any.required': 'Ingredients list is required',
    }),
  cuisine: Joi.string().trim().max(50).optional(),
  maxTime: Joi.number().integer().positive().optional(),
  dietaryRestrictions: Joi.array().items(Joi.string().trim()).optional().default([]),
});
