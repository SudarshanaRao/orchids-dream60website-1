// src/models/user.js 
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String },
    seq: { type: Number, default: 0 },
  },
  { timestamps: false }
);
const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

const PreferencesSchema = new mongoose.Schema(
  {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    bidAlerts: { type: Boolean, default: true },
    winNotifications: { type: Boolean, default: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      default: () => randomUUID(),
      index: true,
      unique: true,
      immutable: true,
    },

    userCode: {
      type: String,
      unique: true,
      index: true,
    },

    username: {
      type: String,
      required: [true, 'Username is required'],
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

    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, // allow multiple docs with null/undefined email
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },

    preferences: {
      type: PreferencesSchema,
      default: () => ({}),
    },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },

    // counts & monetary values
    totalAuctions: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 },
    totalAmountSpent: { type: Number, default: 0 },
    totalAmountWon: { type: Number, default: 0 },

    userType: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER',
      required: true,
    },
  },
  { timestamps: true }
);

/**
 * Pre-validate normalization
 * - normalize username/email/mobile
 * - convert empty email to null so sparse unique index works
 */
userSchema.pre('validate', function (next) {
  try {
    if (this.username) {
      this.username = String(this.username).trim().toLowerCase();
    }

    if (typeof this.email !== 'undefined') {
      // convert empty string to null so sparse index doesn't treat it as a value
      if (!this.email) this.email = null;
      else this.email = String(this.email).trim().toLowerCase();
    }

    if (this.mobile) {
      this.mobile = String(this.mobile).replace(/\D/g, '');
    }
    return next();
  } catch (err) {
    return next(err);
  }
});

/**
 * Generate userCode atomically for new users.
 * Uses counters collection with findByIdAndUpdate + $inc (atomic).
 * Format: #U + 6-digit zero-padded number (e.g. #U000001).
 */
userSchema.pre('validate', async function (next) {
  try {
    if (this.isNew && !this.userCode) {
      const counter = await Counter.findByIdAndUpdate(
        'userCode',
        { $inc: { seq: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const seqNum = String(counter.seq).padStart(6, '0');
      this.userCode = `#U${seqNum}`;
    }
    return next();
  } catch (err) {
    return next(err);
  }
});

/**
 * Pre-save hook: hash password if modified
 */
userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

/**
 * Instance helper to set password and hash it immediately.
 */
userSchema.methods.setPassword = async function (plain) {
  if (!plain) throw new Error('Password required');
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(String(plain), salt);
  return this.password;
};

/**
 * Compare provided password with stored hash. Returns boolean.
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  if (!enteredPassword) return false;
  return bcrypt.compare(String(enteredPassword), this.password);
};

/**
 * Return a public JSON-safe profile (no password, no __v, exposes user_id)
 */
userSchema.methods.publicProfile = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  delete obj.__v;
  // hide deleted contact info if deleted
  if (obj.isDeleted) {
    delete obj.email;
    delete obj.mobile;
  }
  obj.user_id = obj.user_id || obj.id;
  return obj;
};

/**
 * toJSON override to remove sensitive/internal fields and present public shape
 */
userSchema.methods.toJSON = function () {
  return this.publicProfile();
};

/**
 * Static helper: find by user_id
 */
userSchema.statics.findByUserId = function (user_id) {
  return this.findOne({ user_id });
};

userSchema.statics.findByMobile = function (Mobile) {
  return this.findOne({ mobile });
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
