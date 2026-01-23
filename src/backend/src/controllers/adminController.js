// src/controllers/adminController.js 
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
  // Generate random total fee within range
  const totalFee = Math.floor(Math.random() * (maxEntryFee - minEntryFee + 1)) + minEntryFee;
  
  // Split randomly - BoxA gets 30-70% of total
  const splitPercentage = Math.random() * 0.4 + 0.3; // 0.3 to 0.7
  const BoxA = Math.floor(totalFee * splitPercentage);
  const BoxB = totalFee - BoxA;
  
  return { BoxA, BoxB };
}

/**
 * Admin Login
 * Checks if credentials match admin account in DB (by username, email, or mobile)
 * User must have userType: 'ADMIN' in the database
 */
const adminLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body || {};

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Identifier and password are required',
      });
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
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials',
      });
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
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials',
      });
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
 * Get User Statistics
 * Returns comprehensive user statistics for admin dashboard
 */
const getUserStatistics = async (req, res) => {
  try {
    // Verify admin access
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Admin user_id required.',
      });
    }

    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || adminUser.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    // Calculate statistics
    const [
      totalUsers,
      activeUsers,
      deletedUsers,
      totalAuctions,
      totalWins,
      totalAmountSpent,
      totalAmountWon,
      recentUsers,
      topSpenders,
      topWinners,
    ] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      User.countDocuments({ isDeleted: false, userType: 'USER' }),
      User.countDocuments({ isDeleted: true }),
      User.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$totalAuctions' } } },
      ]),
      User.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$totalWins' } } },
      ]),
      User.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$totalAmountSpent' } } },
      ]),
      User.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$totalAmountWon' } } },
      ]),
      User.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('user_id username email mobile userCode createdAt totalAuctions totalWins')
        .lean(),
      User.find({ isDeleted: false })
        .sort({ totalAmountSpent: -1 })
        .limit(10)
        .select('user_id username email userCode totalAmountSpent totalAuctions')
        .lean(),
      User.find({ isDeleted: false })
        .sort({ totalWins: -1 })
        .limit(10)
        .select('user_id username email userCode totalWins totalAmountWon')
        .lean(),
    ]);

    const statistics = {
      overview: {
        totalUsers,
        activeUsers,
        deletedUsers,
        adminUsers: await User.countDocuments({ userType: 'ADMIN' }),
      },
      activity: {
        totalAuctions: totalAuctions[0]?.total || 0,
        totalWins: totalWins[0]?.total || 0,
        totalAmountSpent: totalAmountSpent[0]?.total || 0,
        totalAmountWon: totalAmountWon[0]?.total || 0,
      },
      recentUsers: recentUsers.map((u) => ({
        user_id: u.user_id,
        username: u.username,
        email: u.email,
        mobile: u.mobile,
        userCode: u.userCode,
        joinedAt: u.createdAt,
        totalAuctions: u.totalAuctions || 0,
        totalWins: u.totalWins || 0,
      })),
      topSpenders: topSpenders.map((u) => ({
        user_id: u.user_id,
        username: u.username,
        email: u.email,
        userCode: u.userCode,
        totalAmountSpent: u.totalAmountSpent || 0,
        totalAuctions: u.totalAuctions || 0,
      })),
      topWinners: topWinners.map((u) => ({
        user_id: u.user_id,
        username: u.username,
        email: u.email,
        userCode: u.userCode,
        totalWins: u.totalWins || 0,
        totalAmountWon: u.totalAmountWon || 0,
      })),
    };

    return res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (err) {
    console.error('Get User Statistics Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get All Users (Admin)
 * Returns detailed list of all users with pagination
 */
const getAllUsersAdmin = async (req, res) => {
  try {
    // Verify admin access
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Admin user_id required.',
      });
    }

    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || adminUser.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const { page = 1, limit = 20, search = '', includeDeleted = false, userType } = req.query;
    
    const query = {};
    
    if (includeDeleted !== 'true') {
      query.isDeleted = false;
    }
    
    // Filter by userType if provided
    if (userType) {
      query.userType = userType;
    }
    
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
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l)
        .select('-password')
        .lean(),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: users,
      meta: {
        total,
        page: p,
        limit: l,
        pages: Math.ceil(total / l),
      },
    });
  } catch (err) {
    console.error('Get All Users Admin Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get All Master Auctions With Daily Config (Admin)
 * No parameters required - returns all daily auction configs from all active master auctions
 */
const getAllMasterAuctionsWithConfig = async (req, res) => {
  try {
    // Get all active master auctions with their daily configs
    const masterAuctions = await MasterAuction.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    // Flatten all daily auction configs from all master auctions
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

    // Sort by time slot
    allAuctions.sort((a, b) => {
      const timeA = a.TimeSlot || '00:00';
      const timeB = b.TimeSlot || '00:00';
      return timeA.localeCompare(timeB);
    });

    return res.status(200).json({
      success: true,
      data: allAuctions,
      meta: { total: allAuctions.length },
    });
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
    // Verify admin access
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Admin user_id required.',
      });
    }

    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || adminUser.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const payload = { ...req.body };
    payload.createdBy = adminUser.user_id;

    // Process dailyAuctionConfig for entry fees
    if (Array.isArray(payload.dailyAuctionConfig)) {
      payload.dailyAuctionConfig = payload.dailyAuctionConfig.map((auction) => {
        if (auction.EntryFee === 'RANDOM' && auction.minEntryFee != null && auction.maxEntryFee != null) {
          // Generate random BoxA and BoxB fees
          const feeSplits = generateRandomFeeSplits(auction.minEntryFee, auction.maxEntryFee);
          return {
            ...auction,
            FeeSplits: feeSplits,
          };
        } else if (auction.EntryFee === 'MANUAL') {
          // For MANUAL, set min and max to 0
          return {
            ...auction,
            minEntryFee: 0,
            maxEntryFee: 0,
          };
        }
        return auction;
      });
    }

    // If setting as active, deactivate others
    if (payload.isActive === true) {
      await MasterAuction.updateMany({ isActive: true }, { $set: { isActive: false } });
    }

    const masterAuction = await MasterAuction.create(payload);

    return res.status(201).json({
      success: true,
      message: 'Master auction created successfully',
      data: masterAuction,
    });
  } catch (err) {
    console.error('Create Master Auction Admin Error:', err);

    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors || {}).map((v) => v.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages,
      });
    }

    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate master auction',
      });
    }

    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get All Master Auctions (Admin)
 */
const getAllMasterAuctionsAdmin = async (req, res) => {
  try {
    // Verify admin access
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Admin user_id required.',
      });
    }

    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || adminUser.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const { page = 1, limit = 20, isActive } = req.query;
    
    const query = {};
    
    if (typeof isActive !== 'undefined') {
      query.isActive = isActive === 'true';
    }

    const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (p - 1) * l;

    const [auctions, total] = await Promise.all([
      MasterAuction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l)
        .lean(),
      MasterAuction.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: auctions,
      meta: {
        total,
        page: p,
        limit: l,
        pages: Math.ceil(total / l),
      },
    });
  } catch (err) {
    console.error('Get All Master Auctions Admin Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Update Master Auction (Admin)
 */
const updateMasterAuctionAdmin = async (req, res) => {
  try {
    // Verify admin access
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Admin user_id required.',
      });
    }

    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || adminUser.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const { master_id } = req.params;
    const updates = { ...req.body };
    
    // Remove fields that shouldn't be updated
    delete updates.master_id;
    delete updates.createdBy;
    
    updates.modifiedBy = adminUser.user_id;

    // Process dailyAuctionConfig for entry fees
    if (Array.isArray(updates.dailyAuctionConfig)) {
      updates.dailyAuctionConfig = updates.dailyAuctionConfig.map((auction) => {
        if (auction.EntryFee === 'RANDOM' && auction.minEntryFee != null && auction.maxEntryFee != null) {
          // Generate random BoxA and BoxB fees
          const feeSplits = generateRandomFeeSplits(auction.minEntryFee, auction.maxEntryFee);
          return {
            ...auction,
            FeeSplits: feeSplits,
          };
        } else if (auction.EntryFee === 'MANUAL') {
          // For MANUAL, set min and max to 0
          return {
            ...auction,
            minEntryFee: 0,
            maxEntryFee: 0,
          };
        }
        return auction;
      });
    }

    // If setting as active, deactivate others
    if (updates.isActive === true) {
      await MasterAuction.updateMany(
        { master_id: { $ne: master_id }, isActive: true },
        { $set: { isActive: false } }
      );
    }

    const auction = await MasterAuction.findOneAndUpdate(
      { master_id },
      updates,
      { new: true, runValidators: true }
    );

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Master auction not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Master auction updated successfully',
      data: auction,
    });
  } catch (err) {
    console.error('Update Master Auction Admin Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Delete Master Auction (Admin)
 */
const deleteMasterAuctionAdmin = async (req, res) => {
  try {
    // Verify admin access
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Admin user_id required.',
      });
    }

    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || adminUser.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const { master_id } = req.params;

    const auction = await MasterAuction.findOneAndDelete({ master_id });

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Master auction not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Master auction deleted successfully',
    });
  } catch (err) {
    console.error('Delete Master Auction Admin Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Delete Daily Auction Slot (Admin)
 */
const deleteDailyAuctionSlot = async (req, res) => {
  try {
    // Verify admin access
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Admin user_id required.',
      });
    }

    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || adminUser.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const { master_id, auction_number } = req.params;

    const masterAuction = await MasterAuction.findOne({ master_id });

    if (!masterAuction) {
      return res.status(404).json({
        success: false,
        message: 'Master auction not found',
      });
    }

    const auctionIndex = masterAuction.dailyAuctionConfig.findIndex(
      (config) => config.auctionNumber === parseInt(auction_number)
    );

    if (auctionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Auction slot not found',
      });
    }

    masterAuction.dailyAuctionConfig.splice(auctionIndex, 1);
    masterAuction.totalAuctionsPerDay = masterAuction.dailyAuctionConfig.length;
    masterAuction.modifiedBy = adminUser.user_id;

    await masterAuction.save();

    return res.status(200).json({
      success: true,
      message: 'Auction slot deleted successfully',
      data: masterAuction,
    });
  } catch (err) {
    console.error('Delete Daily Auction Slot Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get Push Subscription Statistics (Admin)
 * Returns statistics about PWA vs Web push notification subscriptions
 */
const getPushSubscriptionStats = async (req, res) => {
  try {
    // Verify admin access
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Admin user_id required.',
      });
    }

    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || adminUser.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    // Get all active subscriptions grouped by device type
    const [pwaSubscriptions, webSubscriptions, totalActive, totalInactive] = await Promise.all([
      PushSubscription.find({ isActive: true, deviceType: 'PWA' })
        .populate('userId', 'username email mobile userCode')
        .sort({ lastUsed: -1 })
        .lean(),
      PushSubscription.find({ isActive: true, deviceType: 'Web' })
        .populate('userId', 'username email mobile userCode')
        .sort({ lastUsed: -1 })
        .lean(),
      PushSubscription.countDocuments({ isActive: true }),
      PushSubscription.countDocuments({ isActive: false }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalActive,
          totalInactive,
          pwaCount: pwaSubscriptions.length,
          webCount: webSubscriptions.length,
        },
        pwaUsers: pwaSubscriptions.map(sub => ({
          subscriptionId: sub._id,
          userId: sub.userId?._id,
          username: sub.userId?.username,
          email: sub.userId?.email,
          mobile: sub.userId?.mobile,
          userCode: sub.userId?.userCode,
          deviceType: sub.deviceType,
          endpoint: sub.endpoint.substring(0, 50) + '...',
          createdAt: sub.createdAt,
          lastUsed: sub.lastUsed,
        })),
        webUsers: webSubscriptions.map(sub => ({
          subscriptionId: sub._id,
          userId: sub.userId?._id,
          username: sub.userId?.username,
          email: sub.userId?.email,
          mobile: sub.userId?.mobile,
          userCode: sub.userId?.userCode,
          deviceType: sub.deviceType,
          endpoint: sub.endpoint.substring(0, 50) + '...',
          createdAt: sub.createdAt,
          lastUsed: sub.lastUsed,
        })),
      },
    });
  } catch (err) {
    console.error('Get Push Subscription Stats Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deletePushSubscriptionAdmin = async (req, res) => {
  try {
    const adminId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    const { subscriptionId } = req.params;

    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Admin user_id required.' });
    }

    const adminUser = await User.findOne({ user_id: adminId });
    if (!adminUser || adminUser.userType !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    const subscription = await PushSubscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    subscription.isActive = false;
    await subscription.save();

    return res.status(200).json({ success: true, message: 'Subscription removed successfully' });
  } catch (err) {
    console.error('Delete Push Subscription Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const formatDateDDMMYYYY = (date) => {
  const d = new Date(new Date(date).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const parseDateInput = (dateStr) => {
  if (!dateStr) return null;
  // Handle DD-MM-YYYY
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[0].length === 2) {
      const [day, month, year] = parts;
      return new Date(`${year}-${month}-${day}T00:00:00+05:30`);
    } else if (parts[0].length === 4) {
      // YYYY-MM-DD
      return new Date(`${dateStr}T00:00:00+05:30`);
    }
  }
  return new Date(dateStr + 'T00:00:00+05:30');
};

/**
 * Get Analytics Data (Admin)
 * Returns comprehensive analytics for daily auction activity with date filtering
 * Supports Today, Yesterday, Weekly, Monthly and Custom ranges
 */
const getAnalyticsData = async (req, res) => {
  try {
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Admin user_id required.',
      });
    }

    const adminUser = await User.findOne({ user_id: userId });
    if (!adminUser || adminUser.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const { date, startDate: startParam, endDate: endParam, viewType = 'today' } = req.query;
    
    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    
    let rangeStart, rangeEnd;

    switch (viewType) {
      case 'yesterday':
        rangeStart = new Date(nowIST);
        rangeStart.setDate(rangeStart.getDate() - 1);
        rangeStart.setHours(0, 0, 0, 0);
        rangeEnd = new Date(rangeStart);
        rangeEnd.setHours(23, 59, 59, 999);
        break;
      case 'week':
        rangeStart = new Date(nowIST);
        rangeStart.setDate(rangeStart.getDate() - 7);
        rangeStart.setHours(0, 0, 0, 0);
        rangeEnd = new Date(nowIST);
        rangeEnd.setHours(23, 59, 59, 999);
        break;
      case 'month':
        rangeStart = new Date(nowIST);
        rangeStart.setDate(rangeStart.getDate() - 30);
        rangeStart.setHours(0, 0, 0, 0);
        rangeEnd = new Date(nowIST);
        rangeEnd.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        if (startParam && endParam) {
          rangeStart = parseDateInput(startParam);
          rangeEnd = parseDateInput(endParam);
          rangeEnd.setHours(23, 59, 59, 999);
        } else {
          rangeStart = new Date(nowIST);
          rangeStart.setHours(0, 0, 0, 0);
          rangeEnd = new Date(nowIST);
          rangeEnd.setHours(23, 59, 59, 999);
        }
        break;
      case 'today':
      default:
        if (date) {
          rangeStart = parseDateInput(date);
        } else {
          rangeStart = new Date(nowIST);
        }
        rangeStart.setHours(0, 0, 0, 0);
        rangeEnd = new Date(rangeStart);
        rangeEnd.setHours(23, 59, 59, 999);
        break;
    }
    
    const currentHour = nowIST.getHours();
    const currentMinute = nowIST.getMinutes();
    const currentTimeSlot = `${currentHour.toString().padStart(2, '0')}:00-${(currentHour + 1).toString().padStart(2, '0')}:00`;

    const startOfToday = new Date(nowIST);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(nowIST);
    endOfToday.setHours(23, 59, 59, 999);

    const includesToday = rangeStart <= endOfToday && rangeEnd >= startOfToday;

    let todaysScheduledAuctions = [];
    if (includesToday) {
      try {
        const fetch = require('node-fetch');
        const schedulerResponse = await fetch('https://dev-api.dream60.com/scheduler/hourly-auctions');
        if (schedulerResponse.ok) {
          const schedulerData = await schedulerResponse.json();
          if (schedulerData.success && Array.isArray(schedulerData.data)) {
            todaysScheduledAuctions = schedulerData.data;
          }
        }
      } catch (fetchErr) {
        console.log('Could not fetch scheduler data:', fetchErr.message);
      }
    }

    const [
      dbHourlyAuctions,
      auctionHistories,
      last7DaysData
    ] = await Promise.all([
      HourlyAuction.find({
        auctionDate: { $gte: rangeStart, $lte: rangeEnd }
      }).sort({ auctionDate: 1, TimeSlot: 1 }).lean(),
      
      AuctionHistory.find({
        auctionDate: { $gte: rangeStart, $lte: rangeEnd }
      }).lean(),
      
      (async () => {
        const results = [];
        const daysToFetch = viewType === 'month' ? 30 : 7;
        for (let i = daysToFetch - 1; i >= 0; i--) {
          const dayStart = new Date(nowIST);
          dayStart.setDate(dayStart.getDate() - i);
          dayStart.setHours(0, 0, 0, 0);
          
          const dayEnd = new Date(dayStart);
          dayEnd.setHours(23, 59, 59, 999);
          
          const [participants, claimed, revenue] = await Promise.all([
            AuctionHistory.countDocuments({
              auctionDate: { $gte: dayStart, $lte: dayEnd }
            }),
            AuctionHistory.countDocuments({
              auctionDate: { $gte: dayStart, $lte: dayEnd },
              prizeClaimStatus: 'CLAIMED'
            }),
            AuctionHistory.aggregate([
              { $match: { auctionDate: { $gte: dayStart, $lte: dayEnd } } },
              { $group: { _id: null, total: { $sum: '$entryFeePaid' } } }
            ])
          ]);
          
          results.push({
            date: formatDateDDMMYYYY(dayStart),
            dateISO: dayStart.toISOString().split('T')[0],
            dayName: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
            participants,
            claimed,
            revenue: revenue[0]?.total || 0
          });
        }
        return results;
      })()
    ]);

    const dbAuctionIds = new Set(dbHourlyAuctions.map(a => a.hourlyAuctionId));
    let hourlyAuctions = [...dbHourlyAuctions];
    
    if (includesToday && todaysScheduledAuctions.length > 0) {
      for (const scheduledAuction of todaysScheduledAuctions) {
        if (!dbAuctionIds.has(scheduledAuction.hourlyAuctionId)) {
          // Check if this scheduled auction falls within our range
          const auctionDate = new Date(scheduledAuction.auctionDate);
          if (auctionDate >= rangeStart && auctionDate <= rangeEnd) {
            hourlyAuctions.push({
              hourlyAuctionId: scheduledAuction.hourlyAuctionId,
              hourlyAuctionCode: scheduledAuction.hourlyAuctionCode,
              auctionName: scheduledAuction.auctionName,
              TimeSlot: scheduledAuction.TimeSlot,
              Status: scheduledAuction.Status,
              prizeValue: scheduledAuction.prizeValue,
              roundCount: scheduledAuction.roundCount,
              currentRound: scheduledAuction.currentRound || 0,
              totalParticipants: scheduledAuction.totalParticipants || 0,
              auctionDate: scheduledAuction.auctionDate,
              fromScheduler: true
            });
          }
        } else {
          const idx = hourlyAuctions.findIndex(a => a.hourlyAuctionId === scheduledAuction.hourlyAuctionId);
          if (idx !== -1) {
            hourlyAuctions[idx] = {
              ...hourlyAuctions[idx],
              Status: scheduledAuction.Status,
              currentRound: scheduledAuction.currentRound || hourlyAuctions[idx].currentRound,
              totalParticipants: scheduledAuction.totalParticipants || hourlyAuctions[idx].totalParticipants
            };
          }
        }
      }
      
      hourlyAuctions.sort((a, b) => {
        const dateA = new Date(a.auctionDate);
        const dateB = new Date(b.auctionDate);
        if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;
        const timeA = a.TimeSlot || '00:00';
        const timeB = b.TimeSlot || '00:00';
        return timeA.localeCompare(timeB);
      });
    }

    const todaysUpcoming = includesToday 
      ? hourlyAuctions.filter(a => {
          const aDate = new Date(a.auctionDate);
          const isActuallyToday = aDate.toDateString() === nowIST.toDateString();
          if (!isActuallyToday) return a.Status === 'UPCOMING' || a.Status === 'SCHEDULED' || a.Status === 'WAITING';
          
          const slotHour = parseInt(a.TimeSlot.split(':')[0]);
          return (a.Status === 'UPCOMING' || a.Status === 'SCHEDULED' || a.Status === 'WAITING') && slotHour > currentHour;
        })
      : hourlyAuctions.filter(a => a.Status === 'UPCOMING' || a.Status === 'SCHEDULED' || a.Status === 'WAITING');

    const totalAuctions = hourlyAuctions.length;
    const liveAuctions = hourlyAuctions.filter(a => a.Status === 'LIVE' || a.Status === 'IN_PROGRESS');
    const completedAuctions = hourlyAuctions.filter(a => a.Status === 'COMPLETED');
    const upcomingAuctions = todaysUpcoming;
    
    const uniqueParticipants = new Set(auctionHistories.map(h => h.userId)).size;
    const totalParticipations = auctionHistories.length;
    const totalClaimed = auctionHistories.filter(h => h.prizeClaimStatus === 'CLAIMED').length;
    const totalPending = auctionHistories.filter(h => h.prizeClaimStatus === 'PENDING' && h.isWinner).length;
    const totalExpired = auctionHistories.filter(h => h.prizeClaimStatus === 'EXPIRED').length;
    
    const totalEntryFees = auctionHistories.reduce((sum, h) => sum + (h.entryFeePaid || 0), 0);
    const totalPrizeValue = completedAuctions.reduce((sum, a) => sum + (a.prizeValue || 0), 0);
    const totalClaimedValue = auctionHistories
      .filter(h => h.prizeClaimStatus === 'CLAIMED')
      .reduce((sum, h) => sum + (h.prizeAmountWon || 0), 0);

    const auctionDetails = hourlyAuctions.map(auction => {
      const auctionParticipants = auctionHistories.filter(h => h.hourlyAuctionId === auction.hourlyAuctionId);
      const winners = auctionParticipants.filter(h => h.isWinner);
      const claimed = winners.filter(w => w.prizeClaimStatus === 'CLAIMED');
      
      const aDate = new Date(auction.auctionDate);
      const isActuallyToday = aDate.toDateString() === nowIST.toDateString();
      const slotHour = parseInt(auction.TimeSlot.split(':')[0]);
      
      let computedStatus = auction.Status;
      if (isActuallyToday) {
        if (auction.Status === 'LIVE' || auction.Status === 'IN_PROGRESS') {
          computedStatus = 'LIVE';
        } else if (auction.Status === 'COMPLETED') {
          computedStatus = 'COMPLETED';
        } else if (slotHour < currentHour) {
          computedStatus = 'COMPLETED';
        } else if (slotHour === currentHour) {
          computedStatus = 'LIVE';
        } else {
          computedStatus = 'UPCOMING';
        }
      }
      
      return {
        auctionId: auction.hourlyAuctionId,
        auctionCode: auction.hourlyAuctionCode,
        auctionName: auction.auctionName,
        timeSlot: auction.TimeSlot,
        date: formatDateDDMMYYYY(auction.auctionDate),
        status: computedStatus,
        dbStatus: auction.Status,
        prizeValue: auction.prizeValue,
        participantCount: auction.totalParticipants || auctionParticipants.length,
        currentRound: auction.currentRound,
        totalRounds: auction.roundCount,
        winnersCount: winners.length,
        claimedCount: claimed.length,
        totalEntryFees: auctionParticipants.reduce((sum, p) => sum + (p.entryFeePaid || 0), 0),
        fromScheduler: auction.fromScheduler || false,
        winners: winners.map(w => ({
          rank: w.finalRank,
          username: w.username,
          prizeAmount: w.prizeAmountWon,
          claimStatus: w.prizeClaimStatus,
          claimedAt: w.claimedAt
        }))
      };
    });

    const statusDistribution = {
      live: liveAuctions.length,
      completed: completedAuctions.length,
      upcoming: upcomingAuctions.length,
      cancelled: hourlyAuctions.filter(a => a.Status === 'CANCELLED').length
    };

    const claimStatusDistribution = {
      claimed: totalClaimed,
      pending: totalPending,
      expired: totalExpired,
      notApplicable: auctionHistories.filter(h => h.prizeClaimStatus === 'NOT_APPLICABLE').length
    };

    const currentTimeIST = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')} IST`;

    return res.status(200).json({
      success: true,
      data: {
        viewType,
        startDate: formatDateDDMMYYYY(rangeStart),
        endDate: formatDateDDMMYYYY(rangeEnd),
        currentTime: currentTimeIST,
        currentTimeISO: nowIST.toISOString(),
        currentTimeSlot,
        fetchedAt: new Date().toISOString(),
        isToday: viewType === 'today' && rangeStart.toDateString() === nowIST.toDateString(),
        summary: {
          totalAuctions,
          liveAuctions: liveAuctions.length,
          completedAuctions: completedAuctions.length,
          upcomingAuctions: upcomingAuctions.length,
          uniqueParticipants,
          totalParticipations,
          totalClaimed,
          totalPending,
          totalExpired,
          totalEntryFees,
          totalPrizeValue,
          totalClaimedValue
        },
        statusDistribution,
        claimStatusDistribution,
        auctionDetails,
        lastTrendData: last7DaysData,
        upcomingAuctionsList: upcomingAuctions.map(a => ({
          auctionId: a.hourlyAuctionId,
          auctionCode: a.hourlyAuctionCode,
          auctionName: a.auctionName,
          timeSlot: a.TimeSlot,
          prizeValue: a.prizeValue,
          status: a.Status,
          auctionDate: formatDateDDMMYYYY(a.auctionDate),
          auctionDateISO: a.auctionDate
        })),
        currentLiveAuction: liveAuctions.length > 0 ? {
          auctionId: liveAuctions[0].hourlyAuctionId,
          auctionName: liveAuctions[0].auctionName,
          timeSlot: liveAuctions[0].TimeSlot,
          prizeValue: liveAuctions[0].prizeValue,
          currentRound: liveAuctions[0].currentRound,
          totalRounds: liveAuctions[0].roundCount,
          participantCount: liveAuctions[0].totalParticipants
        } : null,
        schedulerDataIncluded: includesToday && todaysScheduledAuctions.length > 0
      }
    });
  } catch (err) {
    console.error('Get Analytics Data Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Send Admin Signup OTP
 * Sends OTP to dream60.official@gmail.com for admin approval
 */
const sendAdminSignupOtp = async (req, res) => {
  try {
    const { username, email, mobile, adminType } = req.body || {};

    if (!username || !email || !mobile || !adminType) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, mobile, and admin type are required',
      });
    }

    const validAdminTypes = ['ADMIN', 'SUPER_ADMIN', 'DEVELOPER'];
    if (!validAdminTypes.includes(adminType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admin type. Must be ADMIN, SUPER_ADMIN, or DEVELOPER',
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { username: username },
        { email: email.toLowerCase() },
        { mobile: mobile },
      ],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(409).json({ success: false, message: 'Username already taken' });
      }
      if (existingUser.email && existingUser.email.toLowerCase() === email.toLowerCase()) {
        return res.status(409).json({ success: false, message: 'Email already registered' });
      }
      if (existingUser.mobile === mobile) {
        return res.status(409).json({ success: false, message: 'Mobile number already registered' });
      }
    }

    const otpCode = generateOtp();
    const identifier = `admin_signup_${email.toLowerCase()}`;

    await OTP.findOneAndUpdate(
      { identifier, type: 'email' },
      { otp: otpCode, createdAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const emailResult = await sendOtpEmail(
      ADMIN_APPROVAL_EMAIL,
      otpCode,
      `Admin Signup Approval - ${adminType} Request from ${username} (${email})`
    );

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send approval OTP. Please try again.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Approval OTP sent to admin email. Please enter the OTP to complete registration.`,
    });
  } catch (err) {
    console.error('Send Admin Signup OTP Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Admin Signup
 * Creates admin user after OTP verification
 */
const adminSignup = async (req, res) => {
  try {
    const { username, email, mobile, password, confirmPassword, adminType, otp } = req.body || {};

    if (!username || !email || !mobile || !password || !confirmPassword || !adminType || !otp) {
      return res.status(400).json({
        success: false,
        message: 'All fields including OTP are required',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    const validAdminTypes = ['ADMIN', 'SUPER_ADMIN', 'DEVELOPER'];
    if (!validAdminTypes.includes(adminType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admin type',
      });
    }

    const identifier = `admin_signup_${email.toLowerCase()}`;
    const otpRecord = await OTP.findOne({ identifier, type: 'email' });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found or expired. Please request a new one.',
      });
    }

    if (otpRecord.otp !== String(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    const existingUser = await User.findOne({
      $or: [
        { username: username },
        { email: email.toLowerCase() },
        { mobile: mobile },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this username, email, or mobile already exists',
      });
    }

    const isSuperAdmin = adminType === 'SUPER_ADMIN';
    const isDeveloper = adminType === 'DEVELOPER';

    const newAdmin = new User({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      mobile: String(mobile).replace(/\D/g, ''),
      password,
      userType: 'ADMIN',
      isSuperAdmin,
      isDeveloper,
      adminType,
    });

    await newAdmin.save();

    return res.status(201).json({
      success: true,
      message: `${adminType} account created successfully`,
      admin: {
        user_id: newAdmin.user_id,
        username: newAdmin.username,
        email: newAdmin.email,
        userType: newAdmin.userType,
        adminType: adminType,
        isSuperAdmin: newAdmin.isSuperAdmin,
        isDeveloper: newAdmin.isDeveloper,
      },
    });
  } catch (err) {
    console.error('Admin Signup Error:', err);

    if (err && err.code === 11000) {
      const dupField = Object.keys(err.keyValue || {})[0];
      const msgMap = {
        username: 'Username already taken',
        mobile: 'Mobile number already registered',
        email: 'Email already registered',
      };
      return res.status(409).json({ success: false, message: msgMap[dupField] || 'Duplicate field value' });
    }

    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Update User Super Admin Status
 * Sets or removes super admin privileges for a user
 */
const updateUserSuperAdminStatus = async (req, res) => {
  try {
    const adminId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    const { targetUserId, isSuperAdmin } = req.body;

    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Admin user_id required.' });
    }

    const adminUser = await User.findOne({ user_id: adminId });
    if (!adminUser || adminUser.userType !== 'ADMIN' || !adminUser.isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied. Super Admin privileges required.' });
    }

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Target user ID is required.' });
    }

    const targetUser = await User.findOne({ user_id: targetUserId });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found.' });
    }

    targetUser.isSuperAdmin = isSuperAdmin === true;
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: `User ${targetUser.username} super admin status updated to ${isSuperAdmin}`,
      data: {
        user_id: targetUser.user_id,
        username: targetUser.username,
        email: targetUser.email,
        isSuperAdmin: targetUser.isSuperAdmin,
      },
    });
  } catch (err) {
    console.error('Update User Super Admin Status Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Set Super Admin By Email (One-time setup)
 * Used to bootstrap a super admin when none exists
 */
const setSuperAdminByEmail = async (req, res) => {
  try {
    const { email, secretKey } = req.body;

    if (secretKey !== '841941-DREAM60-SUPERADMIN') {
      return res.status(403).json({ success: false, message: 'Invalid secret key.' });
    }

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase(), userType: 'ADMIN' });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Admin user with this email not found.' });
    }

    user.isSuperAdmin = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${user.username} (${user.email}) is now a Super Admin`,
      data: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
      },
    });
  } catch (err) {
    console.error('Set Super Admin By Email Error:', err);
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