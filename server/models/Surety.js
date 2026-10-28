import mongoose from 'mongoose';

const suretySchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
      index: true
    },
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    relationship: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    solvencyAmount: {
      type: Number,
      required: true,
      min: 0
    },
    idProofType: {
      type: String,
      enum: ['Aadhaar', 'Voter ID', 'PAN Card', 'Ration Card', 'Passport', 'Driving License'],
      default: 'Aadhaar'
    },
    idProofNumber: {
      type: String,
      required: true,
      trim: true
    },
    documentPath: {
      type: String,
      default: ''
    },
    documentOriginalName: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Pending Verification', 'Verified', 'Rejected'],
      default: 'Pending Verification',
      index: true
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    verifiedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

const Surety = mongoose.model('Surety', suretySchema);
export default Surety;
