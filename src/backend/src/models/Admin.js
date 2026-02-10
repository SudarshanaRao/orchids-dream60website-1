// src/models/Admin.js - Separate admin collection, no link to User model
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const adminSchema = new mongoose.Schema(
  {
    admin_id: {
      type: String,
      default: () => randomUUID(),
      index: true,
      unique: true,
      immutable: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      index: true,
      match: [/^[0-9]{7,15}$/, 'Please enter a valid mobile number'],
      set: (v) => (v ? String(v).replace(/\D/g, '') : v),
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    adminType: {
      type: String,
      enum: ['ADMIN', 'SUPER_ADMIN', 'DEVELOPER'],
      default: 'ADMIN',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    personalAccessCode: {
      type: String,
      select: false,
    },
    accessCodeCreatedAt: {
      type: Date,
    },
    accessCodeResetOtp: {
      type: String,
      select: false,
    },
    accessCodeResetOtpExpiry: {
      type: Date,
      select: false,
    },
    mobileViewOtp: {
      type: String,
      select: false,
    },
    mobileViewOtpExpiry: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

adminSchema.pre('validate', function (next) {
  try {
    if (this.username) this.username = String(this.username).trim().toLowerCase();
    if (this.email) this.email = String(this.email).trim().toLowerCase();
    if (this.mobile) this.mobile = String(this.mobile).replace(/\D/g, '');
    return next();
  } catch (err) {
    return next(err);
  }
});

adminSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

adminSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password || !enteredPassword) return false;
  return bcrypt.compare(String(enteredPassword), this.password);
};

adminSchema.methods.compareAccessCode = async function (enteredCode) {
  if (!this.personalAccessCode || !enteredCode) return false;
  return bcrypt.compare(String(enteredCode), this.personalAccessCode);
};

adminSchema.methods.publicProfile = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
