import express from 'express';
import { z } from 'zod';
import {
  register,
  verifyOtp,
  resendOtp,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  judgeAcceptInvite,
  getMe
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Validation Schemas
const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must have at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  phone: z.string().optional()
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'Verification code must be exactly 6 digits')
});

const resendOtpSchema = z.object({
  email: z.string().email()
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

const judgeInviteSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
});

// Routes
router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/verify-otp', otpLimiter, validateBody(verifyOtpSchema), verifyOtp);
router.post('/resend-otp', otpLimiter, validateBody(resendOtpSchema), resendOtp);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), resetPassword);
router.post('/judge-accept-invite', authLimiter, validateBody(judgeInviteSchema), judgeAcceptInvite);

// Authenticated user routes
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, validateBody(changePasswordSchema), changePassword);

export default router;
