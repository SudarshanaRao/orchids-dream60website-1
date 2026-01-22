const mongoose = require('mongoose');

const WoohooProductSchema = new mongoose.Schema({
    id: String,
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    offerShortDesc: String,
    purchaserLimit: String,
    purchaserDescription: String,
    price: {
        price: String,
        type: String,
        min: Number,
        max: Number,
        denominations: [String],
        currency: {
            code: String,
            symbol: String,
            numericCode: String
        }
    },
    images: {
        thumbnail: String,
        mobile: String,
        base: String,
        small: String
    },
    tnc: {
        link: String,
        content: String
    },
    type: String,
    brandName: String,
    brandCode: String,
    kycEnabled: String,
    allowed_fulfillments: [{ code: String }],
    rewardsDescription: String,
    additionalForm: mongoose.Schema.Types.Mixed,
    metaInformation: mongoose.Schema.Types.Mixed,
    schedulingEnabled: Boolean,
    categories: [Number],
    themes: [{
        sku: String,
        price: String,
        image: String
    }],
    handlingCharges: {
        amount: String,
        label: String
    },
    reloadCardNumber: Boolean,
    expiry: String,
    formatExpiry: String,
    discounts: mongoose.Schema.Types.Mixed,
    corporateDiscounts: mongoose.Schema.Types.Mixed,
    relatedProducts: mongoose.Schema.Types.Mixed,
    storeLocatorUrl: String,
    etaMessage: String,
    payout: mongoose.Schema.Types.Mixed,
    convenience_charges: mongoose.Schema.Types.Mixed,
    cpg: mongoose.Schema.Types.Mixed,
    updatedAt: { type: Date, default: Date.now },
    rawData: mongoose.Schema.Types.Mixed // Store full response just in case
}, { timestamps: true });

module.exports = mongoose.model('WoohooProduct', WoohooProductSchema);
