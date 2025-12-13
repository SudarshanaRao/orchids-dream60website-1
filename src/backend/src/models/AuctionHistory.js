// src/models/AuctionHistory.js
const mongoose = require('mongoose');
const { sendPrizeClaimWinnerEmail, sendWaitingQueueEmail } = require('../utils/emailService');
const User = require('./user');

/**
 * Helper function to get current IST time
 * Returns a Date object representing the current time in IST timezone
 */
const getISTTime = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  return new Date(now.getTime() + istOffset);
};

/**
 * AuctionHistory - Tracks individual user participation in auctions
 * Created when user joins an auction
 * Updated when auction completes to mark winners
 */
const auctionHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    
    username: {
      type: String,
      required: true,
    },
    
    hourlyAuctionId: {
      type: String,
      required: true,
      index: true,
    },
    
    dailyAuctionId: {
      type: String,
      required: true,
    },
    
    auctionDate: {
      type: Date,
      required: true,
      index: true,
    },
    
    auctionName: {
      type: String,
      required: true,
    },
    
    prizeValue: {
      type: Number,
      required: true,
    },
    
    TimeSlot: {
      type: String,
      required: true,
    },
    
    // Entry fee paid by user
    entryFeePaid: {
      type: Number,
      required: true,
      default: 0,
    },
    
    // Total amount bid across all rounds
    totalAmountBid: {
      type: Number,
      default: 0,
    },
    
    // Total amount spent (entry fee + bids)
    totalAmountSpent: {
      type: Number,
      default: 0,
    },
    
    // Number of rounds participated
    roundsParticipated: {
      type: Number,
      default: 0,
    },
    
    // Total bids placed
    totalBidsPlaced: {
      type: Number,
      default: 0,
    },
    
    // Total participants in this hourly auction
    totalParticipants: {
      type: Number,
      default: 0,
    },
    
    // ========== WINNER TRACKING ==========

    // Whether user won this auction (rank 1, 2, or 3)
    isWinner: {
      type: Boolean,
      default: false,
    },

    // User's final rank (1-3 for winners, null for non-winners)
    finalRank: {
      type: Number,
      default: null,
      min: 1,
      max: 3,
    },

    // Prize amount won (0 for non-winners)
    prizeAmountWon: {
      type: Number,
      default: 0,
    },

    // Whether user was eliminated
    isEliminated: {
      type: Boolean,
      default: false,
    },

    // Round in which user was eliminated
    eliminatedInRound: {
      type: Number,
      default: null,
    },

    // Auction status when this record was created/updated
    auctionStatus: {
      type: String,
      enum: ['JOINED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'JOINED',
    },

    // When user joined the auction
    joinedAt: {
      type: Date,
      default: Date.now,
    },

    // When auction was completed
    completedAt: {
      type: Date,
      default: null,
    },

    // ========== PRIZE CLAIM FIELDS (FOR RANK 1 WINNER) ==========

    // UPI ID for prize transfer (only for rank 1 winner)
    claimUpiId: {
      type: String,
      default: null,
    },

    // Remaining product fees to be paid to claim prize
    remainingProductFees: {
      type: Number,
      default: 0,
    },

    // Bid amount placed in the last round before completion (amount winner needs to pay)
    lastRoundBidAmount: {
      type: Number,
      default: 0,
    },

    // Whether remaining fees have been paid
    remainingFeesPaid: {
      type: Boolean,
      default: false,
    },

    // Payment reference for remaining fees
    remainingFeesPaymentRef: {
      type: String,
      default: null,
    },

    // Prize claim status
    prizeClaimStatus: {
      type: String,
      enum: ['PENDING', 'CLAIMED', 'EXPIRED', 'NOT_APPLICABLE'],
      default: 'NOT_APPLICABLE',
    },

    // Deadline to claim prize (30 minutes from completion for rank 1)
    claimDeadline: {
      type: Date,
      default: null,
    },

    // When prize was claimed
    claimedAt: {
      type: Date,
      default: null,
    },

    // Prize claim notes/remarks
    claimNotes: {
      type: String,
      default: null,
    },

    // ✅ NEW: Track who actually claimed the prize (for other winners to see)
    claimedBy: {
      type: String,
      default: null,
    },

    // ✅ NEW: Track which rank claimed the prize (for other winners to see)
    claimedByRank: {
      type: Number,
      default: null,
      min: 1,
      max: 3,
    },

    // ========== PRIORITY CLAIM SYSTEM (NEW) ==========

    // Which rank (1, 2, or 3) is currently eligible to claim
    // This starts at 1, then moves to 2 if rank 1 doesn't claim, then to 3
    currentEligibleRank: {
      type: Number,
      default: null,
      min: 1,
      max: 3,
    },

    // When the current rank's 30-minute claim window started
    claimWindowStartedAt: {
      type: Date,
      default: null,
    },

    // Track which ranks have been given a chance (for logging)
    ranksOffered: {
      type: [Number],
      default: [],
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate entries
auctionHistorySchema.index({ userId: 1, hourlyAuctionId: 1 }, { unique: true });

// Index for querying user's history
auctionHistorySchema.index({ userId: 1, auctionDate: -1 });

// Index for querying winners
auctionHistorySchema.index({ isWinner: 1, finalRank: 1 });

// Index for prize claim status
auctionHistorySchema.index({ prizeClaimStatus: 1, claimDeadline: 1 });

/**
 * Static method: Create auction history entry when user joins
 */
auctionHistorySchema.statics.createEntry = async function(data) {
  try {
    const entry = await this.create({
      userId: data.userId,
      username: data.username,
      hourlyAuctionId: data.hourlyAuctionId,
      dailyAuctionId: data.dailyAuctionId,
      auctionDate: data.auctionDate,
      auctionName: data.auctionName,
      prizeValue: data.prizeValue,
      TimeSlot: data.TimeSlot,
      entryFeePaid: data.entryFeePaid || 0,
      auctionStatus: 'JOINED',
      joinedAt: getISTTime(), // ✅ Use IST time
    });

    console.log(`✅ [AUCTION_HISTORY] Created entry for user ${data.username} in auction ${data.hourlyAuctionId}`);
    return entry;
  } catch (error) {
    // If duplicate, update existing
    if (error.code === 11000) {
      console.log(`⚠️ [AUCTION_HISTORY] Entry already exists for user ${data.username} in auction ${data.hourlyAuctionId}`);
      return await this.findOne({
        userId: data.userId,
        hourlyAuctionId: data.hourlyAuctionId,
      });
    }
    throw error;
  }
};

/**
 * Static method: Update entry with bid information
 */
auctionHistorySchema.statics.updateBidInfo = async function(userId, hourlyAuctionId, bidData) {
  try {
    const updated = await this.findOneAndUpdate(
      { userId, hourlyAuctionId },
      {
        $inc: {
          totalAmountBid: bidData.bidAmount || 0,
          totalBidsPlaced: 1,
          roundsParticipated: bidData.isFirstBidInRound ? 1 : 0,
        },
        $set: {
          auctionStatus: 'IN_PROGRESS',
        },
      },
      { new: true }
    );

    // Update totalAmountSpent
    if (updated) {
      updated.totalAmountSpent = updated.entryFeePaid + updated.totalAmountBid;
      await updated.save();
    }

    return updated;
  } catch (error) {
    console.error(`❌ [AUCTION_HISTORY] Error updating bid info:`, error);
    throw error;
  }
};

/**
 * Static method: Mark winners after auction completion
 */
auctionHistorySchema.statics.markWinners = async function(hourlyAuctionId, winners, totalParticipants = 0) {
  try {
    const updates = [];
    const now = getISTTime(); // ✅ Use IST time

    for (const winner of winners) {
      // ✅ Calculate deadline based on rank (fixed time slots from winners announcement)
      // Rank 1: 0-15 mins, Rank 2: 16-30 mins, Rank 3: 31-45 mins
      const claimWindowStart = new Date(now.getTime() + (winner.rank - 1) * 15 * 60 * 1000);
      const claimDeadline = new Date(now.getTime() + winner.rank * 15 * 60 * 1000);

      const updateData = {
        isWinner: true,
        finalRank: winner.rank,
        prizeAmountWon: winner.prizeAmount || 0,
        lastRoundBidAmount: winner.finalAuctionAmount || 0,
        auctionStatus: 'COMPLETED',
        completedAt: now, // ✅ Use IST time
        prizeClaimStatus: 'PENDING',
        claimDeadline: claimDeadline, // ✅ IST-based deadline
        totalParticipants: totalParticipants,
        // ✅ NEW: Fixed time slots - rank 1 starts immediately, others wait
        currentEligibleRank: 1, // All winners see that rank 1 is currently eligible
        claimWindowStartedAt: claimWindowStart, // ✅ IST-based window start
        ranksOffered: [1], // Track that rank 1 has been offered
      };

      // Calculate remaining fees based on rank
      if (winner.rank === 1) {
        updateData.remainingProductFees = Math.round((winner.prizeAmount || 0) * 0.1);
      } else if (winner.rank === 2) {
        updateData.remainingProductFees = Math.round((winner.prizeAmount || 0) * 0.05);
      } else if (winner.rank === 3) {
        updateData.remainingProductFees = Math.round((winner.prizeAmount || 0) * 0.03);
      }

      // ✅ Log times in readable IST format
      const istFormatter = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      console.log(`🎯 [PRIORITY_CLAIM] Auction ${hourlyAuctionId} - Rank ${winner.rank} Winner ${winner.playerUsername}`);
      console.log(`     💰 Last round bid: ₹${winner.finalAuctionAmount || 0}`);
      console.log(`     ⏰ Completed at IST: ${istFormatter.format(now)}`);
      console.log(`     ⏰ Claim window: ${istFormatter.format(claimWindowStart)} to ${istFormatter.format(claimDeadline)}`);
      if (winner.rank === 1) {
        console.log(`     ✅ Rank 1 can claim NOW (0-15 mins)`);
      } else if (winner.rank === 2) {
        console.log(`     ⏳ Rank 2 in waiting queue (claim window opens at 16 mins)`);
      } else if (winner.rank === 3) {
        console.log(`     ⏳ Rank 3 in waiting queue (claim window opens at 31 mins)`);
      }

      const update = await this.findOneAndUpdate(
        { 
          userId: winner.playerId, 
          hourlyAuctionId 
        },
        {
          $set: updateData,
        },
        { new: true }
      );

      if (update) {
        updates.push(update);
        console.log(`🏆 [AUCTION_HISTORY] Marked ${winner.playerUsername} as WINNER (Rank ${winner.rank}) in auction ${hourlyAuctionId}`);

        // ✅ Send email notification to winners
        try {
          const user = await User.findOne({ user_id: winner.playerId });
          if (user && user.email) {
            const auctionName = update.auctionName || 'Auction';

            if (winner.rank === 1) {
              // Send prize claim winner email to rank 1
              console.log(`📧 [EMAIL] Sending prize claim email to ${user.email} (Rank 1)`);
              await sendPrizeClaimWinnerEmail(user.email, {
                username: winner.playerUsername,
                auctionName: auctionName,
                prizeAmount: winner.prizeAmount || 0,
                claimDeadline: claimDeadline,
                upiId: null // Not claimed yet
              });
            } else {
              // Send waiting queue email to rank 2 and 3
              console.log(`📧 [EMAIL] Sending waiting queue email to ${user.email} (Rank ${winner.rank})`);
              await sendWaitingQueueEmail(user.email, {
                username: winner.playerUsername,
                auctionName: auctionName,
                rank: winner.rank,
                prizeAmount: winner.prizeAmount || 0
              });
            }
          }
        } catch (emailError) {
          console.error(`❌ [EMAIL] Error sending email to ${winner.playerUsername}:`, emailError.message);
          // Don't fail the entire operation if email fails
        }
      }
    }

    return updates;
  } catch (error) {
    console.error(`❌ [AUCTION_HISTORY] Error marking winners:`, error);
    throw error;
  }
};

/**
 * Static method: Mark non-winners after auction completion
 */
auctionHistorySchema.statics.markNonWinners = async function(hourlyAuctionId, totalParticipants = 0) {
  try {
    const result = await this.updateMany(
      { 
        hourlyAuctionId, 
        isWinner: false,
        auctionStatus: { $ne: 'COMPLETED' }
      },
      {
        $set: {
          auctionStatus: 'COMPLETED',
          completedAt: getISTTime(), // ✅ Use IST time
          prizeClaimStatus: 'NOT_APPLICABLE',
          totalParticipants: totalParticipants,
        },
      }
    );

    console.log(`✅ [AUCTION_HISTORY] Marked ${result.modifiedCount} non-winners as COMPLETED in auction ${hourlyAuctionId}`);
    console.log(`     👥 Total participants: ${totalParticipants}`);
    return result;
  } catch (error) {
    console.error(`❌ [AUCTION_HISTORY] Error marking non-winners:`, error);
    throw error;
  }
};

/**
 * Static method: Submit prize claim (for all winners)
 */
auctionHistorySchema.statics.submitPrizeClaim = async function(userId, hourlyAuctionId, claimData) {
  try {
    const { upiId, paymentReference } = claimData;

    // Find the winner's history entry (any rank)
    const entry = await this.findOne({ userId, hourlyAuctionId, isWinner: true });

    if (!entry) {
      throw new Error('Winner entry not found');
    }

    if (entry.prizeClaimStatus !== 'PENDING') {
      throw new Error(`Prize claim is not pending. Current status: ${entry.prizeClaimStatus}`);
    }

    // Check if deadline has passed (compare IST times)
    const now = getISTTime(); // ✅ Use IST time
    if (entry.claimDeadline && now > entry.claimDeadline) {
      await this.findOneAndUpdate(
        { userId, hourlyAuctionId },
        {
          $set: {
            prizeClaimStatus: 'EXPIRED',
            claimNotes: 'Claim deadline expired (15 minutes) - Prize forfeited',
          },
        }
      );
      throw new Error('Prize claim deadline has expired');
    }

    // Update with claim information
    const updated = await this.findOneAndUpdate(
      { userId, hourlyAuctionId },
      {
        $set: {
          claimUpiId: upiId,
          remainingFeesPaymentRef: paymentReference,
          remainingFeesPaid: !!paymentReference,
          prizeClaimStatus: 'CLAIMED',
          claimedAt: now, // ✅ Use IST time
          claimNotes: `Prize claimed successfully (Rank ${entry.finalRank})`,
          claimedBy: entry.username,
          claimedByRank: entry.finalRank,
        },
      },
      { new: true }
    );

    console.log(`🎁 [AUCTION_HISTORY] Prize claimed by ${entry.username} (Rank ${entry.finalRank}) for auction ${hourlyAuctionId}`);

    // ✅ Send confirmation email
    try {
      const user = await User.findOne({ user_id: userId });
      if (user && user.email) {
        console.log(`📧 [EMAIL] Sending prize claimed confirmation to ${user.email}`);
        await sendPrizeClaimWinnerEmail(user.email, {
          username: entry.username,
          auctionName: entry.auctionName || 'Auction',
          prizeAmount: entry.prizeAmountWon || 0,
          claimDeadline: entry.claimDeadline,
          upiId: upiId // Now claimed
        });
      }
    } catch (emailError) {
      console.error(`❌ [EMAIL] Error sending confirmation email:`, emailError.message);
      // Don't fail the operation if email fails
    }

    return updated;
  } catch (error) {
    console.error(`❌ [AUCTION_HISTORY] Error submitting prize claim:`, error);
    throw error;
  }
};

/**
 * Static method: Check and expire unclaimed prizes
 */
auctionHistorySchema.statics.expireUnclaimedPrizes = async function() {
  try {
    const now = getISTTime(); // ✅ Use IST time

    const result = await this.updateMany(
      {
        prizeClaimStatus: 'PENDING',
        claimDeadline: { $lt: now },
      },
      {
        $set: {
          prizeClaimStatus: 'EXPIRED',
          claimNotes: 'Claim deadline expired (30 minutes) - Prize forfeited',
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`⏰ [AUCTION_HISTORY] Expired ${result.modifiedCount} unclaimed prizes`);
    }

    return result;
  } catch (error) {
    console.error(`❌ [AUCTION_HISTORY] Error expiring unclaimed prizes:`, error);
    throw error;
  }
};

/**
 * Static method: Get user's auction history
 */
auctionHistorySchema.statics.getUserHistory = async function(userId, filters = {}) {
  try {
    const query = { userId };

    // Apply filters
    if (filters.isWinner !== undefined) {
      query.isWinner = filters.isWinner;
    }

    if (filters.startDate) {
      query.auctionDate = { $gte: new Date(filters.startDate) };
    }

    if (filters.endDate) {
      if (!query.auctionDate) query.auctionDate = {};
      query.auctionDate.$lte = new Date(filters.endDate);
    }

    const history = await this.find(query)
      .sort({ auctionDate: -1, TimeSlot: -1 })
      .lean();

    return history;
  } catch (error) {
    console.error(`❌ [AUCTION_HISTORY] Error getting user history:`, error);
    throw error;
  }
};

/**
 * Static method: Get user statistics
 * totalSpent = entryFees of all auctions joined + lastRoundBidAmount (only for won+claimed auctions)
 */
auctionHistorySchema.statics.getUserStats = async function(userId) {
  try {
    const stats = await this.aggregate([
      { $match: { userId, auctionStatus: 'COMPLETED' } },
      {
        $group: {
          _id: null,
          totalAuctions: { $sum: 1 },
          totalWins: {
            $sum: { $cond: ['$isWinner', 1, 0] }
          },
          totalLosses: {
            $sum: { $cond: ['$isWinner', 0, 1] }
          },
          // Total entry fees from all auctions joined
          totalEntryFees: { $sum: '$entryFeePaid' },
          // Sum of lastRoundBidAmount ONLY for auctions where user won AND claimed prize
          totalFinalRoundBidsForClaimedWins: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$isWinner', true] },
                  { $eq: ['$prizeClaimStatus', 'CLAIMED'] }
                ]},
                '$lastRoundBidAmount',
                0
              ]
            }
          },
          // CRITICAL: Only sum prize amounts for CLAIMED prizes
          totalWon: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$isWinner', true] },
                  { $eq: ['$prizeClaimStatus', 'CLAIMED'] }
                ]},
                '$prizeAmountWon',
                0
              ]
            }
          },
        },
      },
    ]);

    if (stats.length === 0) {
      return {
        totalAuctions: 0,
        totalWins: 0,
        totalLosses: 0,
        totalSpent: 0,
        totalWon: 0,
        winRate: 0,
        netGain: 0,
      };
    }

    const result = stats[0];
    // totalSpent = entry fees of all auctions + final round bids only for won+claimed auctions
    result.totalSpent = (result.totalEntryFees || 0) + (result.totalFinalRoundBidsForClaimedWins || 0);
    result.winRate = result.totalAuctions > 0 
      ? Math.round((result.totalWins / result.totalAuctions) * 100) 
      : 0;
    result.netGain = result.totalWon - result.totalSpent;

    // Clean up intermediate fields
    delete result._id;
    delete result.totalEntryFees;
    delete result.totalFinalRoundBidsForClaimedWins;

    return result;
  } catch (error) {
    console.error(`❌ [AUCTION_HISTORY] Error getting user stats:`, error);
    throw error;
  }
};

/**
 * Static method: Advance to next rank in priority claim queue
 * Called when current eligible rank fails to claim within 30 minutes
 */
auctionHistorySchema.statics.advanceClaimQueue = async function(hourlyAuctionId) {
  try {
    // Find all winners for this auction with PENDING status
    const winners = await this.find({
      hourlyAuctionId,
      isWinner: true,
      prizeClaimStatus: 'PENDING'
    }).sort({ finalRank: 1 });

    if (winners.length === 0) {
      console.log(`⏭️ [PRIORITY_CLAIM] No pending winners for auction ${hourlyAuctionId}`);
      return null;
    }

    // Get current eligible rank (should be same for all winners)
    const currentEligibleRank = winners[0].currentEligibleRank || 1;
    const nextRank = currentEligibleRank + 1;

    // Check if there's a next rank (max is 3)
    if (nextRank > 3) {
      console.log(`⏭️ [PRIORITY_CLAIM] All ranks exhausted for auction ${hourlyAuctionId}. Marking as EXPIRED.`);

      // Expire all pending claims
      await this.updateMany(
        { hourlyAuctionId, prizeClaimStatus: 'PENDING' },
        {
          $set: {
            prizeClaimStatus: 'EXPIRED',
            claimNotes: 'All winners (rank 1-3) failed to claim within their 15-minute windows'
          }
        }
      );

      return null;
    }

    // Check if next rank winner exists
    const nextRankWinner = winners.find(w => w.finalRank === nextRank);

    if (!nextRankWinner) {
      console.log(`⏭️ [PRIORITY_CLAIM] No rank ${nextRank} winner exists for auction ${hourlyAuctionId}. Marking remaining as EXPIRED.`);

      // Expire all pending claims
      await this.updateMany(
        { hourlyAuctionId, prizeClaimStatus: 'PENDING' },
        {
          $set: {
            prizeClaimStatus: 'EXPIRED',
            claimNotes: `Rank ${currentEligibleRank} failed to claim and no rank ${nextRank} winner exists`
          }
        }
      );

      return null;
    }

    // ✅ FIX: Only update currentEligibleRank
    // Do NOT update claimWindowStartedAt - keep original fixed time slots
    const now = getISTTime(); // ✅ Use IST time

    // ✅ Format for logging
    const istFormatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    console.log(`⏭️ [PRIORITY_CLAIM] Advancing auction ${hourlyAuctionId} from rank ${currentEligibleRank} to rank ${nextRank}`);
    console.log(`     ❌ Rank ${currentEligibleRank} failed to claim within 15 minutes`);
    console.log(`     ✅ Rank ${nextRank} (${nextRankWinner.username}) now eligible to claim`);
    console.log(`     ⏰ Current time IST: ${istFormatter.format(now)}`);
    console.log(`     ⏰ Rank ${nextRank} window start IST: ${istFormatter.format(nextRankWinner.claimWindowStartedAt)}`);
    console.log(`     ⏰ Rank ${nextRank} deadline IST: ${istFormatter.format(nextRankWinner.claimDeadline)}`);

    // ✅ FIX: Only update currentEligibleRank, do NOT update claimWindowStartedAt
    const result = await this.updateMany(
      { hourlyAuctionId, isWinner: true, prizeClaimStatus: 'PENDING' },
      {
        $set: {
          currentEligibleRank: nextRank
          // ❌ REMOVED: claimWindowStartedAt: now
          // Keep original fixed time slot window start
        },
        $push: {
          ranksOffered: nextRank
        }
      }
    );

    console.log(`✅ [PRIORITY_CLAIM] Updated ${result.modifiedCount} winner records for auction ${hourlyAuctionId}`);

    // ✅ Send email notification to next rank winner
    try {
      const user = await User.findOne({ user_id: nextRankWinner.userId });
      if (user && user.email) {
        console.log(`📧 [EMAIL] Sending prize claim notification to ${user.email} (Rank ${nextRank} now eligible)`);
        await sendPrizeClaimWinnerEmail(user.email, {
          username: nextRankWinner.username,
          auctionName: nextRankWinner.auctionName || 'Auction',
          prizeAmount: nextRankWinner.prizeAmountWon || 0,
          claimDeadline: nextRankWinner.claimDeadline,
          upiId: null // Not claimed yet
        });
      }
    } catch (emailError) {
      console.error(`❌ [EMAIL] Error sending email to rank ${nextRank} winner:`, emailError.message);
      // Don't fail the operation if email fails
    }

    return {
      previousRank: currentEligibleRank,
      currentRank: nextRank,
      currentWinner: nextRankWinner.username,
      windowStart: nextRankWinner.claimWindowStartedAt,
      deadline: nextRankWinner.claimDeadline
    };
  } catch (error) {
    console.error(`❌ [PRIORITY_CLAIM] Error advancing claim queue:`, error);
    throw error;
  }
};

/**
 * Static method: Check and advance priority claim queues for all auctions
 * Should be called by cron job every minute
 */
auctionHistorySchema.statics.processClaimQueues = async function() {
  try {
    // ✅ Get current IST time for comparison
    const now = getISTTime(); // ✅ Use IST time consistently

    // ✅ Format for logging
    const istFormatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    console.log(`⏰ [PRIORITY_CLAIM] Processing claim queues at IST: ${istFormatter.format(now)}`);

    // ✅ Find auctions where the CURRENT eligible rank's window has expired
    // Since all times are now stored in IST, we can directly compare with IST time
    const expiredClaims = await this.aggregate([
      {
        $match: {
          prizeClaimStatus: 'PENDING',
          isWinner: true,
          currentEligibleRank: { $exists: true, $ne: null },
          completedAt: { $exists: true, $ne: null }
        }
      },
      {
        $addFields: {
          // Calculate when current eligible rank's window expires
          // currentEligibleRank 1 expires at completedAt + 15 mins
          // currentEligibleRank 2 expires at completedAt + 30 mins
          // currentEligibleRank 3 expires at completedAt + 45 mins
          currentRankDeadline: {
            $add: [
              '$completedAt',
              { $multiply: ['$currentEligibleRank', 15 * 60 * 1000] }
            ]
          }
        }
      },
      {
        $match: {
          currentRankDeadline: { $lt: now } // Compare with IST now
        }
      },
      {
        $group: {
          _id: '$hourlyAuctionId',
          currentEligibleRank: { $first: '$currentEligibleRank' },
          completedAt: { $first: '$completedAt' },
          currentRankDeadline: { $first: '$currentRankDeadline' }
        }
      }
    ]);

    if (expiredClaims.length === 0) {
      return { processed: 0, advanced: 0 };
    }

    console.log(`⏰ [PRIORITY_CLAIM] Processing ${expiredClaims.length} auctions with expired claim windows`);

    let advancedCount = 0;

    for (const auction of expiredClaims) {
      console.log(`⏰ [PRIORITY_CLAIM] Rank ${auction.currentEligibleRank} window expired for auction ${auction._id}`);
      console.log(`     Completed at IST: ${istFormatter.format(auction.completedAt)}`);
      console.log(`     Deadline IST: ${istFormatter.format(auction.currentRankDeadline)}`);
      console.log(`     Current time IST: ${istFormatter.format(now)}`);

      const result = await this.advanceClaimQueue(auction._id);
      if (result) {
        advancedCount++;
      }
    }

    console.log(`✅ [PRIORITY_CLAIM] Processed ${expiredClaims.length} auctions, advanced ${advancedCount} to next rank`);

    return {
      processed: expiredClaims.length,
      advanced: advancedCount
    };
  } catch (error) {
    console.error(`❌ [PRIORITY_CLAIM] Error processing claim queues:`, error);
    throw error;
  }
};

module.exports = mongoose.models.AuctionHistory || mongoose.model('AuctionHistory', auctionHistorySchema);