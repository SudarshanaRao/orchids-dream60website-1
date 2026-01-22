const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const emailTemplateSchema = new mongoose.Schema(
  {
    template_id: {
      type: String,
      default: uuidv4,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true, // Allow nulls while ensuring uniqueness for non-nulls
      trim: true,
      lowercase: true
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    body: {
      type: String,
      required: [true, 'Email body is required'],
    },
    category: {
      type: String,
      enum: ['PRIZE_CLAIM', 'GENERAL', 'MARKETING', 'NOTIFICATION', 'CUSTOM'],
      default: 'CUSTOM',
    },
    createdBy: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

emailTemplateSchema.index({ category: 1, isActive: 1 });
emailTemplateSchema.index({ createdBy: 1 });

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);

module.exports = EmailTemplate;