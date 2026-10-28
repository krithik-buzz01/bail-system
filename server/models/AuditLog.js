import mongoose from 'mongoose';
import { AUDIT_ACTIONS } from '../config/constants.js';

const AuditLogSchema = new mongoose.Schema(
  {
    sequenceNumber: {
      type: Number,
      required: true,
      unique: true,
      index: true
    },
    action: {
      type: String,
      enum: Object.values(AUDIT_ACTIONS),
      required: true,
      index: true
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      index: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedByName: {
      type: String,
      default: 'System'
    },
    performedByEmail: {
      type: String
    },
    role: {
      type: String,
      default: 'system'
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1'
    },
    userAgent: {
      type: String
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    previousHash: {
      type: String,
      required: true
    },
    hash: {
      type: String,
      required: true,
      index: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    // Append-only: disable automatic mongoose updating features
    timestamps: false
  }
);

// Prevent updating or deleting via pre-hooks to enforce append-only rule
AuditLogSchema.pre('updateOne', function () {
  throw new Error('AuditLog is append-only and cannot be updated');
});
AuditLogSchema.pre('updateMany', function () {
  throw new Error('AuditLog is append-only and cannot be updated');
});
AuditLogSchema.pre('findOneAndUpdate', function () {
  throw new Error('AuditLog is append-only and cannot be updated');
});
AuditLogSchema.pre('deleteOne', function () {
  throw new Error('AuditLog is append-only and cannot be deleted');
});
AuditLogSchema.pre('deleteMany', function () {
  throw new Error('AuditLog is append-only and cannot be deleted');
});
AuditLogSchema.pre('findOneAndDelete', function () {
  throw new Error('AuditLog is append-only and cannot be deleted');
});

export default mongoose.model('AuditLog', AuditLogSchema);
