import mongoose from 'mongoose';
import { DECISION_OUTCOMES } from '../config/constants.js';

const DecisionSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BailApplication',
      required: true,
      unique: true
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true
    },
    judgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    outcome: {
      type: String,
      enum: Object.values(DECISION_OUTCOMES),
      required: true
    },
    reasons: {
      type: String,
      required: true,
      trim: true
    },
    conditions: [
      {
        type: String,
        trim: true
      }
    ],
    suretyAmount: {
      type: Number,
      default: 0
    },
    suretiesCount: {
      type: Number,
      default: 1
    },
    nextHearingDate: {
      type: Date
    },
    triggersConsidered: {
      bnss187Considered: { type: Boolean, default: false },
      bnss479Considered: { type: Boolean, default: false },
      bailableFlagConsidered: { type: Boolean, default: false },
      antilGuidelinesConsidered: { type: Boolean, default: false },
      priorConvictionConsidered: { type: Boolean, default: false }
    },
    decidedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model('Decision', DecisionSchema);
