const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const User = require('../models/user');

// Generate VAPID keys (run once and save to .env)
const generateVAPIDKeys = (req, res) => {
  try {
    const vapidKeys = webpush.generateVAPIDKeys();
    res.json({
      success: true,
      vapidKeys: {
        publicKey: vapidKeys.publicKey,
        privateKey: vapidKeys.privateKey
      },
      message: 'Add these keys to your .env file as VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate VAPID keys',
      error: error.message
    });
  }
};

// Get VAPID public key for client
const getVAPIDPublicKey = (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  
  if (!publicKey) {
    return res.status(500).json({
      success: false,
      message: 'VAPID public key not configured'
    });
  }
  
  res.json({
    success: true,
    publicKey
  });
};

// Subscribe user to push notifications
const subscribe = async (req, res) => {
  try {
    const { userId, subscription, deviceType } = req.body;
    
    if (!userId || !subscription) {
      return res.status(400).json({
        success: false,
        message: 'User ID and subscription are required'
      });
    }
    
    // Check if user exists using user_id (UUID format)
    const user = await User.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Detect device type from user agent if not provided
    let detectedDeviceType = deviceType || 'Web';
    const userAgent = req.headers['user-agent'] || '';
    
    // Check if it's a PWA by checking for standalone mode indicators
    if (userAgent.includes('Mobile') && (userAgent.includes('wv') || req.headers['x-requested-with'])) {
      detectedDeviceType = 'PWA';
    }
    
    // Check if subscription already exists
    const existingSubscription = await PushSubscription.findOne({
      endpoint: subscription.endpoint
    });
    
    if (existingSubscription) {
      // Update existing subscription
      existingSubscription.keys = subscription.keys;
      existingSubscription.userId = userId;
      existingSubscription.isActive = true;
      existingSubscription.deviceType = detectedDeviceType;
      existingSubscription.lastUsed = new Date();
      existingSubscription.userAgent = userAgent;
      await existingSubscription.save();
      
      return res.json({
        success: true,
        message: 'Push subscription updated successfully'
      });
    }
    
    // Create new subscription
    const newSubscription = new PushSubscription({
      userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      deviceType: detectedDeviceType,
      userAgent: userAgent
    });
    
    await newSubscription.save();
    
    res.json({
      success: true,
      message: 'Push subscription created successfully'
    });
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe to push notifications',
      error: error.message
    });
  }
};

// Unsubscribe user from push notifications
const unsubscribe = async (req, res) => {
  try {
    const { userId, endpoint } = req.body;
    
    if (!userId || !endpoint) {
      return res.status(400).json({
        success: false,
        message: 'User ID and endpoint are required'
      });
    }
    
    const subscription = await PushSubscription.findOne({
      userId,
      endpoint
    });
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }
    
    subscription.isActive = false;
    await subscription.save();
    
    res.json({
      success: true,
      message: 'Push subscription deactivated successfully'
    });
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe from push notifications',
      error: error.message
    });
  }
};

// Send push notification to specific user
const sendToUser = async (req, res) => {
  try {
    const { userId, title, body, url } = req.body;
    
    if (!userId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'User ID, title, and body are required'
      });
    }
    
    const subscriptions = await PushSubscription.find({
      userId,
      isActive: true
    });
    
    if (subscriptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active subscriptions found for this user'
      });
    }
    
    // Configure web-push
    webpush.setVapidDetails(
      `mailto:${process.env.EMAIL_USER}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    
    const payload = JSON.stringify({
      title,
      body,
      url: url || '/'
    });
    
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.keys.p256dh,
                auth: sub.keys.auth
              }
            },
            payload
          );
          
          // Update last used
          sub.lastUsed = new Date();
          await sub.save();
          
          return { success: true, endpoint: sub.endpoint };
        } catch (error) {
          // Deactivate subscription if it's no longer valid
          if (error.statusCode === 410) {
            sub.isActive = false;
            await sub.save();
          }
          return { success: false, endpoint: sub.endpoint, error: error.message };
        }
      })
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    
    res.json({
      success: true,
      message: `Notification sent to ${successCount} out of ${subscriptions.length} subscriptions`,
      results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send push notification',
      error: error.message
    });
  }
};

// Send push notification to all participants of current auction
const sendToAllParticipants = async (req, res) => {
  try {
    const { title, body, url } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required'
      });
    }
    
    const subscriptions = await PushSubscription.find({
      isActive: true
    }).populate('userId', 'username email');
    
    if (subscriptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active subscriptions found'
      });
    }
    
    // Configure web-push
    webpush.setVapidDetails(
      `mailto:${process.env.EMAIL_USER}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    
    const payload = JSON.stringify({
      title,
      body,
      url: url || '/'
    });
    
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.keys.p256dh,
                auth: sub.keys.auth
              }
            },
            payload
          );
          
          // Update last used
          sub.lastUsed = new Date();
          await sub.save();
          
          return { success: true, endpoint: sub.endpoint, username: sub.userId?.username };
        } catch (error) {
          // Deactivate subscription if it's no longer valid
          if (error.statusCode === 410) {
            sub.isActive = false;
            await sub.save();
          }
          return { success: false, endpoint: sub.endpoint, username: sub.userId?.username, error: error.message };
        }
      })
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    
    res.json({
      success: true,
      message: `Notification sent to ${successCount} out of ${subscriptions.length} subscribers`,
      totalSubscriptions: subscriptions.length,
      successfulSends: successCount,
      failedSends: subscriptions.length - successCount
    });
  } catch (error) {
    console.error('Error sending push notifications to all:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send push notifications',
      error: error.message
    });
  }
};

module.exports = {
  generateVAPIDKeys,
  getVAPIDPublicKey,
  subscribe,
  unsubscribe,
  sendToUser,
  sendToAllParticipants
};