import mongoose from 'mongoose';

const DraftTemplateSchema = new mongoose.Schema(
  {
    templateType: {
      type: String,
      enum: ['REGULAR_BAIL', 'DEFAULT_BAIL', 'SECTION_479_BAIL', 'GENERAL'],
      required: true,
      unique: true
    },
    title: {
      type: String,
      required: true
    },
    courtHeadingTemplate: {
      type: String,
      required: true
    },
    partyDetailsTemplate: {
      type: String,
      required: true
    },
    factsTemplate: {
      type: String,
      required: true
    },
    groundsTemplate: {
      type: String,
      required: true
    },
    prayerTemplate: {
      type: String,
      required: true
    },
    verificationTemplate: {
      type: String,
      required: true
    },
    placeholders: [
      {
        type: String
      }
    ],
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

export default mongoose.model('DraftTemplate', DraftTemplateSchema);
