const User = require('../models/user');
const MasterAuction = require('../models/masterAuction');
const PushSubscription = require('../models/PushSubscription');
const DailyAuction = require('../models/DailyAuction');
const HourlyAuction = require('../models/HourlyAuction');
const AuctionHistory = require('../models/AuctionHistory');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const { sendOtpEmail } = require('../utils/emailService');

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
    });

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

    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const history = await AuctionHistory.find({
      startTime: { $gte: targetDate, $lt: nextDate }
    }).lean();

    return res.status(200).json({ success: true, data: history });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
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
};
