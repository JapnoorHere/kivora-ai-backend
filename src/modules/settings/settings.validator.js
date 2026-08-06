import Joi from 'joi';

export const saveApiKeySchema = Joi.object({
  provider: Joi.string().valid('gemini', 'groq').required(),
  apiKey: Joi.string().trim().min(10).max(200).required(),
});

export const providerParamSchema = Joi.object({
  provider: Joi.string().valid('gemini', 'groq').required(),
});

export const setPreferredProviderSchema = Joi.object({
  provider: Joi.string().valid('gemini', 'groq').required(),
});
