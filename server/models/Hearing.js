import mongoose from 'mongoose';

const hearingSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BailApplication',
      required: true,
      index: true
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
      index: true
    },
    judgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    hearingDate: {
      type: Date,
      required: true,
      index: true
    },
    startTime: {
      type: String, // e.g. "10:30"
      default: '10:30'
    },
    endTime: {
      type: String, // e.g. "11:00"
      default: '11:00'
    },
    courtRoom: {
      type: String,
      required: true,
      trim: true
    },
    bench: {
      type: String,
      default: 'Regular Sessions Bench'
    },
    purpose: {
      type: String,
      default: 'Bail Application Hearing'
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Adjourned', 'Completed', 'Cancelled'],
      default: 'Scheduled',
      index: true
    },
    adjournmentReason: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const Hearing = mongoose.model('Hearing', hearingSchema);
export default Hearing;
