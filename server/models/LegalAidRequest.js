import mongoose from 'mongoose';

const legalAidRequestSchema = new mongoose.Schema(
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
    dlsaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LegalAidContact'
    },
    district: {
      type: String,
      required: true
    },
    incomeCategory: {
      type: String,
      enum: ['Below Poverty Line', 'Marginal Income', 'Incarcerated Undertrial', 'Special Category (Women/SC/ST)'],
      default: 'Incarcerated Undertrial'
    },
    incomeProofPath: {
      type: String,
      default: ''
    },
    reasonForRequest: {
      type: String,
      required: true
    },
    assignedAdvocate: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      enrollmentNumber: { type: String, default: '' },
      assignedDate: { type: Date }
    },
    status: {
      type: String,
      enum: ['Submitted', 'Under Review', 'Assigned', 'Rejected', 'Completed'],
      default: 'Submitted',
      index: true
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    history: [
      {
        status: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        remarks: String
      }
    ]
  },
  {
    timestamps: true
  }
);

const LegalAidRequest = mongoose.model('LegalAidRequest', legalAidRequestSchema);
export default LegalAidRequest;
