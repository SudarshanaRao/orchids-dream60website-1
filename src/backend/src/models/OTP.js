// src/models/OTP.js
const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['mobile', 'email'],
    required: true,
    index: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // expire after 5 minutes
    expires: 300,
  },
});

// Optional compound index to ensure unique active OTP per identifier+type 
OTPSchema.index({ identifier: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('OTP', OTPSchema);
