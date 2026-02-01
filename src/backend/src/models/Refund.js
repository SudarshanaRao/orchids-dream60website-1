const mongoose = require('mongoose');

const RefundSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    hourlyAuctionId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      default: 'Auction Cancelled',
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    processedBy: {
      type: String, // Admin user ID
    },
    processedAt: {
      type: Date,
    },
    notes: String,
  },
  { timestamps: true }
);

// Virtual for ID to match frontend expectation
RefundSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

RefundSchema.set('toJSON', { virtuals: true });
RefundSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Refund', RefundSchema);
