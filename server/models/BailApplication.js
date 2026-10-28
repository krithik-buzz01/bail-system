import mongoose from 'mongoose';
import { APP_STATUS } from '../config/constants.js';

const HearingSchema = new mongoose.Schema(
  {
    hearingDate: {
      type: Date,
      required: true
    },
    courtRoom: {
      type: String,
      required: true,
      trim: true
    },
    purpose: {
      type: String,
      default: 'Bail Hearing'
    },
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

const BailApplicationSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
      unique: true
    },
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    applicationNumber: {
      type: String,
      unique: true,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(APP_STATUS),
      default: APP_STATUS.SUBMITTED,
      index: true
    },
    assignedJudgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    assignedAt: {
      type: Date
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    hearings: [HearingSchema],
    draftPdfPath: {
      type: String
    },
    submissionDate: {
      type: Date,
      default: Date.now
    },
    urgentHearingRequested: {
      type: Boolean,
      default: false
    },
    urgentGrounds: {
      type: String
    }
  },
  { timestamps: true }
);

export default mongoose.model('BailApplication', BailApplicationSchema);
