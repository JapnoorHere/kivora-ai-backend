import * as settingsService from './settings.service.js';
import { sendSuccess } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { MESSAGES } from '../../constants/index.js';

export const handleGetAiSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getAiSettings(req.user._id);
  return sendSuccess(res, MESSAGES.SETTINGS.FETCHED, settings);
});

export const handleSaveApiKey = asyncHandler(async (req, res) => {
  const { provider, apiKey } = req.body;
  const settings = await settingsService.saveApiKey(req.user._id, { provider, apiKey });
  return sendSuccess(res, MESSAGES.SETTINGS.KEY_SAVED, settings);
});

export const handleRemoveApiKey = asyncHandler(async (req, res) => {
  const { provider } = req.params;
  const settings = await settingsService.removeApiKey(req.user._id, provider);
  return sendSuccess(res, MESSAGES.SETTINGS.KEY_REMOVED, settings);
});

export const handleSetPreferredProvider = asyncHandler(async (req, res) => {
  const { provider } = req.body;
  const settings = await settingsService.setPreferredProvider(req.user._id, provider);
  return sendSuccess(res, MESSAGES.SETTINGS.PREFERRED_UPDATED, settings);
});
