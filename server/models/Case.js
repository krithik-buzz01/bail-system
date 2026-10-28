import mongoose from 'mongoose';
import { APP_STATUS } from '../config/constants.js';

const CaseOffenceSchema = new mongoose.Schema(
  {
    offenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offence',
      required: true
    },
    section: { type: String, required: true },
    act: { type: String, required: true },
    title: { type: String, required: true },
    maxSentenceYears: { type: Number, required: true },
    bailable: { type: Boolean, required: true },
    punishableDeathOrLife: { type: Boolean, required: true },
    antilCategory: { type: String, required: true },
    versionUsed: { type: Number, default: 1 }
  },
  { _id: false }
);

const CaseSchema = new mongoose.Schema(
  {
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    caseNumber: {
      type: String,
      unique: true,
      required: true
    },
    personDetails: {
      fullName: { type: String, required: true, trim: true },
      age: { type: Number, required: true, min: 18, max: 120 },
      gender: {
        type: String,
        enum: ['Male', 'Female', 'Transgender', 'Other'],
        required: true
      },
      relationship: {
        type: String,
        required: true,
        default: 'Self'
      },
      contactPhone: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      idProofType: {
        type: String,
        enum: ['Aadhaar', 'Voter ID', 'PAN Card', 'Driving License', 'Passport', 'Other'],
        default: 'Aadhaar'
      },
      idProofNumber: { type: String, trim: true }
    },
    firNumber: {
      type: String,
      required: true,
      trim: true
    },
    policeStation: {
      type: String,
      required: true,
      trim: true
    },
    district: {
      type: String,
      required: true,
      trim: true
    },
    court: {
      type: String,
      required: true,
      trim: true
    },
    offences: [CaseOffenceSchema],
    arrestDate: {
      type: Date,
      required: true
    },
    remandDate: {
      type: Date,
      required: true
    },
    priorConviction: {
      type: Boolean,
      default: false
    },
    priorConvictionDetails: {
      type: String,
      trim: true
    },
    otherPendingCases: {
      type: Boolean,
      default: false
    },
    pendingCaseDetails: {
      type: String,
      trim: true
    },
    investigationStatus: {
      type: String,
      enum: ['In Progress', 'Chargesheet Filed'],
      default: 'In Progress'
    },
    chargesheetDate: {
      type: Date
    },
    status: {
      type: String,
      enum: Object.values(APP_STATUS),
      default: APP_STATUS.DRAFT
    }
  },
  { timestamps: true }
);

export default mongoose.model('Case', CaseSchema);
