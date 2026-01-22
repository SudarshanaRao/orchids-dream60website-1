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
    updatedAt: { type: Date, default: Date.now },
    rawData: mongoose.Schema.Types.Mixed // Store full response just in case
}, { timestamps: true });

module.exports = mongoose.model('WoohooProduct', WoohooProductSchema);
