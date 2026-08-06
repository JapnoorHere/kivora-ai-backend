import * as userService from './user.service.js';
import { sendSuccess } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { MESSAGES } from '../../constants/index.js';

export const handleGetPreferences = asyncHandler(async (req, res) => {
  const preferences = await userService.getPreferences(req.user._id);
  return sendSuccess(res, MESSAGES.USER.PREFERENCES_FETCHED, preferences);
});

export const handleSavePreferences = asyncHandler(async (req, res) => {
  const preferences = await userService.savePreferences(req.user._id, req.body);
  return sendSuccess(res, MESSAGES.USER.PREFERENCES_SAVED, preferences);
});
