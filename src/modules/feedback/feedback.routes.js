import express from 'express';
import * as feedbackController from './feedback.controller.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { submitFeedbackSchema } from './feedback.validator.js';

const router = express.Router();

router.use(protect);

router.post('/submit', validate(submitFeedbackSchema), feedbackController.handleSubmitFeedback);

export default router;
