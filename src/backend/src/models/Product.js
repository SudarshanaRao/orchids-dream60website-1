// src/models/Product.js
const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const productSchema = new mongoose.Schema(
  {
    product_id: {
      type: String,
      default: () => randomUUID(),
      index: true,
      unique: true,
      immutable: true,
    },

    // Product name (unique, used for suggestions)
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true,
    },

    // Normalized unique key for product name
    nameKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Prize value
    prizeValue: {
      type: Number,
      required: true,
      min: 0,
    },

    // Product image URL
    imageUrl: {
      type: String,
      default: null,
    },

    // Product description as key-value pairs
    productDescription: {
      type: Map,
      of: String,
      default: {},
    },

    // Entry fee configuration
    entryFeeType: {
      type: String,
      enum: ['RANDOM', 'MANUAL'],
      default: 'RANDOM',
    },

    minEntryFee: {
      type: Number,
      min: 0,
      default: null,
    },

    maxEntryFee: {
      type: Number,
      min: 0,
      default: null,
    },

    feeSplits: {
      BoxA: { type: Number, min: 0, default: null },
      BoxB: { type: Number, min: 0, default: null },
    },

    // Round configuration
    roundCount: {
      type: Number,
      min: 1,
      default: 4,
    },

    // Track usage count for sorting suggestions
    usageCount: {
      type: Number,
      default: 0,
    },

    // Created by admin
    createdBy: {
      type: String,
      required: true,
    },

    // Is active (for soft delete)
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Create text index for search
productSchema.index({ name: 'text' });

productSchema.pre('validate', function (next) {
  if (this.name) {
    this.nameKey = String(this.name).trim().toLowerCase();
  }
  return next();
});

// Static: Find products by search term
productSchema.statics.searchByName = function (searchTerm, limit = 10) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    isActive: true,
    name: regex,
  })
    .sort({ usageCount: -1, name: 1 })
    .limit(limit);
};

// Static: Increment usage count
productSchema.statics.incrementUsage = async function (productId) {
  return this.findOneAndUpdate(
    { product_id: productId },
    { $inc: { usageCount: 1 } },
    { new: true }
  );
};

// Instance: Public profile
productSchema.methods.publicProfile = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  // Convert Mongoose Map to plain object for proper JSON serialization
  if (this.productDescription instanceof Map) {
    const descObj = {};
    this.productDescription.forEach((value, key) => {
      descObj[key] = value;
    });
    obj.productDescription = descObj;
  }
  return obj;
};

productSchema.methods.toJSON = function () {
  return this.publicProfile();
};

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
