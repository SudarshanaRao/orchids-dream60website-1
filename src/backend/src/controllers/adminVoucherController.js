// src/backend/src/controllers/adminVoucherController.js
const AuctionHistory = require('../models/AuctionHistory');
const User = require('../models/user');
const Voucher = require('../models/Voucher');
const WoohooProduct = require('../models/WoohooProduct');
const woohooService = require('../utils/woohooService');
const { sendEmail } = require('../utils/emailService');

/**
 * Refresh Woohoo products in local database
 */
const refreshWoohooProducts = async (req, res) => {
    try {
        console.log('Starting Woohoo product refresh...');
        
        // 1. Get all products (list of SKUs)
        const productListResponse = await woohooService.getProductsList();
        
        // Product List API might return an array or an object with products array
        const products = Array.isArray(productListResponse) ? productListResponse : (productListResponse.products || []);
        
        if (products.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No products found in Woohoo catalog'
            });
        }

        console.log(`Found ${products.length} products. Fetching details for each...`);
        
        const results = {
            total: products.length,
            updated: 0,
            failed: 0,
            errors: []
        };

        // 2. Fetch details for each product and upsert
        // We do this sequentially or in small batches to avoid rate limits
        for (const p of products) {
            const sku = p.sku;
            try {
                const details = await woohooService.getProductDetails(sku);
                
                await WoohooProduct.findOneAndUpdate(
                    { sku: sku },
                    {
                        id: details.id,
                        name: details.name,
                        description: details.description,
                        offerShortDesc: details.offerShortDesc,
                        purchaserLimit: details.purchaserLimit,
                        purchaserDescription: details.purchaserDescription,
                        price: {
                            price: details.price?.price,
                            type: details.price?.type,
                            min: details.price?.min,
                            max: details.price?.max,
                            denominations: details.price?.denominations,
                            currency: details.price?.currency
                        },
                        images: details.images,
                        tnc: details.tnc,
                        type: details.type,
                        brandName: details.brandName,
                        brandCode: details.brandCode,
                        kycEnabled: details.kycEnabled,
                        allowed_fulfillments: details.allowed_fulfillments,
                        rewardsDescription: details.rewardsDescription,
                        additionalForm: details.additionalForm,
                        metaInformation: details.metaInformation,
                        schedulingEnabled: details.schedulingEnabled,
                        categories: details.categories,
                        themes: details.themes,
                        handlingCharges: details.handlingCharges,
                        reloadCardNumber: details.reloadCardNumber,
                        expiry: details.expiry,
                        formatExpiry: details.formatExpiry,
                        discounts: details.discounts,
                        corporateDiscounts: details.corporateDiscounts,
                        relatedProducts: details.relatedProducts,
                        storeLocatorUrl: details.storeLocatorUrl,
                        etaMessage: details.etaMessage,
                        payout: details.payout,
                        convenience_charges: details.convenience_charges,
                        cpg: details.cpg,
                        updatedAt: new Date(),
                        rawData: details
                    },
                    { upsert: true, new: true }
                );
                results.updated++;
            } catch (err) {
                console.error(`Failed to refresh details for SKU: ${sku}`, err.message);
                results.failed++;
                results.errors.push({ sku, error: err.message });
            }
        }

        return res.status(200).json({
            success: true,
            message: `Product refresh completed. Updated: ${results.updated}, Failed: ${results.failed}`,
            data: results
        });
    } catch (error) {
        console.error('Error refreshing Woohoo products:', error);
        return res.status(500).json({
            success: false,
            message: 'Error refreshing products from Woohoo API',
            error: error.message
        });
    }
};

/**
 * Get products from local database
 */
const getDbProducts = async (req, res) => {
    try {
        const products = await WoohooProduct.find().sort({ name: 1 }).lean();
        return res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error('Error fetching products from DB:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching products from database'
        });
    }
};

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
            sku: sku,
            amount: amount,
            syncOnly: true // Default to true for immediate card details
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
            status: woohooResponse.status === 'COMPLETE' ? 'complete' : (woohooResponse.status === 'FAILED' ? 'failed' : 'processing'),
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

        // 6. Send Email/Message (Optional, can be triggered separately or auto)
        // For now, let's mark it as ready
        
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
 * Get Woohoo SVC Account Balance
 */
const getWoohooBalance = async (req, res) => {
    try {
        const balanceData = await woohooService.getSVCBalance();
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
 * Get Products by Category
 */
const getWoohooProducts = async (req, res) => {
    try {
        const { categoryId } = req.params;
        if (!categoryId) {
            return res.status(400).json({
                success: false,
                message: 'Category ID is required'
            });
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
 * Get Product Details by SKU
 */
const getWoohooProductDetails = async (req, res) => {
    try {
        const { sku } = req.params;
        if (!sku) {
            return res.status(400).json({
                success: false,
                message: 'SKU is required'
            });
        }
        const product = await woohooService.getProductDetails(sku);
        return res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error fetching product details:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: 'Error fetching product details from Woohoo API',
            error: error.response?.data || error.message
        });
    }
};

/**
 * Get Order Status
 */
const getWoohooOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }
        const status = await woohooService.getOrderStatus(orderId);
        return res.status(200).json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('Error fetching order status:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: 'Error fetching order status from Woohoo API',
            error: error.response?.data || error.message
        });
    }
};

/**
 * Get Activated Cards for an Order
 */
const getWoohooOrderCards = async (req, res) => {
    try {
        const { orderId } = req.params;
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }
        const cards = await woohooService.getActivatedCards(orderId);
        return res.status(200).json({
            success: true,
            data: cards
        });
    } catch (error) {
        console.error('Error fetching order cards:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: 'Error fetching order cards from Woohoo API',
            error: error.response?.data || error.message
        });
    }
};

/**
 * Resend Voucher Email to User
 */
const resendVoucherEmail = async (req, res) => {
    try {
        const { voucherId } = req.params;
        if (!voucherId) {
            return res.status(400).json({
                success: false,
                message: 'Voucher ID is required'
            });
        }

        const voucher = await Voucher.findById(voucherId);
        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: 'Voucher not found'
            });
        }

        if (voucher.status !== 'complete') {
            return res.status(400).json({
                success: false,
                message: 'Cannot send email for incomplete voucher'
            });
        }

        const user = await User.findOne({ user_id: voucher.userId });
        if (!user || !user.email) {
            return res.status(404).json({
                success: false,
                message: 'User or email not found'
            });
        }

        await sendEmail({
            to: user.email,
            subject: 'Your Dream60 Prize Voucher',
            html: `
                <h2>Congratulations! Here is your Amazon Gift Voucher</h2>
                <p>Dear ${user.username || 'Winner'},</p>
                <p>Thank you for participating in Dream60! Here are your voucher details:</p>
                <ul>
                    <li><strong>Amount:</strong> ₹${voucher.amount}</li>
                    <li><strong>Card Number:</strong> ${voucher.cardNumber || 'N/A'}</li>
                    <li><strong>Card PIN:</strong> ${voucher.cardPin || 'N/A'}</li>
                    ${voucher.expiry ? `<li><strong>Expiry:</strong> ${new Date(voucher.expiry).toLocaleDateString()}</li>` : ''}
                    ${voucher.activationUrl ? `<li><strong>Activation URL:</strong> <a href="${voucher.activationUrl}">${voucher.activationUrl}</a></li>` : ''}
                </ul>
                <p>Best regards,<br>Dream60 Team</p>
            `
        });

        voucher.sentToUser = true;
        voucher.sentAt = new Date();
        await voucher.save();

        return res.status(200).json({
            success: true,
            message: 'Voucher email sent successfully'
        });
    } catch (error) {
        console.error('Error sending voucher email:', error);
        return res.status(500).json({
            success: false,
            message: 'Error sending voucher email',
            error: error.message
        });
    }
};

/**
 * Update Voucher Status (sync with Woohoo)
 */
const syncVoucherStatus = async (req, res) => {
    try {
        const { voucherId } = req.params;
        if (!voucherId) {
            return res.status(400).json({
                success: false,
                message: 'Voucher ID is required'
            });
        }

        const voucher = await Voucher.findById(voucherId);
        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: 'Voucher not found'
            });
        }

        const orderStatus = await woohooService.getOrderStatus(voucher.woohooOrderId);
        
        if (orderStatus.status === 'COMPLETE' && voucher.status !== 'complete') {
            voucher.status = 'complete';
            
            const cards = await woohooService.getActivatedCards(voucher.woohooOrderId);
            if (cards && cards.length > 0) {
                const card = cards[0];
                voucher.cardNumber = card.cardNumber;
                voucher.cardPin = card.cardPin;
                voucher.expiry = card.expiry;
                voucher.activationUrl = card.activationUrl;
            }
            
            await voucher.save();
        } else if (orderStatus.status === 'FAILED') {
            voucher.status = 'failed';
            await voucher.save();
        }

        return res.status(200).json({
            success: true,
            message: 'Voucher status synced successfully',
            data: voucher
        });
    } catch (error) {
        console.error('Error syncing voucher status:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: 'Error syncing voucher status',
            error: error.response?.data || error.message
        });
    }
};

module.exports = {
    refreshWoohooProducts,
    getDbProducts,
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
