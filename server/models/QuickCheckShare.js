import mongoose from 'mongoose';

const quickCheckShareSchema = new mongoose.Schema(
  {
    shareToken: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    offences: [
      {
        section: String,
        act: String,
        title: String,
        maxSentenceYears: Number,
        bailable: Boolean,
        punishableDeathOrLife: Boolean,
        antilCategory: String
      }
    ],
    remandDate: {
      type: Date,
      required: true
    },
    isFirstOffender: {
      type: Boolean,
      default: true
    },
    hasOtherCases: {
      type: Boolean,
      default: false
    },
    results: {
      type: Object,
      required: true
    },
    ipAddress: {
      type: String,
      default: ''
    },
    viewsCount: {
      type: Number,
      default: 0
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
  },
  {
    timestamps: true
  }
);

const QuickCheckShare = mongoose.model('QuickCheckShare', quickCheckShareSchema);
export default QuickCheckShare;
