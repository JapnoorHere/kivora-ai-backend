import express from 'express';
import * as logsController from './logs.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Scoped to the caller's own history — no admin/role system exists yet, so this
// intentionally never exposes other users' logs. Cross-user analysis still works
// via direct MongoDB access to the `errorlogs` / `aiinteractionlogs` collections.
router.use(protect);

router.get('/errors', logsController.handleGetMyErrorLogs);
router.get('/ai-interactions', logsController.handleGetMyAiInteractions);

export default router;
