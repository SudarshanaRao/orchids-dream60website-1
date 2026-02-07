// src/backend/src/models/Voucher.js
const mongoose = require('mongoose');

const VoucherSchema = new mongoose.Schema(
    {
        userId: {
            type: String, // UUID from user model
            required: true,
            index: true
        },
        claimId: {
            type: String, // ID of the prize claim
            required: true,
            index: true
        },
        auctionId: {
            type: String,
            required: true
        },
        woohooOrderId: {
            type: String,
            required: true,
            unique: true
        },
        sku: {
            type: String,
            required: true
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
            status: { type: String, enum: ['sent', 'failed'], default: 'sent' }
        }]
    },
    { timestamps: true }
);

module.exports = mongoose.model('Voucher', VoucherSchema);
