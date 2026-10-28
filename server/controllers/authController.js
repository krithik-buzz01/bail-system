import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import JudgeProfile from '../models/JudgeProfile.js';
import OtpToken from '../models/OtpToken.js';
import RefreshToken from '../models/RefreshToken.js';
import { ROLES, AUDIT_ACTIONS } from '../config/constants.js';
import { sendOtpEmail, sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { sendOtpSms } from '../services/smsService.js';
import { recordAuditEvent } from '../services/auditService.js';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

/**
 * Cookie options helper
 */
const getCookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: maxAgeMs
});

/**
 * Generates Access and Refresh tokens with database-tracked rotation
 */
const generateAuthTokens = async (user) => {
  const accessSecret = process.env.JWT_ACCESS_SECRET || 'access_secret_bail_reckoner_bnss_2023_secure_key_12345';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh_secret_bail_reckoner_bnss_2023_secure_key_67890';

  const accessToken = jwt.sign(
    { userId: user._id, role: user.role, email: user.email },
    accessSecret,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    expiresAt
  });

  return { accessToken, rawRefreshToken };
};

/**
 * Citizen Registration
 */
export const register = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists. Please log in.'
        });
      }
      // If user exists but is unverified, update their details and re-send OTP
      const salt = await bcrypt.genSalt(10);
      existingUser.passwordHash = await bcrypt.hash(password, salt);
      existingUser.fullName = fullName;
      existingUser.phone = phone;
      await existingUser.save();

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await OtpToken.deleteMany({ userId: existingUser._id, type: 'REGISTRATION' });
      await OtpToken.create({
        userId: existingUser._id,
        email: normalizedEmail,
        phone: existingUser.phone,
        otpHash,
        type: 'REGISTRATION',
        expiresAt,
        lastSentAt: new Date()
      });

      // Dispatch to BOTH Email and SMS:
      await Promise.allSettled([
        sendOtpEmail(normalizedEmail, otp),
        sendOtpSms(existingUser.phone, otp)
      ]);

      return res.status(200).json({
        success: true,
        message: 'A 6-digit verification code was dispatched to both your Email and your Mobile Phone via SMS.',
        email: normalizedEmail,
        phone: existingUser.phone,
        devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
      });
    }

    // New user
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName,
      email: normalizedEmail,
      passwordHash,
      phone,
      role: ROLES.CITIZEN,
      isVerified: false,
      isActive: true
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OtpToken.create({
      userId: newUser._id,
      email: normalizedEmail,
      phone: newUser.phone,
      otpHash,
      type: 'REGISTRATION',
      expiresAt,
      lastSentAt: new Date()
    });

    // Dispatch to BOTH Email and SMS:
    await Promise.allSettled([
      sendOtpEmail(normalizedEmail, otp),
      sendOtpSms(newUser.phone, otp)
    ]);

    await recordAuditEvent({
      action: AUDIT_ACTIONS.USER_REGISTER,
      performedBy: newUser._id,
      performedByName: newUser.fullName,
      performedByEmail: newUser.email,
      role: newUser.role,
      ipAddress: req.ip,
      details: { email: normalizedEmail, phone: newUser.phone, role: ROLES.CITIZEN }
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful! A 6-digit verification code was dispatched to both your Email and your Mobile Phone via SMS.',
      email: normalizedEmail,
      phone: newUser.phone,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

/**
 * Verify Registration OTP
 */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account is already verified. Please log in.' });
    }

    const tokenDoc = await OtpToken.findOne({
      userId: user._id,
      type: 'REGISTRATION'
    });

    if (!tokenDoc) {
      return res.status(400).json({ success: false, message: 'No active verification code found. Please request a new one.' });
    }

    if (new Date() > tokenDoc.expiresAt) {
      await OtpToken.deleteOne({ _id: tokenDoc._id });
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
    }

    if (tokenDoc.attempts >= 5) {
      await OtpToken.deleteOne({ _id: tokenDoc._id });
      return res.status(429).json({ success: false, message: 'Maximum attempts exceeded (5). Please request a new verification code.' });
    }

    const isMatch = await bcrypt.compare(otp, tokenDoc.otpHash);
    if (!isMatch) {
      tokenDoc.attempts += 1;
      await tokenDoc.save();
      const remaining = 5 - tokenDoc.attempts;
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${remaining} attempt(s) remaining.`
      });
    }

    // Mark user verified and active
    user.isVerified = true;
    user.failedAttempts = 0;
    user.lockUntil = null;
    await user.save();

    await OtpToken.deleteOne({ _id: tokenDoc._id });

    // Send Welcome Email
    await sendWelcomeEmail(user.email, user.fullName);

    // Generate session tokens
    const { accessToken, rawRefreshToken } = await generateAuthTokens(user);

    // Set secure cookies
    res.cookie('access_token', accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie('refresh_token', rawRefreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    await recordAuditEvent({
      action: 'VERIFY_OTP',
      performedBy: user._id,
      performedByName: user.fullName,
      performedByEmail: user.email,
      role: user.role,
      ipAddress: req.ip,
      details: { email: user.email, verified: true }
    });

    return res.status(200).json({
      success: true,
      message: 'Account verified successfully!',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        language: user.language
      },
      accessToken
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({ success: false, message: 'Verification failed.' });
  }
};

/**
 * Resend OTP with 60-second cooldown
 */
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account is already verified. Please log in.' });
    }

    const existing = await OtpToken.findOne({ userId: user._id, type: 'REGISTRATION' });
    if (existing && existing.lastSentAt) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(existing.lastSentAt).getTime()) / 1000);
      if (elapsedSeconds < 60) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${60 - elapsedSeconds} second(s) before requesting another code.`
        });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OtpToken.deleteMany({ userId: user._id, type: 'REGISTRATION' });
    await OtpToken.create({
      userId: user._id,
      email: normalizedEmail,
      phone: user.phone,
      otpHash,
      type: 'REGISTRATION',
      expiresAt,
      lastSentAt: new Date()
    });

    // Dispatch to BOTH Email and SMS:
    await Promise.allSettled([
      sendOtpEmail(normalizedEmail, otp),
      sendOtpSms(user.phone, otp)
    ]);

    return res.status(200).json({
      success: true,
      message: 'A new 6-digit verification code has been dispatched to both your Email and your Mobile Phone via SMS.',
      email: normalizedEmail,
      phone: user.phone,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({ success: false, message: 'Failed to resend code.' });
  }
};

/**
 * Login with Account Lockout (15 mins after 5 failed attempts)
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Check if account is locked
    if (user.isLocked()) {
      const lockMinutesRemaining = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to 5 consecutive failed attempts. Please try again after ${lockMinutesRemaining} minute(s).`
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedAttempts = (user.failedAttempts || 0) + 1;
      if (user.failedAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
        await user.save();
        return res.status(423).json({
          success: false,
          message: 'Account locked for 15 minutes due to 5 failed login attempts.'
        });
      }
      await user.save();
      const remaining = 5 - user.failedAttempts;
      return res.status(401).json({
        success: false,
        message: `Invalid email or password. ${remaining} attempt(s) remaining before account lockout.`
      });
    }

    // Check verification status (Judges invited are verified via invite; citizens must be verified)
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_NOT_VERIFIED',
        message: 'Account is not yet verified. Please enter the OTP sent to your email.',
        email: user.email
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact an administrator.'
      });
    }

    // Reset failed attempts upon successful login
    user.failedAttempts = 0;
    user.lockUntil = null;
    await user.save();

    // Check if user is judge, fetch court profile
    let judgeProfile = null;
    if (user.role === ROLES.JUDGE) {
      judgeProfile = await JudgeProfile.findOne({ userId: user._id }).lean();
    }

    // Generate tokens
    const { accessToken, rawRefreshToken } = await generateAuthTokens(user);

    res.cookie('access_token', accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie('refresh_token', rawRefreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    await recordAuditEvent({
      action: AUDIT_ACTIONS.USER_LOGIN,
      performedBy: user._id,
      performedByName: user.fullName,
      performedByEmail: user.email,
      role: user.role,
      ipAddress: req.ip,
      details: { email: user.email, role: user.role }
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        language: user.language,
        mustChangePassword: Boolean(user.mustChangePassword),
        judgeProfile: judgeProfile ? { court: judgeProfile.court, bench: judgeProfile.bench } : null
      },
      accessToken
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Login failed.' });
  }
};

/**
 * Token Refresh endpoint
 */
export const refreshToken = async (req, res) => {
  try {
    const rawToken = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!rawToken) {
      return res.status(401).json({ success: false, message: 'Refresh token missing.' });
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const existing = await RefreshToken.findOne({ tokenHash });

    if (!existing || existing.revoked || new Date() > existing.expiresAt) {
      return res.status(401).json({ success: false, message: 'Refresh token invalid or expired.' });
    }

    const user = await User.findById(existing.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User inactive or not found.' });
    }

    // Token rotation: revoke old token
    existing.revoked = true;
    await existing.save();

    // Generate fresh pair
    const { accessToken, rawRefreshToken } = await generateAuthTokens(user);

    res.cookie('access_token', accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie('refresh_token', rawRefreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    return res.status(200).json({
      success: true,
      accessToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ success: false, message: 'Failed to refresh token.' });
  }
};

/**
 * Logout endpoint
 */
export const logout = async (req, res) => {
  try {
    const rawToken = req.cookies?.refresh_token;
    if (rawToken) {
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      await RefreshToken.updateOne({ tokenHash }, { revoked: true });
    }

    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });

    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ success: false, message: 'Logout failed.' });
  }
};

/**
 * Forgot Password - Send 30-minute signed link
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Don't leak user existence; return generic success message
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been dispatched.'
      });
    }

    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await OtpToken.deleteMany({ userId: user._id, type: 'PASSWORD_RESET' });
    await OtpToken.create({
      userId: user._id,
      email: normalizedEmail,
      otpHash: resetTokenHash,
      type: 'PASSWORD_RESET',
      expiresAt
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${rawResetToken}&email=${encodeURIComponent(normalizedEmail)}`;

    await sendPasswordResetEmail(normalizedEmail, resetUrl);

    return res.status(200).json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been dispatched.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Password reset request failed.' });
  }
};

/**
 * Reset Password - Single-use token verification
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset link.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const tokenDoc = await OtpToken.findOne({
      userId: user._id,
      otpHash: tokenHash,
      type: 'PASSWORD_RESET'
    });

    if (!tokenDoc || new Date() > tokenDoc.expiresAt) {
      return res.status(400).json({ success: false, message: 'Password reset link is invalid or has expired.' });
    }

    // Set new password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.failedAttempts = 0;
    user.lockUntil = null;
    user.mustChangePassword = false;
    await user.save();

    // Revoke token (single-use)
    await OtpToken.deleteOne({ _id: tokenDoc._id });
    // Revoke existing refresh tokens
    await RefreshToken.updateMany({ userId: user._id }, { revoked: true });

    await recordAuditEvent({
      action: AUDIT_ACTIONS.PASSWORD_RESET,
      performedBy: user._id,
      performedByName: user.fullName,
      performedByEmail: user.email,
      role: user.role,
      ipAddress: req.ip,
      details: { email: user.email }
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

/**
 * Change Password (for authenticated users or forced admin password change)
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // If mustChangePassword is true, allow without currentPassword check or verify currentPassword
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = false;
    await user.save();

    await recordAuditEvent({
      action: AUDIT_ACTIONS.PASSWORD_CHANGE,
      performedBy: user._id,
      performedByName: user.fullName,
      performedByEmail: user.email,
      role: user.role,
      ipAddress: req.ip,
      details: { email: user.email }
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update password.' });
  }
};

/**
 * Judge Accept Invite & Set Password (48-hour valid link)
 */
export const judgeAcceptInvite = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const profile = await JudgeProfile.findOne({ inviteTokenHash: tokenHash }).populate('userId');

    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Invalid judicial invitation link.'
      });
    }

    if (profile.isInviteAccepted) {
      return res.status(400).json({
        success: false,
        message: 'Invitation has already been accepted. Please log in.'
      });
    }

    if (profile.inviteExpiresAt && new Date() > profile.inviteExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'This invitation link has expired (valid 48 hours). Please contact the administrator.'
      });
    }

    const user = profile.userId;
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.isVerified = true;
    user.isActive = true;
    await user.save();

    profile.isInviteAccepted = true;
    profile.inviteTokenHash = null;
    await profile.save();

    await recordAuditEvent({
      action: AUDIT_ACTIONS.JUDGE_ACTIVATE,
      performedBy: user._id,
      performedByName: user.fullName,
      performedByEmail: user.email,
      role: ROLES.JUDGE,
      ipAddress: req.ip,
      details: { court: profile.court, bench: profile.bench }
    });

    return res.status(200).json({
      success: true,
      message: 'Judicial account activated successfully! You may now log in.'
    });
  } catch (error) {
    console.error('Judge accept invite error:', error);
    return res.status(500).json({ success: false, message: 'Failed to activate judicial account.' });
  }
};

/**
 * Get current authenticated user profile
 */
export const getMe = async (req, res) => {
  try {
    let judgeProfile = null;
    if (req.user.role === ROLES.JUDGE) {
      judgeProfile = await JudgeProfile.findOne({ userId: req.user._id }).lean();
    }

    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        language: req.user.language,
        mustChangePassword: Boolean(req.user.mustChangePassword),
        judgeProfile: judgeProfile ? { court: judgeProfile.court, bench: judgeProfile.bench } : null
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
};
