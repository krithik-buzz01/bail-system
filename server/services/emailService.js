import nodemailer from 'nodemailer';
import EmailLog from '../models/EmailLog.js';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (user && pass && user.trim() !== '' && pass.trim() !== '') {
    transporter = nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port,
      secure,
      auth: { user, pass }
    });
  } else {
    // Development / fallback transporter
    transporter = null;
  }
  return transporter;
};

/**
 * Base email layout wrapper with deep navy & teal professional legal-aid styling
 */
const wrapEmailTemplate = ({ title, contentHtml, disclaimer = true }) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0b192c; padding: 24px 32px; text-align: left;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">
                Bail Reckoner <span style="color: #41b06e; font-size: 14px; font-weight: 500;">| BNSS 2023</span>
              </h1>
              <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">Bail Assessment & Legal Rights Portal</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px; text-align: left; font-size: 15px; line-height: 1.6; color: #334155;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 600;">${title}</h2>
              ${contentHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; text-align: left; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              ${disclaimer ? '<p style="margin: 0 0 8px 0; font-style: italic;">Disclaimer: This automated notification is for guidance under the Bharatiya Nagarik Suraksha Sanhita, 2023. It does not constitute formal legal advice. Consult an advocate or your District Legal Services Authority (DLSA).</p>' : ''}
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} Bail Reckoner TN. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Sends an email with full logging to EmailLog collection
 */
export const sendEmail = async ({ to, subject, html, text, templateName = 'CUSTOM' }) => {
  const mailTransporter = getTransporter();
  const from = process.env.EMAIL_FROM || '"Bail Reckoner Support" <support@bailreckoner.gov.in>';

  let status = 'SENT';
  let errorMessage = null;

  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from,
        to,
        subject,
        text,
        html
      });
      console.log(`[SMTP EMAIL SENT] to=${to} subject="${subject}" template=${templateName}`);
    } catch (err) {
      status = 'FAILED';
      errorMessage = err.message;
      console.error(`[SMTP EMAIL FAILED] to=${to} error="${err.message}"`);
    }
  } else {
    // In development or when credentials are not supplied, mark as SIMULATED so flows never break
    status = 'SIMULATED';
    console.log(`[SIMULATED EMAIL LOGGED] to=${to} subject="${subject}" template=${templateName}`);
  }

  // Record in EmailLog collection for Admin audit
  try {
    await EmailLog.create({
      to,
      subject,
      status,
      templateName,
      previewHtml: html.substring(0, 5000),
      previewText: text.substring(0, 1000),
      errorMessage,
      timestamp: new Date()
    });
  } catch (logErr) {
    console.error('Failed to write EmailLog:', logErr.message);
  }

  return { status, errorMessage };
};

// ======================== EMAIL FLOWS ========================

export const sendOtpEmail = async (email, otp) => {
  const subject = `Your Verification Code: ${otp} - Bail Reckoner`;
  const contentHtml = `
    <p>Dear Citizen,</p>
    <p>Please use the following 6-digit One-Time Password (OTP) to complete your verification for Bail Reckoner:</p>
    <div style="text-align: center; margin: 24px 0;">
      <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0b192c; background-color: #f1f5f9; padding: 12px 28px; border-radius: 8px; border: 2px dashed #008dda;">
        ${otp}
      </span>
    </div>
    <p style="margin: 0; font-size: 14px; color: #64748b;">
      This code is valid for <strong>10 minutes</strong> and can only be used once. If you did not make this request, please ignore this email.
    </p>
  `;
  const text = `Your Bail Reckoner verification code is ${otp}. It is valid for 10 minutes.`;
  return sendEmail({ to: email, subject, html: wrapEmailTemplate({ title: 'Email Verification', contentHtml }), text, templateName: 'OTP' });
};

export const sendWelcomeEmail = async (email, fullName) => {
  const subject = `Welcome to Bail Reckoner, ${fullName}`;
  const contentHtml = `
    <p>Dear ${fullName},</p>
    <p>Your account on <strong>Bail Reckoner</strong> has been verified successfully.</p>
    <p>You can now:</p>
    <ul style="padding-left: 20px; line-height: 1.8;">
      <li>Add cases for undertrial prisoners or accused persons</li>
      <li>Run statutory bail eligibility checks under the BNSS 2023</li>
      <li>Track 60/90-day investigation default bail deadlines</li>
      <li>Draft bail petitions and connect with Tamil Nadu DLSA legal aid</li>
    </ul>
    <div style="margin-top: 24px;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="background-color: #008dda; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">Go to Portal</a>
    </div>
  `;
  const text = `Dear ${fullName}, welcome to Bail Reckoner! Your account is verified.`;
  return sendEmail({ to: email, subject, html: wrapEmailTemplate({ title: 'Welcome to Bail Reckoner', contentHtml }), text, templateName: 'WELCOME' });
};

export const sendPasswordResetEmail = async (email, resetUrl) => {
  const subject = 'Password Reset Request - Bail Reckoner';
  const contentHtml = `
    <p>Hello,</p>
    <p>We received a request to reset your password for your Bail Reckoner account. Click the button below to set a new password:</p>
    <div style="margin: 24px 0;">
      <a href="${resetUrl}" style="background-color: #0b192c; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Reset Password</a>
    </div>
    <p style="font-size: 13px; color: #64748b;">This single-use link will expire in <strong>30 minutes</strong>.</p>
    <p style="font-size: 13px; color: #64748b;">If you did not request this, you can safely ignore this email.</p>
  `;
  const text = `Reset your Bail Reckoner password using this link: ${resetUrl}. Valid for 30 minutes.`;
  return sendEmail({ to: email, subject, html: wrapEmailTemplate({ title: 'Reset Your Password', contentHtml }), text, templateName: 'PASSWORD_RESET' });
};

export const sendJudgeInviteEmail = async (email, judgeName, court, bench, inviteUrl) => {
  const subject = `Official Judicial Invitation: Bail Reckoner - ${court}`;
  const contentHtml = `
    <p>Hon'ble Judge ${judgeName},</p>
    <p>An administrative account has been initiated for you on the <strong>Bail Reckoner Judicial Decision-Support Portal</strong> for:</p>
    <div style="background-color: #f8fafc; border-left: 4px solid #008dda; padding: 12px 16px; margin: 16px 0;">
      <p style="margin: 0; font-weight: 600;">Court: ${court}</p>
      <p style="margin: 4px 0 0 0; color: #475569;">Bench: ${bench}</p>
    </div>
    <p>Please activate your judicial profile and set your secure password by clicking the link below:</p>
    <div style="margin: 24px 0;">
      <a href="${inviteUrl}" style="background-color: #008dda; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Activate Judicial Account</a>
    </div>
    <p style="font-size: 13px; color: #64748b;">This secure invitation link is valid for <strong>48 hours</strong>.</p>
  `;
  const text = `Hon'ble Judge ${judgeName}, please set your Bail Reckoner judicial password: ${inviteUrl}`;
  return sendEmail({ to: email, subject, html: wrapEmailTemplate({ title: 'Judicial Account Invitation', contentHtml }), text, templateName: 'JUDGE_INVITE' });
};

export const sendApplicationSubmittedEmail = async (email, caseNumber, applicantName) => {
  const subject = `Bail Application Submitted - Case No. ${caseNumber}`;
  const contentHtml = `
    <p>Dear ${applicantName},</p>
    <p>Your bail application for <strong>Case No. ${caseNumber}</strong> has been successfully submitted to the court queue.</p>
    <p>Current Status: <span style="background-color: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 4px; font-weight: 600;">Submitted / Under Review</span></p>
    <p>You can track real-time status, document verification, and scheduled hearing dates in your Citizen Portal.</p>
  `;
  const text = `Bail application for Case No. ${caseNumber} submitted successfully.`;
  return sendEmail({ to: email, subject, html: wrapEmailTemplate({ title: 'Application Submitted', contentHtml }), text, templateName: 'APP_SUBMITTED' });
};

export const sendApplicationAssignedEmail = async (judgeEmail, judgeName, caseNumber, court) => {
  const subject = `New Case Assigned - Case No. ${caseNumber}`;
  const contentHtml = `
    <p>Hon'ble Judge ${judgeName},</p>
    <p>A new bail application has been assigned to your bench (${court}):</p>
    <p><strong>Case Number:</strong> ${caseNumber}</p>
    <p>The Decision-Support summary, statutory triggers (BNSS 187/479), and uploaded case documents are available in your Judge Portal.</p>
  `;
  const text = `New case ${caseNumber} assigned to your bench.`;
  return sendEmail({ to: judgeEmail, subject, html: wrapEmailTemplate({ title: 'New Case Assigned', contentHtml }), text, templateName: 'APP_ASSIGNED' });
};

export const sendHearingScheduledEmail = async (email, caseNumber, hearingDate, courtRoom) => {
  const formattedDate = new Date(hearingDate).toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short'
  });
  const subject = `Hearing Scheduled - Case No. ${caseNumber}`;
  const contentHtml = `
    <p>Notice of Bail Hearing:</p>
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 6px; margin: 16px 0;">
      <p style="margin: 0; font-weight: 700; color: #166534; font-size: 16px;">Scheduled Date & Time:</p>
      <p style="margin: 4px 0 12px 0; font-size: 16px;">${formattedDate}</p>
      <p style="margin: 0; font-weight: 600; color: #166534;">Court Room / Bench:</p>
      <p style="margin: 4px 0 0 0;">${courtRoom}</p>
    </div>
    <p>Please ensure counsel or authorized representative is present at the designated court.</p>
  `;
  const text = `Hearing scheduled for Case ${caseNumber} on ${formattedDate} at ${courtRoom}.`;
  return sendEmail({ to: email, subject, html: wrapEmailTemplate({ title: 'Hearing Scheduled', contentHtml }), text, templateName: 'HEARING_SCHEDULED' });
};

export const sendJudgeDecisionEmail = async (email, caseNumber, outcome, reasons, conditions = []) => {
  const isGranted = outcome.toLowerCase().includes('granted');
  const badgeColor = isGranted ? '#166534' : '#991b1b';
  const badgeBg = isGranted ? '#dcfce7' : '#fee2e2';

  const subject = `Bail Decision Announced - Case No. ${caseNumber} [${outcome}]`;
  const contentHtml = `
    <p>An official decision has been pronounced by the Hon'ble Judge for <strong>Case No. ${caseNumber}</strong>:</p>
    <div style="margin: 16px 0;">
      <span style="background-color: ${badgeBg}; color: ${badgeColor}; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 16px;">
        ${outcome}
      </span>
    </div>
    <h3 style="margin: 16px 0 8px 0; font-size: 15px;">Reasons / Judicial Grounds:</h3>
    <p style="background-color: #f8fafc; padding: 12px; border-radius: 6px; font-style: italic;">"${reasons}"</p>
    ${
      conditions && conditions.length > 0
        ? `
      <h3 style="margin: 16px 0 8px 0; font-size: 15px;">Conditions Imposed:</h3>
      <ul style="padding-left: 20px;">
        ${conditions.map((c) => `<li style="margin-bottom: 4px;">${c}</li>`).join('')}
      </ul>
    `
        : ''
    }
  `;
  const text = `Bail decision for Case ${caseNumber}: ${outcome}. Reasons: ${reasons}`;
  return sendEmail({ to: email, subject, html: wrapEmailTemplate({ title: 'Judicial Decision Recorded', contentHtml }), text, templateName: 'JUDGE_DECISION' });
};

export const sendDocumentRequestedEmail = async (email, caseNumber, requestedDocType, remarks) => {
  const subject = `Action Required: Document Requested - Case No. ${caseNumber}`;
  const contentHtml = `
    <p>Dear Citizen,</p>
    <p>Upon reviewing your bail application for <strong>Case No. ${caseNumber}</strong>, the registry has requested an additional document:</p>
    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 16px 0;">
      <p style="margin: 0; font-weight: 700; color: #92400e;">Document Needed: ${requestedDocType}</p>
      <p style="margin: 4px 0 0 0; color: #78350f;">Registry Note: ${remarks || 'Please upload a clear, legible copy.'}</p>
    </div>
    <p>Please log in to your portal and upload the requested file to resume review.</p>
  `;
  const text = `Document requested for Case ${caseNumber}: ${requestedDocType}. Note: ${remarks}`;
  return sendEmail({ to: email, subject, html: wrapEmailTemplate({ title: 'Document Required', contentHtml }), text, templateName: 'DOC_REQUESTED' });
};

export const sendDeadlineAlertEmail = async (email, caseNumber, accusedName, daysRemaining, deadlineDate, alertType) => {
  const formattedDate = new Date(deadlineDate).toLocaleDateString('en-IN');
  const isMatured = daysRemaining <= 0;
  const subject = isMatured
    ? `URGENT: Statutory Default Bail Right Matured - Case No. ${caseNumber}`
    : `DEADLINE ALERT: ${daysRemaining} Day(s) to Default Bail Right - Case No. ${caseNumber}`;

  const contentHtml = `
    <p>Alert regarding accused <strong>${accusedName}</strong> (Case No. ${caseNumber}):</p>
    <div style="background-color: ${isMatured ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${isMatured ? '#fecaca' : '#bbf7d0'}; padding: 16px; border-radius: 6px; margin: 16px 0;">
      <h3 style="margin: 0 0 8px 0; color: ${isMatured ? '#991b1b' : '#166534'};">
        ${isMatured ? 'Statutory Default Bail Right Has Matured!' : `Default Bail Deadline Approaching: ${daysRemaining} Day(s) Remaining`}
      </h3>
      <p style="margin: 0; font-size: 14px;">
        Under <strong>Section 187 BNSS, 2023</strong> (formerly Section 167(2) CrPC), the statutory investigation period expires on:
        <br><strong style="font-size: 16px;">${formattedDate}</strong>
      </p>
    </div>
    <p>${
      isMatured
        ? 'Since the investigation period has elapsed without a chargesheet, the accused is statutorily entitled to default bail. File an immediate application before the Magistrate.'
        : `If the investigating police agency does not file a chargesheet by ${formattedDate}, the accused will obtain an indefeasible right to bail.`
    }</p>
  `;
  const text = `Default bail alert for ${accusedName} (${caseNumber}): ${daysRemaining} days remaining to ${formattedDate}.`;
  return sendEmail({ to: email, subject, html: wrapEmailTemplate({ title: 'Section 187 Deadline Alert', contentHtml }), text, templateName: alertType });
};

export const sendSuretyVerifiedEmail = async (email, caseNumber, suretyName, status, reason = '') => {
  const isVerified = status === 'Verified';
  const subject = `Surety Status Updated: ${suretyName} [${status}] - Case No. ${caseNumber}`;
  const contentHtml = `
    <p>The Registry has reviewed the surety submission for <strong>Case No. ${caseNumber}</strong>:</p>
    <div style="background-color: ${isVerified ? '#f0fdf4' : '#fef2f2'}; border-left: 4px solid ${isVerified ? '#22c55e' : '#ef4444'}; padding: 12px 16px; margin: 16px 0;">
      <p style="margin: 0; font-weight: 700; color: ${isVerified ? '#15803d' : '#b91c1c'};">Surety: ${suretyName}</p>
      <p style="margin: 4px 0 0 0; color: #334155;">Status: <strong>${status}</strong></p>
      ${!isVerified && reason ? `<p style="margin: 4px 0 0 0; color: #7f1d1d;">Reason: ${reason}</p>` : ''}
    </div>
    <p>${isVerified ? 'This surety is verified and ready for bail bond execution.' : 'Please upload updated or alternative solvency proofs.'}</p>
  `;
  const text = `Surety ${suretyName} for Case ${caseNumber} is now ${status}. ${reason}`;
  return sendEmail({ to: email, subject, html: wrapEmailTemplate({ title: 'Surety Readiness Update', contentHtml }), text, templateName: 'SURETY_STATUS' });
};

export const sendHearingReminderEmail = async (email, caseNumber, hearingDate, time, courtRoom, interval) => {
  const formattedDate = new Date(hearingDate).toLocaleDateString('en-IN');
  const subject = `HEARING REMINDER (${interval}): Case No. ${caseNumber} - ${formattedDate}`;
  const contentHtml = `
    <p>This is an automated judicial reminder for your upcoming hearing:</p>
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 16px 0;">
      <p style="margin: 0; font-weight: 700; color: #1e40af;">Case: ${caseNumber}</p>
      <p style="margin: 4px 0 0 0; color: #1e3a8a;">Date: <strong>${formattedDate}</strong> at <strong>${time}</strong></p>
      <p style="margin: 4px 0 0 0; color: #1e3a8a;">Courtroom: <strong>${courtRoom}</strong></p>
    </div>
    <p>Please ensure your advocate and sureties are present on time. You can export this event to your calendar from your dashboard.</p>
  `;
  const text = `Hearing reminder (${interval}) for Case ${caseNumber} on ${formattedDate} at ${time} in ${courtRoom}.`;
  return sendEmail({ to: email, subject, html: wrapEmailTemplate({ title: `Hearing Reminder (${interval})`, contentHtml }), text, templateName: `HEARING_REMINDER_${interval.replace(/\s+/g, '_')}` });
};

export const sendDelegateInviteEmail = async (email, inviterName, caseNumber, inviteLink, relationship) => {
  const subject = `You've been invited as a Case Delegate - Case No. ${caseNumber}`;
  const contentHtml = `
    <p>Dear Delegate,</p>
    <p><strong>${inviterName}</strong> has authorized you as a <strong>${relationship}</strong> to view and monitor legal updates for <strong>Case No. ${caseNumber}</strong> on Bail Reckoner.</p>
    <div style="margin: 24px 0; text-align: center;">
      <a href="${inviteLink}" style="background-color: #0b192c; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
        Accept Delegate Access
      </a>
    </div>
    <p style="font-size: 13px; color: #64748b;">As an authorized delegate, you will have read-only access to case progress, statutory default bail timers, and hearing dates.</p>
  `;
  const text = `${inviterName} invited you as delegate for Case ${caseNumber}. Accept link: ${inviteLink}`;
  return sendEmail({ to: email, subject, html: wrapEmailTemplate({ title: 'Family/Delegate Access Invitation', contentHtml }), text, templateName: 'DELEGATE_INVITE' });
};

export const sendDelegateRevokedEmail = async (email, caseNumber, reason = '') => {
  const subject = `Delegate Access Revoked - Case No. ${caseNumber}`;
  const contentHtml = `
    <p>Your authorized delegate access for <strong>Case No. ${caseNumber}</strong> has been revoked.</p>
    ${reason ? `<p style="color: #64748b; font-style: italic;">Reason: ${reason}</p>` : ''}
    <p>You will no longer receive notifications or have access to case file details.</p>
  `;
  const text = `Delegate access for Case ${caseNumber} revoked. ${reason}`;
  return sendEmail({ to: email, subject, html: wrapEmailTemplate({ title: 'Delegation Revoked', contentHtml }), text, templateName: 'DELEGATE_REVOKED' });
};

export const sendConditionEscalationEmail = async (email, caseNumber, accusedName, missedDate, station) => {
  const formattedDate = new Date(missedDate).toLocaleDateString('en-IN');
  const subject = `URGENT VIOLATION ALERT: Missed Bail Condition Check-in - Case No. ${caseNumber}`;
  const contentHtml = `
    <p style="color: #b91c1c; font-weight: 700;">ESCALATION NOTICE: BAIL CONDITION VIOLATION DETECTED</p>
    <p>Accused <strong>${accusedName}</strong> (Case No. ${caseNumber}) failed to log their mandatory periodic check-in:</p>
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 16px 0;">
      <p style="margin: 0; color: #991b1b;">Missed Scheduled Date: <strong>${formattedDate}</strong></p>
      <p style="margin: 4px 0 0 0; color: #991b1b;">Designated Police Station: <strong>${station}</strong></p>
    </div>
    <p>This incident has been recorded in the compliance ledger. Continued non-compliance may lead to cancellation of bail under Section 480/483 BNSS.</p>
  `;
  const text = `Bail condition missed check-in alert for ${accusedName} (${caseNumber}) on ${formattedDate} at ${station}.`;
  return sendEmail({ to: email, subject, html: wrapEmailTemplate({ title: 'Bail Condition Escalation', contentHtml }), text, templateName: 'CONDITION_ESCALATION' });
};

export const sendLegalAidStatusEmail = async (email, caseNumber, status, advocateDetails = {}, remarks = '') => {
  const subject = `Legal Aid Request Status: ${status} - Case No. ${caseNumber}`;
  const contentHtml = `
    <p>Your District Legal Services Authority (DLSA) request for <strong>Case No. ${caseNumber}</strong> has been updated to:</p>
    <div style="background-color: #f0fdfa; border-left: 4px solid #14b8a6; padding: 12px 16px; margin: 16px 0;">
      <p style="margin: 0; font-weight: 700; color: #0f766e;">Status: ${status}</p>
      ${
        advocateDetails.name
          ? `
        <p style="margin: 6px 0 0 0; color: #134e4a;"><strong>Assigned Legal Aid Advocate:</strong> ${advocateDetails.name}</p>
        <p style="margin: 2px 0 0 0; color: #134e4a;"><strong>Contact Phone:</strong> ${advocateDetails.phone || 'Available via DLSA'}</p>
        <p style="margin: 2px 0 0 0; color: #134e4a;"><strong>Enrollment No:</strong> ${advocateDetails.enrollmentNumber || 'Verified'}</p>
      `
          : ''
      }
      ${remarks ? `<p style="margin: 6px 0 0 0; color: #475569;">Note: ${remarks}</p>` : ''}
    </div>
    <p>Free legal aid is provided under Section 340 BNSS and the Legal Services Authorities Act, 1987.</p>
  `;
  const text = `Legal Aid update for Case ${caseNumber}: ${status}. Advocate: ${advocateDetails.name || 'Pending'}`;
  return sendEmail({ to: email, subject, html: wrapEmailTemplate({ title: 'Legal Aid Update', contentHtml }), text, templateName: 'LEGAL_AID_UPDATE' });
};

