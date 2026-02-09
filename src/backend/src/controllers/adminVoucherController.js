// src/backend/src/controllers/adminVoucherController.js
const AuctionHistory = require('../models/AuctionHistory');
const User = require('../models/user');
const Admin = require('../models/Admin');
const Voucher = require('../models/Voucher');
const woohooService = require('../utils/woohooService');
const { sendAmazonVoucherEmail } = require('../utils/emailService');

const verifyAdmin = async (userId) => {
    if (!userId) return null;
    const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
    if (!adminUser) return null;
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
 * Get all issued vouchers (with masked email details for admin)
 */
const getIssuedVouchers = async (req, res) => {
    try {
        const adminId = req.query.user_id || req.headers['x-user-id'];
        const admin = await verifyAdmin(adminId);
        if (!admin) return res.status(403).json({ success: false, message: 'Admin access required' });

        const vouchers = await Voucher.find().sort({ createdAt: -1 }).lean();
        
        // Enrich with user info and masked email details
        const enrichedVouchers = [];
        for (const voucher of vouchers) {
            const user = await User.findOne({ user_id: voucher.userId }).select('username email mobile');
            
            // Get the latest email history entry
            const latestEmail = voucher.emailHistory && voucher.emailHistory.length > 0
                ? voucher.emailHistory[voucher.emailHistory.length - 1]
                : null;

            enrichedVouchers.push({
                ...voucher,
                userName: user?.username,
                userEmail: user?.email,
                userMobile: user?.mobile,
                transactionId: voucher.transactionId,
                emailDetails: {
                    recipientEmail: latestEmail?.sentTo || user?.email || null,
                    recipientEmailMasked: maskEmail(latestEmail?.sentTo || user?.email),
                    emailSubject: latestEmail?.emailSubject || null,
                    emailSentAt: latestEmail?.sentAt || voucher.sentAt || null,
                    emailStatus: latestEmail?.status || (voucher.sentToUser ? 'sent' : null),
                    cardNumberMasked: maskCardNumber(voucher.cardNumber),
                    cardPinMasked: maskPin(voucher.cardPin),
                    giftCardCode: latestEmail?.giftCardCode || voucher.cardNumber || null,
                    giftCardCodeMasked: maskCardNumber(latestEmail?.giftCardCode || voucher.cardNumber),
                    redeemLink: latestEmail?.redeemLink || voucher.activationUrl || null,
                    voucherAmount: voucher.amount,
                    totalEmailsSent: voucher.emailHistory?.length || 0
                }
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

// Masking helpers for admin view
const maskCardNumber = (cardNumber) => {
    if (!cardNumber) return null;
    const str = String(cardNumber);
    if (str.length <= 4) return '*'.repeat(str.length);
    return '*'.repeat(str.length - 4) + str.slice(-4);
};

const maskPin = (pin) => {
    if (!pin) return null;
    const str = String(pin);
    if (str.length <= 2) return '*'.repeat(str.length);
    return '*'.repeat(str.length - 2) + str.slice(-2);
};

const maskEmail = (email) => {
    if (!email) return null;
    const [local, domain] = email.split('@');
    if (!domain) return maskCardNumber(email);
    const maskedLocal = local.length <= 2 ? local : local[0] + '*'.repeat(local.length - 2) + local[local.length - 1];
    const domParts = domain.split('.');
    const maskedDomain = domParts[0].length <= 2
        ? domParts[0]
        : domParts[0][0] + '*'.repeat(domParts[0].length - 2) + domParts[0][domParts[0].length - 1];
    return `${maskedLocal}@${maskedDomain}.${domParts.slice(1).join('.')}`;
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

        const emailSubject = `Your Amazon Gift Card Worth Rs.${voucher.amount} from Dream60`;
        const redeemLink = voucher.activationUrl || 'https://www.amazon.in/gc/balance';

        // Send Amazon Voucher Email
        const emailResult = await sendAmazonVoucherEmail(user.email, {
            username: user.username || 'Customer',
            voucherAmount: voucher.amount,
            giftCardCode: voucher.cardNumber,
            paymentAmount: historyEntry?.lastRoundBidAmount || 0,
            redeemLink: redeemLink
        });

        // Store full email details in voucher record
        const emailRecord = {
            sentTo: user.email,
            sentAt: new Date(),
            voucherAmount: voucher.amount,
            giftCardCode: voucher.cardNumber,
            redeemLink: redeemLink,
            emailSubject: emailSubject,
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
            message: 'Voucher email resent successfully',
            data: {
                transactionId: voucher.transactionId,
                emailSentTo: maskEmail(user.email),
                cardNumberMasked: maskCardNumber(voucher.cardNumber)
            }
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

/**
 * Get voucher transactions for a specific user (for user-facing transaction history)
 * Returns masked card details
 */
const getUserVoucherTransactions = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId is required' });
        }

        const vouchers = await Voucher.find({ userId }).sort({ createdAt: -1 }).lean();

        // Get auction details for each voucher
        const auctionIds = [...new Set(vouchers.map(v => v.auctionId).filter(Boolean))];
        const auctionMap = {};
        if (auctionIds.length > 0) {
            const AuctionHistory = require('../models/AuctionHistory');
            const histories = await AuctionHistory.find({
                hourlyAuctionId: { $in: auctionIds },
                userId
            }).select('hourlyAuctionId auctionName').lean();
            histories.forEach(h => {
                auctionMap[h.hourlyAuctionId] = h.auctionName;
            });
        }

        const maskedVouchers = vouchers.map(v => {
            const latestEmail = v.emailHistory && v.emailHistory.length > 0
                ? v.emailHistory[v.emailHistory.length - 1]
                : null;

            return {
                _id: v._id,
                transactionId: v.transactionId,
                amount: v.amount,
                status: v.status,
                source: v.source || 'woohoo',
                auctionName: auctionMap[v.auctionId] || null,
                woohooOrderId: v.woohooOrderId,
                cardNumberMasked: maskCardNumber(v.cardNumber),
                cardPinMasked: maskPin(v.cardPin),
                expiryDate: v.expiry,
                recipientEmailMasked: maskEmail(latestEmail?.sentTo),
                emailSentAt: latestEmail?.sentAt || v.sentAt,
                emailStatus: latestEmail?.status || (v.sentToUser ? 'sent' : null),
                emailSubject: latestEmail?.emailSubject || null,
                sentAt: v.sentAt,
                createdAt: v.createdAt
            };
        });

        return res.status(200).json({
            success: true,
            data: maskedVouchers
        });
    } catch (error) {
        console.error('Error fetching user voucher transactions:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch voucher transactions'
        });
    }
};

/**
 * Send voucher manually (not via Woohoo)
 * Creates voucher record in DB and optionally sends email
 */
const sendManualVoucher = async (req, res) => {
    try {
        const adminId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
        const admin = await verifyAdmin(adminId);
        if (!admin) return res.status(403).json({ success: false, message: 'Admin access required' });

        const { claimId, voucherAmount, giftCardCode, paymentAmount, redeemLink } = req.body;

        if (!claimId || !voucherAmount || !giftCardCode) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: claimId, voucherAmount, giftCardCode'
            });
        }

        // 1. Verify eligibility
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

        // 4. Create Voucher document
        const voucher = new Voucher({
            userId: user.user_id,
            claimId: claimId,
            auctionId: historyEntry.hourlyAuctionId,
            source: 'manual',
            amount: parseFloat(voucherAmount),
            cardNumber: giftCardCode,
            activationUrl: redeemLink || 'https://www.amazon.in/gc/redeem',
            status: 'complete',
            sentToUser: true,
            sentAt: new Date()
        });

        await voucher.save();

        // 5. Send email notification (optional)
        if (user.email) {
            try {
                await sendAmazonVoucherEmail(user.email, {
                    username: user.username || 'Customer',
                    voucherAmount: voucherAmount,
                    giftCardCode: giftCardCode,
                    paymentAmount: paymentAmount || historyEntry.lastRoundBidAmount || 0,
                    redeemLink: redeemLink || 'https://www.amazon.in/gc/redeem'
                });

                voucher.emailHistory = [{
                    sentTo: user.email,
                    sentAt: new Date(),
                    voucherAmount: voucherAmount,
                    giftCardCode: giftCardCode,
                    redeemLink: redeemLink,
                    emailSubject: `Your Amazon Gift Card Worth Rs.${voucherAmount} from Dream60`,
                    status: 'sent'
                }];
                await voucher.save();
            } catch (emailError) {
                console.error('Email send failed:', emailError);
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Manual voucher created and sent successfully',
            data: {
                transactionId: voucher.transactionId,
                amount: voucher.amount,
                status: voucher.status,
                userName: user.username,
                userEmail: user.email
            }
        });
    } catch (error) {
        console.error('Error sending manual voucher:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating manual voucher',
            error: error.message
        });
    }
};

module.exports = {
    getEligibleWinners,
    sendVoucher,
    sendManualVoucher,
    getIssuedVouchers,
    getWoohooBalance,
    getWoohooTransactions,
    getWoohooCategories,
    getWoohooProducts,
    getWoohooProductDetails,
    getWoohooOrderStatus,
    getWoohooOrderCards,
    resendVoucherEmail,
    syncVoucherStatus,
    getUserVoucherTransactions
};

