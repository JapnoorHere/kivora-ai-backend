import * as logsService from './logs.service.js';
import { sendSuccess } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { MESSAGES } from '../../constants/index.js';
import { serializeMany } from '../../utils/serialize.js';

export const handleGetMyErrorLogs = asyncHandler(async (req, res) => {
  const logs = await logsService.getRecentErrorLogs(req.user._id);
  return sendSuccess(res, MESSAGES.LOGS.FETCHED_ERRORS, serializeMany(logs));
});

export const handleGetMyAiInteractions = asyncHandler(async (req, res) => {
  const logs = await logsService.getRecentAiInteractions(req.user._id);
  return sendSuccess(res, MESSAGES.LOGS.FETCHED_AI, serializeMany(logs));
});
