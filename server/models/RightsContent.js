import mongoose from 'mongoose';

const RightsContentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    titleEn: {
      type: String,
      required: true,
      trim: true
    },
    titleTa: {
      type: String,
      required: true,
      trim: true
    },
    descriptionEn: {
      type: String,
      required: true,
      trim: true
    },
    descriptionTa: {
      type: String,
      required: true,
      trim: true
    },
    legalBasis: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true,
      default: 'Arrest & Custody'
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('RightsContent', RightsContentSchema);
