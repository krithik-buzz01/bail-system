import crypto from 'crypto';
import Offence from '../models/Offence.js';
import RightsContent from '../models/RightsContent.js';
import LegalAidContact from '../models/LegalAidContact.js';
import Notification from '../models/Notification.js';
import QuickCheckShare from '../models/QuickCheckShare.js';
import SystemSetting from '../models/SystemSetting.js';
import { generateRightsCardPdf } from '../services/pdfService.js';
import { runBailAssessment } from '../services/calculators/ruleEngine.js';

export const getOffencesList = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { isActive: true };
    if (search) {
      filter.$or = [
        { section: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { correspondingSection: { $regex: search, $options: 'i' } }
      ];
    }
    const offences = await Offence.find(filter).sort({ title: 1 }).lean();
    return res.status(200).json({ success: true, offences });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch offences.' });
  }
};

export const getRightsContent = async (req, res) => {
  try {
    const rights = await RightsContent.find({ isActive: true }).sort({ order: 1 }).lean();
    return res.status(200).json({ success: true, rights });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch rights content.' });
  }
};

export const downloadRightsPdf = async (req, res) => {
  try {
    const language = req.query.lang === 'ta' ? 'ta' : 'en';
    const rights = await RightsContent.find({ isActive: true }).sort({ order: 1 }).lean();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Arrestee_Rights_Card_${language.toUpperCase()}.pdf"`
    );

    await generateRightsCardPdf({ rightsList: rights, language }, res);
  } catch (error) {
    console.error('Rights PDF download error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate rights card PDF.' });
  }
};

export const getLegalAidContacts = async (req, res) => {
  try {
    const { district, search } = req.query;
    const filter = { isActive: true };
    if (district) filter.district = district;
    if (search) {
      filter.$or = [
        { district: { $regex: search, $options: 'i' } },
        { officeName: { $regex: search, $options: 'i' } },
        { secretaryName: { $regex: search, $options: 'i' } }
      ];
    }
    const contacts = await LegalAidContact.find(filter).sort({ district: 1 }).lean();
    return res.status(200).json({ success: true, contacts });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch legal aid contacts.' });
  }
};

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false
    });

    return res.status(200).json({ success: true, notifications, unreadCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.updateOne({ _id: id, userId: req.user._id }, { isRead: true });
    return res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update notifications.' });
  }
};

/**
 * Feature 14: Public Quick Check (Rate Limited)
 */
export const performQuickCheck = async (req, res) => {
  try {
    const { offenceIds, remandDate, isFirstOffender = true, hasOtherCases = false } = req.body;

    if (!offenceIds || !Array.isArray(offenceIds) || offenceIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one offence.' });
    }

    if (!remandDate) {
      return res.status(400).json({ success: false, message: 'Remand date is required.' });
    }

    const offencesDocs = await Offence.find({ _id: { $in: offenceIds }, isActive: true }).lean();
    if (offencesDocs.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid offences found.' });
    }

    const mockCase = {
      remandDate: new Date(remandDate),
      priorConviction: !isFirstOffender,
      otherPendingCases: Boolean(hasOtherCases),
      offences: offencesDocs
    };

    const setting = await SystemSetting.findOne({ key: 'DEFAULT_BAIL_CONFIG' }).lean();
    const thresholds = setting?.value || { generalDays: 60, heinousDays: 90 };

    const assessmentResult = runBailAssessment({
      caseData: mockCase,
      customThresholds: thresholds,
      currentDate: new Date()
    });

    const shareToken = crypto.randomBytes(12).toString('hex');

    await QuickCheckShare.create({
      shareToken,
      offences: offencesDocs.map((o) => ({
        section: o.section,
        act: o.act,
        title: o.title,
        maxSentenceYears: o.maxSentenceYears,
        bailable: o.bailable,
        punishableDeathOrLife: o.punishableDeathOrLife,
        antilCategory: o.antilCategory
      })),
      remandDate: new Date(remandDate),
      isFirstOffender: Boolean(isFirstOffender),
      hasOtherCases: Boolean(hasOtherCases),
      results: assessmentResult,
      ipAddress: req.ip || ''
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const shareUrl = `${clientUrl}/quick-check?share=${shareToken}`;

    return res.status(200).json({
      success: true,
      results: assessmentResult,
      shareToken,
      shareUrl
    });
  } catch (error) {
    console.error('Quick check error:', error);
    return res.status(500).json({ success: false, message: 'Failed to perform quick calculation.' });
  }
};

export const getSharedQuickCheck = async (req, res) => {
  try {
    const { token } = req.params;
    const share = await QuickCheckShare.findOne({ shareToken: token });

    if (!share) {
      return res.status(404).json({ success: false, message: 'Shared calculation not found or expired.' });
    }

    share.viewsCount = (share.viewsCount || 0) + 1;
    await share.save();

    return res.status(200).json({
      success: true,
      share
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve shared calculation.' });
  }
};
