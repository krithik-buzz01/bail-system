import mongoose from 'mongoose';

const LegalAidContactSchema = new mongoose.Schema(
  {
    district: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    officeName: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    secretaryName: {
      type: String,
      trim: true
    },
    sourceUrl: {
      type: String,
      required: true,
      trim: true
    },
    verificationDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('LegalAidContact', LegalAidContactSchema);
