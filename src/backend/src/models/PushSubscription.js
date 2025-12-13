const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  endpoint: {
    type: String,
    required: true,
    unique: true
  },
  keys: {
    p256dh: {
      type: String,
      required: true
    },
    auth: {
      type: String,
      required: true
    }
  },
  deviceType: {
    type: String,
    enum: ['PWA', 'Web'],
    default: 'Web',
    required: true
  },
  userAgent: String,
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
});

pushSubscriptionSchema.index({ userId: 1, isActive: 1 });
pushSubscriptionSchema.index({ deviceType: 1, isActive: 1 });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);