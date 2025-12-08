// src/controllers/adminController.js 
const User = require('../models/user');
const MasterAuction = require('../models/masterAuction');
const bcrypt = require('bcryptjs');

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
 * Checks if credentials match admin account (by name, email, or mobile)
 * and if user exists in DB with ADMIN userType
 */
const adminLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body || {};

    // Validate request
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Identifier and password are required',
      });
    }

    // Check hardcoded admin credentials
    const ADMIN_EMAIL = 'dream60@gmail.com';
    const ADMIN_USERNAME = 'admin_dream60';
    const ADMIN_MOBILE = '9999999999';
    const ADMIN_PASSWORD = 'Dharsh@2003';

    // Check if identifier matches any of the admin credentials
    const isValidIdentifier = 
      identifier === ADMIN_EMAIL || 
      identifier === ADMIN_USERNAME || 
      identifier === ADMIN_MOBILE;

    if (!isValidIdentifier || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials',
      });
    }

    // Find or create admin user in database
    let adminUser = await User.findOne({ email: ADMIN_EMAIL });

    if (!adminUser) {
      // Create admin user if doesn't exist
      adminUser = new User({
        username: ADMIN_USERNAME,
        mobile: ADMIN_MOBILE,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        userType: 'ADMIN',
      });
      await adminUser.save();
    } else {
      // Update userType to ADMIN if not already
      if (adminUser.userType !== 'ADMIN') {
        adminUser.userType = 'ADMIN';
        await adminUser.save();
      }
    }

    // Return admin user data
    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      admin: {
        user_id: adminUser.user_id,
        username: adminUser.username,
        email: adminUser.email,
        userType: adminUser.userType,
        userCode: adminUser.userCode,
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

module.exports = {
  adminLogin,
  getUserStatistics,
  getAllUsersAdmin,
  getAllMasterAuctionsWithConfig,
  createMasterAuctionAdmin,
  getAllMasterAuctionsAdmin,
  updateMasterAuctionAdmin,
  deleteMasterAuctionAdmin,
};