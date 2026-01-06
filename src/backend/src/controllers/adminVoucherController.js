// src/backend/src/controllers/adminVoucherController.js
const AuctionHistory = require('../models/AuctionHistory');
const User = require('../models/user');
const Voucher = require('../models/Voucher');
const woohooService = require('../utils/woohooService');
const { sendEmail } = require('../utils/emailService');

/**
 * Get users eligible for voucher distribution
 * Winners who claimed prize and paid final bid amount, and no voucher issued yet.
 */
const getEligibleWinners = async (req, res) => {
    try {
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

        // 6. Send Email Notification to Winner
        try {
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #7c3aed; text-align: center;">Congratulations ${user.username || 'Winner'}!</h2>
                    <p>Your prize voucher for <strong>${historyEntry.auctionName}</strong> has been issued.</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Voucher Amount:</strong> ₹${amount.toLocaleString()}</p>
                        <p style="margin: 5px 0;"><strong>Voucher SKU:</strong> ${sku}</p>
                        ${voucher.cardNumber ? `<p style="margin: 5px 0;"><strong>Card Number:</strong> ${voucher.cardNumber}</p>` : ''}
                        ${voucher.cardPin ? `<p style="margin: 5px 0;"><strong>Card PIN:</strong> ${voucher.cardPin}</p>` : ''}
                        ${voucher.activationUrl ? `<p style="margin: 20px 0; text-align: center;"><a href="${voucher.activationUrl}" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Activate Your Voucher</a></p>` : ''}
                    </div>
                    <p>If you don't see the card details above, they will be sent to you in a follow-up email once the order is fully processed, or you can check your "My Claims" section on the website.</p>
                    <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">Thank you for participating in Dream60!</p>
                </div>
            `;

            await sendEmail({
                to: user.email,
                subject: `Congratulations! Your ₹${amount} Voucher is Here - Dream60`,
                html: emailHtml
            });
            console.log(`Voucher email sent to ${user.email}`);
        } catch (emailError) {
            console.error('Error sending voucher email:', emailError);
            // Don't fail the whole request if email fails
        }
        
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

module.exports = {
    getEligibleWinners,
    sendVoucher,
    getIssuedVouchers,
    getWoohooBalance,
    getWoohooTransactions,
    getWoohooCategories,
    getWoohooProducts
};
