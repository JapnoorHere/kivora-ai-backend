import Joi from 'joi';

export const submitFeedbackSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  message: Joi.string().trim().min(10).max(2000).required(),
});
