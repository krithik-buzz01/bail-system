import BailApplication from '../models/BailApplication.js';
import Case from '../models/Case.js';
import { ROLES } from '../config/constants.js';

/**
 * Restricts endpoint to specified user roles
 */
export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}] role(s). Your role is '${req.user.role}'.`
      });
    }

    next();
  };
};

/**
 * Ensures that if a Judge is accessing an application or case, it is assigned to them
 */
export const requireAssignedJudge = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== ROLES.JUDGE) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted to judicial officers.'
      });
    }

    const { applicationId, caseId, id } = req.params;
    let targetApp = null;

    if (applicationId) {
      targetApp = await BailApplication.findById(applicationId);
    } else if (caseId) {
      targetApp = await BailApplication.findOne({ caseId });
    } else if (id) {
      targetApp = await BailApplication.findById(id);
      if (!targetApp) {
        targetApp = await BailApplication.findOne({ caseId: id });
      }
    }

    if (!targetApp) {
      return res.status(404).json({
        success: false,
        message: 'Bail application record not found.'
      });
    }

    // Verify judge assignment
    if (!targetApp.assignedJudgeId || targetApp.assignedJudgeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not assigned to this case file.'
      });
    }

    req.targetApplication = targetApp;
    next();
  } catch (error) {
    console.error('Judge assignment verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify judicial assignment.'
    });
  }
};
