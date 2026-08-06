import express from 'express';
import * as settingsController from './settings.controller.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { saveApiKeySchema, providerParamSchema, setPreferredProviderSchema } from './settings.validator.js';

const router = express.Router();

router.use(protect);

router.get('/ai', settingsController.handleGetAiSettings);
router.post('/ai/keys', validate(saveApiKeySchema), settingsController.handleSaveApiKey);
router.delete('/ai/keys/:provider', validate(providerParamSchema, 'params'), settingsController.handleRemoveApiKey);
router.patch('/ai/preferred', validate(setPreferredProviderSchema), settingsController.handleSetPreferredProvider);

export default router;
