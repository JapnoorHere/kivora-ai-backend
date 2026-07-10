import * as feedbackService from './feedback.service.js';
import { sendSuccess } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { HTTP_STATUS, MESSAGES } from '../../constants/index.js';

export const handleSubmitFeedback = asyncHandler(async (req, res) => {
  const { email, message } = req.body;
  const feedback = await feedbackService.submitFeedback({ email, message }, req.user._id);
  return sendSuccess(res, MESSAGES.FEEDBACK.SUBMITTED, feedback, HTTP_STATUS.CREATED);
});
