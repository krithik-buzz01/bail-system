import express from 'express';
import {
  getOffencesList,
  getRightsContent,
  downloadRightsPdf,
  getLegalAidContacts,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  performQuickCheck,
  getSharedQuickCheck
} from '../controllers/commonController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Publicly accessible catalogue & legal information
router.get('/offences', getOffencesList);
router.get('/rights', getRightsContent);
router.get('/rights/pdf', downloadRightsPdf);
router.get('/legal-aid', getLegalAidContacts);

// Feature 14: Public Quick Check (Rate limited on client/server)
router.post('/quick-check', performQuickCheck);
router.get('/quick-check/:token', getSharedQuickCheck);

// User notification feed (requires authentication)
router.get('/notifications', authenticate, getMyNotifications);
router.patch('/notifications/:id/read', authenticate, markNotificationRead);
router.patch('/notifications/read-all', authenticate, markAllNotificationsRead);

export default router;
