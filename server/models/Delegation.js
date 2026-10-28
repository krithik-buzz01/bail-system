import mongoose from 'mongoose';

const delegationSchema = new mongoose.Schema(
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
    delegateEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    delegateName: {
      type: String,
      required: true,
      trim: true
    },
    delegatePhone: {
      type: String,
      default: ''
    },
    relationship: {
      type: String,
      required: true,
      trim: true // e.g. "Spouse", "Mother", "Advocate"
    },
    inviteToken: {
      type: String,
      unique: true,
      sparse: true
    },
    inviteTokenExpires: {
      type: Date
    },
    delegateUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['Invited', 'Active', 'Revoked'],
      default: 'Invited',
      index: true
    },
    revokedAt: {
      type: Date
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    revokeReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const Delegation = mongoose.model('Delegation', delegationSchema);
export default Delegation;
