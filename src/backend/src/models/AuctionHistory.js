// src/models/AuctionHistory.js
const mongoose = require('mongoose');
const { sendPrizeClaimWinnerEmail, sendWaitingQueueEmail } = require('../utils/emailService');
const { sendSms, formatTemplate } = require('../utils/smsService');
const User = require('./user');
const HourlyAuction = require('./HourlyAuction');
const DailyAuction = require('./DailyAuction');

/**
 * Helper function to get current IST time
 * Returns a Date object where UTC components match IST components
 * (e.g. if it's 3 PM IST, result.getUTCHours() will be 15)
 */
const getISTTime = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  
  return new Date(Date.UTC(
    istDate.getUTCFullYear(),
    istDate.getUTCMonth(),
    istDate.getUTCDate(),
    istDate.getUTCHours(),
    istDate.getUTCMinutes(),
    istDate.getUTCSeconds(),
    istDate.getUTCMilliseconds()
  ));
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
    
    // Payment details for entry fee
    paymentMethod: {
      type: String,
      default: null,
    },
    
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    
    paymentDetails: {
      type: Object,
      default: null,
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

    // Deadline to claim prize (15 minutes from completion for rank 1)
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

    // When the current rank's 15-minute claim window started
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

// ✅ NEW: Index for user stats aggregation performance
auctionHistorySchema.index({ userId: 1, auctionStatus: 1 });

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
      paymentMethod: data.paymentMethod || null,
      razorpayPaymentId: data.razorpayPaymentId || null,
      paymentDetails: data.paymentDetails || null,
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
        const isRankOne = winner.rank === 1;
        const claimWindowStart = isRankOne ? now : null;
        const claimDeadline = isRankOne ? new Date(now.getTime() + 15 * 60 * 1000) : null;

        const updateData = {
          isWinner: true,
          finalRank: winner.rank,
          prizeAmountWon: winner.prizeAmount || 0,
          lastRoundBidAmount: winner.finalAuctionAmount || 0,
          auctionStatus: 'COMPLETED',
          completedAt: now, // ✅ Use IST time
          prizeClaimStatus: 'PENDING',
          claimDeadline: claimDeadline, // ✅ IST-based deadline (only for active rank)
          totalParticipants: totalParticipants,
          // ✅ NEW: Fixed start for rank 1 only, others will start fresh when promoted
          currentEligibleRank: 1,
          claimWindowStartedAt: claimWindowStart,
          ranksOffered: [1],
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
            totalClaimed: {
              $sum: { $cond: [{ $eq: ['$prizeClaimStatus', 'CLAIMED'] }, 1, 0] }
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
          totalClaimed: 0,
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
 * Static method: Sync claim status from AuctionHistory to HourlyAuction and DailyAuction
 * Ensures that if anyone in the top 3 claims the prize, the root winner info is updated.
 * Uses atomic updates to avoid VersionError conflicts.
 */
auctionHistorySchema.statics.syncClaimStatus = async function(hourlyAuctionId, winnersSnapshot = null) {
  try {
    const hourlyAuction = await HourlyAuction.findOne({ hourlyAuctionId }).lean();
    if (!hourlyAuction) return;

    const historyWinners = winnersSnapshot || await this.find({ hourlyAuctionId, isWinner: true }).lean();
    if (!historyWinners || historyWinners.length === 0) return;

    const byRank = historyWinners.reduce((acc, w) => {
      acc[w.finalRank] = w;
      return acc;
    }, {});

    // Build hourly auction update
    if (hourlyAuction.winners && hourlyAuction.winners.length > 0) {
      let actualClaimer = null;
      const hourlyUpdateOps = { $set: {} };

      hourlyAuction.winners.forEach((w, idx) => {
        const hist = byRank[w.rank];
        if (hist) {
          hourlyUpdateOps.$set[`winners.${idx}.prizeClaimStatus`] = hist.prizeClaimStatus;
          hourlyUpdateOps.$set[`winners.${idx}.isPrizeClaimed`] = hist.prizeClaimStatus === 'CLAIMED';
          hourlyUpdateOps.$set[`winners.${idx}.prizeClaimedAt`] = hist.claimedAt || null;
          hourlyUpdateOps.$set[`winners.${idx}.prizeClaimedBy`] = hist.claimedBy || hist.username || null;
          hourlyUpdateOps.$set[`winners.${idx}.claimNotes`] = hist.claimNotes || null;

          if (hist.prizeClaimStatus === 'CLAIMED') {
            actualClaimer = { ...w, prizeClaimStatus: hist.prizeClaimStatus, claimedBy: hist.claimedBy || hist.username };
          }
        }
      });

      // Update top-level winner info to reflect the person who actually CLAIMED
      if (actualClaimer) {
        hourlyUpdateOps.$set['winnerId'] = actualClaimer.playerId;
        hourlyUpdateOps.$set['winnerUsername'] = actualClaimer.playerUsername;
        hourlyUpdateOps.$set['winningBid'] = actualClaimer.finalAuctionAmount;
        hourlyUpdateOps.$set['prizeClaimedBy'] = actualClaimer.playerUsername;
        hourlyUpdateOps.$set['prizeClaimStatus'] = actualClaimer.prizeClaimStatus;
        
        console.log(`🏆 [SYNC_CLAIM] Updated HourlyAuction root winner to actual claimer: ${actualClaimer.playerUsername} (Rank ${actualClaimer.rank})`);
      } else {
        // Fallback to rank 1's status if no one has claimed yet
        const rank1 = byRank[1];
        if (rank1) {
          hourlyUpdateOps.$set['prizeClaimStatus'] = rank1.prizeClaimStatus;
        }
      }

      if (Object.keys(hourlyUpdateOps.$set).length > 0) {
        await HourlyAuction.updateOne({ hourlyAuctionId }, hourlyUpdateOps);
      }
    }

    // Sync to DailyAuction using atomic update
    const dailyAuction = await DailyAuction.findOne({ dailyAuctionId: hourlyAuction.dailyAuctionId }).lean();
    if (dailyAuction) {
      const configIndex = dailyAuction.dailyAuctionConfig.findIndex(
        c => c.TimeSlot === hourlyAuction.TimeSlot && c.auctionNumber === hourlyAuction.auctionNumber
      );
      
      if (configIndex !== -1) {
        const config = dailyAuction.dailyAuctionConfig[configIndex];
        
        if (config.topWinners && config.topWinners.length > 0) {
          const dailyUpdateOps = { $set: {} };
          let claimStatusForConfig = config.prizeClaimStatus;
          let claimedByForConfig = config.prizeClaimedBy;
          
          config.topWinners.forEach((tw, idx) => {
            const hist = byRank[tw.rank];
            if (hist) {
              dailyUpdateOps.$set[`dailyAuctionConfig.${configIndex}.topWinners.${idx}.prizeClaimStatus`] = hist.prizeClaimStatus;
              dailyUpdateOps.$set[`dailyAuctionConfig.${configIndex}.topWinners.${idx}.isPrizeClaimed`] = hist.prizeClaimStatus === 'CLAIMED';
              dailyUpdateOps.$set[`dailyAuctionConfig.${configIndex}.topWinners.${idx}.prizeClaimedAt`] = hist.claimedAt || null;
              dailyUpdateOps.$set[`dailyAuctionConfig.${configIndex}.topWinners.${idx}.prizeClaimedBy`] = hist.claimedBy || hist.username || null;
              dailyUpdateOps.$set[`dailyAuctionConfig.${configIndex}.topWinners.${idx}.claimNotes`] = hist.claimNotes || null;

              if (hist.prizeClaimStatus === 'CLAIMED') {
                claimStatusForConfig = hist.prizeClaimStatus;
                claimedByForConfig = hist.claimedBy || hist.username || null;
              }
            }
          });
          
          // Update top-level claim status for the config
          if (claimStatusForConfig === 'CLAIMED') {
            dailyUpdateOps.$set[`dailyAuctionConfig.${configIndex}.prizeClaimStatus`] = claimStatusForConfig;
            dailyUpdateOps.$set[`dailyAuctionConfig.${configIndex}.prizeClaimedBy`] = claimedByForConfig;
          } else if (byRank[1]) {
            // Fallback for top-level claim status
            dailyUpdateOps.$set[`dailyAuctionConfig.${configIndex}.prizeClaimStatus`] = byRank[1].prizeClaimStatus;
          }
          
          if (Object.keys(dailyUpdateOps.$set).length > 0) {
            await DailyAuction.updateOne({ dailyAuctionId: hourlyAuction.dailyAuctionId }, dailyUpdateOps);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ [SYNC_CLAIM_STATUS] Error syncing claim status:', error.message);
  }
};

// Helper: sync claim status into HourlyAuction and DailyAuction config
// (Renamed from local function to avoid conflict with the new static method if needed, 
// but we'll eventually replace all calls to use the static method)
const syncClaimStatusToAuctions = async (hourlyAuctionId, winnersSnapshot = null) => {
  const AuctionHistory = mongoose.models.AuctionHistory || mongoose.model('AuctionHistory', auctionHistorySchema);
  return await AuctionHistory.syncClaimStatus(hourlyAuctionId, winnersSnapshot);
};

/**
 * Static method: Advance to next rank in priority claim queue
 * Called when current eligible rank fails to claim within 15 minutes OR cancels
 */
auctionHistorySchema.statics.advanceClaimQueue = async function(hourlyAuctionId, options = {}) {
  try {
    const { fromRank: explicitFromRank, reason = 'EXPIRED_WINDOW' } = options;

    // Find all winners for this auction
    const winners = await this.find({
      hourlyAuctionId,
      isWinner: true
    }).sort({ finalRank: 1 });

    if (winners.length === 0) {
      console.log(`⏭️ [PRIORITY_CLAIM] No winners for auction ${hourlyAuctionId}`);
      return null;
    }

    // Determine current rank to advance from
    const currentEligibleRank = explicitFromRank || winners[0].currentEligibleRank || 1;
    const nextRank = currentEligibleRank + 1;
    const now = getISTTime();

    // Expire/mark current eligible rank as not claimed
    const expireReason = reason === 'CANCELLED'
      ? `Rank ${currentEligibleRank} cancelled the claim`
      : `Rank ${currentEligibleRank} did not claim within 15 minutes`;

    await this.updateMany(
      { hourlyAuctionId, finalRank: currentEligibleRank, prizeClaimStatus: 'PENDING' },
      {
        $set: {
          prizeClaimStatus: 'EXPIRED',
          claimNotes: expireReason,
        }
      }
    );

    // Check if there's a next rank (max is 3)
    if (nextRank > 3) {
      console.log(`⏭️ [PRIORITY_CLAIM] All ranks exhausted for auction ${hourlyAuctionId}. Marking remaining as EXPIRED.`);

      await this.updateMany(
        { hourlyAuctionId, prizeClaimStatus: 'PENDING' },
        {
          $set: {
            prizeClaimStatus: 'EXPIRED',
            claimNotes: 'All winners (rank 1-3) failed to claim within their 15-minute windows'
          }
        }
      );

      await syncClaimStatusToAuctions(hourlyAuctionId);
      return null;
    }

    // Activate next rank
    const nextRankWinner = winners.find(w => w.finalRank === nextRank);

    if (!nextRankWinner) {
      console.log(`⏭️ [PRIORITY_CLAIM] No rank ${nextRank} winner exists for auction ${hourlyAuctionId}. Marking remaining as EXPIRED.`);

      await this.updateMany(
        { hourlyAuctionId, prizeClaimStatus: 'PENDING' },
        {
          $set: {
            prizeClaimStatus: 'EXPIRED',
            claimNotes: `Rank ${currentEligibleRank} failed/cancelled and no rank ${nextRank} winner exists`
          }
        }
      );

      await syncClaimStatusToAuctions(hourlyAuctionId);
      return null;
    }

    const claimWindowStart = now;
    const claimDeadline = new Date(now.getTime() + 15 * 60 * 1000);

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
    console.log(`     Reason: ${expireReason}`);
    console.log(`     ✅ Rank ${nextRank} (${nextRankWinner.username}) now eligible to claim`);
    console.log(`     ⏰ Current time IST: ${istFormatter.format(now)}`);
    console.log(`     ⏰ Rank ${nextRank} window start IST: ${istFormatter.format(claimWindowStart)}`);
    console.log(`     ⏰ Rank ${nextRank} deadline IST: ${istFormatter.format(claimDeadline)}`);

    await this.updateMany(
      { hourlyAuctionId, isWinner: true },
      {
        $set: {
          currentEligibleRank: nextRank
        },
        $push: {
          ranksOffered: nextRank
        }
      }
    );

    const updateNext = await this.updateOne(
      { hourlyAuctionId, finalRank: nextRank },
      {
        $set: {
          prizeClaimStatus: 'PENDING',
          claimWindowStartedAt: claimWindowStart,
          claimDeadline: claimDeadline,
          claimNotes: `Rank ${nextRank} is now eligible to claim`,
        }
      }
    );

    console.log(`✅ [PRIORITY_CLAIM] Updated ${updateNext.modifiedCount} record(s) for rank ${nextRank} winner in auction ${hourlyAuctionId}`);

    // ✅ Send email notification to next rank winner
      try {
        const user = await User.findOne({ user_id: nextRankWinner.userId });
        if (user && user.email) {
          console.log(`📧 [EMAIL] Sending prize claim notification to ${user.email} (Rank ${nextRank} now eligible)`);
          await sendPrizeClaimWinnerEmail(user.email, {
            username: nextRankWinner.username,
            auctionName: nextRankWinner.auctionName || 'Auction',
            prizeAmount: nextRankWinner.prizeAmountWon || 0,
            claimDeadline: claimDeadline,
            upiId: null // Not claimed yet
          });
        }

        if (user && user.mobile) {
          const formatted = formatTemplate('NEXT_RANK_OPPORTUNITY', {
            name: nextRankWinner.username || user.username || 'Participant',
            amount: Math.round(nextRankWinner.lastRoundBidAmount || 0),
          });

          if (formatted.success) {
            await sendSms(user.mobile, formatted.message, {
              templateId: formatted.template.templateId,
              senderId: 'FINPGS',
            });
          }
        }
      } catch (emailError) {
        console.error(`❌ [EMAIL] Error sending email to rank ${nextRank} winner:`, emailError.message);
      }

    await syncClaimStatusToAuctions(hourlyAuctionId);

    return {
      previousRank: currentEligibleRank,
      currentRank: nextRank,
      currentWinner: nextRankWinner.username,
      windowStart: claimWindowStart,
      deadline: claimDeadline
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
    const now = getISTTime();

    const expiredActive = await this.find({
      prizeClaimStatus: 'PENDING',
      isWinner: true,
      claimDeadline: { $ne: null, $lt: now },
    }).lean();

    if (expiredActive.length === 0) {
      return { processed: 0, advanced: 0 };
    }

    const processedAuctions = new Set();
    let advancedCount = 0;

    for (const entry of expiredActive) {
      if (processedAuctions.has(entry.hourlyAuctionId)) continue;
      processedAuctions.add(entry.hourlyAuctionId);

      const result = await this.advanceClaimQueue(entry.hourlyAuctionId, {
        fromRank: entry.finalRank,
        reason: 'EXPIRED_WINDOW',
      });

      if (result) advancedCount++;
    }

    return {
      processed: processedAuctions.size,
      advanced: advancedCount,
    };
  } catch (error) {
    console.error(`❌ [PRIORITY_CLAIM] Error processing claim queues:`, error);
    throw error;
  }
};

module.exports = mongoose.models.AuctionHistory || mongoose.model('AuctionHistory', auctionHistorySchema);