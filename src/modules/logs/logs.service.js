import { ErrorLog } from './error-log.model.js';
import { AiInteractionLog } from './ai-interaction-log.model.js';
import { ERROR_CODES } from '../../constants/index.js';
import { logError } from '../../utils/logger.js';

const AI_PROVIDER_ERROR_CODES = new Set([
  ERROR_CODES.RECIPE_AI_EMPTY_RESPONSE,
  ERROR_CODES.RECIPE_AI_FAILED,
  ERROR_CODES.RECIPE_AI_QUOTA_EXCEEDED,
]);

const classifySource = (err) => {
  if (!err.isOperational) return 'server';
  if (err.code && AI_PROVIDER_ERROR_CODES.has(err.code)) return 'ai_provider';
  return 'expected';
};

/** Persists one row per error that reaches the global error handler. Never throws —
 *  a logging failure must never take down the actual error response to the client. */
export const recordErrorLog = (err, req) => {
  ErrorLog.create({
    requestId: req.requestId || null,
    userId: req.user?._id || null,
    method: req.method,
    path: req.path,
    statusCode: err.statusCode || 500,
    code: err.code || null,
    message: err.message,
    source: classifySource(err),
    stack: !err.isOperational ? String(err.stack || '').slice(0, 4000) : null,
  }).catch((loggingError) => {
    logError('Failed to persist error log', loggingError);
  });
};

/** Persists one row per AI generate/modify attempt. Same never-throw contract as above. */
export const recordAiInteraction = (entry) => {
  AiInteractionLog.create(entry).catch((loggingError) => {
    logError('Failed to persist AI interaction log', loggingError);
  });
};

export const getRecentErrorLogs = (userId, limit = 50) => {
  return ErrorLog.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
};

export const getRecentAiInteractions = (userId, limit = 50) => {
  return AiInteractionLog.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
};
