// src/models/HourlyAuction.js
const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

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
    roundCutoffPercentage: { type: Number, min: 0, max: 100, default: null },
    topBidAmountsPerRound: { type: Number, min: 1, default: 3 },
  },
  { _id: false }
);

// Schema for tracking player bids in each round
const RoundPlayerAuctionSchema = new mongoose.Schema(
  {
    playerId: { type: String, required: true },
    playerUsername: { type: String, required: true },
    auctionPlacedAmount: { type: Number, required: true, min: 0 },
    auctionPlacedTime: { type: Date, default: Date.now },
    isQualified: { type: Boolean, default: false },
    rank: { type: Number, default: null },
  },
  { _id: false }
);

// Schema for tracking each round's data
const RoundDataSchema = new mongoose.Schema(
  {
    roundNumber: { type: Number, required: true, min: 1 },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    totalParticipants: { type: Number, default: 0 },
    playersData: { type: [RoundPlayerAuctionSchema], default: [] },
    qualifiedPlayers: { type: [String], default: [] }, // Array of player IDs
    status: { 
      type: String, 
      enum: ['PENDING', 'ACTIVE', 'COMPLETED'], 
      default: 'PENDING' 
    },
  },
  { _id: false }
);

// Schema for tracking participants
const ParticipantSchema = new mongoose.Schema(
  {
    playerId: { type: String, required: true },
    playerUsername: { type: String, required: true },
    entryFee: { type: Number, required: true, min: 0 },
    joinedAt: { type: Date, default: Date.now },
    currentRound: { type: Number, default: 1 },
    isEliminated: { type: Boolean, default: false },
    eliminatedInRound: { type: Number, default: null },
    totalBidsPlaced: { type: Number, default: 0 },
    totalAmountBid: { type: Number, default: 0 },
  },
  { _id: false }
);

// Schema for winners (top 3)
const WinnerSchema = new mongoose.Schema(
  {
    rank: { type: Number, required: true, min: 1, max: 3 },
    playerId: { type: String, required: true },
    playerUsername: { type: String, required: true },
    finalAuctionAmount: { type: Number, required: true },
    totalAmountPaid: { type: Number, required: true },
    prizeAmount: { type: Number, required: true },
    isPrizeClaimed: { type: Boolean, default: false },
    prizeClaimedAt: { type: Date, default: null },
  },
  { _id: false }
);

/**
 * HourlyAuction - Individual auction instance
 * Created from DailyAuction's config array
 * Represents a single auction at a specific time slot
 */
const hourlyAuctionSchema = new mongoose.Schema(
  {
    hourlyAuctionId: {
      type: String,
      default: () => randomUUID(),
      index: true,
      unique: true,
      immutable: true,
    },
    
    // Human-friendly code (e.g., HA000001)
    hourlyAuctionCode: { 
      type: String, 
      unique: true, 
      sparse: true, 
      index: true 
    },
    
    // Reference to daily auction
    dailyAuctionId: {
      type: String,
      required: true,
      index: true,
    },
    
    // Reference to master auction
    masterId: {
      type: String,
      required: true,
      index: true,
    },
    
    // Date for this auction
    auctionDate: {
      type: Date,
      required: true,
      index: true,
    },
    
    // Inherited from dailyAuctionConfig
    auctionNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    
    TimeSlot: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    
    auctionName: {
      type: String,
      required: true,
      trim: true,
    },
    
    prizeValue: {
      type: Number,
      required: true,
      min: 0,
    },
    
    Status: {
      type: String,
      enum: ['LIVE', 'UPCOMING', 'COMPLETED', 'CANCELLED'],
      default: 'UPCOMING',
      index: true,
    },
    
    // ========== NEW: Early Completion Flag ==========
    // Set to true when winners are announced before auction completion
    // (when qualified players ≤ 3 in any round)
    winnersAnnounced: {
      type: Boolean,
      default: false,
    },
    
    maxDiscount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    
    EntryFee: {
      type: String,
      enum: ['RANDOM', 'MANUAL'],
      required: true,
    },
    
    minEntryFee: {
      type: Number,
      min: 0,
      default: null,
    },
    
    maxEntryFee: {
      type: Number,
      min: 0,
      default: null,
    },
    
    FeeSplits: {
      type: FeeSplitsSchema,
      default: null,
    },
    
    roundCount: {
      type: Number,
      min: 1,
      default: 4,
    },
    
    roundConfig: {
      type: [RoundConfigSchema],
      default: [],
    },
    
    imageUrl: {
      type: String,
      default: null,
    },
    
    // ========== NEW FIELDS FOR PLAYER TRACKING ==========
    
    // List of all participants
    participants: {
      type: [ParticipantSchema],
      default: [],
    },
    
    // Detailed round-by-round data
    rounds: {
      type: [RoundDataSchema],
      default: [],
    },
    
    // Top 3 winners
    winners: {
      type: [WinnerSchema],
      default: [],
    },
    
    // Auction runtime data
    totalParticipants: {
      type: Number,
      default: 0,
    },
    
    currentRound: {
      type: Number,
      default: 1,
      min: 1,
    },
    
    totalBids: {
      type: Number,
      default: 0,
    },
    
    totalPrizePool: {
      type: Number,
      default: 0,
    },
    
    // Winner information (primary winner - rank 1)
    winnerId: {
      type: String,
      default: null,
    },
    
    winnerUsername: {
      type: String,
      default: null,
    },
    
    winningBid: {
      type: Number,
      default: null,
    },
    
    // Timestamps for auction lifecycle
    startedAt: {
      type: Date,
      default: null,
    },
    
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound indexes
hourlyAuctionSchema.index({ dailyAuctionId: 1, TimeSlot: 1 }, { unique: true });
hourlyAuctionSchema.index({ masterId: 1, auctionDate: 1, TimeSlot: 1 });
hourlyAuctionSchema.index({ auctionDate: 1, Status: 1 });

/**
 * Generate human-friendly hourlyAuctionCode
 * Format: HA + 6-digit zero-padded number (e.g., HA000001)
 */
hourlyAuctionSchema.pre('validate', async function (next) {
  try {
    if (this.isNew && !this.hourlyAuctionCode) {
      const counter = await Counter.findByIdAndUpdate(
        'hourlyAuctionCode',
        { $inc: { seq: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      const seqNum = String(counter.seq).padStart(6, '0');
      this.hourlyAuctionCode = `HA${seqNum}`;
    }
    return next();
  } catch (err) {
    return next(err);
  }
});

/**
 * Instance helper to return public-safe object
 */
hourlyAuctionSchema.methods.publicProfile = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  return obj;
};

hourlyAuctionSchema.methods.toJSON = function () {
  return this.publicProfile();
};

/**
 * Static helper: find by hourlyAuctionId
 */
hourlyAuctionSchema.statics.findByHourlyAuctionId = function (hourlyAuctionId) {
  return this.findOne({ hourlyAuctionId });
};

/**
 * Static helper: find auctions by date
 */
hourlyAuctionSchema.statics.findByDate = function (date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    auctionDate: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  }).sort({ TimeSlot: 1 });
};

/**
 * Static helper: get today's auctions
 */
hourlyAuctionSchema.statics.findToday = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return this.findByDate(today);
};

/**
 * Static helper: find by daily auction ID
 */
hourlyAuctionSchema.statics.findByDailyAuctionId = function (dailyAuctionId) {
  return this.find({ dailyAuctionId }).sort({ TimeSlot: 1 });
};

/**
 * Static helper: get current live auction
 */
hourlyAuctionSchema.statics.findCurrentLive = function () {
  return this.findOne({ Status: 'LIVE' }).sort({ startedAt: -1 });
};

/**
 * Static helper: get upcoming auctions
 */
hourlyAuctionSchema.statics.findUpcoming = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.find({
    Status: 'UPCOMING',
    auctionDate: { $gte: today },
  }).sort({ auctionDate: 1, TimeSlot: 1 });
};

module.exports = mongoose.models.HourlyAuction || mongoose.model('HourlyAuction', hourlyAuctionSchema);