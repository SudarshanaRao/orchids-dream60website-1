// src/models/masterAuction.js
const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

// Reuse a small Counter schema (if you later want human-friendly codes) 
const counterSchema = new mongoose.Schema(
  { _id: { type: String }, seq: { type: Number, default: 0 } },
  { timestamps: false }
);
const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

const FeeSplitsSchema = new mongoose.Schema(
  {
    BoxA: { type: Number, required: true, min: 0 },
    BoxB: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const RoundConfigSchema = new mongoose.Schema(
  {
    round: { type: Number, required: true, min: 1 },
    minPlayers: { type: Number, min: 0, default: null },
    duration: { type: Number, min: 1, default: 15 }, // minutes
    maxBid: { type: Number, min: 0, default: null },
    roundCutoffPercentage: { type: Number, min: 0, max: 100, default: null },
    topBidAmountsPerRound: { type: Number, min: 1, default: 3 },
  },
  { _id: false }
);

const DailyAuctionSchema = new mongoose.Schema(
  {
    auctionNumber: { type: Number, required: true, min: 1 },
    auctionId: {
      type: String,
      default: () => randomUUID(),
      match: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      required: true,
      index: true,
      unique: true,
      immutable: true,
    },
    TimeSlot: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    auctionName: { type: String, required: true, trim: true },
    prizeValue: { type: Number, required: true, min: 0 },
    Status: {
      type: String,
      enum: ['LIVE', 'UPCOMING', 'COMPLETED', 'CANCELLED'],
      default: 'UPCOMING',
    },
    maxDiscount: { type: Number, min: 0, max: 100, default: 0 },
    EntryFee: { type: String, enum: ['RANDOM', 'MANUAL'], required: true },
    minEntryFee: { type: Number, min: 0, default: null },
    maxEntryFee: { type: Number, min: 0, default: null },
    FeeSplits: { type: FeeSplitsSchema, default: null },
    roundCount: { type: Number, min: 1, default: 4 },
    roundConfig: { type: [RoundConfigSchema], default: [] },
    imageUrl: { type: String, default: null },
  },
  { _id: false }
);

const masterAuctionSchema = new mongoose.Schema(
  {
    master_id: {
      type: String,
      default: () => randomUUID(),
      index: true,
      unique: true,
      immutable: true,
    },

    createdBy: {
      type: String,
      required: [true, 'createdBy (UUID) is required'],
    },

    modifiedBy: { type: String, default: null },

    isActive: { type: Boolean, default: true },

    totalAuctionsPerDay: { type: Number, required: true, min: 0 },

    dailyAuctionConfig: { type: [DailyAuctionSchema], default: [] },

    // optional human-friendly code (example): MA000001
    masterCode: { type: String, unique: true, sparse: true, index: true },
  },
  { timestamps: true }
);

/**
 * Pre-validate normalization and conditional validations
 */
masterAuctionSchema.pre('validate', async function (next) {
  try {
    // normalize TimeSlot strings inside dailyAuctionConfig
    if (Array.isArray(this.dailyAuctionConfig)) {
      for (let i = 0; i < this.dailyAuctionConfig.length; i++) {
        const a = this.dailyAuctionConfig[i];
        if (a && a.TimeSlot) {
          a.TimeSlot = String(a.TimeSlot).trim();
        }

        // EntryFee RANDOM requires minEntryFee & maxEntryFee
        if (a && a.EntryFee === 'RANDOM') {
          if (a.minEntryFee == null || a.maxEntryFee == null) {
            return next(new Error(`dailyAuctionConfig[${i}]: minEntryFee and maxEntryFee are required when EntryFee is RANDOM`));
          }
        }

        // EntryFee MANUAL requires FeeSplits
        if (a && a.EntryFee === 'MANUAL') {
          if (!a.FeeSplits || typeof a.FeeSplits.BoxA !== 'number' || typeof a.FeeSplits.BoxB !== 'number') {
            return next(new Error(`dailyAuctionConfig[${i}]: FeeSplits (BoxA/BoxB) required when EntryFee is MANUAL`));
          }
        }

        // If roundCount != 4 require roundConfig
        if (a && a.roundCount && a.roundCount !== 4) {
          if (!Array.isArray(a.roundConfig) || a.roundConfig.length === 0) {
            return next(new Error(`dailyAuctionConfig[${i}]: roundConfig required when roundCount != 4`));
          }
        }
      }
    }

    return next();
  } catch (err) {
    return next(err);
  }
});

/**
 * Generate human friendly masterCode atomically (optional)
 * Format: MA + 6-digit zero-padded number (e.g. MA000001)
 */
masterAuctionSchema.pre('validate', async function (next) {
  try {
    if (this.isNew && !this.masterCode) {
      const counter = await Counter.findByIdAndUpdate(
        'masterAuctionCode',
        { $inc: { seq: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      const seqNum = String(counter.seq).padStart(6, '0');
      this.masterCode = `MA${seqNum}`;
    }
    return next();
  } catch (err) {
    return next(err);
  }
});

/**
 * Instance helper to return public-safe object
 */
masterAuctionSchema.methods.publicProfile = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  return obj;
};

masterAuctionSchema.methods.toJSON = function () {
  return this.publicProfile();
};

/**
 * Static helper: find by master_id
 */
masterAuctionSchema.statics.findByMasterId = function (master_id) {
  return this.findOne({ master_id });
};

module.exports = mongoose.models.MasterAuction || mongoose.model('MasterAuction', masterAuctionSchema);