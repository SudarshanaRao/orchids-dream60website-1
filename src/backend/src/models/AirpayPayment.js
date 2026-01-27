const mongoose = require('mongoose');

const AirpayPaymentSchema = new mongoose.Schema(
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
    orderId: {
      type: String,
      unique: true,
      required: true,
    },
    airpayTransactionId: String,
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
    
    // Response details from Airpay
    airpayResponse: Object,
    
    // Captured Payment Details
    paymentMethod: String, // chmod
    bankName: String,
    cardName: String,
    cardNumber: String,
    vpa: String, // UPI ID
    
    // Metadata
    auctionName: String,
    auctionTimeSlot: String,
    roundNumber: Number,
    paidAt: Date,
    message: String,
    customVar: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('AirpayPayment', AirpayPaymentSchema);
