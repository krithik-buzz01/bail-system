import mongoose from 'mongoose';

const AssessmentSchema = new mongoose.Schema(
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
      required: true
    },
    inputsSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    outputs: {
      verdict: { type: String, required: true },
      legalBasis: { type: String, required: true },
      plainReasoning: { type: String, required: true },
      recommendedNextSteps: [{ type: String }],
      isBailableAll: { type: Boolean, default: false },
      bnss187: {
        thresholdDays: Number,
        daysElapsed: Number,
        daysRemaining: Number,
        thresholdDate: Date,
        isMatured: Boolean,
        progressPercentage: Number,
        heinousCategory: Boolean
      },
      bnss479: {
        isEligible: Boolean,
        fractionApplied: Number,
        thresholdDays: Number,
        daysServed: Number,
        daysRemaining: Number,
        thresholdDate: Date,
        excludedDeathOrLife: Boolean,
        multipleCasesFlagged: Boolean,
        steps: [String]
      },
      antilCategory: String,
      statutoryTriggersMet: [String]
    },
    ruleVersions: [
      {
        offenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offence' },
        section: String,
        versionNumber: Number
      }
    ],
    computedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model('Assessment', AssessmentSchema);
