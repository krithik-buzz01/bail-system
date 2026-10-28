import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
      index: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    fileType: {
      type: String,
      enum: ['FIR_COPY', 'REMAND_ORDER', 'ID_PROOF', 'MEDICAL_REPORT', 'BAIL_PETITION', 'OTHER'],
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    storageType: {
      type: String,
      enum: ['local', 'cloudinary'],
      default: 'local'
    },
    verificationStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected', 'Requested'],
      default: 'Pending'
    },
    remarks: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('Document', DocumentSchema);
