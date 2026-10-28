import express from 'express';
import { z } from 'zod';
import {
  getJudgeQueue,
  getJudgeCaseFile,
  recordDecision,
  getJudgeCalendar,
  checkJudgeClash,
  getJudgeRadar,
  getJudgeCompliance
} from '../controllers/judgeController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles, requireAssignedJudge } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validation.js';
import { ROLES, DECISION_OUTCOMES } from '../config/constants.js';

const router = express.Router();

// Enforce Judge role
router.use(authenticate, requireRoles(ROLES.JUDGE));

const decisionSchema = z.object({
  outcome: z.enum([
    DECISION_OUTCOMES.GRANTED,
    DECISION_OUTCOMES.REJECTED,
    DECISION_OUTCOMES.CONDITIONAL
  ]),
  reasons: z.string().min(5, 'Judicial reasons for decision are required'),
  conditions: z.array(z.string()).optional(),
  suretyAmount: z.coerce.number().min(0).optional(),
  suretiesCount: z.coerce.number().min(0).optional(),
  nextHearingDate: z.string().optional().nullable(),
  triggersConsidered: z.object({
    bnss187Considered: z.boolean().default(false),
    bnss479Considered: z.boolean().default(false),
    bailableFlagConsidered: z.boolean().default(false),
    antilGuidelinesConsidered: z.boolean().default(false),
    priorConvictionConsidered: z.boolean().default(false)
  }).optional()
});

// Bench Queue & Radar
router.get('/queue', getJudgeQueue);
router.get('/radar', getJudgeRadar);

// Calendar, Agenda & Clash Detection
router.get('/calendar', getJudgeCalendar);
router.post('/hearings/check-clash', checkJudgeClash);

// Case Decision & Support Panel
router.get('/cases/:id', requireAssignedJudge, getJudgeCaseFile);
router.post('/cases/:id/decision', requireAssignedJudge, validateBody(decisionSchema), recordDecision);
router.get('/cases/:id/compliance', requireAssignedJudge, getJudgeCompliance);

export default router;
