const User = require('../models/user');
const MasterAuction = require('../models/masterAuction');
const Product = require('../models/Product');
const PushSubscription = require('../models/PushSubscription');
const DailyAuction = require('../models/DailyAuction');
const HourlyAuction = require('../models/HourlyAuction');
const AuctionHistory = require('../models/AuctionHistory');
const OTP = require('../models/OTP');
const Refund = require('../models/Refund');
const AirpayPayment = require('../models/AirpayPayment');
const HourlyAuctionJoin = require('../models/HourlyAuctionJoin');
const bcrypt = require('bcryptjs');
const { sendOtpEmail, sendEmailWithTemplate, buildEmailTemplate, getPrimaryClientUrl } = require('../utils/emailService');
const { sendSms, SMS_TEMPLATES } = require('../utils/smsService');

const ADMIN_APPROVAL_EMAIL = 'dream60.official@gmail.com';

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Helper: Generate random BoxA and BoxB fees that add up to a total within min/max range
 */
function generateRandomFeeSplits(minEntryFee, maxEntryFee) {
  const totalFee = Math.floor(Math.random() * (maxEntryFee - minEntryFee + 1)) + minEntryFee;
  const splitPercentage = Math.random() * 0.4 + 0.3; // 0.3 to 0.7
  const BoxA = Math.floor(totalFee * splitPercentage);
  const BoxB = totalFee - BoxA;
  return { BoxA, BoxB };
}

const getConfigFeeSplits = (config) => {
  if (config.FeeSplits && (typeof config.FeeSplits.BoxA === 'number' || typeof config.FeeSplits.BoxB === 'number')) {
    return { BoxA: config.FeeSplits.BoxA ?? 0, BoxB: config.FeeSplits.BoxB ?? 0 };
  }
  if (typeof config.BoxA === 'number' || typeof config.BoxB === 'number') {
    return { BoxA: config.BoxA ?? 0, BoxB: config.BoxB ?? 0 };
  }
  return { BoxA: null, BoxB: null };
};

const syncProductsFromConfig = async (configs, userId) => {
  if (!Array.isArray(configs) || configs.length === 0) return;

  const operations = configs
    .filter(config => config?.auctionName)
    .map(config => {
      const name = String(config.auctionName).trim();
      const nameKey = name.toLowerCase();
      const feeSplits = getConfigFeeSplits(config);

      return Product.updateOne(
        { nameKey },
        {
          $set: {
            name,
            prizeValue: Number(config.prizeValue || 0),
            imageUrl: config.imageUrl || null,
            productDescription: config.productDescription || {},
            entryFeeType: config.EntryFee || 'RANDOM',
            minEntryFee: config.minEntryFee ?? null,
            maxEntryFee: config.maxEntryFee ?? null,
            feeSplits,
            roundCount: config.roundCount || 4,
            isActive: true,
          },
          $setOnInsert: { createdBy: userId },
          $inc: { usageCount: 1 },
        },
        { upsert: true }
      );
    });

  await Promise.all(operations);
};

/**
 * Admin Login
 */
const adminLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body || {};

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Identifier and password are required' });
    }

    const adminUser = await User.findOne({
      $or: [
        { username: identifier },
        { email: identifier },
        { mobile: identifier },
      ],
      userType: 'ADMIN',
      isDeleted: { $ne: true },
    });

    if (!adminUser) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    let isPasswordValid = false;
    if (adminUser.password === password) {
      isPasswordValid = true;
    } else if (adminUser.password && adminUser.password.startsWith('$2')) {
      try {
        isPasswordValid = await bcrypt.compare(password, adminUser.password);
      } catch (bcryptErr) {
        console.error('Bcrypt compare error:', bcryptErr);
        isPasswordValid = false;
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      admin: {
        user_id: adminUser.user_id,
        username: adminUser.username,
        email: adminUser.email,
        userType: adminUser.userType,
        userCode: adminUser.userCode,
        isSuperAdmin: adminUser.isSuperAdmin || false,
      },
    });
  } catch (err) {
    console.error('Admin Login Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Send Admin Signup OTP
 */
const sendAdminSignupOtp = async (req, res) => {
  try {
    const { email, username, mobile } = req.body;

    if (!email || !username || !mobile) {
      return res.status(400).json({ success: false, message: 'Email, username, and mobile are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { mobile }],
      isDeleted: { $ne: true }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email/username/mobile already exists' });
    }

    const otp = generateOtp();
    await OTP.findOneAndUpdate(
      { identifier: email.toLowerCase() },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    await sendOtpEmail(email, otp);

    return res.status(200).json({ success: true, message: 'OTP sent to email for admin signup' });
  } catch (err) {
    console.error('Send Admin Signup OTP Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Admin Signup
 */
const adminSignup = async (req, res) => {
  try {
    const { email, username, mobile, password, otp } = req.body;

    if (!email || !username || !mobile || !password || !otp) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({ identifier: email.toLowerCase(), otp });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await User.create({
      username,
      email: email.toLowerCase(),
      mobile,
      password: hashedPassword,
      userType: 'ADMIN',
      isVerified: true,
    });

    // Delete OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    return res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      admin: {
        user_id: newAdmin.user_id,
        username: newAdmin.username,
        email: newAdmin.email,
        userType: newAdmin.userType,
      }
    });
  } catch (err) {
    console.error('Admin Signup Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get User Statistics
 */
const getUserStatistics = async (req, res) => {
  try {
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Admin user_id required.' });
    }

    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || (adminUser.userType !== 'ADMIN' && !adminUser.isSuperAdmin)) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    const statsPromises = [
      User.countDocuments({ isDeleted: false }).catch(() => 0),
      User.countDocuments({ isDeleted: false, userType: 'USER' }).catch(() => 0),
      User.countDocuments({ isDeleted: true }).catch(() => 0),
      User.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: null, total: { $sum: '$totalAuctions' } } }]).catch(() => []),
      User.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: null, total: { $sum: '$totalWins' } } }]).catch(() => []),
      User.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: null, total: { $sum: '$totalAmountSpent' } } }]).catch(() => []),
      User.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: null, total: { $sum: '$totalAmountWon' } } }]).catch(() => []),
      User.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(10).select('user_id username email mobile userCode createdAt totalAuctions totalWins').lean().catch(() => []),
      User.find({ isDeleted: false }).sort({ totalAmountSpent: -1 }).limit(10).select('user_id username email userCode totalAmountSpent totalAuctions').lean().catch(() => []),
      User.find({ isDeleted: false }).sort({ totalWins: -1 }).limit(10).select('user_id username email userCode totalWins totalAmountWon').lean().catch(() => []),
    ];

    const [totalUsers, activeUsers, deletedUsers, totalAuctions, totalWins, totalAmountSpent, totalAmountWon, recentUsers, topSpenders, topWinners] = await Promise.all(statsPromises);

    const statistics = {
      overview: {
        totalUsers,
        activeUsers,
        deletedUsers,
        adminUsers: await User.countDocuments({ userType: 'ADMIN' }).catch(() => 0),
      },
      activity: {
        totalAuctions: totalAuctions[0]?.total || 0,
        totalWins: totalWins[0]?.total || 0,
        totalAmountSpent: totalAmountSpent[0]?.total || 0,
        totalAmountWon: totalAmountWon[0]?.total || 0,
      },
      recentUsers: (recentUsers || []).map(u => ({
        user_id: u.user_id,
        username: u.username,
        email: u.email,
        mobile: u.mobile,
        userCode: u.userCode,
        joinedAt: u.createdAt,
        totalAuctions: u.totalAuctions || 0,
        totalWins: u.totalWins || 0,
      })),
      topSpenders: (topSpenders || []).map(u => ({
        user_id: u.user_id,
        username: u.username,
        email: u.email,
        userCode: u.userCode,
        totalAmountSpent: u.totalAmountSpent || 0,
        totalAuctions: u.totalAuctions || 0,
      })),
      topWinners: (topWinners || []).map(u => ({
        user_id: u.user_id,
        username: u.username,
        email: u.email,
        userCode: u.userCode,
        totalWins: u.totalWins || 0,
        totalAmountWon: u.totalAmountWon || 0,
      })),
    };

    return res.status(200).json({ success: true, data: statistics });
  } catch (err) {
    console.error('Get User Statistics Error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching statistics' });
  }
};

/**
 * Get All Users (Admin)
 */
const getAllUsersAdmin = async (req, res) => {
  try {
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Admin user_id required.' });
    }

    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || (adminUser.userType !== 'ADMIN' && !adminUser.isSuperAdmin)) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    const { page = 1, limit = 20, search = '', includeDeleted = false, userType } = req.query;
    const query = {};
    if (includeDeleted !== 'true') query.isDeleted = false;
    if (userType) query.userType = userType;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { userCode: { $regex: search, $options: 'i' } },
      ];
    }

    const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (p - 1) * l;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(l).select('-password').lean(),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: users,
      meta: { total, page: p, limit: l, pages: Math.ceil(total / l) },
    });
  } catch (err) {
    console.error('Get All Users Admin Error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
};

/**
 * Get All Master Auctions With Daily Config (Admin)
 */
const getAllMasterAuctionsWithConfig = async (req, res) => {
  try {
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Admin user_id required.' });
    }

    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || (adminUser.userType !== 'ADMIN' && !adminUser.isSuperAdmin)) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    const masterAuctions = await MasterAuction.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    const allAuctions = [];
    for (const masterAuction of masterAuctions) {
      if (masterAuction.dailyAuctionConfig && Array.isArray(masterAuction.dailyAuctionConfig)) {
        for (const config of masterAuction.dailyAuctionConfig) {
          allAuctions.push({
            ...config,
            master_id: masterAuction.master_id,
            masterAuctionCreatedAt: masterAuction.createdAt,
          });
        }
      }
    }

    allAuctions.sort((a, b) => (a.TimeSlot || '00:00').localeCompare(b.TimeSlot || '00:00'));
    return res.status(200).json({ success: true, data: allAuctions, meta: { total: allAuctions.length } });
  } catch (err) {
    console.error('Get All Master Auctions With Config Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Create Master Auction (Admin)
 */
const createMasterAuctionAdmin = async (req, res) => {
  try {
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Admin user_id required.' });
    }

    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || (adminUser.userType !== 'ADMIN' && !adminUser.isSuperAdmin)) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    const { totalAuctionsPerDay, dailyAuctionConfig, isActive } = req.body;
    if (!dailyAuctionConfig || !Array.isArray(dailyAuctionConfig)) {
      return res.status(400).json({ success: false, message: 'dailyAuctionConfig must be an array' });
    }

    // Process and validate config
    const processedConfig = dailyAuctionConfig.map(config => {
      // Calculate minSlotsValue if AUTO
      if (config.minSlotsCriteria === 'AUTO') {
        const prizeValue = config.prizeValue || 0;
        let entryFee = 0;
        if (config.EntryFee === 'MANUAL' && config.FeeSplits) {
          entryFee = (config.FeeSplits.BoxA || 0) + (config.FeeSplits.BoxB || 0);
        } else if (config.EntryFee === 'RANDOM' && config.minEntryFee && config.maxEntryFee) {
          entryFee = (config.minEntryFee + config.maxEntryFee) / 2;
        }

        if (entryFee > 0) {
          config.minSlotsValue = Math.floor((prizeValue / entryFee) / 2);
        } else {
          config.minSlotsValue = 0;
        }
      }

      if (config.EntryFee === 'RANDOM' && (!config.minEntryFee || !config.maxEntryFee)) {
        throw new Error(`minEntryFee and maxEntryFee required for RANDOM entry fee in auction ${config.auctionNumber}`);
      }
      if (config.EntryFee === 'RANDOM') {
        const { BoxA, BoxB } = generateRandomFeeSplits(config.minEntryFee, config.maxEntryFee);
        return { ...config, BoxA, BoxB };
      }
      return config;
    });

    const newMasterAuction = await MasterAuction.create({
      totalAuctionsPerDay: totalAuctionsPerDay || processedConfig.length,
      dailyAuctionConfig: processedConfig,
      isActive: isActive !== false,
      createdBy: userId,
    });

    await syncProductsFromConfig(processedConfig, userId);

    return res.status(201).json({ success: true, message: 'Master auction created successfully', data: newMasterAuction });
  } catch (err) {
    console.error('Create Master Auction Error:', err);
    return res.status(err.message.includes('required') ? 400 : 500).json({ success: false, message: err.message || 'Server error' });
  }
};

/**
 * Get All Master Auctions Admin
 */
const getAllMasterAuctionsAdmin = async (req, res) => {
  try {
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Admin user_id required.' });
    }

    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || (adminUser.userType !== 'ADMIN' && !adminUser.isSuperAdmin)) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    const { page = 1, limit = 20, isActive } = req.query;
    const query = {};
    if (typeof isActive !== 'undefined') query.isActive = isActive === 'true';

    const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (p - 1) * l;

    const [auctions, total] = await Promise.all([
      MasterAuction.find(query).sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
      MasterAuction.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: auctions,
      meta: { total, page: p, limit: l, pages: Math.ceil(total / l) },
    });
  } catch (err) {
    console.error('Get All Master Auctions Admin Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Update Master Auction Admin
 */
const updateMasterAuctionAdmin = async (req, res) => {
  try {
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Admin user_id required.' });
    }

    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || (adminUser.userType !== 'ADMIN' && !adminUser.isSuperAdmin)) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    const { master_id } = req.params;
    const { totalAuctionsPerDay, dailyAuctionConfig, isActive } = req.body;

    const masterAuction = await MasterAuction.findOne({ master_id });
    if (!masterAuction) return res.status(404).json({ success: false, message: 'Master auction not found' });

    if (totalAuctionsPerDay) masterAuction.totalAuctionsPerDay = totalAuctionsPerDay;
    if (typeof isActive !== 'undefined') masterAuction.isActive = isActive;
    masterAuction.modifiedBy = userId;
    if (dailyAuctionConfig && Array.isArray(dailyAuctionConfig)) {
      masterAuction.dailyAuctionConfig = dailyAuctionConfig.map(config => {
        if (config.EntryFee === 'RANDOM' && (!config.BoxA || !config.BoxB)) {
          const { BoxA, BoxB } = generateRandomFeeSplits(config.minEntryFee || 20, config.maxEntryFee || 80);
          return { ...config, BoxA, BoxB };
        }
        return config;
      });
    }

    await masterAuction.save();
    await syncProductsFromConfig(masterAuction.dailyAuctionConfig, userId);
    return res.status(200).json({ success: true, message: 'Master auction updated successfully', data: masterAuction });
  } catch (err) {
    console.error('Update Master Auction Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Delete Master Auction Admin
 */
const deleteMasterAuctionAdmin = async (req, res) => {
  try {
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || (adminUser.userType !== 'ADMIN' && !adminUser.isSuperAdmin)) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    const { master_id } = req.params;
    const result = await MasterAuction.findOneAndDelete({ master_id });
    if (!result) return res.status(404).json({ success: false, message: 'Master auction not found' });

    return res.status(200).json({ success: true, message: 'Master auction deleted successfully' });
  } catch (err) {
    console.error('Delete Master Auction Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Delete Daily Auction Slot
 */
const deleteDailyAuctionSlot = async (req, res) => {
  try {
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || (adminUser.userType !== 'ADMIN' && !adminUser.isSuperAdmin)) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    const { master_id, auction_number } = req.params;
    const masterAuction = await MasterAuction.findOne({ master_id });
    if (!masterAuction) return res.status(404).json({ success: false, message: 'Master auction not found' });

    masterAuction.dailyAuctionConfig = masterAuction.dailyAuctionConfig.filter(slot => slot.auctionNumber !== parseInt(auction_number));
    await masterAuction.save();

    return res.status(200).json({ success: true, message: 'Auction slot deleted successfully' });
  } catch (err) {
    console.error('Delete Daily Auction Slot Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get Push Subscription Stats
 */
const getPushSubscriptionStats = async (req, res) => {
  try {
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || (adminUser.userType !== 'ADMIN' && !adminUser.isSuperAdmin)) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    const subscriptions = await PushSubscription.find().lean();
    const userIds = subscriptions.map(s => s.userId).filter(id => id);
    const users = await User.find({ user_id: { $in: userIds } }).select('user_id username email').lean();
    const userMap = users.reduce((acc, u) => ({ ...acc, [u.user_id]: u }), {});

    const processedSubs = subscriptions.map(s => ({
      ...s,
      username: userMap[s.userId]?.username || 'Unknown',
      email: userMap[s.userId]?.email || 'Unknown',
    }));

    const pwaUsers = processedSubs.filter(s => s.deviceType === 'PWA');
    const webUsers = processedSubs.filter(s => s.deviceType === 'Web');

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalActive: subscriptions.length,
          pwaCount: pwaUsers.length,
          webCount: webUsers.length,
        },
        pwaUsers,
        webUsers,
      }
    });
  } catch (err) {
    console.error('Push Subscription Stats Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Delete Push Subscription Admin
 */
const deletePushSubscriptionAdmin = async (req, res) => {
  try {
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || (adminUser.userType !== 'ADMIN' && !adminUser.isSuperAdmin)) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    const { subscriptionId } = req.params;
    await PushSubscription.findOneAndDelete({ subscriptionId });
    return res.status(200).json({ success: true, message: 'Subscription deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get Analytics Data
 */
const getAnalyticsData = async (req, res) => {
  try {
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || (adminUser.userType !== 'ADMIN' && !adminUser.isSuperAdmin)) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    const { date, viewType, startDate: startStr, endDate: endStr } = req.query;
    
    // Determine date range
    let start, end;
    const now = new Date();
    
    const parseDDMMYYYY = (str) => {
      if (!str) return null;
      const [d, m, y] = str.split('-').map(Number);
      return new Date(y, m - 1, d);
    };

    if (viewType === 'today') {
      start = date ? parseDDMMYYYY(date) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 1);
    } else if (viewType === 'yesterday') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end.setHours(0, 0, 0, 0);
    } else if (viewType === 'week') {
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    } else if (viewType === 'month') {
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    } else if (viewType === 'custom') {
      start = parseDDMMYYYY(startStr) || new Date(now.getFullYear(), now.getMonth(), now.getDate());
      start.setHours(0, 0, 0, 0);
      end = parseDDMMYYYY(endStr) || new Date(start);
      end.setHours(23, 59, 59, 999);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 1);
    }

    // Fetch all hourly auctions in range
    const hourlyAuctions = await HourlyAuction.find({
      auctionDate: { $gte: start, $lt: end }
    }).sort({ auctionDate: 1, TimeSlot: 1 }).lean();

    // Fetch auction history in range
    const history = await AuctionHistory.find({
      auctionDate: { $gte: start, $lt: end }
    }).lean();

    // Aggregate Summary
    const summary = {
      totalAuctions: hourlyAuctions.length,
      liveAuctions: hourlyAuctions.filter(a => a.Status === 'LIVE').length,
      completedAuctions: hourlyAuctions.filter(a => a.Status === 'COMPLETED').length,
      upcomingAuctions: hourlyAuctions.filter(a => a.Status === 'UPCOMING').length,
      uniqueParticipants: new Set(history.map(h => h.userId)).size,
      totalParticipations: history.length,
      totalClaimed: history.filter(h => h.prizeClaimStatus === 'CLAIMED').length,
      totalPending: history.filter(h => h.prizeClaimStatus === 'PENDING').length,
      totalExpired: history.filter(h => h.prizeClaimStatus === 'EXPIRED').length,
      totalEntryFees: history.reduce((sum, h) => sum + (h.entryFeePaid || 0), 0),
      totalPrizeValue: hourlyAuctions.reduce((sum, a) => sum + (a.prizeValue || 0), 0),
      totalClaimedValue: history.filter(h => h.prizeClaimStatus === 'CLAIMED').reduce((sum, h) => sum + (h.prizeAmountWon || 0), 0),
    };

    // Status Distribution
    const statusDistribution = {
      live: summary.liveAuctions,
      completed: summary.completedAuctions,
      upcoming: summary.upcomingAuctions,
      cancelled: hourlyAuctions.filter(a => a.Status === 'CANCELLED').length,
    };

    // Claim Status Distribution
    const claimStatusDistribution = {
      claimed: summary.totalClaimed,
      pending: summary.totalPending,
      expired: summary.totalExpired,
      notApplicable: history.filter(h => h.prizeClaimStatus === 'NOT_APPLICABLE').length,
    };

    // Auction Details
    const auctionDetails = hourlyAuctions.map(a => {
      const auctionHistory = history.filter(h => h.hourlyAuctionId === a.hourlyAuctionId);
      const winners = (a.winners || []).map(w => ({
        rank: w.rank,
        username: w.playerUsername,
        prizeAmount: w.prizeAmount,
        claimStatus: w.prizeClaimStatus || 'NOT_APPLICABLE',
        claimedAt: w.prizeClaimedAt,
      }));

      return {
        auctionId: a.hourlyAuctionId,
        auctionCode: a.hourlyAuctionCode,
        auctionName: a.auctionName,
        timeSlot: a.TimeSlot,
        date: a.auctionDate ? new Date(a.auctionDate).toLocaleDateString('en-IN') : 'N/A',
        status: a.Status,
        prizeValue: a.prizeValue || 0,
        participantCount: a.totalParticipants || 0,
        currentRound: a.currentRound || 0,
        totalRounds: a.totalRounds || 0,
        winnersCount: winners.length,
        claimedCount: winners.filter(w => w.claimStatus === 'CLAIMED').length,
        totalEntryFees: auctionHistory.reduce((sum, h) => sum + (h.entryFeePaid || 0), 0),
        winners,
      };
    });

    // Trend Data (Last 7 days by default for trend charts)
    const trendRangeStart = new Date(start);
    trendRangeStart.setDate(trendRangeStart.getDate() - 6); // Look back 7 days total
    
    const trendHistory = await AuctionHistory.find({
      auctionDate: { $gte: trendRangeStart, $lt: end }
    }).lean();

    const lastTrendData = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(end);
      d.setDate(d.getDate() - (i + 1));
      d.setHours(0,0,0,0);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const dayHistory = trendHistory.filter(h => h.auctionDate >= d && h.auctionDate < nextD);
      lastTrendData.unshift({
        date: d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' }),
        dateISO: d.toISOString(),
        dayName: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        participants: new Set(dayHistory.map(h => h.userId)).size,
        claimed: dayHistory.filter(h => h.prizeClaimStatus === 'CLAIMED').length,
        revenue: dayHistory.reduce((sum, h) => sum + (h.entryFeePaid || 0), 0),
      });
    }

    // Current Live Auction
    const currentLiveAuctionDoc = hourlyAuctions.find(a => a.Status === 'LIVE');
    const currentLiveAuction = currentLiveAuctionDoc ? {
      auctionId: currentLiveAuctionDoc.hourlyAuctionId,
      auctionName: currentLiveAuctionDoc.auctionName,
      timeSlot: currentLiveAuctionDoc.TimeSlot,
      prizeValue: currentLiveAuctionDoc.prizeValue,
      currentRound: currentLiveAuctionDoc.currentRound,
      totalRounds: currentLiveAuctionDoc.totalRounds,
      participantCount: currentLiveAuctionDoc.totalParticipants || 0,
    } : null;

    const result = {
      viewType: viewType || 'today',
      startDate: start.toLocaleDateString('en-IN'),
      endDate: end.toLocaleDateString('en-IN'),
      currentTime: now.toLocaleTimeString('en-IN'),
      currentTimeISO: now.toISOString(),
      currentTimeSlot: `${now.getHours().toString().padStart(2, '0')}:00`,
      fetchedAt: now.toISOString(),
      isToday: start.toDateString() === now.toDateString(),
      summary,
      statusDistribution,
      claimStatusDistribution,
      auctionDetails,
      lastTrendData,
      currentLiveAuction,
    };

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('Get Analytics Data Error:', err);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

/**
 * Update User Super Admin Status
 */
const updateUserSuperAdminStatus = async (req, res) => {
  try {
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || !adminUser.isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied. Super Admin privileges required.' });
    }

    const { targetUserId, isSuperAdmin } = req.body;
    const targetUser = await User.findOne({ user_id: targetUserId });
    if (!targetUser) return res.status(404).json({ success: false, message: 'Target user not found' });

    targetUser.isSuperAdmin = isSuperAdmin === true;
    await targetUser.save();

    return res.status(200).json({ success: true, message: 'Super admin status updated' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Set Super Admin By Email (One-time setup)
 */
const setSuperAdminByEmail = async (req, res) => {
  try {
    const { email, secretKey } = req.body;
    if (secretKey !== '841941-DREAM60-SUPERADMIN') return res.status(403).json({ success: false, message: 'Invalid secret' });

    const user = await User.findOne({ email: email.toLowerCase(), userType: 'ADMIN' });
    if (!user) return res.status(404).json({ success: false, message: 'Admin not found' });

    user.isSuperAdmin = true;
    await user.save();
    return res.status(200).json({ success: true, message: 'Super Admin set' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Cancel Hourly Auction
 */
const cancelHourlyAuction = async (req, res) => {
  try {
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || (adminUser.userType !== 'ADMIN' && !adminUser.isSuperAdmin)) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    const { auctionId } = req.params;
    const hourlyAuction = await HourlyAuction.findOne({ hourlyAuctionId: auctionId });
    if (!hourlyAuction) return res.status(404).json({ success: false, message: 'Auction not found' });

    if (hourlyAuction.Status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Auction is already cancelled' });
    }

    // Update HourlyAuction status
    hourlyAuction.Status = 'CANCELLED';
    await hourlyAuction.save();

    // Sync status to DailyAuction
    const dailyAuction = await DailyAuction.findOne({ dailyAuctionId: hourlyAuction.dailyAuctionId });
    if (dailyAuction) {
      const configIndex = dailyAuction.dailyAuctionConfig.findIndex(c => c.hourlyAuctionId === auctionId);
      if (configIndex !== -1) {
        dailyAuction.dailyAuctionConfig[configIndex].Status = 'CANCELLED';
        await dailyAuction.save();
      }
    }

    // Process participants for refunds and notifications
    const participants = hourlyAuction.participants || [];
    const refundResults = [];

    for (const participant of participants) {
      try {
        const user = await User.findOne({ user_id: participant.playerId });
        if (!user) continue;

        // Find successful entry fee payment
        const payment = await AirpayPayment.findOne({
          userId: participant.playerId,
          auctionId: auctionId,
          status: 'paid',
          paymentType: 'ENTRY_FEE'
        });

        if (payment) {
          // Create Refund record
          const refund = await Refund.create({
            userId: participant.playerId,
            username: participant.playerUsername,
            orderId: payment.orderId,
            hourlyAuctionId: auctionId,
            amount: payment.amount,
            reason: 'Auction Cancelled by Admin',
            status: 'PENDING'
          });
          refundResults.push({ userId: participant.playerId, status: 'REFUND_PENDING', refundId: refund._id });
        }

        // Send SMS
        await sendSms(user.mobile, `Dear ${participant.playerUsername}, Your ${hourlyAuction.TimeSlot} time slot bid has been cancelled, and the refund process has been initiated. The amount will be credited soon to the original payment source. Thank you for your patience. - Finpages Tech`, {
          templateId: '1207176916920661369'
        });

        // Send Email
        const primaryClientUrl = getPrimaryClientUrl();
        const emailHtml = buildEmailTemplate({
          primaryClientUrl,
          title: 'Auction Cancelled',
          status: 'REFUND INITIATED',
          bodyHtml: `
            <h2 class="hero-title">Auction Cancelled</h2>
            <p class="hero-text">Dear ${participant.playerUsername},</p>
            <p class="hero-text">We regret to inform you that the auction <strong>${hourlyAuction.auctionName}</strong> for the <strong>${hourlyAuction.TimeSlot}</strong> time slot has been cancelled.</p>
            <p class="hero-text">A refund for your entry fee has been initiated and will be credited to your original payment source shortly.</p>
            <div class="alert-box alert-success">
              <div class="alert-title">Refund Status</div>
              <div class="alert-desc">The refund process is now pending and will be completed soon.</div>
            </div>
            <p class="hero-text">Thank you for your patience and understanding.</p>
          `
        });

        await sendEmailWithTemplate(user.email, 'Auction Cancelled', {}, `Auction Cancelled: ${hourlyAuction.auctionName}`, emailHtml);

        // Update AuctionHistory
        await AuctionHistory.findOneAndUpdate(
          { userId: participant.playerId, hourlyAuctionId: auctionId },
          { prizeClaimStatus: 'CANCELLED', claimNotes: 'Auction cancelled by admin' }
        );

        // Update HourlyAuctionJoin
        await HourlyAuctionJoin.findOneAndUpdate(
          { userId: participant.playerId, hourlyAuctionId: auctionId },
          { status: 'cancelled' }
        );

      } catch (err) {
        console.error(`Error processing participant ${participant.playerId} for cancellation:`, err);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Auction cancelled successfully. Refunds initiated and notifications sent.',
      data: {
        auctionId,
        participantsCount: participants.length,
        refundsCreated: refundResults.length
      }
    });

  } catch (err) {
    console.error('Cancel Hourly Auction Error:', err);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

/**
 * Get Refunds
 */
const getRefunds = async (req, res) => {
  try {
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || (adminUser.userType !== 'ADMIN' && !adminUser.isSuperAdmin)) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    const refunds = await Refund.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: refunds });
  } catch (err) {
    console.error('Get Refunds Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Update Refund Status
 */
const updateRefundStatus = async (req, res) => {
  try {
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    console.log(`[ADMIN-AUTH] Checking user_id: ${userId} for updateRefundStatus`);
    
    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser) {
      console.error(`[ADMIN-AUTH] User not found: ${userId}`);
      return res.status(403).json({ success: false, message: 'Access denied. Admin user not found.' });
    }
    
    if (adminUser.userType !== 'ADMIN' && !adminUser.isSuperAdmin) {
      console.error(`[ADMIN-AUTH] User ${userId} is not an admin. Type: ${adminUser.userType}, Super: ${adminUser.isSuperAdmin}`);
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    const { refundId } = req.params;
    const { status, notes } = req.body;

    const refund = await Refund.findById(refundId);
    if (!refund) return res.status(404).json({ success: false, message: 'Refund record not found' });

    refund.status = status;
    if (notes) refund.notes = notes;
    if (status === 'COMPLETED') {
      refund.processedAt = new Date();
      refund.processedBy = userId;
    }

    await refund.save();
    return res.status(200).json({ success: true, message: 'Refund status updated', data: refund });
  } catch (err) {
    console.error('Update Refund Status Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  adminLogin,
  sendAdminSignupOtp,
  adminSignup,
  getUserStatistics,
  getAllUsersAdmin,
  getAllMasterAuctionsWithConfig,
  createMasterAuctionAdmin,
  getAllMasterAuctionsAdmin,
  updateMasterAuctionAdmin,
  deleteMasterAuctionAdmin,
  deleteDailyAuctionSlot,
  getPushSubscriptionStats,
  deletePushSubscriptionAdmin,
  getAnalyticsData,
  updateUserSuperAdminStatus,
  setSuperAdminByEmail,
  cancelHourlyAuction,
  getRefunds,
  updateRefundStatus,
};
