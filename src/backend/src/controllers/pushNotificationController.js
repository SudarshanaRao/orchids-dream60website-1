const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const User = require('../models/user');

const DEFAULT_ACTIONS = [
  {
    action: 'open',
    title: '🎯 Open',
    icon: '/icons/icon-96x96.png'
  },
  {
    action: 'close',
    title: '❌ Dismiss',
    icon: '/icons/icon-72x72.png'
  }
];

const buildNotificationPayload = (payload = {}) => {
  const {
    title,
    body,
    url = '/',
    image = null,
    icon = '/icons/icon-192x192.png',
    badge = '/icons/icon-72x72.png',
    actions = [],
    vibrate = [200, 100, 200],
    requireInteraction = false,
    tag = 'dream60-notification',
    silent = false,
    data = {},
  } = payload;

  return JSON.stringify({
    title,
    body,
    url,
    image,
    icon,
    badge,
    actions: actions.length ? actions : DEFAULT_ACTIONS,
    vibrate,
    requireInteraction,
    tag,
    silent,
    timestamp: Date.now(),
    data,
  });
};

const getSendOptions = ({ ttl = 86400, urgency = 'high', topic } = {}) => ({
  TTL: ttl,
  urgency,
  topic,
  vapidDetails: {
    subject: process.env.VAPID_SUBJECT || `mailto:${process.env.EMAIL_USER}`,
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
  },
});

// Generate VAPID keys (run once and save to .env)
const generateVAPIDKeys = async (req, res) => {
  try {
    const adminId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Admin user_id required.' });
    }

    const adminUser = await User.findOne({ user_id: adminId });
    if (!adminUser || (adminUser.userType !== 'ADMIN' && !adminUser.isSuperAdmin)) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

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
    const { userId, title, body, ttl, urgency, topic, ...rest } = req.body;
    const adminId = req.query.user_id || req.body.admin_id || req.headers['x-user-id'];

    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Admin user_id required.' });
    }

    const adminUser = await User.findOne({ user_id: adminId });
    if (!adminUser || (adminUser.userType !== 'ADMIN' && !adminUser.isSuperAdmin)) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

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
    const vapidSubject = process.env.VAPID_SUBJECT || `mailto:${process.env.EMAIL_USER}`;
    
    // Validate VAPID subject format (must be mailto: URL or https: URL)
    if (!vapidSubject.startsWith('mailto:') && !vapidSubject.startsWith('https://')) {
      throw new Error('VAPID subject must be a valid mailto: or https: URL');
    }
    
    webpush.setVapidDetails(
      vapidSubject,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    
    const payload = buildNotificationPayload({ title, body, ...rest });
    const sendOptions = getSendOptions({ ttl, urgency, topic });
    
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
            payload,
            sendOptions
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
    const { title, body, ttl, urgency, topic, ...rest } = req.body;
    const adminId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];

    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Admin user_id required.' });
    }

    const adminUser = await User.findOne({ user_id: adminId });
    if (!adminUser || (adminUser.userType !== 'ADMIN' && !adminUser.isSuperAdmin)) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required'
      });
    }
    
    // Get all active subscriptions with user details
    const subscriptions = await PushSubscription.find({
      isActive: true
    }).populate('userId', 'username email user_id userCode');
    
    if (subscriptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active subscriptions found'
      });
    }
    
    // Configure web-push
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || `mailto:${process.env.EMAIL_USER}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    
    // Create professional notification payload
    const payload = buildNotificationPayload({ title, body, ...rest });
    const sendOptions = getSendOptions({ ttl, urgency, topic });
    
    // Send notifications and track results
    const recipientResults = [];
    
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
            payload,
            sendOptions
          );
          
          // Update last used
          sub.lastUsed = new Date();
          await sub.save();
          
          // Track successful recipient
          recipientResults.push({
            success: true,
            username: sub.userId?.username || 'Unknown',
            email: sub.userId?.email || 'Unknown',
            userCode: sub.userId?.userCode || 'Unknown',
            userId: sub.userId?.user_id || 'Unknown',
            deviceType: sub.deviceType,
            endpoint: sub.endpoint.substring(0, 50) + '...'
          });
          
          return { success: true, endpoint: sub.endpoint, username: sub.userId?.username };
        } catch (error) {
          // Deactivate subscription if it's no longer valid (410 Gone)
          if (error.statusCode === 410) {
            sub.isActive = false;
            await sub.save();
          }
          
          // Track failed recipient
          recipientResults.push({
            success: false,
            username: sub.userId?.username || 'Unknown',
            email: sub.userId?.email || 'Unknown',
            userCode: sub.userId?.userCode || 'Unknown',
            userId: sub.userId?.user_id || 'Unknown',
            deviceType: sub.deviceType,
            error: error.message || 'Unknown error',
            statusCode: error.statusCode || 'Unknown'
          });
          
          return { success: false, endpoint: sub.endpoint, username: sub.userId?.username, error: error.message };
        }
      })
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failedCount = subscriptions.length - successCount;
    
    // Filter successful recipients
    const successfulRecipients = recipientResults.filter(r => r.success);
    const failedRecipients = recipientResults.filter(r => !r.success);
    
    console.log(`✅ Push Notification Sent:`);
    console.log(`   Title: ${title}`);
    console.log(`   Success: ${successCount}/${subscriptions.length}`);
    console.log(`   Failed: ${failedCount}`);
    
    res.json({
      success: true,
      message: `Notification sent to ${successCount} out of ${subscriptions.length} subscribers`,
      totalSubscriptions: subscriptions.length,
      successfulSends: successCount,
      failedSends: failedCount,
      // Return recipient information for admin tracking
      recipients: successfulRecipients,
      failedRecipients: failedRecipients.length > 0 ? failedRecipients : undefined
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

const sendToSelectedUsers = async (req, res) => {
  try {
    const { userIds = [], subscriptionIds = [], title, body, ttl, urgency, topic, ...rest } = req.body;
    const adminId = req.query.user_id || req.body.user_id || req.query.admin_id || req.body.adminId || req.headers['x-user-id'];

    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Admin user_id required.' });
    }

    const adminUser = await User.findOne({ user_id: adminId });
    if (!adminUser || (adminUser.userType !== 'ADMIN' && !adminUser.isSuperAdmin)) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body are required' });
    }

    const normalizedUserIds = Array.isArray(userIds) ? userIds.filter(Boolean) : [];
    const normalizedSubscriptionIds = Array.isArray(subscriptionIds) ? subscriptionIds.filter(Boolean) : [];

    if (normalizedUserIds.length === 0 && normalizedSubscriptionIds.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one userId or subscriptionId is required' });
    }

    const subscriptionQuery = { isActive: true };

    if (normalizedUserIds.length && normalizedSubscriptionIds.length) {
      subscriptionQuery.$or = [
        { userId: { $in: normalizedUserIds } },
        { _id: { $in: normalizedSubscriptionIds } }
      ];
    } else if (normalizedUserIds.length) {
      subscriptionQuery.userId = { $in: normalizedUserIds };
    } else {
      subscriptionQuery._id = { $in: normalizedSubscriptionIds };
    }

    const subscriptions = await PushSubscription.find(subscriptionQuery).populate('userId', 'username email user_id userCode');

    if (subscriptions.length === 0) {
      return res.status(404).json({ success: false, message: 'No active subscriptions found for selected users/devices' });
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || `mailto:${process.env.EMAIL_USER}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const payload = buildNotificationPayload({ title, body, ...rest });
    const sendOptions = getSendOptions({ ttl, urgency, topic });

    const recipientResults = [];

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
            payload,
            sendOptions
          );

          sub.lastUsed = new Date();
          await sub.save();

          recipientResults.push({
            success: true,
            username: sub.userId?.username || 'Unknown',
            email: sub.userId?.email || 'Unknown',
            userCode: sub.userId?.userCode || 'Unknown',
            userId: sub.userId?.user_id || 'Unknown',
            deviceType: sub.deviceType,
            endpoint: sub.endpoint.substring(0, 50) + '...'
          });

          return { success: true, endpoint: sub.endpoint, username: sub.userId?.username };
        } catch (error) {
          if (error.statusCode === 410) {
            sub.isActive = false;
            await sub.save();
          }

          recipientResults.push({
            success: false,
            username: sub.userId?.username || 'Unknown',
            email: sub.userId?.email || 'Unknown',
            userCode: sub.userId?.userCode || 'Unknown',
            userId: sub.userId?.user_id || 'Unknown',
            deviceType: sub.deviceType,
            error: error.message || 'Unknown error',
            statusCode: error.statusCode || 'Unknown'
          });

          return { success: false, endpoint: sub.endpoint, username: sub.userId?.username, error: error.message };
        }
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failedCount = subscriptions.length - successCount;

    res.json({
      success: true,
      message: `Notification sent to ${successCount} out of ${subscriptions.length} selected subscriptions`,
      totalSubscriptions: subscriptions.length,
      successfulSends: successCount,
      failedSends: failedCount,
      recipients: recipientResults.filter(r => r.success),
      failedRecipients: recipientResults.filter(r => !r.success)
    });
  } catch (error) {
    console.error('Error sending push notifications to selected users:', error);
    res.status(500).json({ success: false, message: 'Failed to send push notifications', error: error.message });
  }
};

module.exports = {
  generateVAPIDKeys,
  getVAPIDPublicKey,
  subscribe,
  unsubscribe,
  sendToUser,
  sendToAllParticipants,
  sendToSelectedUsers
};