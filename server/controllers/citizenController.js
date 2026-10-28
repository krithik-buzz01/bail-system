import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import Case from '../models/Case.js';
import Offence from '../models/Offence.js';
import Document from '../models/Document.js';
import BailApplication from '../models/BailApplication.js';
import Assessment from '../models/Assessment.js';
import Notification from '../models/Notification.js';
import DraftTemplate from '../models/DraftTemplate.js';
import AuditLog from '../models/AuditLog.js';
import SystemSetting from '../models/SystemSetting.js';
import Surety from '../models/Surety.js';
import Hearing from '../models/Hearing.js';
import Delegation from '../models/Delegation.js';
import OcrExtraction from '../models/OcrExtraction.js';
import ConditionCheckin from '../models/ConditionCheckin.js';
import LegalAidRequest from '../models/LegalAidRequest.js';
import Decision from '../models/Decision.js';
import { APP_STATUS, AUDIT_ACTIONS } from '../config/constants.js';
import { runBailAssessment } from '../services/calculators/ruleEngine.js';
import {
  sendApplicationSubmittedEmail,
  sendDelegateInviteEmail,
  sendDelegateRevokedEmail,
  sendLegalAidStatusEmail
} from '../services/emailService.js';
import { recordAuditEvent } from '../services/auditService.js';
import { generateBailDraftPdf, generateAssessmentPdf } from '../services/pdfService.js';
import { extractFieldsFromDocument } from '../services/ocrService.js';
import { generateIcsContent } from '../services/calendarService.js';

/**
 * Citizen Dashboard Overview
 */
export const getCitizenDashboard = async (req, res) => {
  try {
    const citizenId = req.user._id;

    // Fetch citizen's cases
    const cases = await Case.find({ citizenId }).sort({ createdAt: -1 }).lean();

    // Fetch corresponding bail applications
    const caseIds = cases.map((c) => c._id);
    const applications = await BailApplication.find({ caseId: { $in: caseIds } })
      .populate('assignedJudgeId', 'fullName email')
      .lean();

    const appMap = {};
    applications.forEach((a) => {
      appMap[a.caseId.toString()] = a;
    });

    // Fetch threshold settings for live calculations
    const setting = await SystemSetting.findOne({ key: 'DEFAULT_BAIL_CONFIG' }).lean();
    const thresholds = setting?.value || { generalDays: 60, heinousDays: 90 };

    // Annotate cases with live default bail countdown and application status
    const annotatedCases = cases.map((c) => {
      const app = appMap[c._id.toString()];
      let assessmentSummary = null;
      try {
        assessmentSummary = runBailAssessment({
          caseData: c,
          customThresholds: thresholds,
          currentDate: new Date()
        });
      } catch (e) {
        // Fallback if dates are missing
      }

      return {
        ...c,
        application: app || null,
        liveAssessment: assessmentSummary
      };
    });

    // Unread notifications count
    const unreadNotifications = await Notification.countDocuments({
      userId: citizenId,
      isRead: false
    });

    const recentNotifications = await Notification.find({ userId: citizenId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        cases: annotatedCases,
        totalCases: cases.length,
        unreadNotifications,
        recentNotifications
      }
    });
  } catch (error) {
    console.error('Citizen dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load citizen dashboard.' });
  }
};

/**
 * Create Case (Add Case Wizard)
 */
export const createCase = async (req, res) => {
  try {
    const citizenId = req.user._id;
    const {
      personDetails,
      firNumber,
      policeStation,
      district,
      court,
      offenceIds,
      arrestDate,
      remandDate,
      priorConviction,
      priorConvictionDetails,
      otherPendingCases,
      pendingCaseDetails
    } = req.body;

    // Verify offences from offence database
    const offencesDocs = await Offence.find({ _id: { $in: offenceIds }, isActive: true }).lean();
    if (offencesDocs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one valid offence must be selected from the catalogue.'
      });
    }

    const populatedOffences = offencesDocs.map((off) => ({
      offenceId: off._id,
      section: off.section,
      act: off.act,
      title: off.title,
      maxSentenceYears: off.maxSentenceYears,
      bailable: off.bailable,
      punishableDeathOrLife: off.punishableDeathOrLife,
      antilCategory: off.antilCategory,
      versionUsed: off.currentVersion || 1
    }));

    // Generate unique Case Number: e.g. BR-TN-2026-9281
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const caseNumber = `BR-${district ? district.substring(0, 3).toUpperCase() : 'TN'}-${new Date().getFullYear()}-${randomSuffix}`;

    const newCase = await Case.create({
      citizenId,
      caseNumber,
      personDetails,
      firNumber,
      policeStation,
      district,
      court,
      offences: populatedOffences,
      arrestDate: new Date(arrestDate),
      remandDate: new Date(remandDate),
      priorConviction: Boolean(priorConviction),
      priorConvictionDetails: priorConvictionDetails || '',
      otherPendingCases: Boolean(otherPendingCases),
      pendingCaseDetails: pendingCaseDetails || '',
      status: APP_STATUS.DRAFT
    });

    await recordAuditEvent({
      action: AUDIT_ACTIONS.CASE_CREATE,
      caseId: newCase._id,
      performedBy: citizenId,
      performedByName: req.user.fullName,
      performedByEmail: req.user.email,
      role: req.user.role,
      ipAddress: req.ip,
      details: { caseNumber, firNumber, district }
    });

    return res.status(201).json({
      success: true,
      message: 'Case record created successfully!',
      case: newCase
    });
  } catch (error) {
    console.error('Create case error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create case record.' });
  }
};

/**
 * Upload Documents for a Case
 */
export const uploadCaseDocument = async (req, res) => {
  try {
    const { id: caseId } = req.params;
    const { fileType, remarks } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const caseDoc = await Case.findOne({ _id: caseId, citizenId: req.user._id });
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found or unauthorized.' });
    }

    const docRecord = await Document.create({
      caseId,
      uploadedBy: req.user._id,
      fileType: fileType || 'OTHER',
      originalName: file.originalname,
      fileName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      storageType: 'local',
      verificationStatus: 'Pending',
      remarks: remarks || ''
    });

    await recordAuditEvent({
      action: AUDIT_ACTIONS.DOCUMENT_UPLOAD,
      caseId,
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      performedByEmail: req.user.email,
      role: req.user.role,
      ipAddress: req.ip,
      details: { fileName: file.originalname, fileType }
    });

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully!',
      document: docRecord
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload document.' });
  }
};

/**
 * Run Bail Assessment for a Case
 */
export const runAssessment = async (req, res) => {
  try {
    const { id: caseId } = req.params;
    const caseDoc = await Case.findOne({ _id: caseId, citizenId: req.user._id });
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found or unauthorized.' });
    }

    const setting = await SystemSetting.findOne({ key: 'DEFAULT_BAIL_CONFIG' }).lean();
    const thresholds = setting?.value || { generalDays: 60, heinousDays: 90 };

    const assessmentResult = runBailAssessment({
      caseData: caseDoc,
      customThresholds: thresholds,
      currentDate: new Date()
    });

    // Save or update assessment record
    let assessmentDoc = await Assessment.findOne({ caseId });
    if (!assessmentDoc) {
      assessmentDoc = new Assessment({
        caseId,
        citizenId: req.user._id,
        inputsSnapshot: caseDoc.toObject(),
        outputs: assessmentResult,
        ruleVersions: assessmentResult.ruleVersions,
        computedAt: new Date()
      });
    } else {
      assessmentDoc.inputsSnapshot = caseDoc.toObject();
      assessmentDoc.outputs = assessmentResult;
      assessmentDoc.ruleVersions = assessmentResult.ruleVersions;
      assessmentDoc.computedAt = new Date();
    }
    await assessmentDoc.save();

    return res.status(200).json({
      success: true,
      assessment: assessmentResult
    });
  } catch (error) {
    console.error('Assessment execution error:', error);
    return res.status(500).json({ success: false, message: 'Failed to run bail assessment.' });
  }
};

/**
 * Submit Bail Application to Court Queue
 */
export const submitBailApplication = async (req, res) => {
  try {
    const { id: caseId } = req.params;
    const { urgentHearingRequested = false, urgentGrounds = '' } = req.body;

    const caseDoc = await Case.findOne({ _id: caseId, citizenId: req.user._id });
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found or unauthorized.' });
    }

    let app = await BailApplication.findOne({ caseId });
    if (app && app.status !== APP_STATUS.DRAFT) {
      return res.status(400).json({
        success: false,
        message: `Application is already submitted with status: ${app.status}`
      });
    }

    // Run assessment if not already available
    const setting = await SystemSetting.findOne({ key: 'DEFAULT_BAIL_CONFIG' }).lean();
    const thresholds = setting?.value || { generalDays: 60, heinousDays: 90 };
    const assessmentResult = runBailAssessment({
      caseData: caseDoc,
      customThresholds: thresholds,
      currentDate: new Date()
    });

    // Generate draft bail application PDF
    const uploadDir = path.join(process.cwd(), 'server/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const pdfFilename = `bail_draft_${caseDoc.caseNumber}_${Date.now()}.pdf`;
    const pdfPath = path.join(uploadDir, pdfFilename);
    const writeStream = fs.createWriteStream(pdfPath);

    await generateBailDraftPdf(
      { caseData: caseDoc, template: null, assessment: assessmentResult },
      writeStream
    );

    const applicationNumber = `BA-${caseDoc.caseNumber.replace('BR-', '')}`;

    if (!app) {
      app = await BailApplication.create({
        caseId,
        citizenId: req.user._id,
        applicationNumber,
        status: APP_STATUS.SUBMITTED,
        draftPdfPath: pdfFilename,
        urgentHearingRequested: Boolean(urgentHearingRequested),
        urgentGrounds: urgentGrounds || '',
        submissionDate: new Date()
      });
    } else {
      app.status = APP_STATUS.SUBMITTED;
      app.draftPdfPath = pdfFilename;
      app.urgentHearingRequested = Boolean(urgentHearingRequested);
      app.urgentGrounds = urgentGrounds || '';
      app.submissionDate = new Date();
      await app.save();
    }

    caseDoc.status = APP_STATUS.SUBMITTED;
    await caseDoc.save();

    // Send confirmation email
    await sendApplicationSubmittedEmail(
      req.user.email,
      caseDoc.caseNumber,
      req.user.fullName
    );

    await recordAuditEvent({
      action: AUDIT_ACTIONS.APPLICATION_SUBMIT,
      caseId,
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      performedByEmail: req.user.email,
      role: req.user.role,
      ipAddress: req.ip,
      details: { applicationNumber, urgent: urgentHearingRequested }
    });

    return res.status(200).json({
      success: true,
      message: 'Bail application successfully submitted to the court queue!',
      application: app
    });
  } catch (error) {
    console.error('Submit application error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit application.' });
  }
};

/**
 * Download Auto-Drafted Bail Application PDF
 */
export const downloadDraftPdf = async (req, res) => {
  try {
    const { id: caseId } = req.params;
    const caseDoc = await Case.findOne({ _id: caseId, citizenId: req.user._id });
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found or unauthorized.' });
    }

    const setting = await SystemSetting.findOne({ key: 'DEFAULT_BAIL_CONFIG' }).lean();
    const thresholds = setting?.value || { generalDays: 60, heinousDays: 90 };
    const assessmentResult = runBailAssessment({
      caseData: caseDoc,
      customThresholds: thresholds,
      currentDate: new Date()
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Draft_Bail_Petition_${caseDoc.caseNumber}.pdf"`
    );

    await generateBailDraftPdf(
      { caseData: caseDoc, template: null, assessment: assessmentResult },
      res
    );
  } catch (error) {
    console.error('Draft PDF download error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate draft PDF.' });
  }
};

/**
 * Download Assessment Report PDF
 */
export const downloadAssessmentPdf = async (req, res) => {
  try {
    const { id: caseId } = req.params;
    const caseDoc = await Case.findOne({ _id: caseId, citizenId: req.user._id });
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found or unauthorized.' });
    }

    const setting = await SystemSetting.findOne({ key: 'DEFAULT_BAIL_CONFIG' }).lean();
    const thresholds = setting?.value || { generalDays: 60, heinousDays: 90 };
    const assessmentResult = runBailAssessment({
      caseData: caseDoc,
      customThresholds: thresholds,
      currentDate: new Date()
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Bail_Assessment_Report_${caseDoc.caseNumber}.pdf"`
    );

    await generateAssessmentPdf({ caseData: caseDoc, assessment: assessmentResult }, res);
  } catch (error) {
    console.error('Assessment PDF download error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate assessment PDF.' });
  }
};

/**
 * Get Specific Case Details with Documents and Application Status
 */
export const getCaseDetails = async (req, res) => {
  try {
    const { id: caseId } = req.params;
    const caseDoc = await Case.findOne({ _id: caseId, citizenId: req.user._id }).lean();
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    const documents = await Document.find({ caseId }).lean();
    const application = await BailApplication.findOne({ caseId })
      .populate('assignedJudgeId', 'fullName email')
      .lean();

    const setting = await SystemSetting.findOne({ key: 'DEFAULT_BAIL_CONFIG' }).lean();
    const thresholds = setting?.value || { generalDays: 60, heinousDays: 90 };
    const assessment = runBailAssessment({
      caseData: caseDoc,
      customThresholds: thresholds,
      currentDate: new Date()
    });

    return res.status(200).json({
      success: true,
      case: caseDoc,
      documents,
      application,
      assessment
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch case details.' });
  }
};

/**
 * Get Case Audit History for Citizen View
 */
export const getCaseAuditHistory = async (req, res) => {
  try {
    const { id: caseId } = req.params;
    const caseDoc = await Case.findOne({ _id: caseId, citizenId: req.user._id });
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found or unauthorized.' });
    }

    const logs = await AuditLog.find({ caseId })
      .sort({ sequenceNumber: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      auditHistory: logs
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch case audit history.' });
  }
};

/**
 * Feature 7: Surety Readiness Management
 */
export const getCaseSureties = async (req, res) => {
  try {
    const { id: caseId } = req.params;
    const caseDoc = await Case.findOne({ _id: caseId, citizenId: req.user._id });
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found or unauthorized.' });
    }

    const sureties = await Surety.find({ caseId }).sort({ createdAt: -1 }).lean();
    const verifiedCount = sureties.filter((s) => s.status === 'Verified').length;
    const totalSolvency = sureties.reduce((sum, s) => sum + (s.solvencyAmount || 0), 0);

    return res.status(200).json({
      success: true,
      sureties,
      summary: {
        total: sureties.length,
        verifiedCount,
        pendingCount: sureties.filter((s) => s.status === 'Pending Verification').length,
        isReady: verifiedCount >= 2,
        totalSolvency
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch sureties.' });
  }
};

export const addCaseSurety = async (req, res) => {
  try {
    const { id: caseId } = req.params;
    const { fullName, relationship, phone, address, solvencyAmount, idProofType, idProofNumber } = req.body;

    const caseDoc = await Case.findOne({ _id: caseId, citizenId: req.user._id });
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found or unauthorized.' });
    }

    const documentPath = req.file ? req.file.filename : '';
    const documentOriginalName = req.file ? req.file.originalname : '';

    const surety = await Surety.create({
      caseId,
      citizenId: req.user._id,
      fullName,
      relationship,
      phone,
      address,
      solvencyAmount: Number(solvencyAmount || 0),
      idProofType: idProofType || 'Aadhaar',
      idProofNumber,
      documentPath,
      documentOriginalName,
      status: 'Pending Verification'
    });

    await recordAuditEvent({
      action: 'SURETY_ADDED',
      caseId,
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      performedByEmail: req.user.email,
      role: req.user.role,
      ipAddress: req.ip,
      details: { suretyName: fullName, solvencyAmount, idProofType }
    });

    return res.status(201).json({
      success: true,
      message: 'Surety added successfully. Pending verification by Court Registry.',
      surety
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to add surety.' });
  }
};

export const deleteCaseSurety = async (req, res) => {
  try {
    const { id: caseId, suretyId } = req.params;
    const surety = await Surety.findOneAndDelete({ _id: suretyId, caseId, citizenId: req.user._id });
    if (!surety) {
      return res.status(404).json({ success: false, message: 'Surety not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Surety record removed.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete surety.' });
  }
};

/**
 * Feature 8: Hearing Calendar & .ics Export
 */
export const getCitizenHearings = async (req, res) => {
  try {
    const citizenCases = await Case.find({ citizenId: req.user._id }).select('_id caseNumber').lean();
    const caseIds = citizenCases.map((c) => c._id);

    const hearings = await Hearing.find({ caseId: { $in: caseIds } })
      .populate('judgeId', 'fullName email')
      .populate('caseId', 'caseNumber personDetails')
      .sort({ hearingDate: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      hearings
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch hearings.' });
  }
};

export const downloadHearingIcs = async (req, res) => {
  try {
    const { hearingId } = req.params;
    const hearing = await Hearing.findById(hearingId)
      .populate('caseId')
      .populate('judgeId', 'fullName');

    if (!hearing) {
      return res.status(404).json({ success: false, message: 'Hearing not found.' });
    }

    const icsContent = generateIcsContent({
      hearing,
      caseData: hearing.caseId,
      courtRoom: hearing.courtRoom,
      judgeName: hearing.judgeId?.fullName
    });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Hearing_${hearing.caseId?.caseNumber || 'court'}.ics"`);
    return res.send(icsContent);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate calendar export.' });
  }
};

/**
 * Feature 9: Family & Representative Delegation
 */
export const getCaseDelegates = async (req, res) => {
  try {
    const { id: caseId } = req.params;
    const delegates = await Delegation.find({ caseId, citizenId: req.user._id })
      .populate('delegateUserId', 'fullName email phone')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      delegates
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch delegates.' });
  }
};

export const inviteCaseDelegate = async (req, res) => {
  try {
    const { id: caseId } = req.params;
    const { delegateEmail, delegateName, delegatePhone, relationship } = req.body;

    const caseDoc = await Case.findOne({ _id: caseId, citizenId: req.user._id });
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    const inviteToken = crypto.randomBytes(24).toString('hex');
    const inviteTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const delegation = await Delegation.create({
      caseId,
      citizenId: req.user._id,
      delegateEmail,
      delegateName,
      delegatePhone: delegatePhone || '',
      relationship,
      inviteToken,
      inviteTokenExpires,
      status: 'Invited'
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteLink = `${clientUrl}/delegate/accept?token=${inviteToken}`;

    await sendDelegateInviteEmail(
      delegateEmail,
      req.user.fullName,
      caseDoc.caseNumber,
      inviteLink,
      relationship
    );

    await recordAuditEvent({
      action: 'DELEGATE_INVITED',
      caseId,
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      performedByEmail: req.user.email,
      role: req.user.role,
      ipAddress: req.ip,
      details: { delegateEmail, delegateName, relationship }
    });

    return res.status(201).json({
      success: true,
      message: `Invitation sent to ${delegateEmail}.`,
      delegation
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to invite delegate.' });
  }
};

export const revokeCaseDelegate = async (req, res) => {
  try {
    const { id: caseId, delegateId } = req.params;
    const { reason = 'Revoked by primary citizen' } = req.body;

    const delegation = await Delegation.findOne({ _id: delegateId, caseId, citizenId: req.user._id });
    if (!delegation) {
      return res.status(404).json({ success: false, message: 'Delegation not found.' });
    }

    delegation.status = 'Revoked';
    delegation.revokedAt = new Date();
    delegation.revokedBy = req.user._id;
    delegation.revokeReason = reason;
    await delegation.save();

    const caseDoc = await Case.findById(caseId).select('caseNumber');
    await sendDelegateRevokedEmail(delegation.delegateEmail, caseDoc?.caseNumber || 'N/A', reason);

    await recordAuditEvent({
      action: 'DELEGATE_REVOKED',
      caseId,
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      performedByEmail: req.user.email,
      role: req.user.role,
      ipAddress: req.ip,
      details: { delegateEmail: delegation.delegateEmail, reason }
    });

    return res.status(200).json({
      success: true,
      message: 'Delegate access revoked successfully.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to revoke delegate.' });
  }
};

/**
 * Feature 10: Plain-Language Case Timeline with Next Steps Guidance
 */
export const getCaseTimeline = async (req, res) => {
  try {
    const { id: caseId } = req.params;
    const caseDoc = await Case.findOne({ _id: caseId, citizenId: req.user._id }).lean();
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    const application = await BailApplication.findOne({ caseId }).populate('assignedJudgeId', 'fullName court').lean();
    const hearings = await Hearing.find({ caseId }).sort({ hearingDate: 1 }).lean();
    const decision = await Decision.findOne({ caseId }).lean();

    const milestones = [
      {
        id: 'arrest',
        stage: 'Arrest & Detention',
        date: caseDoc.arrestDate,
        status: 'Completed',
        description: `Arrested by ${caseDoc.policeStation} in connection with FIR ${caseDoc.firNumber}.`,
        nextAction: 'Production before the jurisdictional Magistrate within 24 hours under Section 58 BNSS.'
      },
      {
        id: 'remand',
        stage: 'First Judicial Remand',
        date: caseDoc.remandDate,
        status: 'Completed',
        description: `Remanded to custody. Section 187 statutory countdown begins from this date.`,
        nextAction: 'Monitor investigation window (60 or 90 days).'
      }
    ];

    if (application) {
      milestones.push({
        id: 'application',
        stage: 'Bail Petition Submitted',
        date: application.submissionDate || application.createdAt,
        status: 'Completed',
        description: `Bail Application No. ${application.applicationNumber} registered in Court Registry.`,
        nextAction: application.assignedJudgeId
          ? `Assigned to ${application.assignedJudgeId.fullName}. Awaiting hearing order.`
          : 'Pending judicial bench allocation by Registry Admin.'
      });
    } else {
      milestones.push({
        id: 'application',
        stage: 'Bail Petition Submission',
        date: null,
        status: 'Pending',
        description: 'Auto-draft your petition and submit to the court registry queue.',
        nextAction: 'Review statutory eligibility and click Submit Application.'
      });
    }

    if (hearings.length > 0) {
      hearings.forEach((h, idx) => {
        milestones.push({
          id: `hearing_${idx}`,
          stage: `Hearing: ${h.purpose || 'Statutory Review'}`,
          date: h.hearingDate,
          status: h.status === 'Completed' ? 'Completed' : 'Upcoming',
          description: `Courtroom: ${h.courtRoom} at ${h.startTime || '10:30 AM'}. Status: ${h.status}.`,
          nextAction: h.status === 'Scheduled' ? 'Ensure advocate and sureties are in attendance.' : 'Review judicial order.'
        });
      });
    }

    if (decision) {
      milestones.push({
        id: 'decision',
        stage: `Judicial Order: ${decision.outcome}`,
        date: decision.decidedAt,
        status: 'Completed',
        description: `Pronounced by Court: ${decision.outcome}. Reasons: "${decision.reasons?.substring(0, 120)}..."`,
        nextAction: decision.outcome.toLowerCase().includes('granted')
          ? 'Execute personal bail bond and deposit surety verifications at Registry.'
          : 'Consult legal aid or counsel for appeal before the High Court.'
      });
    }

    return res.status(200).json({
      success: true,
      caseNumber: caseDoc.caseNumber,
      currentStatus: caseDoc.status,
      milestones,
      guidance: {
        currentPhase: decision ? 'Decided' : application ? 'Judicial Review' : 'Pre-Submission',
        summary: 'Under BNSS 2023, every stage of criminal procedure has fixed statutory timelines designed to prevent prolonged undertrial incarceration.'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to construct case timeline.' });
  }
};

/**
 * Feature 11: Document Vault with OCR Suggestion & Field Confirmation
 */
export const uploadAndOcrDocument = async (req, res) => {
  try {
    const { id: caseId } = req.params;
    const { fileType = 'Remand Order', remarks = '' } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const caseDoc = await Case.findOne({ _id: caseId, citizenId: req.user._id });
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    let mappedType = 'OTHER';
    if (fileType?.toUpperCase().includes('REMAND')) mappedType = 'REMAND_ORDER';
    else if (fileType?.toUpperCase().includes('FIR')) mappedType = 'FIR_COPY';
    else if (fileType?.toUpperCase().includes('ID')) mappedType = 'ID_PROOF';
    else if (fileType?.toUpperCase().includes('MED')) mappedType = 'MEDICAL_REPORT';
    else if (fileType?.toUpperCase().includes('BAIL')) mappedType = 'BAIL_PETITION';

    const doc = await Document.create({
      caseId,
      uploadedBy: req.user._id,
      fileType: mappedType,
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      storageType: 'local',
      verificationStatus: 'Verified',
      remarks
    });

    // Run heuristic OCR analysis
    const ocrResult = await extractFieldsFromDocument({
      filePath: file.path,
      originalName: file.originalname
    });

    const ocrExtraction = await OcrExtraction.create({
      documentId: doc._id,
      caseId,
      extractedFields: ocrResult.extractedFields,
      confidenceScores: ocrResult.confidenceScores,
      rawText: ocrResult.rawText,
      status: 'Pending Confirmation'
    });

    return res.status(201).json({
      success: true,
      message: 'Document uploaded. OCR fields extracted for review and confirmation.',
      document: doc,
      ocr: ocrExtraction
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'OCR processing failed.' });
  }
};

export const confirmOcrFields = async (req, res) => {
  try {
    const { id: caseId } = req.params;
    const { ocrId, confirmedFields } = req.body;

    const ocrDoc = await OcrExtraction.findOne({ _id: ocrId, caseId });
    if (!ocrDoc) {
      return res.status(404).json({ success: false, message: 'OCR record not found.' });
    }

    ocrDoc.status = 'Confirmed';
    ocrDoc.confirmedBy = req.user._id;
    ocrDoc.confirmedAt = new Date();
    ocrDoc.confirmedFields = confirmedFields;
    await ocrDoc.save();

    // Optionally update case FIR details with confirmed values
    const caseDoc = await Case.findOne({ _id: caseId, citizenId: req.user._id });
    if (caseDoc && confirmedFields) {
      if (confirmedFields.firNumber) caseDoc.firNumber = confirmedFields.firNumber;
      if (confirmedFields.policeStation) caseDoc.policeStation = confirmedFields.policeStation;
      if (confirmedFields.remandDate) caseDoc.remandDate = new Date(confirmedFields.remandDate);
      await caseDoc.save();
    }

    await recordAuditEvent({
      action: 'OCR_FIELDS_CONFIRMED',
      caseId,
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      performedByEmail: req.user.email,
      role: req.user.role,
      ipAddress: req.ip,
      details: { confirmedFields }
    });

    return res.status(200).json({
      success: true,
      message: 'OCR fields confirmed and updated on case record.',
      ocr: ocrDoc
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to confirm OCR fields.' });
  }
};

/**
 * Feature 12: Bail Conditions Compliance Tracker
 */
export const getCaseCompliance = async (req, res) => {
  try {
    const { id: caseId } = req.params;
    const caseDoc = await Case.findOne({ _id: caseId, citizenId: req.user._id }).lean();
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    const decision = await Decision.findOne({ caseId }).lean();
    const checkins = await ConditionCheckin.find({ caseId }).sort({ checkinDate: -1 }).lean();

    const totalCheckins = checkins.length;
    const verifiedCheckins = checkins.filter((c) => c.status === 'Verified').length;
    const missedCheckins = checkins.filter((c) => c.status === 'Missed').length;

    const complianceScore = totalCheckins === 0 ? 100 : Math.round((verifiedCheckins / totalCheckins) * 100);

    return res.status(200).json({
      success: true,
      decision: decision || null,
      conditions: decision?.conditions || ['Periodic weekly reporting at jurisdictional Police Station.'],
      checkins,
      stats: {
        totalCheckins,
        verifiedCheckins,
        missedCheckins,
        complianceScore
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load compliance data.' });
  }
};

export const logConditionCheckin = async (req, res) => {
  try {
    const { id: caseId } = req.params;
    const { checkinDate, policeStation, officerName, receiptNumber, notes } = req.body;

    const caseDoc = await Case.findOne({ _id: caseId, citizenId: req.user._id });
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    const proofDocumentPath = req.file ? req.file.filename : '';

    const checkin = await ConditionCheckin.create({
      caseId,
      citizenId: req.user._id,
      checkinDate: new Date(checkinDate || Date.now()),
      policeStation: policeStation || caseDoc.policeStation,
      officerName: officerName || '',
      receiptNumber: receiptNumber || '',
      proofDocumentPath,
      status: 'Verified',
      notes: notes || 'Periodic reporting verified by local station officer.'
    });

    await recordAuditEvent({
      action: 'CONDITION_CHECKIN_LOGGED',
      caseId,
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      performedByEmail: req.user.email,
      role: req.user.role,
      ipAddress: req.ip,
      details: { checkinDate, policeStation }
    });

    return res.status(201).json({
      success: true,
      message: 'Check-in logged successfully! Compliance score updated.',
      checkin
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to log condition check-in.' });
  }
};

/**
 * Feature 13: Citizen Eligibility Radar
 */
export const getCitizenRadar = async (req, res) => {
  try {
    const cases = await Case.find({ citizenId: req.user._id }).lean();
    const setting = await SystemSetting.findOne({ key: 'DEFAULT_BAIL_CONFIG' }).lean();
    const thresholds = setting?.value || { generalDays: 60, heinousDays: 90 };

    const maturedCases = [];
    const urgentCases = [];

    cases.forEach((c) => {
      try {
        const assessment = runBailAssessment({
          caseData: c,
          customThresholds: thresholds,
          currentDate: new Date()
        });

        if (assessment.bnss187?.isMatured || assessment.bnss479?.isEligible) {
          maturedCases.push({
            caseId: c._id,
            caseNumber: c.caseNumber,
            personName: c.personDetails?.fullName,
            statutoryReason: assessment.bnss187?.isMatured ? 'Section 187 Default Bail Matured' : 'Section 479 Detention Limit Reached',
            elapsedDays: assessment.bnss187?.daysElapsed,
            status: c.status
          });
        } else if (assessment.bnss187?.daysRemaining <= 7) {
          urgentCases.push({
            caseId: c._id,
            caseNumber: c.caseNumber,
            personName: c.personDetails?.fullName,
            daysRemaining: assessment.bnss187.daysRemaining,
            deadlineDate: assessment.bnss187.deadlineDate,
            status: c.status
          });
        }
      } catch (e) {}
    });

    return res.status(200).json({
      success: true,
      hasMaturedRights: maturedCases.length > 0,
      maturedCases,
      urgentCases
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to evaluate eligibility radar.' });
  }
};

/**
 * Feature 15: Legal Aid Request & Tracking
 */
export const getCaseLegalAid = async (req, res) => {
  try {
    const { id: caseId } = req.params;
    const request = await LegalAidRequest.findOne({ caseId, citizenId: req.user._id })
      .populate('dlsaId')
      .lean();

    return res.status(200).json({
      success: true,
      hasRequest: Boolean(request),
      request: request || null
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch legal aid request.' });
  }
};

export const submitLegalAidRequest = async (req, res) => {
  try {
    const { id: caseId } = req.params;
    const { dlsaId, district, incomeCategory, reasonForRequest } = req.body;

    const caseDoc = await Case.findOne({ _id: caseId, citizenId: req.user._id });
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    const incomeProofPath = req.file ? req.file.filename : '';

    let aidReq = await LegalAidRequest.findOne({ caseId });
    if (aidReq) {
      aidReq.district = district || caseDoc.district;
      aidReq.incomeCategory = incomeCategory || 'Incarcerated Undertrial';
      aidReq.reasonForRequest = reasonForRequest;
      aidReq.status = 'Submitted';
      if (incomeProofPath) aidReq.incomeProofPath = incomeProofPath;
      aidReq.history.push({
        status: 'Submitted',
        updatedBy: req.user._id,
        remarks: 'Legal aid assistance re-submitted by citizen.'
      });
      await aidReq.save();
    } else {
      aidReq = await LegalAidRequest.create({
        caseId,
        citizenId: req.user._id,
        dlsaId: dlsaId || null,
        district: district || caseDoc.district,
        incomeCategory: incomeCategory || 'Incarcerated Undertrial',
        incomeProofPath,
        reasonForRequest,
        status: 'Submitted',
        history: [
          {
            status: 'Submitted',
            updatedBy: req.user._id,
            remarks: 'Application submitted for free legal representation under Sec 340 BNSS.'
          }
        ]
      });
    }

    await recordAuditEvent({
      action: 'LEGAL_AID_REQUESTED',
      caseId,
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      performedByEmail: req.user.email,
      role: req.user.role,
      ipAddress: req.ip,
      details: { district: aidReq.district, incomeCategory }
    });

    return res.status(201).json({
      success: true,
      message: 'Legal aid request submitted to District Legal Services Authority (DLSA).',
      request: aidReq
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to submit legal aid request.' });
  }
};

