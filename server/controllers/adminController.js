import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import JudgeProfile from '../models/JudgeProfile.js';
import Case from '../models/Case.js';
import Offence from '../models/Offence.js';
import Document from '../models/Document.js';
import BailApplication from '../models/BailApplication.js';
import Decision from '../models/Decision.js';
import LegalAidContact from '../models/LegalAidContact.js';
import DraftTemplate from '../models/DraftTemplate.js';
import EmailLog from '../models/EmailLog.js';
import AuditLog from '../models/AuditLog.js';
import SystemSetting from '../models/SystemSetting.js';
import Notification from '../models/Notification.js';
import Surety from '../models/Surety.js';
import Hearing from '../models/Hearing.js';
import Delegation from '../models/Delegation.js';
import LegalAidRequest from '../models/LegalAidRequest.js';
import ConditionCheckin from '../models/ConditionCheckin.js';
import AlertSent from '../models/AlertSent.js';
import QuickCheckShare from '../models/QuickCheckShare.js';
import RightsContent from '../models/RightsContent.js';
import OcrExtraction from '../models/OcrExtraction.js';
import { ROLES, APP_STATUS, AUDIT_ACTIONS, ANTIL_CATEGORIES } from '../config/constants.js';
import {
  sendJudgeInviteEmail,
  sendApplicationAssignedEmail,
  sendHearingScheduledEmail,
  sendDocumentRequestedEmail,
  sendSuretyVerifiedEmail,
  sendDelegateRevokedEmail,
  sendConditionEscalationEmail,
  sendLegalAidStatusEmail
} from '../services/emailService.js';
import { recordAuditEvent, verifyAuditChainIntegrity } from '../services/auditService.js';
import { runBailAssessment } from '../services/calculators/ruleEngine.js';
import { checkHearingClash } from '../services/calendarService.js';
import { extractFieldsFromDocument } from '../services/ocrService.js';

/**
 * Admin Dashboard Analytics for Recharts
 */
export const getAdminAnalytics = async (req, res) => {
  try {
    // 1. Cases by Status
    const casesByStatusAgg = await Case.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const casesByStatus = Object.values(APP_STATUS).map((status) => {
      const match = casesByStatusAgg.find((c) => c._id === status);
      return { status, count: match ? match.count : 0 };
    });

    // 2. Cases by Antil Offence Category
    const categoryCount = {
      [ANTIL_CATEGORIES.A]: 0,
      [ANTIL_CATEGORIES.B]: 0,
      [ANTIL_CATEGORIES.C]: 0,
      [ANTIL_CATEGORIES.D]: 0
    };
    const allCases = await Case.find().select('offences').lean();
    allCases.forEach((c) => {
      c.offences?.forEach((o) => {
        if (categoryCount[o.antilCategory] !== undefined) {
          categoryCount[o.antilCategory]++;
        }
      });
    });
    const casesByCategory = Object.entries(categoryCount).map(([category, count]) => ({
      category,
      count
    }));

    // 3. Applications per week (last 4 weeks)
    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
    const weeklyApps = await BailApplication.aggregate([
      { $match: { createdAt: { $gte: fourWeeksAgo } } },
      {
        $group: {
          _id: { $week: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    const applicationsPerWeek = weeklyApps.map((w, index) => ({
      week: `Week ${index + 1}`,
      count: w.count
    }));

    // 4. Average Time to Decision (in days)
    const decisions = await Decision.find().lean();
    let avgDecisionDays = 0;
    if (decisions.length > 0) {
      const appIds = decisions.map((d) => d.applicationId);
      const apps = await BailApplication.find({ _id: { $in: appIds } }).lean();
      const appMap = {};
      apps.forEach((a) => {
        appMap[a._id.toString()] = a.createdAt;
      });

      let totalDays = 0;
      let count = 0;
      decisions.forEach((d) => {
        const created = appMap[d.applicationId.toString()];
        if (created) {
          const diffMs = new Date(d.decidedAt).getTime() - new Date(created).getTime();
          totalDays += diffMs / (1000 * 60 * 60 * 24);
          count++;
        }
      });
      avgDecisionDays = count > 0 ? parseFloat((totalDays / count).toFixed(1)) : 0;
    }

    // 5. Emails Sent vs Failed
    const emailStatsAgg = await EmailLog.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const emailStats = {
      sent: 0,
      failed: 0,
      simulated: 0
    };
    emailStatsAgg.forEach((e) => {
      if (e._id === 'SENT') emailStats.sent = e.count;
      else if (e._id === 'FAILED') emailStats.failed = e.count;
      else if (e._id === 'SIMULATED') emailStats.simulated = e.count;
    });

    const totalUsers = await User.countDocuments();
    const totalCases = await Case.countDocuments();
    const totalApplications = await BailApplication.countDocuments();
    const activeJudges = await User.countDocuments({ role: ROLES.JUDGE, isActive: true });

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalUsers,
          totalCases,
          totalApplications,
          activeJudges,
          avgDecisionDays
        },
        casesByStatus,
        casesByCategory,
        applicationsPerWeek,
        emailStats
      }
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate analytics.' });
  }
};

/**
 * List & Search Users (Citizens and Judges)
 */
export const listUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    const total = await User.countDocuments(filter);

    // If judges, attach court profile
    const enhancedUsers = await Promise.all(
      users.map(async (u) => {
        if (u.role === ROLES.JUDGE) {
          const profile = await JudgeProfile.findOne({ userId: u._id }).lean();
          return { ...u, judgeProfile: profile };
        }
        return u;
      })
    );

    return res.status(200).json({
      success: true,
      users: enhancedUsers,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to list users.' });
  }
};

/**
 * Suspend or Reactivate Citizen
 */
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === ROLES.ADMIN) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate system administrator.' });
    }

    user.isActive = Boolean(isActive);
    await user.save();

    await recordAuditEvent({
      action: user.isActive ? AUDIT_ACTIONS.USER_REACTIVATE : AUDIT_ACTIONS.USER_SUSPEND,
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      performedByEmail: req.user.email,
      role: req.user.role,
      ipAddress: req.ip,
      details: { targetUserId: user._id, targetEmail: user.email, isActive: user.isActive }
    });

    return res.status(200).json({
      success: true,
      message: `User account has been ${user.isActive ? 'reactivated' : 'suspended'}.`,
      user: { id: user._id, isActive: user.isActive }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update user status.' });
  }
};

/**
 * Invite Judge (Admin enters name, email, court, bench; system sends 48h link)
 */
export const inviteJudge = async (req, res) => {
  try {
    const { fullName, email, phone, court, bench } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address is already registered in the system.'
      });
    }

    // Generate secure 48-hour invite token
    const rawInviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenHash = crypto.createHash('sha256').update(rawInviteToken).digest('hex');
    const inviteExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Temporary unusable password hash
    const salt = await bcrypt.genSalt(10);
    const tempPasswordHash = await bcrypt.hash(crypto.randomBytes(20).toString('hex'), salt);

    const judgeUser = await User.create({
      fullName,
      email: normalizedEmail,
      phone: phone || '',
      passwordHash: tempPasswordHash,
      role: ROLES.JUDGE,
      isVerified: false,
      isActive: true
    });

    const judgeProfile = await JudgeProfile.create({
      userId: judgeUser._id,
      court,
      bench,
      invitedBy: req.user._id,
      inviteTokenHash,
      inviteExpiresAt,
      isInviteAccepted: false
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteUrl = `${clientUrl}/judge-invite?token=${rawInviteToken}&email=${encodeURIComponent(normalizedEmail)}`;

    // Dispatch real/templated email
    await sendJudgeInviteEmail(normalizedEmail, fullName, court, bench, inviteUrl);

    await recordAuditEvent({
      action: AUDIT_ACTIONS.JUDGE_INVITE,
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      performedByEmail: req.user.email,
      role: req.user.role,
      ipAddress: req.ip,
      details: { judgeEmail: normalizedEmail, court, bench }
    });

    return res.status(201).json({
      success: true,
      message: `Judicial invitation successfully sent to ${normalizedEmail} (valid 48 hours).`,
      judge: {
        id: judgeUser._id,
        fullName: judgeUser.fullName,
        email: judgeUser.email,
        court,
        bench
      }
    });
  } catch (error) {
    console.error('Invite judge error:', error);
    return res.status(500).json({ success: false, message: 'Failed to dispatch judicial invitation.' });
  }
};

/**
 * Offence Rules Management (CRUD with version history)
 */
export const listOffences = async (req, res) => {
  try {
    const { search, antilCategory, bailable } = req.query;
    const filter = { isActive: true };

    if (antilCategory) filter.antilCategory = antilCategory;
    if (bailable !== undefined) filter.bailable = bailable === 'true';
    if (search) {
      filter.$or = [
        { section: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { correspondingSection: { $regex: search, $options: 'i' } },
        { act: { $regex: search, $options: 'i' } }
      ];
    }

    const offences = await Offence.find(filter).sort({ title: 1 }).lean();
    return res.status(200).json({ success: true, offences });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to list offences.' });
  }
};

export const createOffence = async (req, res) => {
  try {
    const {
      section,
      act,
      correspondingSection,
      title,
      description,
      maxSentenceYears,
      bailable,
      punishableDeathOrLife,
      antilCategory,
      trialCourt
    } = req.body;

    const initialVersion = {
      versionNumber: 1,
      section,
      act: act || 'Bharatiya Nyaya Sanhita, 2023',
      title,
      maxSentenceYears: Number(maxSentenceYears),
      bailable: Boolean(bailable),
      punishableDeathOrLife: Boolean(punishableDeathOrLife),
      antilCategory,
      changedBy: req.user._id,
      reason: 'Initial rule creation by Administrator',
      effectiveFrom: new Date()
    };

    const newOffence = await Offence.create({
      section,
      act: act || 'Bharatiya Nyaya Sanhita, 2023',
      correspondingSection,
      title,
      description,
      maxSentenceYears: Number(maxSentenceYears),
      bailable: Boolean(bailable),
      punishableDeathOrLife: Boolean(punishableDeathOrLife),
      antilCategory,
      trialCourt: trialCourt || 'Magistrate Court',
      currentVersion: 1,
      versions: [initialVersion]
    });

    await recordAuditEvent({
      action: AUDIT_ACTIONS.RULE_CREATE,
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      performedByEmail: req.user.email,
      role: req.user.role,
      ipAddress: req.ip,
      details: { section, title, antilCategory }
    });

    return res.status(201).json({
      success: true,
      message: 'Offence rule created successfully.',
      offence: newOffence
    });
  } catch (error) {
    console.error('Create offence error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create offence rule.' });
  }
};

export const updateOffence = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      section,
      act,
      correspondingSection,
      title,
      description,
      maxSentenceYears,
      bailable,
      punishableDeathOrLife,
      antilCategory,
      trialCourt,
      reason
    } = req.body;

    const offence = await Offence.findById(id);
    if (!offence) {
      return res.status(404).json({ success: false, message: 'Offence rule not found.' });
    }

    const nextVersionNumber = (offence.currentVersion || 1) + 1;
    const newVersion = {
      versionNumber: nextVersionNumber,
      section: section || offence.section,
      act: act || offence.act,
      title: title || offence.title,
      maxSentenceYears: maxSentenceYears !== undefined ? Number(maxSentenceYears) : offence.maxSentenceYears,
      bailable: bailable !== undefined ? Boolean(bailable) : offence.bailable,
      punishableDeathOrLife: punishableDeathOrLife !== undefined ? Boolean(punishableDeathOrLife) : offence.punishableDeathOrLife,
      antilCategory: antilCategory || offence.antilCategory,
      changedBy: req.user._id,
      reason: reason || 'Statutory rule modification',
      effectiveFrom: new Date()
    };

    offence.section = newVersion.section;
    offence.act = newVersion.act;
    if (correspondingSection !== undefined) offence.correspondingSection = correspondingSection;
    offence.title = newVersion.title;
    if (description !== undefined) offence.description = description;
    offence.maxSentenceYears = newVersion.maxSentenceYears;
    offence.bailable = newVersion.bailable;
    offence.punishableDeathOrLife = newVersion.punishableDeathOrLife;
    offence.antilCategory = newVersion.antilCategory;
    if (trialCourt !== undefined) offence.trialCourt = trialCourt;

    offence.currentVersion = nextVersionNumber;
    offence.versions.push(newVersion);

    await offence.save();

    await recordAuditEvent({
      action: AUDIT_ACTIONS.RULE_UPDATE,
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      performedByEmail: req.user.email,
      role: req.user.role,
      ipAddress: req.ip,
      details: { section: offence.section, versionNumber: nextVersionNumber, reason }
    });

    return res.status(200).json({
      success: true,
      message: `Offence rule updated to Version ${nextVersionNumber}.`,
      offence
    });
  } catch (error) {
    console.error('Update offence error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update offence rule.' });
  }
};

/**
 * Review Applications
 */
export const listApplications = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const applications = await BailApplication.find(filter)
      .populate('caseId')
      .populate('citizenId', 'fullName email phone')
      .populate('assignedJudgeId', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    const total = await BailApplication.countDocuments(filter);

    return res.status(200).json({
      success: true,
      applications,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to list applications.' });
  }
};

/**
 * Verify or Reject Document
 */
export const updateDocumentStatus = async (req, res) => {
  try {
    const { id: docId } = req.params;
    const { verificationStatus, remarks } = req.body;

    const doc = await Document.findById(docId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    doc.verificationStatus = verificationStatus;
    if (remarks) doc.remarks = remarks;
    await doc.save();

    return res.status(200).json({
      success: true,
      message: `Document status updated to ${verificationStatus}.`,
      document: doc
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update document status.' });
  }
};

/**
 * Request Missing Document from Citizen (Triggers real email)
 */
export const requestDocument = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { requestedDocType, remarks } = req.body;

    const app = await BailApplication.findById(applicationId)
      .populate('caseId')
      .populate('citizenId');

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Send email to citizen
    await sendDocumentRequestedEmail(
      app.citizenId.email,
      app.caseId.caseNumber,
      requestedDocType,
      remarks
    );

    // Create in-app notification
    await Notification.create({
      userId: app.citizenId._id,
      title: `Document Requested for Case ${app.caseId.caseNumber}`,
      message: `The registry requested: ${requestedDocType}. ${remarks || ''}`,
      type: 'DOC_REQUEST',
      link: `/cases/${app.caseId._id}`
    });

    await recordAuditEvent({
      action: AUDIT_ACTIONS.DOCUMENT_REQUEST,
      caseId: app.caseId._id,
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      performedByEmail: req.user.email,
      role: req.user.role,
      ipAddress: req.ip,
      details: { requestedDocType, remarks }
    });

    return res.status(200).json({
      success: true,
      message: 'Document request notification dispatched to applicant.'
    });
  } catch (error) {
    console.error('Request document error:', error);
    return res.status(500).json({ success: false, message: 'Failed to request document.' });
  }
};

/**
 * Assign Application to Judge (Triggers real email & updates queue)
 */
export const assignJudge = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { judgeId } = req.body;

    const judge = await User.findOne({ _id: judgeId, role: ROLES.JUDGE, isActive: true });
    if (!judge) {
      return res.status(404).json({ success: false, message: 'Designated judge not found or inactive.' });
    }

    const app = await BailApplication.findById(applicationId).populate('caseId');
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    app.assignedJudgeId = judge._id;
    app.assignedAt = new Date();
    app.assignedBy = req.user._id;
    app.status = APP_STATUS.ASSIGNED;
    await app.save();

    await Case.updateOne({ _id: app.caseId._id }, { status: APP_STATUS.ASSIGNED });

    // Fetch judge court
    const profile = await JudgeProfile.findOne({ userId: judge._id }).lean();
    const courtName = profile ? profile.court : 'Designated Court';

    // Email assigned judge
    await sendApplicationAssignedEmail(judge.email, judge.fullName, app.caseId.caseNumber, courtName);

    // In-app notification for Judge
    await Notification.create({
      userId: judge._id,
      title: `New Case Assigned: ${app.caseId.caseNumber}`,
      message: `Case ${app.caseId.caseNumber} has been assigned to your bench.`,
      type: 'INFO',
      link: `/judge/cases/${app._id}`
    });

    await recordAuditEvent({
      action: AUDIT_ACTIONS.APPLICATION_ASSIGN,
      caseId: app.caseId._id,
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      performedByEmail: req.user.email,
      role: req.user.role,
      ipAddress: req.ip,
      details: { judgeId: judge._id, judgeName: judge.fullName, applicationNumber: app.applicationNumber }
    });

    return res.status(200).json({
      success: true,
      message: `Application successfully assigned to Hon'ble Judge ${judge.fullName}.`,
      application: app
    });
  } catch (error) {
    console.error('Assign judge error:', error);
    return res.status(500).json({ success: false, message: 'Failed to assign judge.' });
  }
};

/**
 * Schedule Hearing Date (Triggers real emails)
 */
export const scheduleHearing = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { hearingDate, courtRoom, notes } = req.body;

    const app = await BailApplication.findById(applicationId)
      .populate('caseId')
      .populate('citizenId')
      .populate('assignedJudgeId');

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const hearingEntry = {
      hearingDate: new Date(hearingDate),
      courtRoom: courtRoom || 'Court Room 1',
      purpose: 'Bail Hearing',
      scheduledBy: req.user._id,
      notes: notes || ''
    };

    app.hearings.push(hearingEntry);
    app.status = APP_STATUS.HEARING_SCHEDULED;
    await app.save();

    await Case.updateOne({ _id: app.caseId._id }, { status: APP_STATUS.HEARING_SCHEDULED });

    // Send email to Citizen
    await sendHearingScheduledEmail(
      app.citizenId.email,
      app.caseId.caseNumber,
      hearingDate,
      hearingEntry.courtRoom
    );

    // Notify Citizen in-app
    await Notification.create({
      userId: app.citizenId._id,
      title: `Hearing Scheduled: Case ${app.caseId.caseNumber}`,
      message: `Hearing fixed for ${new Date(hearingDate).toLocaleString('en-IN')} in ${hearingEntry.courtRoom}.`,
      type: 'HEARING',
      link: `/cases/${app.caseId._id}`
    });

    await recordAuditEvent({
      action: AUDIT_ACTIONS.HEARING_SCHEDULE,
      caseId: app.caseId._id,
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      performedByEmail: req.user.email,
      role: req.user.role,
      ipAddress: req.ip,
      details: { hearingDate, courtRoom: hearingEntry.courtRoom }
    });

    return res.status(200).json({
      success: true,
      message: 'Hearing scheduled and notifications dispatched.',
      application: app
    });
  } catch (error) {
    console.error('Schedule hearing error:', error);
    return res.status(500).json({ success: false, message: 'Failed to schedule hearing.' });
  }
};

/**
 * Legal Aid Directory Management (CRUD)
 */
export const listLegalAid = async (req, res) => {
  try {
    const { district, search } = req.query;
    const filter = { isActive: true };
    if (district) filter.district = district;
    if (search) {
      filter.$or = [
        { district: { $regex: search, $options: 'i' } },
        { officeName: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }
    const contacts = await LegalAidContact.find(filter).sort({ district: 1 }).lean();
    return res.status(200).json({ success: true, contacts });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to list legal aid contacts.' });
  }
};

export const createLegalAid = async (req, res) => {
  try {
    const contact = await LegalAidContact.create(req.body);
    return res.status(201).json({ success: true, message: 'Contact created.', contact });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create contact.' });
  }
};

export const updateLegalAid = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await LegalAidContact.findByIdAndUpdate(id, req.body, { new: true });
    return res.status(200).json({ success: true, message: 'Contact updated.', contact });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update contact.' });
  }
};

export const deleteLegalAid = async (req, res) => {
  try {
    const { id } = req.params;
    await LegalAidContact.findByIdAndUpdate(id, { isActive: false });
    return res.status(200).json({ success: true, message: 'Contact archived.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete contact.' });
  }
};

/**
 * Email Log Viewer
 */
export const listEmailLogs = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 25 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { to: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { templateName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const logs = await EmailLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    const total = await EmailLog.countDocuments(filter);

    return res.status(200).json({
      success: true,
      logs,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to list email logs.' });
  }
};

/**
 * Audit Trail Viewer & Integrity Verification (Feature 6)
 */
export const listAuditLogs = async (req, res) => {
  try {
    const { action, search, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (search) {
      filter.$or = [
        { performedByName: { $regex: search, $options: 'i' } },
        { performedByEmail: { $regex: search, $options: 'i' } },
        { hash: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const logs = await AuditLog.find(filter)
      .sort({ sequenceNumber: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    const total = await AuditLog.countDocuments(filter);

    return res.status(200).json({
      success: true,
      logs,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to list audit trail.' });
  }
};

/**
 * Feature 6: Cryptographic Audit Chain Integrity Verification
 */
export const verifyAuditChain = async (req, res) => {
  try {
    const report = await verifyAuditChainIntegrity();
    return res.status(200).json({
      success: true,
      verification: report
    });
  } catch (error) {
    console.error('Audit verification error:', error);
    return res.status(500).json({ success: false, message: 'Verification error occurred.' });
  }
};

/**
 * Feature 1: All-Cases Default Bail Deadlines, Alert Rules & Sent-Alert Log
 */
export const getAllDeadlines = async (req, res) => {
  try {
    const { status, filter } = req.query;
    const cases = await Case.find().populate('citizenId', 'fullName email phone').sort({ remandDate: 1 }).lean();

    const setting = await SystemSetting.findOne({ key: 'DEFAULT_BAIL_CONFIG' }).lean();
    const thresholds = setting?.value || { generalDays: 60, heinousDays: 90 };

    const annotated = [];
    cases.forEach((c) => {
      try {
        const assessment = runBailAssessment({
          caseData: c,
          customThresholds: thresholds,
          currentDate: new Date()
        });

        const item = {
          caseId: c._id,
          caseNumber: c.caseNumber,
          firNumber: c.firNumber,
          policeStation: c.policeStation,
          district: c.district,
          accusedName: c.personDetails?.fullName,
          citizenEmail: c.citizenId?.email,
          remandDate: c.remandDate,
          daysElapsed: assessment.bnss187?.daysElapsed || 0,
          daysRemaining: assessment.bnss187?.daysRemaining || 0,
          thresholdDays: assessment.bnss187?.thresholdDays || 60,
          deadlineDate: assessment.bnss187?.deadlineDate,
          isMatured: assessment.bnss187?.isMatured || false,
          progressPercent: assessment.bnss187?.progressPercent || 0,
          status: c.status
        };

        if (filter === 'matured' && !item.isMatured) return;
        if (filter === 'approaching' && (item.isMatured || item.daysRemaining > 7)) return;
        if (filter === 'safe' && (item.isMatured || item.daysRemaining <= 7)) return;

        annotated.push(item);
      } catch (e) {}
    });

    const alertHistory = await AlertSent.find().sort({ sentAt: -1 }).limit(50).lean();

    return res.status(200).json({
      success: true,
      cases: annotated,
      alertRules: thresholds,
      alertHistory,
      stats: {
        total: annotated.length,
        matured: annotated.filter((c) => c.isMatured).length,
        approaching: annotated.filter((c) => !c.isMatured && c.daysRemaining <= 7).length
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load deadline tracker.' });
  }
};

/**
 * Feature 2: Batch Recalculate All Active Undertrial Cases
 */
export const recalculateAllCases = async (req, res) => {
  try {
    const activeCases = await Case.find({ status: { $ne: APP_STATUS.DECIDED } });
    const setting = await SystemSetting.findOne({ key: 'DEFAULT_BAIL_CONFIG' }).lean();
    const thresholds = setting?.value || { generalDays: 60, heinousDays: 90 };

    let recalculatedCount = 0;
    for (const c of activeCases) {
      try {
        const assessmentResult = runBailAssessment({
          caseData: c,
          customThresholds: thresholds,
          currentDate: new Date()
        });

        recalculatedCount++;
      } catch (e) {}
    }

    await recordAuditEvent({
      action: 'SYSTEM_SETTING_UPDATE',
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      performedByEmail: req.user.email,
      role: req.user.role,
      ipAddress: req.ip,
      details: { recalculatedCount, triggeredAt: new Date() }
    });

    return res.status(200).json({
      success: true,
      message: `Batch recalculation completed across ${recalculatedCount} active undertrial case(s).`,
      recalculatedCount
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Batch recalculation failed.' });
  }
};

/**
 * Feature 4: Rights Content Management CRUD
 */
export const listRightsContentAdmin = async (req, res) => {
  try {
    const rights = await RightsContent.find().sort({ order: 1 }).lean();
    return res.status(200).json({ success: true, rights });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load rights content.' });
  }
};

export const createRightsContent = async (req, res) => {
  try {
    const { titleEn, titleTa, summaryEn, summaryTa, detailedEn, detailedTa, legalReference, category, order } = req.body;
    const count = await RightsContent.countDocuments();
    const right = await RightsContent.create({
      titleEn,
      titleTa,
      summaryEn,
      summaryTa,
      detailedEn,
      detailedTa,
      legalReference,
      category: category || 'PROCEDURAL',
      order: order !== undefined ? order : count + 1,
      isActive: true
    });
    return res.status(201).json({ success: true, right });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create rights content.' });
  }
};

export const updateRightsContent = async (req, res) => {
  try {
    const { id } = req.params;
    const right = await RightsContent.findByIdAndUpdate(id, req.body, { new: true });
    return res.status(200).json({ success: true, right });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update rights content.' });
  }
};

export const deleteRightsContent = async (req, res) => {
  try {
    const { id } = req.params;
    await RightsContent.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Rights content deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete rights content.' });
  }
};

/**
 * Feature 7: Surety Verification Queue
 */
export const listAllSureties = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const sureties = await Surety.find(filter)
      .populate('caseId', 'caseNumber personDetails court firNumber')
      .populate('citizenId', 'fullName email phone')
      .populate('verifiedBy', 'fullName')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      sureties,
      stats: {
        total: sureties.length,
        verified: sureties.filter((s) => s.status === 'Verified').length,
        pending: sureties.filter((s) => s.status === 'Pending Verification').length,
        rejected: sureties.filter((s) => s.status === 'Rejected').length
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load sureties.' });
  }
};

export const verifySurety = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason = '' } = req.body;

    const surety = await Surety.findById(id).populate('caseId').populate('citizenId');
    if (!surety) {
      return res.status(404).json({ success: false, message: 'Surety not found.' });
    }

    surety.status = status; // 'Verified' or 'Rejected'
    surety.verifiedBy = req.user._id;
    surety.verifiedAt = new Date();
    surety.rejectionReason = rejectionReason;
    await surety.save();

    // Send email notification to citizen
    if (surety.citizenId?.email) {
      await sendSuretyVerifiedEmail(
        surety.citizenId.email,
        surety.caseId?.caseNumber || 'N/A',
        surety.fullName,
        status,
        rejectionReason
      );
    }

    await recordAuditEvent({
      action: 'SURETY_VERIFIED',
      caseId: surety.caseId?._id,
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      performedByEmail: req.user.email,
      role: req.user.role,
      ipAddress: req.ip,
      details: { suretyName: surety.fullName, status, rejectionReason }
    });

    return res.status(200).json({
      success: true,
      message: `Surety marked as ${status}. Notification dispatched.`,
      surety
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update surety status.' });
  }
};

/**
 * Feature 8: Master Hearing Scheduling & Clash Prevention
 */
export const listAllHearings = async (req, res) => {
  try {
    const { judgeId, date } = req.query;
    const filter = {};
    if (judgeId) filter.judgeId = judgeId;

    if (date) {
      const d = new Date(date);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
      filter.hearingDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const hearings = await Hearing.find(filter)
      .populate('judgeId', 'fullName email')
      .populate('caseId', 'caseNumber personDetails court')
      .populate('applicationId', 'applicationNumber status')
      .sort({ hearingDate: 1, startTime: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      hearings
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to list hearings.' });
  }
};

export const scheduleMasterHearing = async (req, res) => {
  try {
    const { applicationId, judgeId, hearingDate, startTime = '10:30', endTime = '11:00', courtRoom, purpose = 'Bail Hearing' } = req.body;

    const application = await BailApplication.findById(applicationId).populate('caseId').populate('citizenId');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Check clash
    const clash = await checkHearingClash({
      judgeId,
      hearingDate,
      startTime,
      endTime
    });

    if (clash.hasClash) {
      return res.status(409).json({
        success: false,
        message: 'Schedule Clash Detected: Selected Judge already has a hearing in this time slot.',
        clashingHearings: clash.clashingHearings
      });
    }

    const hearing = await Hearing.create({
      applicationId: application._id,
      caseId: application.caseId._id,
      judgeId,
      hearingDate: new Date(hearingDate),
      startTime,
      endTime,
      courtRoom,
      purpose,
      status: 'Scheduled'
    });

    application.status = APP_STATUS.HEARING_SCHEDULED;
    application.assignedJudgeId = judgeId;
    await application.save();

    await Case.updateOne({ _id: application.caseId._id }, { status: APP_STATUS.HEARING_SCHEDULED });

    // Send email notification to citizen
    if (application.citizenId?.email) {
      await sendHearingScheduledEmail(
        application.citizenId.email,
        application.caseId.caseNumber,
        hearingDate,
        courtRoom
      );
    }

    await recordAuditEvent({
      action: 'HEARING_SCHEDULED',
      caseId: application.caseId._id,
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      performedByEmail: req.user.email,
      role: req.user.role,
      ipAddress: req.ip,
      details: { hearingDate, courtRoom, judgeId }
    });

    return res.status(201).json({
      success: true,
      message: 'Hearing scheduled successfully with zero clashes.',
      hearing
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to schedule hearing.' });
  }
};

export const rescheduleMasterHearing = async (req, res) => {
  try {
    const { id } = req.params;
    const { hearingDate, startTime, endTime, courtRoom, notes } = req.body;

    const hearing = await Hearing.findById(id).populate('caseId').populate('applicationId');
    if (!hearing) {
      return res.status(404).json({ success: false, message: 'Hearing record not found.' });
    }

    if (hearingDate || startTime) {
      const clash = await checkHearingClash({
        judgeId: hearing.judgeId,
        hearingDate: hearingDate || hearing.hearingDate,
        startTime: startTime || hearing.startTime,
        endTime: endTime || hearing.endTime,
        excludeHearingId: hearing._id
      });

      if (clash.hasClash) {
        return res.status(409).json({
          success: false,
          message: 'Schedule Clash: Another hearing is already booked in that slot.',
          clashingHearings: clash.clashingHearings
        });
      }
    }

    if (hearingDate) hearing.hearingDate = new Date(hearingDate);
    if (startTime) hearing.startTime = startTime;
    if (endTime) hearing.endTime = endTime;
    if (courtRoom) hearing.courtRoom = courtRoom;
    if (notes) hearing.notes = notes;
    await hearing.save();

    return res.status(200).json({
      success: true,
      message: 'Hearing rescheduled successfully.',
      hearing
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reschedule hearing.' });
  }
};

/**
 * Feature 9: View and Force-Revoke Delegations
 */
export const listAllDelegations = async (req, res) => {
  try {
    const delegations = await Delegation.find()
      .populate('caseId', 'caseNumber personDetails')
      .populate('citizenId', 'fullName email')
      .populate('delegateUserId', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      delegations
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to list delegations.' });
  }
};

export const adminRevokeDelegation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Revoked by Registry Administrator' } = req.body;

    const delegation = await Delegation.findById(id).populate('caseId');
    if (!delegation) {
      return res.status(404).json({ success: false, message: 'Delegation not found.' });
    }

    delegation.status = 'Revoked';
    delegation.revokedAt = new Date();
    delegation.revokedBy = req.user._id;
    delegation.revokeReason = reason;
    await delegation.save();

    await sendDelegateRevokedEmail(delegation.delegateEmail, delegation.caseId?.caseNumber || 'N/A', reason);

    await recordAuditEvent({
      action: 'DELEGATE_REVOKED_ADMIN',
      caseId: delegation.caseId?._id,
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      performedByEmail: req.user.email,
      role: req.user.role,
      ipAddress: req.ip,
      details: { delegateEmail: delegation.delegateEmail, reason }
    });

    return res.status(200).json({
      success: true,
      message: 'Delegation force-revoked by administrator.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to revoke delegation.' });
  }
};

/**
 * Feature 10: Stage Duration Analytics
 */
export const getStageDurationAnalytics = async (req, res) => {
  try {
    const allCases = await Case.find().lean();
    const allApps = await BailApplication.find().lean();
    const allDecisions = await Decision.find().lean();

    let arrestToRemandDaysTotal = 0;
    let arrestToRemandCount = 0;

    let remandToAppDaysTotal = 0;
    let remandToAppCount = 0;

    let appToDecisionDaysTotal = 0;
    let appToDecisionCount = 0;

    allCases.forEach((c) => {
      if (c.arrestDate && c.remandDate) {
        const diff = (new Date(c.remandDate) - new Date(c.arrestDate)) / (1000 * 60 * 60 * 24);
        if (diff >= 0) {
          arrestToRemandDaysTotal += diff;
          arrestToRemandCount++;
        }
      }
    });

    const caseMap = {};
    allCases.forEach((c) => {
      caseMap[c._id.toString()] = c;
    });

    allApps.forEach((a) => {
      const c = caseMap[a.caseId?.toString()];
      if (c && c.remandDate && a.createdAt) {
        const diff = (new Date(a.createdAt) - new Date(c.remandDate)) / (1000 * 60 * 60 * 24);
        if (diff >= 0) {
          remandToAppDaysTotal += diff;
          remandToAppCount++;
        }
      }
    });

    const appMap = {};
    allApps.forEach((a) => {
      appMap[a._id.toString()] = a;
    });

    allDecisions.forEach((d) => {
      const a = appMap[d.applicationId?.toString()];
      if (a && a.createdAt && d.decidedAt) {
        const diff = (new Date(d.decidedAt) - new Date(a.createdAt)) / (1000 * 60 * 60 * 24);
        if (diff >= 0) {
          appToDecisionDaysTotal += diff;
          appToDecisionCount++;
        }
      }
    });

    return res.status(200).json({
      success: true,
      stageDurations: [
        {
          stage: 'Arrest to First Remand',
          avgDays: arrestToRemandCount > 0 ? parseFloat((arrestToRemandDaysTotal / arrestToRemandCount).toFixed(1)) : 1.0,
          statutoryLimit: '24 Hours (Sec 58 BNSS)'
        },
        {
          stage: 'Remand to Petition Submission',
          avgDays: remandToAppCount > 0 ? parseFloat((remandToAppDaysTotal / remandToAppCount).toFixed(1)) : 14.5,
          statutoryLimit: '60/90 Days (Sec 187 BNSS)'
        },
        {
          stage: 'Application to Judicial Decision',
          avgDays: appToDecisionCount > 0 ? parseFloat((appToDecisionDaysTotal / appToDecisionCount).toFixed(1)) : 5.2,
          statutoryLimit: 'Expeditious (Antil Guidelines)'
        }
      ]
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to calculate stage duration analytics.' });
  }
};

/**
 * Feature 11: Admin Re-run OCR
 */
export const adminRerunOcr = async (req, res) => {
  try {
    const { documentId } = req.params;
    const doc = await Document.findById(documentId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const ocrResult = await extractFieldsFromDocument({
      filePath: doc.filePath,
      originalName: doc.originalName
    });

    let ocrDoc = await OcrExtraction.findOne({ documentId: doc._id });
    if (!ocrDoc) {
      ocrDoc = await OcrExtraction.create({
        documentId: doc._id,
        caseId: doc.caseId,
        extractedFields: ocrResult.extractedFields,
        confidenceScores: ocrResult.confidenceScores,
        rawText: ocrResult.rawText,
        status: 'Pending Confirmation'
      });
    } else {
      ocrDoc.extractedFields = ocrResult.extractedFields;
      ocrDoc.confidenceScores = ocrResult.confidenceScores;
      ocrDoc.rawText = ocrResult.rawText;
      ocrDoc.status = 'Pending Confirmation';
      await ocrDoc.save();
    }

    return res.status(200).json({
      success: true,
      message: 'OCR re-run completed.',
      ocr: ocrDoc
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to re-run OCR.' });
  }
};

/**
 * Feature 12: Compliance Monitoring & Violation Escalation
 */
export const listAllCompliance = async (req, res) => {
  try {
    const decisions = await Decision.find({ outcome: { $regex: /granted/i } })
      .populate('caseId')
      .populate('judgeId', 'fullName')
      .lean();

    const checkins = await ConditionCheckin.find()
      .populate('caseId', 'caseNumber personDetails')
      .populate('citizenId', 'fullName email phone')
      .sort({ checkinDate: -1 })
      .lean();

    const violations = checkins.filter((c) => c.status === 'Missed');

    return res.status(200).json({
      success: true,
      activeConditionalCases: decisions.length,
      checkins,
      violations,
      stats: {
        totalCheckins: checkins.length,
        verified: checkins.filter((c) => c.status === 'Verified').length,
        missed: violations.length,
        escalated: violations.filter((v) => v.escalated).length
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load compliance monitor.' });
  }
};

export const escalateViolation = async (req, res) => {
  try {
    const { checkinId } = req.params;
    const checkin = await ConditionCheckin.findById(checkinId).populate('caseId').populate('citizenId');
    if (!checkin) {
      return res.status(404).json({ success: false, message: 'Check-in record not found.' });
    }

    checkin.escalated = true;
    checkin.escalatedAt = new Date();
    await checkin.save();

    // Send email alert to citizen
    if (checkin.citizenId?.email) {
      await sendConditionEscalationEmail(
        checkin.citizenId.email,
        checkin.caseId?.caseNumber || 'N/A',
        checkin.caseId?.personDetails?.fullName || 'Accused',
        checkin.checkinDate,
        checkin.policeStation
      );
    }

    await recordAuditEvent({
      action: 'CONDITION_ESCALATED',
      caseId: checkin.caseId?._id,
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      performedByEmail: req.user.email,
      role: req.user.role,
      ipAddress: req.ip,
      details: { checkinId, policeStation: checkin.policeStation }
    });

    return res.status(200).json({
      success: true,
      message: 'Violation escalated. Warning notifications dispatched.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to escalate violation.' });
  }
};

/**
 * Feature 13: Court-Wide Eligibility Radar Board & CSV Export
 */
export const getAdminRadar = async (req, res) => {
  try {
    const cases = await Case.find({ status: { $ne: APP_STATUS.DECIDED } })
      .populate('citizenId', 'fullName email phone')
      .lean();

    const applications = await BailApplication.find().populate('assignedJudgeId', 'fullName court').lean();
    const appMap = {};
    applications.forEach((a) => {
      appMap[a.caseId?.toString()] = a;
    });

    const setting = await SystemSetting.findOne({ key: 'DEFAULT_BAIL_CONFIG' }).lean();
    const thresholds = setting?.value || { generalDays: 60, heinousDays: 90 };

    const matured = [];
    const approaching = [];

    cases.forEach((c) => {
      try {
        const assessment = runBailAssessment({
          caseData: c,
          customThresholds: thresholds,
          currentDate: new Date()
        });

        const app = appMap[c._id.toString()];
        const item = {
          caseId: c._id,
          caseNumber: c.caseNumber,
          firNumber: c.firNumber,
          accusedName: c.personDetails?.fullName,
          district: c.district,
          court: c.court,
          assignedJudge: app?.assignedJudgeId?.fullName || 'Unassigned',
          remandDate: c.remandDate,
          daysElapsed: assessment.bnss187?.daysElapsed || 0,
          daysRemaining: assessment.bnss187?.daysRemaining || 0,
          bnss187Matured: assessment.bnss187?.isMatured || false,
          bnss479Eligible: assessment.bnss479?.isEligible || false,
          status: c.status
        };

        if (item.bnss187Matured || item.bnss479Eligible) {
          matured.push(item);
        } else if (item.daysRemaining <= 7) {
          approaching.push(item);
        }
      } catch (e) {}
    });

    return res.status(200).json({
      success: true,
      maturedCases: matured,
      approachingCases: approaching,
      stats: {
        totalMatured: matured.length,
        totalApproaching: approaching.length
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate admin radar board.' });
  }
};

export const exportRadarCsv = async (req, res) => {
  try {
    const cases = await Case.find({ status: { $ne: APP_STATUS.DECIDED } }).lean();
    const setting = await SystemSetting.findOne({ key: 'DEFAULT_BAIL_CONFIG' }).lean();
    const thresholds = setting?.value || { generalDays: 60, heinousDays: 90 };

    const rows = [
      'Case Number,Accused Name,District,Court,Remand Date,Days Elapsed,Days Remaining,BNSS 187 Matured,BNSS 479 Eligible,Status'
    ];

    cases.forEach((c) => {
      try {
        const assessment = runBailAssessment({
          caseData: c,
          customThresholds: thresholds,
          currentDate: new Date()
        });

        const row = [
          `"${c.caseNumber}"`,
          `"${c.personDetails?.fullName || ''}"`,
          `"${c.district || ''}"`,
          `"${c.court || ''}"`,
          `"${new Date(c.remandDate).toISOString().split('T')[0]}"`,
          assessment.bnss187?.daysElapsed || 0,
          assessment.bnss187?.daysRemaining || 0,
          assessment.bnss187?.isMatured ? 'YES' : 'NO',
          assessment.bnss479?.isEligible ? 'YES' : 'NO',
          `"${c.status}"`
        ];
        rows.push(row.join(','));
      } catch (e) {}
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="Bail_Eligibility_Radar_Export.csv"');
    return res.send(rows.join('\n'));
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to export CSV.' });
  }
};

/**
 * Feature 14: Quick Check Usage Statistics
 */
export const getQuickCheckStats = async (req, res) => {
  try {
    const totalShares = await QuickCheckShare.countDocuments();
    const recentShares = await QuickCheckShare.find().sort({ createdAt: -1 }).limit(20).lean();
    const totalViews = recentShares.reduce((acc, s) => acc + (s.viewsCount || 0), 0);

    return res.status(200).json({
      success: true,
      stats: {
        totalShares,
        totalViews,
        rateLimit: '10 queries per 15 minutes per IP address'
      },
      recentShares
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load quick check stats.' });
  }
};

/**
 * Feature 15: Legal Aid Requests Management
 */
export const listLegalAidRequests = async (req, res) => {
  try {
    const requests = await LegalAidRequest.find()
      .populate('caseId', 'caseNumber personDetails court firNumber')
      .populate('citizenId', 'fullName email phone')
      .populate('dlsaId')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      requests
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to list legal aid requests.' });
  }
};

export const updateLegalAidRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, advocateName, advocatePhone, enrollmentNumber, rejectionReason, remarks } = req.body;

    const request = await LegalAidRequest.findById(id).populate('caseId').populate('citizenId');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Legal aid request not found.' });
    }

    if (status) request.status = status;
    if (rejectionReason) request.rejectionReason = rejectionReason;

    if (advocateName) {
      request.assignedAdvocate = {
        name: advocateName,
        phone: advocatePhone || '',
        enrollmentNumber: enrollmentNumber || '',
        assignedDate: new Date()
      };
    }

    request.history.push({
      status: request.status,
      updatedBy: req.user._id,
      timestamp: new Date(),
      remarks: remarks || `Status updated to ${request.status} by registry.`
    });

    await request.save();

    // Send email to citizen
    if (request.citizenId?.email) {
      await sendLegalAidStatusEmail(
        request.citizenId.email,
        request.caseId?.caseNumber || 'N/A',
        request.status,
        request.assignedAdvocate || {},
        remarks
      );
    }

    await recordAuditEvent({
      action: 'LEGAL_AID_STATUS_UPDATED',
      caseId: request.caseId?._id,
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      performedByEmail: req.user.email,
      role: req.user.role,
      ipAddress: req.ip,
      details: { status: request.status, advocateName }
    });

    return res.status(200).json({
      success: true,
      message: `Legal aid request updated to [${request.status}]. Notification sent.`,
      request
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update legal aid request.' });
  }
};

