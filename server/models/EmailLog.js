import mongoose from 'mongoose';

const EmailLogSchema = new mongoose.Schema(
  {
    to: {
      type: String,
      required: true,
      index: true
    },
    subject: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['SENT', 'FAILED', 'SIMULATED'],
      required: true,
      index: true
    },
    templateName: {
      type: String
    },
    previewHtml: {
      type: String
    },
    previewText: {
      type: String
    },
    errorMessage: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('EmailLog', EmailLogSchema);
