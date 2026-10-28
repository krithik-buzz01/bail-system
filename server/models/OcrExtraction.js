import mongoose from 'mongoose';

const ocrExtractionSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
      index: true
    },
    extractedFields: {
      firNumber: { type: String, default: '' },
      policeStation: { type: String, default: '' },
      remandDate: { type: Date, default: null },
      sectionsCharged: [{ type: String }],
      accusedName: { type: String, default: '' },
      courtName: { type: String, default: '' }
    },
    confidenceScores: {
      type: Map,
      of: Number,
      default: {}
    },
    rawText: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Pending Confirmation', 'Confirmed', 'Rejected'],
      default: 'Pending Confirmation',
      index: true
    },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    confirmedAt: {
      type: Date
    },
    confirmedFields: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

const OcrExtraction = mongoose.model('OcrExtraction', ocrExtractionSchema);
export default OcrExtraction;
