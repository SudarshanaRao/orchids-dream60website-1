// src/backend/src/controllers/adminVoucherController.js
const AuctionHistory = require('../models/AuctionHistory');
const User = require('../models/user');
const Voucher = require('../models/Voucher');
const woohooService = require('../utils/woohooService');
const { sendAmazonVoucherEmail } = require('../utils/emailService');

const verifyAdmin = async (userId) => {
    if (!userId) return null;
    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || (adminUser.userType !== 'ADMIN' && !adminUser.isSuperAdmin)) return null;
    return adminUser;
};

/**
 * Get users eligible for voucher distribution
 * Winners who claimed prize and paid final bid amount, and no voucher issued yet.
 */
const getEligibleWinners = async (req, res) => {
    try {
        const adminId = req.query.user_id || req.headers['x-user-id'];
        const admin = await verifyAdmin(adminId);
        if (!admin) return res.status(403).json({ success: false, message: 'Admin access required' });

        // Find winners who have claimed and paid
        const winners = await AuctionHistory.find({
            isWinner: true,
            prizeClaimStatus: 'CLAIMED',
            remainingFeesPaid: true
        }).lean();

        if (!winners || winners.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                data: []
            });
        }

        // Get already issued voucher claimIds
        const issuedVouchers = await Voucher.find({
            claimId: { $in: winners.map(w => w._id.toString()) }
        }).select('claimId');
        
        const issuedClaimIds = new Set(issuedVouchers.map(v => v.claimId));

        // Filter out those who already have vouchers
        const eligibleWinners = [];
        for (const winner of winners) {
            if (!issuedClaimIds.has(winner._id.toString())) {
                // Get user details for contact info
                const user = await User.findOne({ user_id: winner.userId }).select('email mobile username');
                eligibleWinners.push({
                    ...winner,
                    userEmail: user?.email,
                    userMobile: user?.mobile,
                    userName: user?.username
                });
            }
        }

        return res.status(200).json({
            success: true,
            count: eligibleWinners.length,
            data: eligibleWinners
        });
    } catch (error) {
        console.error('Error fetching eligible winners:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching eligible winners'
        });
    }
};

/**
 * Manually send voucher to a winner via Woohoo
 */
const sendVoucher = async (req, res) => {
    try {
        const adminId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
        const admin = await verifyAdmin(adminId);
        if (!admin) return res.status(403).json({ success: false, message: 'Admin access required' });

        const { claimId, sku, amount } = req.body;

        if (!claimId || !sku || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: claimId, sku, amount'
            });
        }

        // 1. Verify eligibility again
        const historyEntry = await AuctionHistory.findById(claimId);
        if (!historyEntry) {
            return res.status(404).json({ success: false, message: 'Winner entry not found' });
        }

        if (historyEntry.prizeClaimStatus !== 'CLAIMED' || !historyEntry.remainingFeesPaid) {
            return res.status(400).json({ success: false, message: 'User has not completed the claim process or payment' });
        }

        // 2. Check if already issued
        const existingVoucher = await Voucher.findOne({ claimId });
        if (existingVoucher) {
            return res.status(400).json({ success: false, message: 'Voucher already issued for this claim' });
        }

        // 3. Get user details
        const user = await User.findOne({ user_id: historyEntry.userId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // 4. Call Woohoo API
        const orderDetails = {
            firstname: user.username || 'Customer',
            lastname: 'Dream60',
            email: user.email || 'support@dream60.com',
            phone: user.mobile || '0000000000',
            billingAddress: {
                firstname: user.username || 'Customer',
                lastname: 'Dream60',
                email: user.email || 'support@dream60.com',
                mobile: user.mobile || '0000000000',
                line1: 'Dream60 Office',
                city: 'Bangalore',
                region: 'Karnataka',
                country: 'IN',
                postcode: '560001'
            },
            shippingAddress: {
                firstname: user.username || 'Customer',
                lastname: 'Dream60',
                email: user.email || 'support@dream60.com',
                mobile: user.mobile || '0000000000',
                line1: 'Dream60 Office',
                city: 'Bangalore',
                region: 'Karnataka',
                country: 'IN',
                postcode: '560001'
            },
            sku: sku,
            amount: amount
        };

        const woohooResponse = await woohooService.createOrder(orderDetails);

        // 5. Save to Voucher model
        const voucher = new Voucher({
            userId: user.user_id,
            claimId: claimId,
            auctionId: historyEntry.hourlyAuctionId,
            woohooOrderId: woohooResponse.orderId || woohooResponse.refno,
            sku: sku,
            amount: amount,
            status: woohooResponse.status === 'COMPLETE' ? 'complete' : 'processing',
            orderResponse: woohooResponse
        });

        // If sync_only was true, we might have card details immediately
        if (woohooResponse.cards && woohooResponse.cards.length > 0) {
            const card = woohooResponse.cards[0];
            voucher.cardNumber = card.cardNumber;
            voucher.cardPin = card.cardPin;
            voucher.expiry = card.expiry;
            voucher.activationUrl = card.activationUrl;
        }

        await voucher.save();
        
        return res.status(200).json({
            success: true,
            message: 'Voucher order placed successfully',
            data: voucher
        });
    } catch (error) {
        console.error('Error sending voucher:', error.response?.data || error);
        return res.status(500).json({
            success: false,
            message: 'Error creating voucher via Woohoo API',
            error: error.response?.data || error.message
        });
    }
};

/**
 * Get all issued vouchers
 */
const getIssuedVouchers = async (req, res) => {
    try {
        const adminId = req.query.user_id || req.headers['x-user-id'];
        const admin = await verifyAdmin(adminId);
        if (!admin) return res.status(403).json({ success: false, message: 'Admin access required' });

        const vouchers = await Voucher.find().sort({ createdAt: -1 }).lean();
        
        // Enrich with user info
        const enrichedVouchers = [];
        for (const voucher of vouchers) {
            const user = await User.findOne({ user_id: voucher.userId }).select('username email mobile');
            enrichedVouchers.push({
                ...voucher,
                userName: user?.username,
                userEmail: user?.email,
                userMobile: user?.mobile
            });
        }

        return res.status(200).json({
            success: true,
            data: enrichedVouchers
        });
    } catch (error) {
        console.error('Error fetching issued vouchers:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching vouchers'
        });
    }
};

/**
 * Get Woohoo Account Balance
 */
const getWoohooBalance = async (req, res) => {
    try {
        const adminId = req.query.user_id || req.headers['x-user-id'];
        const admin = await verifyAdmin(adminId);
        if (!admin) return res.status(403).json({ success: false, message: 'Admin access required' });

        const balanceData = await woohooService.getAccountBalance();
        return res.status(200).json({
            success: true,
            data: balanceData
        });
    } catch (error) {
        console.error('Error fetching Woohoo balance:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: 'Error fetching balance from Woohoo API',
            error: error.response?.data || error.message
        });
    }
};

/**
 * Get Woohoo Transaction History
 */
const getWoohooTransactions = async (req, res) => {
    try {
        const adminId = req.query.user_id || req.headers['x-user-id'];
        const admin = await verifyAdmin(adminId);
        if (!admin) return res.status(403).json({ success: false, message: 'Admin access required' });

        const transactions = await woohooService.getTransactionHistory();
        return res.status(200).json({
            success: true,
            data: transactions
        });
    } catch (error) {
        console.error('Error fetching Woohoo transactions:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: 'Error fetching transactions from Woohoo API',
            error: error.response?.data || error.message
        });
    }
};

/**
 * Get Woohoo Categories
 */
const getWoohooCategories = async (req, res) => {
    try {
        const adminId = req.query.user_id || req.headers['x-user-id'];
        const admin = await verifyAdmin(adminId);
        if (!admin) return res.status(403).json({ success: false, message: 'Admin access required' });

        const categories = await woohooService.getCategories();
        return res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching Woohoo categories:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: 'Error fetching categories from Woohoo API',
            error: error.response?.data || error.message
        });
    }
};

/**
 * Get Woohoo Products by Category
 */
const getWoohooProducts = async (req, res) => {
    try {
        const adminId = req.query.user_id || req.headers['x-user-id'];
        const admin = await verifyAdmin(adminId);
        if (!admin) return res.status(403).json({ success: false, message: 'Admin access required' });

        const { categoryId } = req.params;
        if (!categoryId) {
            return res.status(400).json({ success: false, message: 'Category ID is required' });
        }
        const products = await woohooService.getProducts(categoryId);
        return res.status(200).json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error fetching Woohoo products:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: 'Error fetching products from Woohoo API',
            error: error.response?.data || error.message
        });
    }
};

/**
 * Get Woohoo Product Details
 */
const getWoohooProductDetails = async (req, res) => {
    try {
        const adminId = req.query.user_id || req.headers['x-user-id'];
        const admin = await verifyAdmin(adminId);
        if (!admin) return res.status(403).json({ success: false, message: 'Admin access required' });

        const { sku } = req.params;
        if (!sku) {
            return res.status(400).json({ success: false, message: 'SKU is required' });
        }
        const details = await woohooService.getProductDetails(sku);
        return res.status(200).json({
            success: true,
            data: details
        });
    } catch (error) {
        console.error('Error fetching Woohoo product details:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: 'Error fetching product details from Woohoo API',
            error: error.response?.data || error.message
        });
    }
};

/**
 * Get Woohoo Order Status
 */
const getWoohooOrderStatus = async (req, res) => {
    try {
        const adminId = req.query.user_id || req.headers['x-user-id'];
        const admin = await verifyAdmin(adminId);
        if (!admin) return res.status(403).json({ success: false, message: 'Admin access required' });

        const { orderId } = req.params;
        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order ID is required' });
        }
        const status = await woohooService.getOrderStatus(orderId);
        return res.status(200).json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('Error fetching Woohoo order status:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: 'Error fetching order status from Woohoo API',
            error: error.response?.data || error.message
        });
    }
};

/**
 * Get Woohoo Order Cards
 */
const getWoohooOrderCards = async (req, res) => {
    try {
        const adminId = req.query.user_id || req.headers['x-user-id'];
        const admin = await verifyAdmin(adminId);
        if (!admin) return res.status(403).json({ success: false, message: 'Admin access required' });

        const { orderId } = req.params;
        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order ID is required' });
        }
        const cards = await woohooService.getActivatedCards(orderId);
        return res.status(200).json({
            success: true,
            data: cards
        });
    } catch (error) {
        console.error('Error fetching Woohoo order cards:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: 'Error fetching order cards from Woohoo API',
            error: error.response?.data || error.message
        });
    }
};

/**
 * Resend Voucher Email
 */
const resendVoucherEmail = async (req, res) => {
    try {
        const { voucherId } = req.params;
        const voucher = await Voucher.findById(voucherId);
        
        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Voucher not found' });
        }

        if (voucher.status !== 'complete') {
            return res.status(400).json({ success: false, message: 'Voucher order is not yet complete' });
        }

        const user = await User.findOne({ user_id: voucher.userId });
        if (!user || !user.email) {
            return res.status(404).json({ success: false, message: 'User or user email not found' });
        }

        // Get auction history for payment amount
        const historyEntry = await AuctionHistory.findOne({ hourlyAuctionId: voucher.auctionId, userId: voucher.userId });

    // Send Amazon Voucher Email
      const emailResult = await sendAmazonVoucherEmail(user.email, {
          username: user.username || 'Customer',
          voucherAmount: voucher.amount,
          giftCardCode: voucher.cardNumber,
          paymentAmount: historyEntry?.lastRoundBidAmount || 0,
          redeemLink: voucher.activationUrl || 'https://www.amazon.in/gc/balance'
      });

      // Store email details in voucher record
      const emailRecord = {
          sentTo: user.email,
          sentAt: new Date(),
          voucherAmount: voucher.amount,
          giftCardCode: voucher.cardNumber,
          redeemLink: voucher.activationUrl || 'https://www.amazon.in/gc/balance',
          status: emailResult.success ? 'sent' : 'failed'
      };
      
      await Voucher.findByIdAndUpdate(voucherId, {
          $set: { sentToUser: emailResult.success, sentAt: new Date() },
          $push: { emailHistory: emailRecord }
      });

      if (!emailResult.success) {
          return res.status(500).json({ success: false, message: 'Failed to send voucher email' });
      }

        return res.status(200).json({
            success: true,
            message: 'Voucher email resent successfully'
        });
    } catch (error) {
        console.error('Error resending voucher email:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Sync Voucher Status
 */
const syncVoucherStatus = async (req, res) => {
    try {
        const { voucherId } = req.params;
        const voucher = await Voucher.findById(voucherId);
        
        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Voucher not found' });
        }

        const woohooStatus = await woohooService.getOrderStatus(voucher.woohooOrderId);
        
        if (woohooStatus.status === 'COMPLETE' && voucher.status !== 'complete') {
            const cards = await woohooService.getActivatedCards(voucher.woohooOrderId);
            if (cards && cards.length > 0) {
                const card = cards[0];
                voucher.cardNumber = card.cardNumber;
                voucher.cardPin = card.cardPin;
                voucher.expiry = card.expiry;
                voucher.activationUrl = card.activationUrl;
                voucher.status = 'complete';
                await voucher.save();
            }
        } else if (woohooStatus.status === 'CANCELLED' || woohooStatus.status === 'FAILED') {
            voucher.status = 'failed';
            await voucher.save();
        }

        return res.status(200).json({
            success: true,
            message: 'Voucher status synced',
            data: voucher
        });
    } catch (error) {
        console.error('Error syncing voucher status:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    getEligibleWinners,
    sendVoucher,
    getIssuedVouchers,
    getWoohooBalance,
    getWoohooTransactions,
    getWoohooCategories,
    getWoohooProducts,
    getWoohooProductDetails,
    getWoohooOrderStatus,
    getWoohooOrderCards,
    resendVoucherEmail,
    syncVoucherStatus
};

