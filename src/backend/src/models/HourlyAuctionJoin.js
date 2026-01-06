const mongoose = require('mongoose');

const HourlyAuctionJoinSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // UUID string instead of mongoose.Schema.Types.UUID
      required: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    hourlyAuctionId: {
      type: String, // UUID string instead of mongoose.Schema.Types.UUID 
      required: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RazorpayPayment',
      required: true,
    },
    status: {
      type: String,
      enum: ['joined', 'cancelled'],
      default: 'joined',
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate joins
HourlyAuctionJoinSchema.index({ userId: 1, hourlyAuctionId: 1 }, { unique: true });

module.exports = mongoose.model('HourlyAuctionJoin', HourlyAuctionJoinSchema);