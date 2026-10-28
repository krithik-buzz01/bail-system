import mongoose from 'mongoose';

const conditionCheckinSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
      index: true
    },
    decisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Decision',
      index: true
    },
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    checkinDate: {
      type: Date,
      required: true,
      index: true
    },
    policeStation: {
      type: String,
      required: true,
      trim: true
    },
    officerName: {
      type: String,
      default: ''
    },
    receiptNumber: {
      type: String,
      default: ''
    },
    proofDocumentPath: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Verified', 'Pending', 'Missed', 'Late'],
      default: 'Verified',
      index: true
    },
    notes: {
      type: String,
      default: ''
    },
    escalated: {
      type: Boolean,
      default: false,
      index: true
    },
    escalatedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

const ConditionCheckin = mongoose.model('ConditionCheckin', conditionCheckinSchema);
export default ConditionCheckin;
