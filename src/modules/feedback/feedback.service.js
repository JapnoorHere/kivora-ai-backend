import { Feedback } from './feedback.model.js';
import { serialize } from '../../utils/serialize.js';

export const submitFeedback = async ({ email, message }, userId) => {
  const feedback = await Feedback.create({ email, message, createdBy: userId });
  return serialize(feedback.toObject());
};
