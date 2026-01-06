// src/controllers/prizeClaimController.js
const AuctionHistory = require('../models/AuctionHistory');
const HourlyAuction = require('../models/HourlyAuction');
const DailyAuction = require('../models/DailyAuction');
const { syncUserStats } = require('./userController');

/**
 * Submit prize claim with UPI ID and payment details
 * POST /prize-claim/submit
 * Body: { userId, hourlyAuctionId, upiId, paymentReference }
 */
const submitPrizeClaim = async (req, res) => {
  try {
    const { userId, hourlyAuctionId, upiId, paymentReference } = req.body;
    
    // Validate required fields
    if (!userId || !hourlyAuctionId || !upiId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, hourlyAuctionId, upiId',
      });
    }
    
    // Basic UPI ID validation
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    if (!upiRegex.test(upiId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid UPI ID format (e.g., username@upi)',
      });
    }
    
    // Find the auction history entry
    const historyEntry = await AuctionHistory.findOne({ 
      userId, 
      hourlyAuctionId,
      isWinner: true 
    });
    
    if (!historyEntry) {
      return res.status(404).json({
        success: false,
        message: 'Winner entry not found for this user and auction',
      });
    }
    
    // Check if already claimed
    if (historyEntry.prizeClaimStatus === 'CLAIMED') {
      return res.status(400).json({
        success: false,
        message: 'Prize has already been claimed',
      });
    }
    
    // ✅ Check if it's the user's turn (priority system)
    if (historyEntry.currentEligibleRank && historyEntry.finalRank !== historyEntry.currentEligibleRank) {
      return res.status(403).json({
        success: false,
        message: `It's not your turn yet. Currently, rank ${historyEntry.currentEligibleRank} can claim. You are rank ${historyEntry.finalRank}.`,
        data: {
          currentEligibleRank: historyEntry.currentEligibleRank,
          yourRank: historyEntry.finalRank,
          claimDeadline: historyEntry.claimDeadline,
        }
      });
    }
    
    // Check if expired and auto-advance queue
    if (historyEntry.claimDeadline && new Date() > historyEntry.claimDeadline) {
      // Mark as expired
      historyEntry.prizeClaimStatus = 'EXPIRED';
      historyEntry.claimNotes = 'Claim deadline expired (15 minutes)';
      await historyEntry.save();
      
      // ✅ IMMEDIATE: Advance queue to next winner without delay
      await AuctionHistory.advanceClaimQueue(hourlyAuctionId, { fromRank: historyEntry.finalRank, reason: 'EXPIRED_WINDOW' });
      await AuctionHistory.syncClaimStatus(hourlyAuctionId);
      
      // Trigger sync for current user (they lost the chance)
      await syncUserStats(userId);
      
      return res.status(400).json({
        success: false,
        message: 'Prize claim deadline has expired. Next winner can now claim.',
      });
    }
    
    // Get rank suffix for logging
    const getRankSuffix = (rank) => {
      if (rank === 1) return '1st';
      if (rank === 2) return '2nd';
      if (rank === 3) return '3rd';
      return `${rank}th`;
    };
    
    // Submit the claim
    const claimData = {
      upiId: upiId.trim(),
      paymentReference: paymentReference ? paymentReference.trim() : null,
    };
    
    const updatedEntry = await AuctionHistory.submitPrizeClaim(
      userId,
      hourlyAuctionId,
      claimData
    );
    
    // ✅ Mark all OTHER winners' claims as EXPIRED and store detailed info about who claimed
    const claimTime = new Date();
    await AuctionHistory.updateMany(
      { 
        hourlyAuctionId, 
        isWinner: true,
        userId: { $ne: userId } // Exclude the actual claimer
      },
      {
        $set: {
          prizeClaimStatus: 'EXPIRED',
          claimedBy: updatedEntry.username,
          claimedByRank: updatedEntry.finalRank,
          claimedAt: claimTime,
          claimNotes: `Prize claimed by ${updatedEntry.username} (Rank ${updatedEntry.finalRank}) at ${claimTime.toISOString()}`
        }
      }
    );
    
    // Get all other winners to send them notification
    const otherWinners = await AuctionHistory.find({
      hourlyAuctionId,
      isWinner: true,
      userId: { $ne: userId }
    });
    
    // Log detailed info for each other winner and sync their stats
    for (const winner of otherWinners) {
      console.log(`📢 [PRIZE_CLAIM] Notified ${winner.username} (Rank ${winner.finalRank}): Prize claimed by ${updatedEntry.username} (Rank ${updatedEntry.finalRank})`);
      await syncUserStats(winner.userId);
    }
    
    await AuctionHistory.syncClaimStatus(hourlyAuctionId);
    
    // Sync stats for the actual claimer
    await syncUserStats(userId);
    
    console.log(`✅ [PRIZE_CLAIM] Prize claimed successfully by ${updatedEntry.username} (${getRankSuffix(updatedEntry.finalRank)} place)`);
    console.log(`     💰 Final round bid amount: ₹${updatedEntry.lastRoundBidAmount || 0}`);
    console.log(`     💳 UPI ID: ${updatedEntry.claimUpiId}`);
    console.log(`     🎯 Prize amount: ₹${updatedEntry.prizeAmountWon || 0}`);
    console.log(`     ⏰ All other pending winners marked as EXPIRED`);
    
    return res.status(200).json({
      success: true,
      message: `Prize claim submitted successfully! Congratulations on your ${getRankSuffix(updatedEntry.finalRank)} place win!`,
      data: {
        userId: updatedEntry.userId,
        username: updatedEntry.username,
        rank: updatedEntry.finalRank,
        prizeAmount: updatedEntry.prizeAmountWon,
        lastRoundBidAmount: updatedEntry.lastRoundBidAmount,
        upiId: updatedEntry.claimUpiId,
        claimedAt: updatedEntry.claimedAt,
        claimStatus: updatedEntry.prizeClaimStatus,
      },
    });
  } catch (error) {
    console.error('❌ [PRIZE_CLAIM] Error submitting prize claim:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while submitting prize claim',
    });
  }
};

// NEW: Winner can cancel claim to pass to next rank immediately
const cancelPrizeClaim = async (req, res) => {
  try {
    const { userId, hourlyAuctionId } = req.body;

    if (!userId || !hourlyAuctionId) {
      return res.status(400).json({
        success: false,
        message: 'userId and hourlyAuctionId are required',
      });
    }

    const historyEntry = await AuctionHistory.findOne({ userId, hourlyAuctionId, isWinner: true });
    if (!historyEntry) {
      return res.status(404).json({ success: false, message: 'Winner entry not found' });
    }

    if (historyEntry.prizeClaimStatus !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Prize is not in pending state' });
    }

    if (historyEntry.currentEligibleRank && historyEntry.finalRank !== historyEntry.currentEligibleRank) {
      return res.status(403).json({
        success: false,
        message: `It's not your turn yet. Current eligible rank is ${historyEntry.currentEligibleRank}.`,
      });
    }

    historyEntry.prizeClaimStatus = 'EXPIRED';
    historyEntry.claimNotes = 'Cancelled by winner';
    historyEntry.claimDeadline = null;
    historyEntry.claimWindowStartedAt = null;
    await historyEntry.save();

    await AuctionHistory.advanceClaimQueue(hourlyAuctionId, { fromRank: historyEntry.finalRank, reason: 'CANCELLED' });
    await AuctionHistory.syncClaimStatus(hourlyAuctionId);

    // Sync stats for the user who cancelled
    await syncUserStats(userId);

    return res.status(200).json({
      success: true,
      message: 'Prize claim cancelled. Next winner can now claim.',
    });
  } catch (error) {
    console.error('❌ [PRIZE_CLAIM] Error cancelling prize claim:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while cancelling prize claim',
    });
  }
};

/**
 * Get prize claim status for a user and auction
 * GET /prize-claim/status?userId=xxx&hourlyAuctionId=xxx
 */
const getPrizeClaimStatus = async (req, res) => {
  try {
    const { userId, hourlyAuctionId } = req.query;
    
    if (!userId || !hourlyAuctionId) {
      return res.status(400).json({
        success: false,
        message: 'userId and hourlyAuctionId are required',
      });
    }
    
    const historyEntry = await AuctionHistory.findOne({ 
      userId, 
      hourlyAuctionId,
      isWinner: true 
    });
    
    if (!historyEntry) {
      return res.status(404).json({
        success: false,
        message: 'Winner entry not found',
      });
    }
    
    // ✅ CRITICAL: Check if deadline expired and auto-advance queue
    if (historyEntry.prizeClaimStatus === 'PENDING' && 
        historyEntry.claimDeadline && 
        new Date() > historyEntry.claimDeadline &&
        historyEntry.currentEligibleRank === historyEntry.finalRank) {
      
      historyEntry.prizeClaimStatus = 'EXPIRED';
      historyEntry.claimNotes = 'Claim deadline expired (15 minutes)';
      await historyEntry.save();
      
      // ✅ IMMEDIATE: Advance queue to next winner
      await AuctionHistory.advanceClaimQueue(hourlyAuctionId, { fromRank: historyEntry.finalRank, reason: 'EXPIRED_WINDOW' });
      await AuctionHistory.syncClaimStatus(hourlyAuctionId);

      // Sync stats for the user whose claim expired
      await syncUserStats(userId);
    }
    
    return res.status(200).json({
      success: true,
      data: {
        userId: historyEntry.userId,
        username: historyEntry.username,
        rank: historyEntry.finalRank,
        prizeAmount: historyEntry.prizeAmountWon,
        lastRoundBidAmount: historyEntry.lastRoundBidAmount,
        remainingProductFees: historyEntry.remainingProductFees,
        claimStatus: historyEntry.prizeClaimStatus,
        claimDeadline: historyEntry.claimDeadline,
        claimedAt: historyEntry.claimedAt,
        upiId: historyEntry.claimUpiId,
        remainingFeesPaid: historyEntry.remainingFeesPaid,
        paymentReference: historyEntry.remainingFeesPaymentRef,
        currentEligibleRank: historyEntry.currentEligibleRank,
        claimWindowStartedAt: historyEntry.claimWindowStartedAt,
      },
    });
  } catch (error) {
    console.error('❌ [PRIZE_CLAIM] Error fetching prize claim status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Check and expire unclaimed prizes (cron job helper)
 * POST /prize-claim/expire-unclaimed
 */
const expireUnclaimedPrizes = async (req, res) => {
  try {
    const result = await AuctionHistory.expireUnclaimedPrizes();
    
    return res.status(200).json({
      success: true,
      message: 'Unclaimed prizes checked and expired',
      data: {
        expiredCount: result.modifiedCount || 0,
      },
    });
  } catch (error) {
    console.error('❌ [PRIZE_CLAIM] Error expiring unclaimed prizes:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Process priority claim queues (for cron job)
 * POST /prize-claim/process-queues
 */
const processClaimQueues = async (req, res) => {
  try {
    const result = await AuctionHistory.processClaimQueues();
    
    return res.status(200).json({
      success: true,
      message: 'Claim queues processed successfully',
      data: result,
    });
  } catch (error) {
    console.error('❌ [PRIZE_CLAIM] Error processing claim queues:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

module.exports = {
  submitPrizeClaim,
  cancelPrizeClaim,
  getPrizeClaimStatus,
  expireUnclaimedPrizes,
  processClaimQueues,
};
