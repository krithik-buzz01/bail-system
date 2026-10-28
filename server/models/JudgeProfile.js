import mongoose from 'mongoose';

const JudgeProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    court: {
      type: String,
      required: true,
      trim: true
    },
    bench: {
      type: String,
      required: true,
      trim: true
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    inviteTokenHash: {
      type: String
    },
    inviteExpiresAt: {
      type: Date
    },
    isInviteAccepted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model('JudgeProfile', JudgeProfileSchema);
