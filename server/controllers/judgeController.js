import BailApplication from '../models/BailApplication.js';
import Case from '../models/Case.js';
import Document from '../models/Document.js';
import Decision from '../models/Decision.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import SystemSetting from '../models/SystemSetting.js';
import Surety from '../models/Surety.js';
import Hearing from '../models/Hearing.js';
import Delegation from '../models/Delegation.js';
import LegalAidRequest from '../models/LegalAidRequest.js';
import ConditionCheckin from '../models/ConditionCheckin.js';
import AuditLog from '../models/AuditLog.js';
import { APP_STATUS, DECISION_OUTCOMES, AUDIT_ACTIONS, ROLES } from '../config/constants.js';
import { runBailAssessment } from '../services/calculators/ruleEngine.js';
import { sendJudgeDecisionEmail } from '../services/emailService.js';
import { recordAuditEvent } from '../services/auditService.js';
import { checkHearingClash } from '../services/calendarService.js';

/**
 * Judge Queue: Fetch only applications assigned to this judge
 */
export const getJudgeQueue = async (req, res) => {
  try {
    const judgeId = req.user._id;
    const { status, priorityDeadline, page = 1, limit = 20 } = req.query;

    const filter = { assignedJudgeId: judgeId };
    if (status) {
      filter.status = status;
    }

    const applications = await BailApplication.find(filter)
      .populate('caseId')
      .populate('citizenId', 'fullName email phone')
      .sort({ createdAt: -1 })
      .lean();

    const setting = await SystemSetting.findOne({ key: 'DEFAULT_BAIL_CONFIG' }).lean();
    const thresholds = setting?.value || { generalDays: 60, heinousDays: 90 };

    // Annotate with live statutory assessment for decision support and priority sorting
    const annotated = applications.map((app) => {
      let liveAssessment = null;
      if (app.caseId) {
        try {
          liveAssessment = runBailAssessment({
            caseData: app.caseId,
            customThresholds: thresholds,
            currentDate: new Date()
          });
        } catch (e) {}
      }

      const defaultBailDaysRemaining = liveAssessment?.bnss187?.daysRemaining ?? 999;
      const isMatured = liveAssessment?.bnss187?.isMatured ?? false;

      return {
        ...app,
        liveAssessment,
        defaultBailDaysRemaining,
        isMatured
      };
    });

    // Sort by priority deadline if requested (matured first, then nearest deadline)
    if (priorityDeadline === 'true') {
      annotated.sort((a, b) => {
        if (a.isMatured && !b.isMatured) return -1;
        if (!a.isMatured && b.isMatured) return 1;
        return a.defaultBailDaysRemaining - b.defaultBailDaysRemaining;
      });
    }

    return res.status(200).json({
      success: true,
      queue: annotated,
      total: annotated.length
    });
  } catch (error) {
    console.error('Judge queue error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load judicial queue.' });
  }
};

/**
 * Judge Case File View with Decision Support Panel (Feature 5, 7, 9, 11, 15)
 */
export const getJudgeCaseFile = async (req, res) => {
  try {
    const judgeId = req.user._id;
    const { id } = req.params;

    // Must be assigned to this judge
    let application = await BailApplication.findOne({ _id: id, assignedJudgeId: judgeId })
      .populate('caseId')
      .populate('citizenId', 'fullName email phone')
      .lean();

    if (!application) {
      application = await BailApplication.findOne({ caseId: id, assignedJudgeId: judgeId })
        .populate('caseId')
        .populate('citizenId', 'fullName email phone')
        .lean();
    }

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Case file not found or not assigned to your judicial bench.'
      });
    }

    const caseId = application.caseId._id;
    const documents = await Document.find({ caseId }).lean();
    const existingDecision = await Decision.findOne({ applicationId: application._id }).lean();
    const sureties = await Surety.find({ caseId }).sort({ createdAt: -1 }).lean();
    const delegates = await Delegation.find({ caseId, status: 'Active' }).lean();
    const legalAid = await LegalAidRequest.findOne({ caseId }).populate('dlsaId').lean();
    const auditLogs = await AuditLog.find({ caseId }).sort({ sequenceNumber: 1 }).lean();
    const compliance = await ConditionCheckin.find({ caseId }).sort({ checkinDate: -1 }).lean();

    const setting = await SystemSetting.findOne({ key: 'DEFAULT_BAIL_CONFIG' }).lean();
    const thresholds = setting?.value || { generalDays: 60, heinousDays: 90 };

    const assessment = runBailAssessment({
      caseData: application.caseId,
      customThresholds: thresholds,
      currentDate: new Date()
    });

    // Feature 5: Structured Decision Support Summary (explainable & advisory)
    const decisionSupport = {
      isAdvisoryOnly: true,
      caseNumber: application.caseId.caseNumber,
      accusedName: application.caseId.personDetails?.fullName,
      priorConvictions: Boolean(application.caseId.priorConviction),
      otherPendingCases: Boolean(application.caseId.otherPendingCases),
      statutoryTriggers: [
        {
          trigger: 'Section 187 BNSS (Default Bail)',
          isMet: assessment.bnss187?.isMatured,
          statusText: assessment.bnss187?.isMatured
            ? 'Right Matured (Investigation statutory limit elapsed without chargesheet)'
            : `${assessment.bnss187?.daysRemaining} days remaining until deadline (${new Date(assessment.bnss187?.deadlineDate).toLocaleDateString('en-IN')})`,
          ruleSource: 'BNSS 2023 Sec 187(3)',
          version: 1
        },
        {
          trigger: 'Section 479 BNSS (Undertrial Detention Threshold)',
          isMet: assessment.bnss479?.isEligible,
          statusText: assessment.bnss479?.excludedDeathOrLife
            ? 'Excluded: Offence carries death or life imprisonment'
            : assessment.bnss479?.multipleCasesFlagged
            ? 'Restriction: Accused has other pending cases (Judicial review required)'
            : assessment.bnss479?.isEligible
            ? `Eligible: ${assessment.bnss479?.daysServed} days served out of ${assessment.bnss479?.thresholdDays} required`
            : `${assessment.bnss479?.daysServed} days served out of ${assessment.bnss479?.thresholdDays} required`,
          ruleSource: assessment.bnss479?.citation || 'BNSS 2023 Sec 479',
          version: 1
        },
        {
          trigger: 'Bailable Offence Status',
          isMet: assessment.isBailableAll,
          statusText: assessment.isBailableAll
            ? 'All offences charged are classified as bailable (Bail is mandatory under Sec 478 BNSS)'
            : 'Contains non-bailable offence(s) (Court discretion applies under Sec 480 BNSS)',
          ruleSource: 'BNSS 2023 Sec 478',
          version: 1
        },
        {
          trigger: 'Satender Kumar Antil (2022) Category',
          isMet: true,
          statusText: `${assessment.overallAntil} - ${
            assessment.overallAntil === 'Category A'
              ? 'Offences <= 7 years imprisonment (Bail should ordinarily be considered favorably)'
              : 'Special or heinous offences (Stringent guidelines apply)'
          }`,
          ruleSource: 'Satender Kumar Antil v. CBI (2022) 10 SCC 51',
          version: 1
        }
      ],
      custodyDays: assessment.bnss187?.daysElapsed || 0,
      riskAssessment: {
        score: application.caseId.priorConviction ? 'MEDIUM' : 'LOW',
        flightRisk: 'Standard',
        suretyReadiness: {
          totalSureties: sureties.length,
          verifiedCount: sureties.filter((s) => s.status === 'Verified').length,
          isSufficient: sureties.filter((s) => s.status === 'Verified').length >= 1
        }
      },
      ruleVersionsUsed: assessment.ruleVersions
    };

    return res.status(200).json({
      success: true,
      caseFile: {
        application,
        caseDetails: application.caseId,
        citizen: application.citizenId,
        documents,
        assessment,
        decisionSupport,
        existingDecision,
        sureties,
        delegates,
        legalAid,
        auditLogs,
        compliance
      }
    });
  } catch (error) {
    console.error('Judge case file error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch case file.' });
  }
};

/**
 * Record Judicial Decision (Granted / Rejected / Granted with conditions)
 */
export const recordDecision = async (req, res) => {
  try {
    const judgeId = req.user._id;
    const { id: applicationId } = req.params;
    const {
      outcome,
      reasons,
      conditions = [],
      suretyAmount = 0,
      suretiesCount = 1,
      nextHearingDate = null,
      triggersConsidered = {}
    } = req.body;

    let application = await BailApplication.findOne({
      _id: applicationId,
      assignedJudgeId: judgeId
    })
      .populate('caseId')
      .populate('citizenId');

    if (!application) {
      application = await BailApplication.findOne({
        caseId: applicationId,
        assignedJudgeId: judgeId
      })
        .populate('caseId')
        .populate('citizenId');
    }

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or unauthorized.'
      });
    }

    if (!Object.values(DECISION_OUTCOMES).includes(outcome)) {
      return res.status(400).json({
        success: false,
        message: `Outcome must be one of: ${Object.values(DECISION_OUTCOMES).join(', ')}`
      });
    }

    // Upsert Decision record
    let decisionDoc = await Decision.findOne({ applicationId: application._id });
    if (!decisionDoc) {
      decisionDoc = new Decision({
        applicationId: application._id,
        caseId: application.caseId._id,
        judgeId,
        outcome,
        reasons,
        conditions,
        suretyAmount: Number(suretyAmount || 0),
        suretiesCount: Number(suretiesCount || 1),
        nextHearingDate: nextHearingDate ? new Date(nextHearingDate) : null,
        triggersConsidered,
        decidedAt: new Date()
      });
    } else {
      decisionDoc.outcome = outcome;
      decisionDoc.reasons = reasons;
      decisionDoc.conditions = conditions;
      decisionDoc.suretyAmount = Number(suretyAmount || 0);
      decisionDoc.suretiesCount = Number(suretiesCount || 1);
      decisionDoc.nextHearingDate = nextHearingDate ? new Date(nextHearingDate) : null;
      decisionDoc.triggersConsidered = triggersConsidered;
      decisionDoc.decidedAt = new Date();
    }
    await decisionDoc.save();

    // Update Application and Case status
    application.status = APP_STATUS.DECIDED;
    await application.save();

    await Case.updateOne({ _id: application.caseId._id }, { status: APP_STATUS.DECIDED });

    // Send notification emails to Citizen
    await sendJudgeDecisionEmail(
      application.citizenId.email,
      application.caseId.caseNumber,
      outcome,
      reasons,
      conditions
    );

    // Notify primary admin via email
    const adminUser = await User.findOne({ role: ROLES.ADMIN, isActive: true }).lean();
    if (adminUser) {
      await sendJudgeDecisionEmail(
        adminUser.email,
        application.caseId.caseNumber,
        outcome,
        `[Admin Copy] Order passed by Hon'ble Judge: ${reasons}`,
        conditions
      );
    }

    // In-app notification for Citizen
    await Notification.create({
      userId: application.citizenId._id,
      title: `Bail Decision Announced: ${application.caseId.caseNumber} [${outcome}]`,
      message: `The court has pronounced its decision: ${outcome}. Reasons: "${reasons.substring(0, 100)}..."`,
      type: 'DECISION',
      link: `/cases/${application.caseId._id}`
    });

    await recordAuditEvent({
      action: AUDIT_ACTIONS.JUDGE_DECISION,
      caseId: application.caseId._id,
      performedBy: judgeId,
      performedByName: req.user.fullName,
      performedByEmail: req.user.email,
      role: ROLES.JUDGE,
      ipAddress: req.ip,
      details: {
        outcome,
        applicationNumber: application.applicationNumber,
        suretyAmount,
        conditionsCount: conditions.length,
        triggersConsidered
      }
    });

    return res.status(200).json({
      success: true,
      message: `Judicial decision recorded successfully: [${outcome}]. Notifications dispatched.`,
      decision: decisionDoc
    });
  } catch (error) {
    console.error('Record decision error:', error);
    return res.status(500).json({ success: false, message: 'Failed to record judicial decision.' });
  }
};

/**
 * Feature 8: Judge Calendar, Daily Agenda & Clash Detection
 */
export const getJudgeCalendar = async (req, res) => {
  try {
    const judgeId = req.user._id;
    const { date } = req.query;

    const query = { judgeId };
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);
      query.hearingDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const hearings = await Hearing.find(query)
      .populate('caseId', 'caseNumber personDetails firNumber court')
      .populate('applicationId', 'applicationNumber status')
      .sort({ hearingDate: 1, startTime: 1 })
      .lean();

    // Check for clashes across the scheduled list
    const timeSlots = {};
    const clashIds = new Set();
    hearings.forEach((h) => {
      if (h.status === 'Scheduled') {
        const slotKey = `${new Date(h.hearingDate).toDateString()}_${h.startTime}_${h.courtRoom}`;
        if (timeSlots[slotKey]) {
          clashIds.add(h._id.toString());
          clashIds.add(timeSlots[slotKey].toString());
        } else {
          timeSlots[slotKey] = h._id;
        }
      }
    });

    const annotatedHearings = hearings.map((h) => ({
      ...h,
      hasClash: clashIds.has(h._id.toString())
    }));

    return res.status(200).json({
      success: true,
      hearings: annotatedHearings,
      totalCount: hearings.length,
      clashCount: clashIds.size
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch judicial calendar.' });
  }
};

export const checkJudgeClash = async (req, res) => {
  try {
    const judgeId = req.user._id;
    const { hearingDate, startTime, endTime, excludeHearingId } = req.body;

    const result = await checkHearingClash({
      judgeId,
      hearingDate,
      startTime,
      endTime,
      excludeHearingId
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to check hearing clash.' });
  }
};

/**
 * Feature 13: Judge Eligibility Radar Board
 */
export const getJudgeRadar = async (req, res) => {
  try {
    const judgeId = req.user._id;
    const applications = await BailApplication.find({
      assignedJudgeId: judgeId,
      status: { $ne: APP_STATUS.DECIDED }
    })
      .populate('caseId')
      .populate('citizenId', 'fullName email phone')
      .lean();

    const setting = await SystemSetting.findOne({ key: 'DEFAULT_BAIL_CONFIG' }).lean();
    const thresholds = setting?.value || { generalDays: 60, heinousDays: 90 };

    const maturedList = [];
    const approachingList = [];

    applications.forEach((app) => {
      if (!app.caseId) return;
      try {
        const assessment = runBailAssessment({
          caseData: app.caseId,
          customThresholds: thresholds,
          currentDate: new Date()
        });

        const entry = {
          applicationId: app._id,
          applicationNumber: app.applicationNumber,
          caseId: app.caseId._id,
          caseNumber: app.caseId.caseNumber,
          accusedName: app.caseId.personDetails?.fullName,
          court: app.caseId.court,
          remandDate: app.caseId.remandDate,
          daysElapsed: assessment.bnss187?.daysElapsed || 0,
          daysRemaining: assessment.bnss187?.daysRemaining || 0,
          bnss187Matured: assessment.bnss187?.isMatured || false,
          bnss479Eligible: assessment.bnss479?.isEligible || false,
          status: app.status
        };

        if (assessment.bnss187?.isMatured || assessment.bnss479?.isEligible) {
          maturedList.push(entry);
        } else if (assessment.bnss187?.daysRemaining <= 7) {
          approachingList.push(entry);
        }
      } catch (e) {}
    });

    return res.status(200).json({
      success: true,
      maturedCases: maturedList,
      approachingCases: approachingList,
      totalMatured: maturedList.length,
      totalApproaching: approachingList.length
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate judge radar board.' });
  }
};

/**
 * Feature 12: Judge Compliance Review
 */
export const getJudgeCompliance = async (req, res) => {
  try {
    const { id } = req.params;
    const checkins = await ConditionCheckin.find({ caseId: id }).sort({ checkinDate: -1 }).lean();
    const decision = await Decision.findOne({ caseId: id }).lean();

    const verified = checkins.filter((c) => c.status === 'Verified').length;
    const missed = checkins.filter((c) => c.status === 'Missed').length;
    const complianceScore = checkins.length === 0 ? 100 : Math.round((verified / checkins.length) * 100);

    return res.status(200).json({
      success: true,
      conditions: decision?.conditions || [],
      checkins,
      stats: {
        total: checkins.length,
        verified,
        missed,
        complianceScore
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch compliance details.' });
  }
};
