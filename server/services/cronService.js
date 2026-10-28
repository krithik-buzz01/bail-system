import cron from 'node-cron';
import Case from '../models/Case.js';
import User from '../models/User.js';
import BailApplication from '../models/BailApplication.js';
import AlertSent from '../models/AlertSent.js';
import Notification from '../models/Notification.js';
import SystemSetting from '../models/SystemSetting.js';
import { calculateBNSS187 } from './calculators/bnss187.js';
import { sendDeadlineAlertEmail } from './emailService.js';
import { recordAuditEvent } from './auditService.js';
import { AUDIT_ACTIONS, ROLES } from '../config/constants.js';

/**
 * Checks all active undertrial cases and dispatches default bail deadline notifications
 * Target thresholds: 7 days, 3 days, 1 day, and 0 days (matured)
 * 
 * @param {Date} [referenceDate=new Date()] - Date to test against
 */
export const runDeadlineAlertCheck = async (referenceDate = new Date()) => {
  console.log(`[CRON] Starting Default Bail Deadline check for date: ${referenceDate.toISOString()}`);

  try {
    // 1. Fetch system thresholds
    const setting = await SystemSetting.findOne({ key: 'DEFAULT_BAIL_CONFIG' }).lean();
    const thresholds = setting?.value || { generalDays: 60, heinousDays: 90 };

    // 2. Fetch all active cases (investigation in progress, not decided)
    const activeCases = await Case.find({
      investigationStatus: 'In Progress',
      remandDate: { $ne: null }
    }).populate('citizenId');

    // Fetch admin user(s) to notify
    const admins = await User.find({ role: ROLES.ADMIN, isActive: true }).lean();
    const adminEmails = admins.map((a) => a.email);

    let alertsDispatched = 0;

    for (const caseDoc of activeCases) {
      const calculation = calculateBNSS187({
        remandDate: caseDoc.remandDate,
        offences: caseDoc.offences,
        currentDate: referenceDate,
        customThresholds: thresholds,
        investigationStatus: caseDoc.investigationStatus,
        chargesheetDate: caseDoc.chargesheetDate
      });

      const { daysRemaining, isMatured, deadlineDate } = calculation;

      // Determine candidate alert types
      const alertCandidates = [];
      if (daysRemaining === 7) {
        alertCandidates.push({ type: 'DEFAULT_BAIL_7_DAYS', daysBefore: 7 });
      } else if (daysRemaining === 3) {
        alertCandidates.push({ type: 'DEFAULT_BAIL_3_DAYS', daysBefore: 3 });
      } else if (daysRemaining === 1) {
        alertCandidates.push({ type: 'DEFAULT_BAIL_1_DAY', daysBefore: 1 });
      } else if (isMatured || daysRemaining <= 0) {
        alertCandidates.push({ type: 'DEFAULT_BAIL_MATURED', daysBefore: 0 });
      }

      for (const candidate of alertCandidates) {
        // Recipients: Citizen
        const citizenUser = caseDoc.citizenId;
        const recipients = [];
        if (citizenUser && citizenUser.email) {
          recipients.push({ email: citizenUser.email, role: 'citizen', userId: citizenUser._id });
        }
        // Also notify primary admin
        if (adminEmails.length > 0) {
          recipients.push({ email: adminEmails[0], role: 'admin', userId: admins[0]._id });
        }

        for (const recipient of recipients) {
          // Check for duplicate alert
          const alreadySent = await AlertSent.findOne({
            caseId: caseDoc._id,
            alertType: candidate.type,
            recipientEmail: recipient.email
          });

          if (alreadySent) {
            continue; // Skip duplicate alert
          }

          // Send real/templated email
          await sendDeadlineAlertEmail(
            recipient.email,
            caseDoc.caseNumber,
            caseDoc.personDetails?.fullName || 'Accused',
            daysRemaining,
            deadlineDate,
            candidate.type
          );

          // Save to AlertSent
          await AlertSent.create({
            caseId: caseDoc._id,
            alertType: candidate.type,
            daysBefore: candidate.daysBefore,
            recipientEmail: recipient.email,
            recipientRole: recipient.role,
            thresholdDate: deadlineDate,
            sentAt: referenceDate
          });

          // In-app notification
          await Notification.create({
            userId: recipient.userId,
            title: candidate.daysBefore === 0
              ? `Default Bail Right Matured: ${caseDoc.caseNumber}`
              : `Default Bail Deadline in ${candidate.daysBefore} Days: ${caseDoc.caseNumber}`,
            message: `Case ${caseDoc.caseNumber} for ${caseDoc.personDetails?.fullName}: Investigation period expires on ${new Date(deadlineDate).toLocaleDateString('en-IN')}.`,
            type: 'ALERT',
            link: `/cases/${caseDoc._id}`
          });

          alertsDispatched++;
        }

        // If matured, also flag in judge queue if application exists
        if (candidate.type === 'DEFAULT_BAIL_MATURED') {
          const app = await BailApplication.findOne({ caseId: caseDoc._id });
          if (app && app.assignedJudgeId) {
            await Notification.create({
              userId: app.assignedJudgeId,
              title: `Statutory Default Bail Matured: Case ${caseDoc.caseNumber}`,
              message: `The 60/90 day investigation period under Section 187 BNSS has elapsed without a chargesheet for Case ${caseDoc.caseNumber}.`,
              type: 'ALERT',
              link: `/judge/cases/${app._id}`
            });
          }
        }
      }
    }

    if (alertsDispatched > 0) {
      await recordAuditEvent({
        action: AUDIT_ACTIONS.DEADLINE_ALERT,
        performedByName: 'Node-Cron Job',
        role: 'system',
        details: { alertsDispatched, referenceDate }
      });
    }

    console.log(`[CRON] Deadline check complete. Total new alerts dispatched: ${alertsDispatched}`);
    return { success: true, alertsDispatched };
  } catch (error) {
    console.error('[CRON] Error during default bail deadline check:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Initializes the node-cron scheduler (runs daily at 00:05 IST)
 */
export const initCronScheduler = () => {
  // 5 minutes past midnight every day: '5 0 * * *'
  cron.schedule('5 0 * * *', async () => {
    console.log('[CRON SCHEDULE] Running daily default bail deadline alerts...');
    await runDeadlineAlertCheck(new Date());
  });

  console.log('Daily Node-Cron scheduler registered for Section 187 Default Bail alerts.');
};
