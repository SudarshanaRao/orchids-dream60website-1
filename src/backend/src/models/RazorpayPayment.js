const mongoose = require('mongoose');

const RazorpayPaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // UUID instead of ObjectId 
      required: true,
    },
    auctionId: {
      type: String, // UUID for Hourly Auction
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    razorpayOrderId: {
      type: String,
      unique: true,
      required: true,
    },
    razorpayPaymentId: String,
    razorpaySignature: String,
    status: {
      type: String,
      enum: ['created', 'paid', 'failed'],
      default: 'created',
    },
    paymentType: {
      type: String,
      enum: ['ENTRY_FEE', 'PRIZE_CLAIM'],
      default: 'ENTRY_FEE',
    },
    orderResponse: Object,
    paymentResponse: Object,
  },
  { timestamps: true }
);

module.exports = mongoose.model('RazorpayPayment', RazorpayPaymentSchema);