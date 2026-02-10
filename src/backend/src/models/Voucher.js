// src/backend/src/models/Voucher.js
const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const VoucherSchema = new mongoose.Schema(
    {
        userId: {
            type: String, // UUID from user model
            required: true,
            index: true
        },
        claimId: {
            type: String, // ID of the prize claim (optional for manual vouchers)
            index: true
        },
        auctionId: {
            type: String
        },
        transactionId: {
            type: String,
            unique: true,
            sparse: true,
            index: true
        },
        source: {
            type: String,
            enum: ['woohoo', 'manual'],
            default: 'woohoo'
        },
        woohooOrderId: {
            type: String,
            default: undefined
        },
        sku: {
            type: String
        },
        amount: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['processing', 'complete', 'failed'],
            default: 'processing'
        },
        cardNumber: String,
        cardPin: String,
        expiry: Date,
        activationUrl: String,
        orderResponse: Object,
        sentToUser: {
            type: Boolean,
            default: false
        },
        sentAt: Date,
        emailHistory: [{
            sentTo: String,
            sentAt: { type: Date, default: Date.now },
            voucherAmount: Number,
            giftCardCode: String,
            redeemLink: String,
            emailSubject: String,
            emailBody: String,
            status: { type: String, enum: ['sent', 'failed'], default: 'sent' }
        }],
        revealCount: {
            type: Number,
            default: 0
        },
        lastRevealDate: {
            type: Date
        },
        revealHistory: [{
            revealedAt: { type: Date, default: Date.now },
            ipAddress: String,
            userAgent: String
        }],
        dailyRevealLimit: {
            type: Number,
            default: 3
        }
    },
    { timestamps: true }
);

// Auto-generate transactionId before save
VoucherSchema.pre('save', function (next) {
    if (!this.transactionId) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = randomUUID().split('-')[0].toUpperCase();
        this.transactionId = `D60-AV-${timestamp}-${random}`;
    }
    next();
});

// Unique index on woohooOrderId only when it exists (not null/undefined)
// This replaces the old sparse unique index that incorrectly blocked multiple null values
VoucherSchema.index(
    { woohooOrderId: 1 },
    { unique: true, partialFilterExpression: { woohooOrderId: { $type: 'string' } } }
);

module.exports = mongoose.model('Voucher', VoucherSchema);
