import express from 'express';
import { z } from 'zod';
import {
  getCitizenDashboard,
  createCase,
  uploadCaseDocument,
  runAssessment,
  submitBailApplication,
  downloadDraftPdf,
  downloadAssessmentPdf,
  getCaseDetails,
  getCaseAuditHistory,
  getCaseSureties,
  addCaseSurety,
  deleteCaseSurety,
  getCitizenHearings,
  downloadHearingIcs,
  getCaseDelegates,
  inviteCaseDelegate,
  revokeCaseDelegate,
  getCaseTimeline,
  uploadAndOcrDocument,
  confirmOcrFields,
  getCaseCompliance,
  logConditionCheckin,
  getCitizenRadar,
  getCaseLegalAid,
  submitLegalAidRequest
} from '../controllers/citizenController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validation.js';
import { upload } from '../middleware/upload.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Apply auth and citizen role constraint to all citizen endpoints
router.use(authenticate, requireRoles(ROLES.CITIZEN));

const createCaseSchema = z.object({
  personDetails: z.object({
    fullName: z.string().min(2, 'Name must have at least 2 characters'),
    age: z.coerce.number().min(18, 'Accused must be an adult (18+)'),
    gender: z.enum(['Male', 'Female', 'Transgender', 'Other']),
    relationship: z.string().min(1, 'Relationship is required'),
    contactPhone: z.string().min(10, 'Valid 10-digit phone number required'),
    address: z.string().min(5, 'Address is required'),
    idProofType: z.string().optional(),
    idProofNumber: z.string().optional()
  }),
  firNumber: z.string().min(1, 'FIR / Crime number is required'),
  policeStation: z.string().min(1, 'Police station is required'),
  district: z.string().min(1, 'District is required'),
  court: z.string().min(1, 'Court name is required'),
  offenceIds: z.array(z.string()).min(1, 'At least one offence must be selected'),
  arrestDate: z.string().min(1, 'Arrest date is required'),
  remandDate: z.string().min(1, 'Remand date is required'),
  priorConviction: z.boolean().default(false),
  priorConvictionDetails: z.string().optional(),
  otherPendingCases: z.boolean().default(false),
  pendingCaseDetails: z.string().optional()
});

// Dashboard & Overview
router.get('/dashboard', getCitizenDashboard);
router.get('/radar', getCitizenRadar);
router.get('/hearings', getCitizenHearings);
router.get('/hearings/:hearingId/ics', downloadHearingIcs);

// Core Case CRUD
router.post('/cases', validateBody(createCaseSchema), createCase);
router.get('/cases/:id', getCaseDetails);
router.post('/cases/:id/documents', upload.single('file'), uploadCaseDocument);
router.post('/cases/:id/assessment', runAssessment);
router.post('/cases/:id/submit', submitBailApplication);
router.get('/cases/:id/draft-pdf', downloadDraftPdf);
router.get('/cases/:id/assessment-pdf', downloadAssessmentPdf);
router.get('/cases/:id/audit', getCaseAuditHistory);

// Feature 7: Sureties
router.get('/cases/:id/sureties', getCaseSureties);
router.post('/cases/:id/sureties', upload.single('proofFile'), addCaseSurety);
router.delete('/cases/:id/sureties/:suretyId', deleteCaseSurety);

// Feature 9: Delegates
router.get('/cases/:id/delegates', getCaseDelegates);
router.post('/cases/:id/delegates', inviteCaseDelegate);
router.post('/cases/:id/delegates/:delegateId/revoke', revokeCaseDelegate);

// Feature 10: Timeline
router.get('/cases/:id/timeline', getCaseTimeline);

// Feature 11: Document Vault with OCR
router.post('/cases/:id/documents/ocr', upload.single('file'), uploadAndOcrDocument);
router.post('/cases/:id/ocr-confirm', confirmOcrFields);

// Feature 12: Bail Conditions Compliance
router.get('/cases/:id/compliance', getCaseCompliance);
router.post('/cases/:id/compliance/checkin', upload.single('proofFile'), logConditionCheckin);

// Feature 15: Legal Aid
router.get('/cases/:id/legal-aid', getCaseLegalAid);
router.post('/cases/:id/legal-aid', upload.single('incomeProof'), submitLegalAidRequest);

export default router;
