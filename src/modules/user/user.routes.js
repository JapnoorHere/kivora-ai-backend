import express from 'express';
import * as userController from './user.controller.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { savePreferencesSchema } from './user.validator.js';

const router = express.Router();

router.use(protect);

router.get('/preferences', userController.handleGetPreferences);
router.put('/preferences', validate(savePreferencesSchema), userController.handleSavePreferences);

export default router;
