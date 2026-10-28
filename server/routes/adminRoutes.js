import express from 'express';
import { z } from 'zod';
import {
  getAdminAnalytics,
  listUsers,
  toggleUserStatus,
  inviteJudge,
  listOffences,
  createOffence,
  updateOffence,
  listApplications,
  updateDocumentStatus,
  requestDocument,
  assignJudge,
  scheduleHearing,
  listLegalAid,
  createLegalAid,
  updateLegalAid,
  deleteLegalAid,
  listEmailLogs,
  listAuditLogs,
  verifyAuditChain,
  getAllDeadlines,
  recalculateAllCases,
  listRightsContentAdmin,
  createRightsContent,
  updateRightsContent,
  deleteRightsContent,
  listAllSureties,
  verifySurety,
  listAllHearings,
  scheduleMasterHearing,
  rescheduleMasterHearing,
  listAllDelegations,
  adminRevokeDelegation,
  getStageDurationAnalytics,
  adminRerunOcr,
  listAllCompliance,
  escalateViolation,
  getAdminRadar,
  exportRadarCsv,
  getQuickCheckStats,
  listLegalAidRequests,
  updateLegalAidRequest
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validation.js';
import { ROLES, ANTIL_CATEGORIES } from '../config/constants.js';

const router = express.Router();

// Enforce Admin RBAC on all admin routes
router.use(authenticate, requireRoles(ROLES.ADMIN));

// Schemas
const inviteJudgeSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  court: z.string().min(3, 'Court name is required'),
  bench: z.string().min(2, 'Bench name is required')
});

const createOffenceSchema = z.object({
  section: z.string().min(1, 'Section is required'),
  act: z.string().default('Bharatiya Nyaya Sanhita, 2023'),
  correspondingSection: z.string().optional(),
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  maxSentenceYears: z.coerce.number().min(0, 'Max sentence must be positive'),
  bailable: z.boolean(),
  punishableDeathOrLife: z.boolean().default(false),
  antilCategory: z.enum([ANTIL_CATEGORIES.A, ANTIL_CATEGORIES.B, ANTIL_CATEGORIES.C, ANTIL_CATEGORIES.D]),
  trialCourt: z.string().optional()
});

const updateOffenceSchema = z.object({
  section: z.string().optional(),
  act: z.string().optional(),
  correspondingSection: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  maxSentenceYears: z.coerce.number().optional(),
  bailable: z.boolean().optional(),
  punishableDeathOrLife: z.boolean().optional(),
  antilCategory: z.enum([ANTIL_CATEGORIES.A, ANTIL_CATEGORIES.B, ANTIL_CATEGORIES.C, ANTIL_CATEGORIES.D]).optional(),
  trialCourt: z.string().optional(),
  reason: z.string().min(3, 'Reason for modification is required for version history')
});

const assignJudgeSchema = z.object({
  judgeId: z.string().min(1, 'Judge ID is required')
});

const scheduleHearingSchema = z.object({
  hearingDate: z.string().min(1, 'Hearing date is required'),
  courtRoom: z.string().min(1, 'Court room is required'),
  notes: z.string().optional()
});

const requestDocSchema = z.object({
  requestedDocType: z.string().min(1, 'Document type is required'),
  remarks: z.string().optional()
});

// Analytics & Dashboard
router.get('/analytics', getAdminAnalytics);

// Feature 1: Default-Bail Deadline Tracker
router.get('/deadlines', getAllDeadlines);

// Feature 2: Section 479 Detention Calculator Recalculate-All
router.post('/recalculate-all', recalculateAllCases);

// Feature 4: Rights Content CRUD
router.get('/rights', listRightsContentAdmin);
router.post('/rights', createRightsContent);
router.put('/rights/:id', updateRightsContent);
router.delete('/rights/:id', deleteRightsContent);

// Feature 7: Surety Verification
router.get('/sureties', listAllSureties);
router.patch('/sureties/:id/verify', verifySurety);

// Feature 8: Master Hearing Scheduling & Clash Prevention
router.get('/hearings', listAllHearings);
router.post('/hearings', scheduleMasterHearing);
router.put('/hearings/:id', rescheduleMasterHearing);

// Feature 9: View and Force-Revoke Delegations
router.get('/delegations', listAllDelegations);
router.patch('/delegations/:id/revoke', adminRevokeDelegation);

// Feature 10: Stage Duration Analytics
router.get('/stage-durations', getStageDurationAnalytics);

// Feature 11: Re-run OCR
router.post('/documents/:documentId/ocr', adminRerunOcr);

// Feature 12: Compliance Monitor & Escalation
router.get('/compliance', listAllCompliance);
router.post('/compliance/:checkinId/escalate', escalateViolation);

// Feature 13: Radar Board & CSV Export
router.get('/radar', getAdminRadar);
router.get('/radar/export-csv', exportRadarCsv);

// Feature 14: Quick Check Stats
router.get('/quick-check-stats', getQuickCheckStats);

// Feature 15: Legal Aid Requests
router.get('/legal-aid-requests', listLegalAidRequests);
router.patch('/legal-aid-requests/:id', updateLegalAidRequest);

// User Management
router.get('/users', listUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.post('/judges/invite', validateBody(inviteJudgeSchema), inviteJudge);

// Offence Rules CRUD with versioning
router.get('/offences', listOffences);
router.post('/offences', validateBody(createOffenceSchema), createOffence);
router.put('/offences/:id', validateBody(updateOffenceSchema), updateOffence);

// Applications Review & Workflow
router.get('/applications', listApplications);
router.patch('/documents/:id/status', updateDocumentStatus);
router.post('/applications/:applicationId/request-doc', validateBody(requestDocSchema), requestDocument);
router.post('/applications/:applicationId/assign-judge', validateBody(assignJudgeSchema), assignJudge);
router.post('/applications/:applicationId/schedule-hearing', validateBody(scheduleHearingSchema), scheduleHearing);

// Legal Aid Directory CRUD
router.get('/legal-aid', listLegalAid);
router.post('/legal-aid', createLegalAid);
router.put('/legal-aid/:id', updateLegalAid);
router.delete('/legal-aid/:id', deleteLegalAid);

// Email Logs & Audit Trail
router.get('/email-logs', listEmailLogs);
router.get('/audit-logs', listAuditLogs);
router.post('/audit-logs/verify', verifyAuditChain);

export default router;
