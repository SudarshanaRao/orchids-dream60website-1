const express = require('express');
const router = express.Router();
const AuctionHistory = require('../models/AuctionHistory');

/**
 * GET /api/v1/prize-claim/pending
 * Get pending prize claims for a user
 * Query params: userId (required)
 */
router.get('/pending', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    // ✅ Find all pending prize claims for this user (any rank 1-3)
    const pendingClaims = await AuctionHistory.find({
      userId,
      isWinner: true,
      prizeClaimStatus: 'PENDING',
    }).sort({ claimDeadline: 1 }); // Sort by deadline (earliest first)

    return res.status(200).json({
      success: true,
      data: pendingClaims,
    });
  } catch (error) {
    console.error('Error fetching pending prize claims:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending prize claims',
      error: error.message,
    });
  }
});

/**
 * POST /api/v1/prize-claim/submit
 * Submit prize claim (UPI ID + remaining fees payment)
 * Body: { userId, hourlyAuctionId, upiId, paymentReference }
 */
router.post('/submit', async (req, res) => {
  try {
    const { userId, hourlyAuctionId, upiId, paymentReference } = req.body;

    // Validate required fields
    if (!userId || !hourlyAuctionId || !upiId) {
      return res.status(400).json({
        success: false,
        message: 'userId, hourlyAuctionId, and upiId are required',
      });
    }

    // Validate UPI ID format (basic validation)
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    if (!upiRegex.test(upiId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid UPI ID format',
      });
    }

    // Submit prize claim
    const updated = await AuctionHistory.submitPrizeClaim(userId, hourlyAuctionId, {
      upiId,
      paymentReference,
    });

    console.log(`✅ [PRIZE-CLAIM-API] Prize claimed successfully by user ${userId} for auction ${hourlyAuctionId}`);

    return res.status(200).json({
      success: true,
      message: 'Prize claim submitted successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error submitting prize claim:', error);
    
    // Handle specific error messages
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    
    if (error.message.includes('expired') || error.message.includes('not pending')) {
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
 * POST /api/v1/prize-claim/process-queues
 * Process priority claim queues (cron job endpoint)
 * Advances to next rank when current rank fails to claim within 30 minutes
 */
router.post('/process-queues', async (req, res) => {
  try {
    const result = await AuctionHistory.processClaimQueues();

    console.log(`✅ [PRIORITY-CLAIM-API] Processed ${result.processed} auctions, advanced ${result.advanced} to next rank`);

    return res.status(200).json({
      success: true,
      message: 'Claim queues processed successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error processing claim queues:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process claim queues',
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/prize-claim/history/:hourlyAuctionId
 * Get prize claim details for a specific auction
 * Params: hourlyAuctionId (required)
 * Query: userId (optional - if provided, returns only that user's claim)
 */
router.get('/history/:hourlyAuctionId', async (req, res) => {
  try {
    const { hourlyAuctionId } = req.params;
    const { userId } = req.query;

    const query = { hourlyAuctionId };
    if (userId) {
      query.userId = userId;
    }

    const claims = await AuctionHistory.find(query).sort({ finalRank: 1 });

    return res.status(200).json({
      success: true,
      data: claims,
    });
  } catch (error) {
    console.error('Error fetching prize claim history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch prize claim history',
      error: error.message,
    });
  }
});

/**
 * POST /api/v1/prize-claim/expire-unclaimed
 * Manually trigger expiration of unclaimed prizes (also runs on scheduler)
 */
router.post('/expire-unclaimed', async (req, res) => {
  try {
    const result = await AuctionHistory.expireUnclaimedPrizes();

    return res.status(200).json({
      success: true,
      message: `Expired ${result.modifiedCount} unclaimed prizes`,
      data: {
        expiredCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error('Error expiring unclaimed prizes:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to expire unclaimed prizes',
      error: error.message,
    });
  }
});

module.exports = router;