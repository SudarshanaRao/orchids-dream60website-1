const express = require('express');
const router = express.Router();
const AuctionHistory = require('../models/AuctionHistory');

/**
 * GET /api/v1/user/auction-history
 * Fetch completed auction history for a specific user from AuctionHistory collection
 * Query params: userId (required) 
 */
router.get('/auction-history', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    // Find all auction history entries for this user, sorted by date (most recent first)
    const historyEntries = await AuctionHistory.find({
      userId: userId,
      auctionStatus: 'COMPLETED'
    }).sort({ auctionDate: -1, TimeSlot: -1 }).lean();

    console.log(`📊 [AUCTION-HISTORY] Found ${historyEntries.length} completed auctions for user ${userId}`);

    // Transform data to match frontend expectations
    const history = historyEntries.map((entry) => {
      return {
        // Auction identifiers
        hourlyAuctionId: entry.hourlyAuctionId,
        dailyAuctionId: entry.dailyAuctionId,
        
        // Auction details
        auctionDate: entry.auctionDate,
        auctionName: entry.auctionName,
        prizeValue: entry.prizeValue,
        TimeSlot: entry.TimeSlot,
        
        // User participation data
        userParticipation: {
          playerId: entry.userId,
          playerUsername: entry.username,
          entryFee: entry.entryFeePaid,
          joinedAt: entry.joinedAt,
          isEliminated: entry.isEliminated,
          eliminatedInRound: entry.eliminatedInRound,
          totalBidsPlaced: entry.totalBidsPlaced,
          totalAmountBid: entry.totalAmountBid,
          totalAmountSpent: entry.totalAmountSpent,
          roundsParticipated: entry.roundsParticipated,
        },
        
        // Winner information
        isWinner: entry.isWinner,
        userWon: entry.isWinner,
        userRank: entry.finalRank,
        prizeAmountWon: entry.prizeAmountWon,
        finalRank: entry.finalRank,
        
        // Prize claim information (for winners)
        prizeClaimStatus: entry.prizeClaimStatus,
        claimDeadline: entry.claimDeadline,
        claimedAt: entry.claimedAt,
        remainingProductFees: entry.remainingProductFees,
        claimUpiId: entry.claimUpiId,
        remainingFeesPaid: entry.remainingFeesPaid,
        lastRoundBidAmount: entry.lastRoundBidAmount,
        
        // Timestamps
        completedAt: entry.completedAt,
      };
    });

    // Calculate statistics
    const totalWins = history.filter((h) => h.isWinner).length;
    const totalLosses = history.filter((h) => !h.isWinner).length;

    return res.status(200).json({
      success: true,
      data: {
        history,
        totalAuctions: history.length,
        totalWins,
        totalLosses,
      },
    });
  } catch (error) {
    console.error('❌ [AUCTION-HISTORY] Error fetching auction history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch auction history',
      error: error.message,
    });
  }
});

/**
 * POST /api/v1/user/claim-prize
 * Submit prize claim for a winner (any rank: 1, 2, or 3)
 * Body: { userId, hourlyAuctionId, upiId, paymentReference? }
 */
router.post('/claim-prize', async (req, res) => {
  try {
    const { userId, hourlyAuctionId, upiId, paymentReference } = req.body;

    // Validation
    if (!userId || !hourlyAuctionId || !upiId) {
      return res.status(400).json({
        success: false,
        message: 'userId, hourlyAuctionId, and upiId are required',
      });
    }

    // Submit prize claim using AuctionHistory model method
    const updated = await AuctionHistory.submitPrizeClaim(userId, hourlyAuctionId, {
      upiId,
      paymentReference: paymentReference || null,
    });

    console.log(`🎁 [CLAIM-PRIZE] Prize claimed by user ${userId} for auction ${hourlyAuctionId}`);

    return res.status(200).json({
      success: true,
      message: 'Prize claim submitted successfully',
      data: updated,
    });
  } catch (error) {
    console.error('❌ [CLAIM-PRIZE] Error submitting prize claim:', error);
    
    // Handle specific error cases
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    
    if (error.message.includes('not pending') || error.message.includes('expired')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to submit prize claim',
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/user/stats
 * Get user's auction statistics
 * Query params: userId (required)
 */
router.get('/stats', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    const stats = await AuctionHistory.getUserStats(userId);

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('❌ [USER-STATS] Error fetching user stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message,
    });
  }
});

module.exports = router;