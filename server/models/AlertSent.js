import mongoose from 'mongoose';

const AlertSentSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
      index: true
    },
    alertType: {
      type: String,
      enum: ['DEFAULT_BAIL_7_DAYS', 'DEFAULT_BAIL_3_DAYS', 'DEFAULT_BAIL_1_DAY', 'DEFAULT_BAIL_MATURED'],
      required: true
    },
    daysBefore: {
      type: Number,
      required: true
    },
    recipientEmail: {
      type: String,
      required: true
    },
    recipientRole: {
      type: String,
      enum: ['citizen', 'admin'],
      required: true
    },
    thresholdDate: {
      type: Date,
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Compound index to guarantee no duplicate alerts for same case, alertType and recipient
AlertSentSchema.index({ caseId: 1, alertType: 1, recipientEmail: 1 }, { unique: true });

export default mongoose.model('AlertSent', AlertSentSchema);
