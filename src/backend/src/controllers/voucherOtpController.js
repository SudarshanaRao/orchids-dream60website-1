// src/backend/src/controllers/voucherOtpController.js
const Voucher = require('../models/Voucher');
const User = require('../models/user');
const OTP = require('../models/OTP');
const smsRestService = require('../utils/smsRestService');

/**
 * Check if user has exceeded daily reveal limit (3 per day)
 */
const checkDailyRevealLimit = (voucher) => {
    if (!voucher.lastRevealDate) return true;

    const today = new Date();
    const lastReveal = new Date(voucher.lastRevealDate);
    const isSameDay = today.toDateString() === lastReveal.toDateString();

    if (!isSameDay) return true;
    return voucher.revealCount < (voucher.dailyRevealLimit || 3);
};

/**
 * Standardize mobile number to 91XXXXXXXXXX format
 */
const formatMobile = (num) => {
    if (!num) return num;
    let cleaned = num.toString().replace(/[\s\-\+]/g, '');
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
        cleaned = '91' + cleaned;
    }
    return cleaned;
};

/**
 * Send OTP for voucher reveal
 * POST /user/voucher/:voucherId/send-reveal-otp
 */
const sendVoucherRevealOtp = async (req, res) => {
    try {
        const { voucherId } = req.params;
        const { userId } = req.body;

        if (!voucherId || !userId) {
            return res.status(400).json({ success: false, message: 'voucherId and userId are required' });
        }

        // 1. Find voucher and verify ownership
        const voucher = await Voucher.findById(voucherId);
        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Voucher not found' });
        }

        if (voucher.userId !== userId) {
            return res.status(403).json({ success: false, message: 'You are not authorized to view this voucher' });
        }

        if (voucher.status !== 'complete') {
            return res.status(400).json({ success: false, message: 'Voucher is not yet complete' });
        }

        // 2. Check daily reveal limit
        if (!checkDailyRevealLimit(voucher)) {
            return res.status(429).json({
                success: false,
                message: 'Daily reveal limit reached (3 per day). Please try again tomorrow.'
            });
        }

        // 3. Get user mobile
        const user = await User.findOne({ user_id: userId });
        if (!user || !user.mobile) {
            return res.status(404).json({ success: false, message: 'User mobile not found' });
        }

        const formattedMobile = formatMobile(user.mobile);

        // 4. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 5. Save OTP with voucher-reveal identifier
        const otpIdentifier = `voucher_reveal_${formattedMobile}`;
        await OTP.findOneAndUpdate(
            { identifier: otpIdentifier, type: 'mobile' },
            { otp, createdAt: new Date() },
            { upsert: true, new: true }
        );

        // 6. Send SMS using login template
        const name = user.username || 'User';
        const message = `Dear ${name}, use this OTP ${otp} to login to your Dream60 Account. Its only valid for 10 minutes - Finpages Tech `;
        const templateId = '1207176898558880888';

        const result = await smsRestService.sendSms(formattedMobile, message, 'FINPGS', { templateId });

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'OTP sent successfully',
                data: { mobile: formattedMobile.slice(-4) }
            });
        } else {
            return res.status(500).json({ success: false, message: result.error || 'Failed to send OTP' });
        }
    } catch (error) {
        console.error('Error sending voucher reveal OTP:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Verify OTP and reveal voucher code
 * POST /user/voucher/:voucherId/verify-reveal-otp
 */
const verifyVoucherRevealOtp = async (req, res) => {
    try {
        const { voucherId } = req.params;
        const { userId, otp } = req.body;

        if (!voucherId || !userId || !otp) {
            return res.status(400).json({ success: false, message: 'voucherId, userId, and otp are required' });
        }

        // 1. Find voucher and verify ownership
        const voucher = await Voucher.findById(voucherId);
        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Voucher not found' });
        }

        if (voucher.userId !== userId) {
            return res.status(403).json({ success: false, message: 'You are not authorized to view this voucher' });
        }

        // 2. Check daily limit again
        if (!checkDailyRevealLimit(voucher)) {
            return res.status(429).json({
                success: false,
                message: 'Daily reveal limit reached (3 per day). Please try again tomorrow.'
            });
        }

        // 3. Get user mobile for OTP lookup
        const user = await User.findOne({ user_id: userId });
        if (!user || !user.mobile) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const formattedMobile = formatMobile(user.mobile);
        const otpIdentifier = `voucher_reveal_${formattedMobile}`;

        // 4. Verify OTP
        const otpRecord = await OTP.findOne({ identifier: otpIdentifier, type: 'mobile' });
        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'OTP expired or not found' });
        }

        if (otpRecord.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        // 5. Delete OTP so it can't be reused
        await OTP.deleteOne({ _id: otpRecord._id });

        // 6. Update reveal tracking
        const today = new Date();
        const lastReveal = voucher.lastRevealDate ? new Date(voucher.lastRevealDate) : null;
        const isSameDay = lastReveal && today.toDateString() === lastReveal.toDateString();

        const newRevealCount = isSameDay ? (voucher.revealCount || 0) + 1 : 1;

        await Voucher.findByIdAndUpdate(voucherId, {
            $set: {
                revealCount: newRevealCount,
                lastRevealDate: today
            },
            $push: {
                revealHistory: {
                    revealedAt: today,
                    ipAddress: req.ip || req.connection?.remoteAddress,
                    userAgent: req.headers['user-agent']
                }
            }
        });

        // 7. Return full card details
        return res.status(200).json({
            success: true,
            message: 'Voucher code revealed successfully',
            data: {
                cardNumber: voucher.cardNumber,
                cardPin: voucher.cardPin || null,
                activationUrl: voucher.activationUrl || null,
                expiry: voucher.expiry || null,
                revealsRemaining: (voucher.dailyRevealLimit || 3) - newRevealCount
            }
        });
    } catch (error) {
        console.error('Error verifying voucher reveal OTP:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    sendVoucherRevealOtp,
    verifyVoucherRevealOtp
};
