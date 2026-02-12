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

// Generate a unique transactionId
const generateTransactionId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const uuid = randomUUID().replace(/-/g, '').toUpperCase();
    return `D60-AV-${timestamp}-${uuid.slice(0, 12)}`;
};

// Auto-generate transactionId before save
VoucherSchema.pre('save', function (next) {
    if (!this.transactionId) {
        this.transactionId = generateTransactionId();
    }
    next();
});

// Unique index on woohooOrderId only when it exists and is a non-empty string
VoucherSchema.index(
    { woohooOrderId: 1 },
    { unique: true, partialFilterExpression: { woohooOrderId: { $type: 'string' } } }
);

const VoucherModel = mongoose.model('Voucher', VoucherSchema);
VoucherModel.generateTransactionId = generateTransactionId;

// Drop any old conflicting indexes on woohooOrderId (e.g. sparse unique)
// and ensure the correct partial filter index exists
VoucherModel.collection.getIndexes().then(indexes => {
    const conflicting = Object.entries(indexes).find(([name, keys]) => {
        return keys.some && keys.some(k => k[0] === 'woohooOrderId') && name !== 'woohooOrderId_1';
    });
    // Drop ALL woohooOrderId indexes and let Mongoose recreate the correct one
    const woohooIndexes = Object.entries(indexes).filter(([name]) =>
        name.includes('woohooOrderId')
    );
    for (const [indexName] of woohooIndexes) {
        VoucherModel.collection.dropIndex(indexName).then(() => {
            console.log(`Dropped old index: ${indexName}`);
        }).catch(() => {});
    }
}).catch(() => {});

module.exports = VoucherModel;
