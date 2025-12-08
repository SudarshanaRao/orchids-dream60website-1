// src/models/DailyAuction.js
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Counter schema for generating human-friendly codes 
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
    status: {
      type: String,
      enum: ['LIVE', 'UPCOMING', 'COMPLETED', 'CANCELLED'],
      default: 'UPCOMING',
    },
    roundCutoffPercentage: { type: Number, min: 0, max: 100, default: null },
    topBidAmountsPerRound: { type: Number, min: 1, default: 3 },
  },
  { _id: false }
);

// Schema for top 3 winners in dailyAuctionConfig
const WinnerInfoSchema = new mongoose.Schema(
  {
    rank: { type: Number, required: true, min: 1, max: 3 },
    playerId: { type: String, default: null },
    playerUsername: { type: String, default: null },
    finalBidAmount: { type: Number, default: null },
    totalAmountPaid: { type: Number, default: null },
    isPrizeClaimed: { type: Boolean, default: false },
    prizeClaimedAt: { type: Date, default: null },
    prizeClaimedBy: { type: String, default: null },
  },
  { _id: false }
);

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DailyAuctionConfigSchema = new mongoose.Schema(
  {
    auctionNumber: { type: Number, required: true, min: 1 },
    auctionId: {
      type: String,
      default: () => uuidv4(),
      match: uuidRegex,
      required: true,
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

    // ========== NEW FIELDS FOR TRACKING ==========
    isAuctionCompleted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },

    topWinners: { type: [WinnerInfoSchema], default: [] },

    // Reference to hourly auction
    hourlyAuctionId: { type: String, default: null },
  },
  { _id: false }
);

/**
 * DailyAuction - Complete replica of MasterAuction
 * Created once per day at 11:30 AM
 * Stores all master auction data for that specific day
 */
const dailyAuctionSchema = new mongoose.Schema(
  {
    dailyAuctionId: {
      type: String,
      default: () => uuidv4(),
      match: uuidRegex,
      index: true,
      unique: true,
      required: true,
      immutable: true,
    },

    // Human-friendly code (e.g., DA000001)
    dailyAuctionCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    // Reference to master auction
    masterId: {
      type: String,
      required: true,
      index: true,
    },

    // Date for this daily auction
    auctionDate: {
      type: Date,
      required: true,
      index: true,
    },

    // Complete master auction data (replicated)
    createdBy: {
      type: String,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    totalAuctionsPerDay: {
      type: Number,
      required: true,
      min: 0,
    },

    // Array of auction configurations (copied from master)
    dailyAuctionConfig: {
      type: [DailyAuctionConfigSchema],
      default: [],
    },

    // Status for the entire daily auction
    Status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'ACTIVE',
    },

    // ========== NEW FIELDS FOR DAILY TRACKING ==========
    isAllAuctionsCompleted: { type: Boolean, default: false },
    completedAuctionsCount: { type: Number, default: 0 },
    totalParticipantsToday: { type: Number, default: 0 },
    totalRevenueToday: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index for unique daily auctions
dailyAuctionSchema.index({ masterId: 1, auctionDate: 1 }, { unique: true });

/**
 * Generate human-friendly dailyAuctionCode
 * Format: DA + 6-digit zero-padded number (e.g., DA000001)
 */
dailyAuctionSchema.pre('validate', async function (next) {
  try {
    if (this.isNew && !this.dailyAuctionCode) {
      const counter = await Counter.findByIdAndUpdate(
        'dailyAuctionCode',
        { $inc: { seq: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      const seqNum = String(counter.seq).padStart(6, '0');
      this.dailyAuctionCode = `DA${seqNum}`;
    }
    return next();
  } catch (err) {
    return next(err);
  }
});

/**
 * Instance helper to return public-safe object
 */
dailyAuctionSchema.methods.publicProfile = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  return obj;
};

dailyAuctionSchema.methods.toJSON = function () {
  return this.publicProfile();
};

/**
 * Static helper: find by dailyAuctionId
 */
dailyAuctionSchema.statics.findByDailyAuctionId = function (dailyAuctionId) {
  return this.findOne({ dailyAuctionId });
};

/**
 * Static helper: find auctions by date (entire day)
 */
dailyAuctionSchema.statics.findByDate = function (date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.find({
    auctionDate: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  }).sort({ createdAt: 1 });
};

/**
 * Static helper: get today's daily auctions
 */
dailyAuctionSchema.statics.findToday = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return this.findByDate(today);
};

/**
 * Static helper: find the latest active daily auction
 */
dailyAuctionSchema.statics.findLatestActive = function () {
  return this.findOne({ isActive: true }).sort({ createdAt: -1 });
};

module.exports = mongoose.models.DailyAuction || mongoose.model('DailyAuction', dailyAuctionSchema);
