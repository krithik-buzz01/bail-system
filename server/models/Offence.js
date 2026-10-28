import mongoose from 'mongoose';
import { ANTIL_CATEGORIES } from '../config/constants.js';

const OffenceVersionSchema = new mongoose.Schema(
  {
    versionNumber: { type: Number, required: true },
    section: { type: String, required: true },
    act: { type: String, required: true },
    title: { type: String, required: true },
    maxSentenceYears: { type: Number, required: true },
    bailable: { type: Boolean, required: true },
    punishableDeathOrLife: { type: Boolean, required: true },
    antilCategory: {
      type: String,
      enum: Object.values(ANTIL_CATEGORIES),
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: { type: String, default: 'Initial version' },
    effectiveFrom: { type: Date, default: Date.now }
  },
  { _id: false }
);

const OffenceSchema = new mongoose.Schema(
  {
    section: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    act: {
      type: String,
      required: true,
      trim: true,
      default: 'Bharatiya Nyaya Sanhita, 2023'
    },
    correspondingSection: {
      type: String,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    maxSentenceYears: {
      type: Number,
      required: true,
      min: 0
    },
    bailable: {
      type: Boolean,
      required: true,
      default: false
    },
    punishableDeathOrLife: {
      type: Boolean,
      required: true,
      default: false
    },
    antilCategory: {
      type: String,
      enum: Object.values(ANTIL_CATEGORIES),
      required: true,
      default: ANTIL_CATEGORIES.A
    },
    trialCourt: {
      type: String,
      trim: true,
      default: 'Magistrate Court'
    },
    cognizable: {
      type: Boolean,
      default: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    currentVersion: {
      type: Number,
      default: 1
    },
    versions: [OffenceVersionSchema]
  },
  { timestamps: true }
);

export default mongoose.model('Offence', OffenceSchema);
