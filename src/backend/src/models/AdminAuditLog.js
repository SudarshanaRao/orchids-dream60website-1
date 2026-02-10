const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: String,
      required: true,
      index: true,
    },
    adminUsername: {
      type: String,
      required: true,
    },
    adminEmail: {
      type: String,
    },
    action: {
      type: String,
      required: true,
      enum: ['VIEW_MOBILE_NUMBER'],
      index: true,
    },
    targetUserId: {
      type: String,
      index: true,
    },
    targetUsername: {
      type: String,
    },
    details: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  { timestamps: true }
);

adminAuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.models.AdminAuditLog || mongoose.model('AdminAuditLog', adminAuditLogSchema);
