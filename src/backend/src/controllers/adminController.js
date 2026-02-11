const User = require('../models/user');
const Admin = require('../models/Admin');
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
const AdminAuditLog = require('../models/AdminAuditLog');
const bcrypt = require('bcryptjs');
const { sendOtpEmail, sendEmailWithTemplate } = require('../utils/emailService');
const { sendSms, SMS_TEMPLATES } = require('../utils/smsService');

const ADMIN_APPROVAL_EMAIL = 'info@dream60.com';

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
 * Admin Login - Uses separate Admin collection
 */
const adminLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body || {};

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Identifier and password are required' });
    }

    const adminUser = await Admin.findOne({
      $or: [
        { username: identifier.toLowerCase() },
        { email: identifier.toLowerCase() },
        { mobile: identifier },
      ],
      isActive: true,
    }).select('+personalAccessCode');

    if (!adminUser) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const isPasswordValid = await adminUser.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      admin: {
        admin_id: adminUser.admin_id,
        username: adminUser.username,
        email: adminUser.email,
        adminType: adminUser.adminType,
        hasAccessCode: !!adminUser.personalAccessCode,
      },
    });
  } catch (err) {
    console.error('Admin Login Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Send Admin Signup OTP - Sends OTP to info@dream60.com for admin approval
 */
const sendAdminSignupOtp = async (req, res) => {
  try {
    const { email, username, mobile, adminType } = req.body;

    if (!email || !username || !mobile) {
      return res.status(400).json({ success: false, message: 'Email, username, and mobile are required' });
    }

    // Check if admin already exists in Admin collection
    const existingAdmin = await Admin.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }, { mobile }],
    });

    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Admin with this email/username/mobile already exists' });
    }

    const otp = generateOtp();
    await OTP.findOneAndUpdate(
      { identifier: email.toLowerCase(), type: 'email' },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Send OTP to info@dream60.com (admin approval email), NOT to the applicant
    await sendOtpEmail(ADMIN_APPROVAL_EMAIL, otp, `Admin Signup Approval for ${username} (${email}) - Type: ${adminType || 'ADMIN'}`);

    return res.status(200).json({ success: true, message: 'OTP sent to admin approval email' });
  } catch (err) {
    console.error('Send Admin Signup OTP Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Admin Signup - Creates admin in separate Admin collection
 */
const adminSignup = async (req, res) => {
  try {
    const { email, username, mobile, password, otp, adminType } = req.body;

    if (!email || !username || !mobile || !password || !otp) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({ identifier: email.toLowerCase(), otp });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Validate adminType
    const validTypes = ['ADMIN', 'SUPER_ADMIN', 'DEVELOPER'];
    const resolvedAdminType = validTypes.includes(adminType) ? adminType : 'ADMIN';

    const newAdmin = await Admin.create({
      username,
      email: email.toLowerCase(),
      mobile,
      password,
      adminType: resolvedAdminType,
      isActive: true,
    });

    // Delete OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    return res.status(201).json({
      success: true,
      message: `${resolvedAdminType} account created successfully`,
      admin: {
        admin_id: newAdmin.admin_id,
        username: newAdmin.username,
        email: newAdmin.email,
        adminType: newAdmin.adminType,
      }
    });
  } catch (err) {
    console.error('Admin Signup Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get User Statistics - pulls real data from collections
 */
const getUserStatistics = async (req, res) => {
  try {
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Admin user_id required.' });
    }

    const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
    if (!adminUser) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    // --- Overview: from User + Admin collections ---
    const [totalUsers, activeUsers, deletedUsers, adminUsers] = await Promise.all([
      User.countDocuments({ isDeleted: false }).catch(() => 0),
      User.countDocuments({ isDeleted: false, userType: 'USER' }).catch(() => 0),
      User.countDocuments({ isDeleted: true }).catch(() => 0),
      Admin.countDocuments({ isActive: true }).catch(() => 0),
    ]);

      // --- Activity: from AuctionHistory, HourlyAuction, AirpayPayment ---
        const [
          auctionHistoryStats,
          totalHourlyAuctions,
          totalAmountSpentAgg,
          prizeclaimTotalAgg,
          totalParticipantsAgg,
          totalHourlyJoins,
        ] = await Promise.all([
          // Aggregate total auction participations from AuctionHistory
          AuctionHistory.aggregate([
            { $match: { auctionStatus: 'COMPLETED' } },
            {
              $group: {
                _id: null,
                totalParticipations: { $sum: 1 },
                totalAmountWon: {
                  $sum: {
                    $cond: [
                      { $and: [{ $eq: ['$isWinner', true] }, { $eq: ['$prizeClaimStatus', 'CLAIMED'] }] },
                      '$prizeAmountWon',
                      0,
                    ],
                  },
                },
              },
            },
          ]).catch(() => []),

          // Total hourly auctions count
          HourlyAuction.countDocuments({}).catch(() => 0),

          // Total amount spent by users (successful payments only)
          AirpayPayment.aggregate([
            { $match: { status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]).catch(() => []),

          // Total prize claim payments (PRIZE_CLAIM type, paid)
          AirpayPayment.aggregate([
            { $match: { status: 'paid', paymentType: 'PRIZE_CLAIM' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]).catch(() => []),

          // Total unique participants
          AuctionHistory.distinct('userId', { auctionStatus: 'COMPLETED' }).catch(() => []),

          // Total participations from HourlyAuctionJoin (actual confirmed joins)
          HourlyAuctionJoin.countDocuments({ status: 'joined' }).catch(() => 0),
        ]);

    const histStats = auctionHistoryStats[0] || {};

    // --- Recent Users: from User collection ---
    const recentUsers = await User.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('user_id username email mobile userCode createdAt')
      .lean()
      .catch(() => []);

    // Enrich recent users with real auction stats from AuctionHistory
    const recentUserIds = (recentUsers || []).map(u => u.user_id);
    const recentUserStats = recentUserIds.length > 0
      ? await AuctionHistory.aggregate([
          { $match: { userId: { $in: recentUserIds }, auctionStatus: 'COMPLETED' } },
          {
            $group: {
              _id: '$userId',
              totalAuctions: { $sum: 1 },
              totalWins: { $sum: { $cond: ['$isWinner', 1, 0] } },
            },
          },
        ]).catch(() => [])
      : [];
    const recentStatsMap = {};
    for (const s of recentUserStats) {
      recentStatsMap[s._id] = s;
    }

      // --- Top Spenders (Prize Claimers): from AuctionHistory (claimed prizes) ---
      const topSpendersAgg = await AuctionHistory.aggregate([
        { $match: { isWinner: true, prizeClaimStatus: 'CLAIMED', auctionStatus: 'COMPLETED' } },
        {
          $group: {
            _id: '$userId',
            totalAmountSpent: { $sum: '$prizeAmountWon' },
            totalAuctions: { $sum: 1 },
          },
        },
        { $sort: { totalAmountSpent: -1 } },
        { $limit: 10 },
      ]).catch(() => []);

    // Enrich top spenders with user details
    const spenderUserIds = topSpendersAgg.map(s => s._id);
    const spenderUsers = spenderUserIds.length > 0
      ? await User.find({ user_id: { $in: spenderUserIds } }).select('user_id username email userCode').lean().catch(() => [])
      : [];
    const spenderUserMap = {};
    for (const u of spenderUsers) {
      spenderUserMap[u.user_id] = u;
    }

      // --- Top Participants: from AuctionHistory (most auction participations) ---
      const topParticipantsAgg = await AuctionHistory.aggregate([
        { $match: { auctionStatus: 'COMPLETED' } },
        {
          $group: {
            _id: '$userId',
            totalAuctions: { $sum: 1 },
          },
        },
        { $sort: { totalAuctions: -1 } },
        { $limit: 10 },
      ]).catch(() => []);

      const participantUserIds = topParticipantsAgg.map(w => w._id);
      const participantUsers = participantUserIds.length > 0
        ? await User.find({ user_id: { $in: participantUserIds } }).select('user_id username email userCode').lean().catch(() => [])
        : [];
      const participantUserMap = {};
      for (const u of participantUsers) {
        participantUserMap[u.user_id] = u;
      }

    const statistics = {
      overview: {
        totalUsers,
        activeUsers,
        deletedUsers,
        adminUsers,
        totalHourlyAuctions,
      },
      activity: {
          totalAuctions: totalHourlyJoins || histStats.totalParticipations || 0,
          totalAmountSpent: totalAmountSpentAgg[0]?.total || 0,
          totalAmountWon: histStats.totalAmountWon || 0,
          totalPrizeClaimPayments: prizeclaimTotalAgg[0]?.total || 0,
          totalParticipants: Array.isArray(totalParticipantsAgg) ? totalParticipantsAgg.length : 0,
        },
      recentUsers: (recentUsers || []).map(u => {
        const s = recentStatsMap[u.user_id] || {};
        return {
          user_id: u.user_id,
          username: u.username,
          email: u.email,
          mobile: u.mobile,
          userCode: u.userCode,
          joinedAt: u.createdAt,
          totalAuctions: s.totalAuctions || 0,
          totalWins: s.totalWins || 0,
        };
      }),
      topSpenders: topSpendersAgg.map(s => {
        const u = spenderUserMap[s._id] || {};
        return {
          user_id: s._id,
          username: u.username || 'Unknown',
          email: u.email || '',
          userCode: u.userCode || '',
          totalAmountSpent: s.totalAmountSpent || 0,
          totalAuctions: s.totalAuctions || 0,
        };
      }),
      topParticipants: topParticipantsAgg.map(w => {
        const u = participantUserMap[w._id] || {};
        return {
          user_id: w._id,
          username: u.username || 'Unknown',
          email: u.email || '',
          userCode: u.userCode || '',
          totalAuctions: w.totalAuctions || 0,
        };
      }),
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

    const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
    if (!adminUser) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    const { page = 1, limit = 20, search = '', includeDeleted = false, userType, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
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

      // Determine if sorting is by a computed field (needs post-sort) or DB field
      const computedSortFields = ['totalAuctions', 'totalAmountSpent', 'totalAmountWon', 'profitLoss'];
      const isComputedSort = computedSortFields.includes(sortBy);
      const dbSortField = sortBy === 'name' ? 'username' : sortBy;
      const dbSortDir = sortOrder === 'asc' ? 1 : -1;

      let users, total;
      if (isComputedSort) {
        // For computed fields, fetch all matching users then sort after enrichment
        [users, total] = await Promise.all([
          User.find(query).sort({ createdAt: -1 }).select('-password').lean(),
          User.countDocuments(query),
        ]);
      } else {
        [users, total] = await Promise.all([
          User.find(query).sort({ [dbSortField]: dbSortDir }).skip(skip).limit(l).select('-password').lean(),
          User.countDocuments(query),
        ]);
      }

          // Enrich users with real stats from AuctionHistory (matching getUserStats logic)
          const userIds = users.map(u => u.user_id);
          const auctionStats = userIds.length > 0
            ? await AuctionHistory.aggregate([
                { $match: { userId: { $in: userIds }, auctionStatus: 'COMPLETED' } },
                {
                  $group: {
                    _id: '$userId',
                    totalAuctions: { $sum: 1 },
                    totalWins: { $sum: { $cond: ['$isWinner', 1, 0] } },
                    // totalSpent = all entry fees + lastRoundBidAmount for won+claimed auctions
                    totalEntryFees: { $sum: '$entryFeePaid' },
                    totalFinalRoundBidsForClaimedWins: {
                      $sum: {
                        $cond: [
                          { $and: [{ $eq: ['$isWinner', true] }, { $eq: ['$prizeClaimStatus', 'CLAIMED'] }] },
                          '$lastRoundBidAmount',
                          0,
                        ],
                      },
                    },
                    // totalWon = prizeAmountWon only for CLAIMED prizes
                    totalAmountWon: {
                      $sum: {
                        $cond: [
                          { $and: [{ $eq: ['$isWinner', true] }, { $eq: ['$prizeClaimStatus', 'CLAIMED'] }] },
                          '$prizeAmountWon',
                          0,
                        ],
                      },
                    },
                  },
                },
              ]).catch(() => [])
            : [];

          const auctionStatsMap = {};
          for (const s of auctionStats) auctionStatsMap[s._id] = s;

          let enrichedUsers = users.map(u => {
            const aStats = auctionStatsMap[u.user_id] || {};
            const spent = (aStats.totalEntryFees || 0) + (aStats.totalFinalRoundBidsForClaimedWins || 0);
            const won = aStats.totalAmountWon || 0;
            return {
              ...u,
              totalAuctions: aStats.totalAuctions || 0,
              totalWins: aStats.totalWins || 0,
              totalAmountWon: won,
              totalAmountSpent: spent,
              profitLoss: won - spent,
            };
          });

          // Apply computed sort if needed
          if (isComputedSort) {
            const field = sortBy;
            enrichedUsers.sort((a, b) => {
              const aVal = a[field] || 0;
              const bVal = b[field] || 0;
              return dbSortDir === 1 ? aVal - bVal : bVal - aVal;
            });
            // Apply pagination after sorting
            enrichedUsers = enrichedUsers.slice(skip, skip + l);
          }

        return res.status(200).json({
          success: true,
          data: enrichedUsers,
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

    const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
    if (!adminUser) {
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

    const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
    if (!adminUser) {
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

    const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
    if (!adminUser) {
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

    const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
    if (!adminUser) {
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
   * Update Daily Auction Slot (within master auction)
   */
  const updateDailyAuctionSlot = async (req, res) => {
    try {
      const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized. Admin user_id required.' });
      }

    const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
    if (!adminUser) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    const { master_id, auction_number } = req.params;
      const auctionNumber = parseInt(auction_number, 10);

      const masterAuction = await MasterAuction.findOne({ master_id });
      if (!masterAuction) return res.status(404).json({ success: false, message: 'Master auction not found' });

      const slotIndex = masterAuction.dailyAuctionConfig.findIndex(
        slot => slot.auctionNumber === auctionNumber
      );
      if (slotIndex === -1) {
        return res.status(404).json({ success: false, message: 'Auction slot not found' });
      }

      const normalizedSlot = { ...req.body, auctionNumber };

      if (
        normalizedSlot.EntryFee === 'RANDOM' &&
        (!normalizedSlot.BoxA || !normalizedSlot.BoxB) &&
        (!normalizedSlot.FeeSplits?.BoxA || !normalizedSlot.FeeSplits?.BoxB)
      ) {
        const { BoxA, BoxB } = generateRandomFeeSplits(
          normalizedSlot.minEntryFee || 20,
          normalizedSlot.maxEntryFee || 80
        );
        normalizedSlot.BoxA = BoxA;
        normalizedSlot.BoxB = BoxB;
        normalizedSlot.FeeSplits = { BoxA, BoxB };
      }

      const existingSlot = masterAuction.dailyAuctionConfig[slotIndex];
      const mergedSlot = {
        ...(existingSlot?.toObject ? existingSlot.toObject() : existingSlot),
        ...normalizedSlot,
      };

      masterAuction.dailyAuctionConfig[slotIndex] = mergedSlot;
      masterAuction.modifiedBy = userId;
      masterAuction.markModified('dailyAuctionConfig');
      await masterAuction.save();
      await syncProductsFromConfig([mergedSlot], userId);

      return res.status(200).json({
        success: true,
        message: 'Auction slot updated successfully',
        data: mergedSlot
      });
    } catch (err) {
      console.error('Update Daily Auction Slot Error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  };

  /**
   * Delete Master Auction Admin
   */
  const deleteMasterAuctionAdmin = async (req, res) => {
  try {
    const userId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
    const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
    if (!adminUser) {
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
    const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
    if (!adminUser) {
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
    const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
    if (!adminUser) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    const subscriptions = await PushSubscription.find().lean();
    const userIds = subscriptions.map(s => s.userId).filter(id => id);
    const users = await User.find({ user_id: { $in: userIds } }).select('user_id username email').lean();
    const userMap = users.reduce((acc, u) => ({ ...acc, [u.user_id]: u }), {});

    const processedSubs = subscriptions.map(s => ({
      ...s,
      subscriptionId: s._id?.toString(),
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
    const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
    if (!adminUser) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    const { subscriptionId } = req.params;
    await PushSubscription.findOneAndDelete({
      $or: [{ _id: subscriptionId }, { subscriptionId }]
    });
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
    const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
    if (!adminUser) {
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
      // Only count prize claims where the winner actually paid (remainingFeesPaid = true)
      const successfulClaims = history.filter(h => h.prizeClaimStatus === 'CLAIMED' && h.remainingFeesPaid === true);
      const summary = {
        totalAuctions: hourlyAuctions.length,
        liveAuctions: hourlyAuctions.filter(a => a.Status === 'LIVE').length,
        completedAuctions: hourlyAuctions.filter(a => a.Status === 'COMPLETED').length,
        upcomingAuctions: hourlyAuctions.filter(a => a.Status === 'UPCOMING').length,
        uniqueParticipants: new Set(history.map(h => h.userId)).size,
        totalParticipations: history.length,
        totalClaimed: successfulClaims.length,
        totalPending: history.filter(h => h.prizeClaimStatus === 'PENDING').length,
        totalExpired: history.filter(h => h.prizeClaimStatus === 'EXPIRED').length,
        totalEntryFees: history.reduce((sum, h) => sum + (h.entryFeePaid || 0), 0),
        totalPrizeValue: hourlyAuctions.reduce((sum, a) => sum + (a.prizeValue || 0), 0),
        totalClaimedValue: successfulClaims.reduce((sum, h) => sum + (h.prizeAmountWon || 0), 0),
        totalAmountSpentByClaiming: successfulClaims.reduce((sum, h) => sum + (h.remainingProductFees || 0), 0),
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
    const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
    if (!adminUser || adminUser.adminType !== 'SUPER_ADMIN') {
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

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    admin.adminType = 'SUPER_ADMIN';
    await admin.save();
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
    const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
    if (!adminUser) {
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

        // Send Email (template-driven)
        const emailVariables = {
          name: participant.playerUsername,
          Name: participant.playerUsername,
          auctionName: hourlyAuction.auctionName,
          AuctionName: hourlyAuction.auctionName,
          timeSlot: hourlyAuction.TimeSlot,
          TimeSlot: hourlyAuction.TimeSlot
        };

        await sendEmailWithTemplate(user.email, 'Auction Cancelled', emailVariables);

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
    const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
    if (!adminUser) {
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
    console.log(`[ADMIN-AUTH] Checking admin_id: ${userId} for updateRefundStatus`);
    
    const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
    if (!adminUser) {
      console.error(`[ADMIN-AUTH] Admin not found: ${userId}`);
      return res.status(403).json({ success: false, message: 'Access denied. Admin not found.' });
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

/**
 * Verify Admin Access Code
 */
const verifyAccessCode = async (req, res) => {
  try {
    const { admin_id, accessCode } = req.body;
    if (!admin_id || !accessCode) {
      return res.status(400).json({ success: false, message: 'Admin ID and access code are required' });
    }

    const adminUser = await Admin.findOne({ admin_id, isActive: true }).select('+personalAccessCode');
    if (!adminUser) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (!adminUser.personalAccessCode) {
      return res.status(400).json({ success: false, message: 'No access code set. Please set one first.' });
    }

    const isValid = await adminUser.compareAccessCode(accessCode);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid access code' });
    }

    return res.status(200).json({ success: true, message: 'Access code verified' });
  } catch (err) {
    console.error('Verify Access Code Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Set or Update Admin Access Code
 */
const setAccessCode = async (req, res) => {
  try {
    const { admin_id, newAccessCode, currentAccessCode } = req.body;
    if (!admin_id || !newAccessCode) {
      return res.status(400).json({ success: false, message: 'Admin ID and new access code are required' });
    }

    if (!/^\d{4}$/.test(newAccessCode)) {
        return res.status(400).json({ success: false, message: 'Access code must be exactly 4 digits' });
      }

      const adminUser = await Admin.findOne({ admin_id, isActive: true }).select('+personalAccessCode');
      if (!adminUser) {
        return res.status(404).json({ success: false, message: 'Admin not found' });
      }

      // If admin already has an access code, verify the current one
      if (adminUser.personalAccessCode && currentAccessCode) {
        const isValid = await adminUser.compareAccessCode(currentAccessCode);
        if (!isValid) {
          return res.status(401).json({ success: false, message: 'Current access code is incorrect' });
        }
      }

      const salt = await bcrypt.genSalt(10);
      const hashedCode = await bcrypt.hash(newAccessCode, salt);

    adminUser.personalAccessCode = hashedCode;
    adminUser.accessCodeCreatedAt = new Date();
    await adminUser.save();

    return res.status(200).json({ success: true, message: 'Access code updated successfully' });
  } catch (err) {
    console.error('Set Access Code Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Send OTP for Access Code Reset
 */
const sendAccessCodeResetOtp = async (req, res) => {
  try {
    const { admin_id } = req.body;
    if (!admin_id) {
      return res.status(400).json({ success: false, message: 'Admin ID is required' });
    }

    const adminUser = await Admin.findOne({ admin_id, isActive: true });
    if (!adminUser) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    adminUser.accessCodeResetOtp = otp;
    adminUser.accessCodeResetOtpExpiry = otpExpiry;
    await adminUser.save();

    // Send OTP to admin's email
    await sendOtpEmail(adminUser.email, otp, 'Access Code Reset');

    return res.status(200).json({ success: true, message: 'OTP sent to your registered email' });
  } catch (err) {
    console.error('Send Access Code Reset OTP Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Reset Access Code with OTP
 */
const resetAccessCodeWithOtp = async (req, res) => {
  try {
    const { admin_id, otp, newAccessCode } = req.body;
    if (!admin_id || !otp || !newAccessCode) {
      return res.status(400).json({ success: false, message: 'Admin ID, OTP, and new access code are required' });
    }

      if (!/^\d{4}$/.test(newAccessCode)) {
        return res.status(400).json({ success: false, message: 'Access code must be exactly 4 digits' });
      }

    const adminUser = await Admin.findOne({ admin_id, isActive: true }).select('+accessCodeResetOtp +accessCodeResetOtpExpiry');
    if (!adminUser) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (!adminUser.accessCodeResetOtp || adminUser.accessCodeResetOtp !== otp) {
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }

    if (adminUser.accessCodeResetOtpExpiry && adminUser.accessCodeResetOtpExpiry < new Date()) {
      return res.status(401).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedCode = await bcrypt.hash(newAccessCode, salt);

    adminUser.personalAccessCode = hashedCode;
    adminUser.accessCodeCreatedAt = new Date();
    adminUser.accessCodeResetOtp = undefined;
    adminUser.accessCodeResetOtpExpiry = undefined;
    await adminUser.save();

    return res.status(200).json({ success: true, message: 'Access code reset successfully' });
  } catch (err) {
    console.error('Reset Access Code Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get Access Code Status
 */
const getAccessCodeStatus = async (req, res) => {
  try {
    const admin_id = req.query.admin_id;
    if (!admin_id) {
      return res.status(400).json({ success: false, message: 'Admin ID is required' });
    }

    const adminUser = await Admin.findOne({ admin_id, isActive: true }).select('+personalAccessCode');
    if (!adminUser) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        hasAccessCode: !!adminUser.personalAccessCode,
        accessCodeCreatedAt: adminUser.accessCodeCreatedAt || null,
      },
    });
  } catch (err) {
    console.error('Get Access Code Status Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Send OTP to admin mobile for viewing user mobile number
 */
const sendMobileViewOtp = async (req, res) => {
  try {
    const { admin_id } = req.body;
    if (!admin_id) {
      return res.status(400).json({ success: false, message: 'Admin ID is required' });
    }

    const adminUser = await Admin.findOne({ admin_id, isActive: true });
    if (!adminUser) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (!adminUser.mobile) {
      return res.status(400).json({ success: false, message: 'Admin mobile number not configured' });
    }

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await Admin.updateOne(
      { admin_id },
      { mobileViewOtp: otp, mobileViewOtpExpiry: otpExpiry }
    );

    // Send OTP via SMS to admin's mobile
    const message = `Dear ${adminUser.username}, use this OTP ${otp} to view user mobile number on Dream60 Admin Panel. Valid for 5 minutes. - Finpages Tech`;
    await sendSms(adminUser.mobile, message, { templateId: '1207176898558880888' });

    return res.status(200).json({ success: true, message: 'OTP sent to your registered mobile number' });
  } catch (err) {
    console.error('Send Mobile View OTP Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Verify OTP and reveal user mobile number with audit logging
 */
const verifyMobileViewOtp = async (req, res) => {
  try {
    const { admin_id, otp, target_user_id } = req.body;
    if (!admin_id || !otp || !target_user_id) {
      return res.status(400).json({ success: false, message: 'Admin ID, OTP, and target user ID are required' });
    }

    const adminUser = await Admin.findOne({ admin_id, isActive: true }).select('+mobileViewOtp +mobileViewOtpExpiry');
    if (!adminUser) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (!adminUser.mobileViewOtp || adminUser.mobileViewOtp !== otp) {
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }

    if (adminUser.mobileViewOtpExpiry && adminUser.mobileViewOtpExpiry < new Date()) {
      return res.status(401).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Get the target user's mobile number
    const targetUser = await User.findOne({ user_id: target_user_id }).select('user_id username mobile').lean();
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found' });
    }

    // Clear OTP after successful verification
    await Admin.updateOne(
      { admin_id },
      { $unset: { mobileViewOtp: 1, mobileViewOtpExpiry: 1 } }
    );

    // Create audit log
    await AdminAuditLog.create({
      adminId: adminUser.admin_id,
      adminUsername: adminUser.username,
      adminEmail: adminUser.email,
      action: 'VIEW_MOBILE_NUMBER',
      targetUserId: target_user_id,
      targetUsername: targetUser.username || 'Unknown',
      details: `Admin viewed mobile number of user ${targetUser.username} (${target_user_id})`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: { mobile: targetUser.mobile },
    });
  } catch (err) {
    console.error('Verify Mobile View OTP Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get admin audit logs
 */
const getAdminAuditLogs = async (req, res) => {
  try {
    const userId = req.query.user_id || req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
    if (!adminUser) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { page = 1, limit = 50 } = req.query;
    const l = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (p - 1) * l;

    const [logs, total] = await Promise.all([
      AdminAuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
      AdminAuditLog.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: logs,
      meta: { total, page: p, limit: l, pages: Math.ceil(total / l) },
    });
  } catch (err) {
    console.error('Get Admin Audit Logs Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Verify Common Admin Access Code (6-digit gate before login)
 */
const verifyCommonAccessCode = async (req, res) => {
  try {
    const { accessCode } = req.body;
    if (!accessCode) {
      return res.status(400).json({ success: false, message: 'Access code is required' });
    }

    const commonCode = process.env.ADMIN_COMMON_ACCESS_CODE || '841941';
    if (String(accessCode) !== String(commonCode)) {
      return res.status(401).json({ success: false, message: 'Invalid access code' });
    }

    return res.status(200).json({ success: true, message: 'Access code verified' });
  } catch (err) {
    console.error('Verify Common Access Code Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get All Admins (Super Admin / Developer only)
 */
const getAllAdmins = async (req, res) => {
  try {
    const userId = req.query.user_id || req.headers['x-user-id'];
    const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
    if (!adminUser || !['SUPER_ADMIN', 'DEVELOPER'].includes(adminUser.adminType)) {
      return res.status(403).json({ success: false, message: 'Access denied. Super Admin or Developer required.' });
    }

    const admins = await Admin.find().select('-password').sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: admins });
  } catch (err) {
    console.error('Get All Admins Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Create Admin (Super Admin / Developer only)
 */
const createAdmin = async (req, res) => {
  try {
    const userId = req.query.user_id || req.body.requester_id || req.headers['x-user-id'];
    const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
    if (!adminUser || !['SUPER_ADMIN', 'DEVELOPER'].includes(adminUser.adminType)) {
      return res.status(403).json({ success: false, message: 'Access denied. Super Admin or Developer required.' });
    }

    const { username, email, mobile, password, adminType } = req.body;
    if (!username || !email || !mobile || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existing = await Admin.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }, { mobile }],
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Admin with this email/username/mobile already exists' });
    }

    const validTypes = ['ADMIN', 'SUPER_ADMIN', 'DEVELOPER'];
    const newAdmin = await Admin.create({
      username,
      email: email.toLowerCase(),
      mobile,
      password,
      adminType: validTypes.includes(adminType) ? adminType : 'ADMIN',
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: { admin_id: newAdmin.admin_id, username: newAdmin.username, email: newAdmin.email, adminType: newAdmin.adminType },
    });
  } catch (err) {
    console.error('Create Admin Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Update Admin (Super Admin / Developer only)
 */
const updateAdmin = async (req, res) => {
  try {
    const userId = req.query.user_id || req.body.requester_id || req.headers['x-user-id'];
    const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
    if (!adminUser || !['SUPER_ADMIN', 'DEVELOPER'].includes(adminUser.adminType)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { admin_id } = req.params;
    const { username, email, mobile, adminType, isActive, status } = req.body;

    const target = await Admin.findOne({ admin_id });
    if (!target) return res.status(404).json({ success: false, message: 'Admin not found' });

    if (username) target.username = username;
    if (email) target.email = email.toLowerCase();
    if (mobile) target.mobile = mobile;
    if (adminType && ['ADMIN', 'SUPER_ADMIN', 'DEVELOPER'].includes(adminType)) target.adminType = adminType;
    if (typeof isActive === 'boolean') target.isActive = isActive;
    if (status === 'blocked') target.isActive = false;
    if (status === 'active') target.isActive = true;

    await target.save();
    return res.status(200).json({ success: true, message: 'Admin updated successfully' });
  } catch (err) {
    console.error('Update Admin Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Delete Admin (Super Admin / Developer only)
 */
const deleteAdmin = async (req, res) => {
  try {
    const userId = req.query.user_id || req.headers['x-user-id'];
    const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
    if (!adminUser || !['SUPER_ADMIN', 'DEVELOPER'].includes(adminUser.adminType)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { admin_id } = req.params;
    if (admin_id === userId) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    await Admin.findOneAndDelete({ admin_id });
    return res.status(200).json({ success: true, message: 'Admin deleted successfully' });
  } catch (err) {
    console.error('Delete Admin Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Reset Admin Password (Super Admin / Developer only)
 */
const resetAdminPassword = async (req, res) => {
  try {
    const userId = req.query.user_id || req.body.requester_id || req.headers['x-user-id'];
    const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
    if (!adminUser || !['SUPER_ADMIN', 'DEVELOPER'].includes(adminUser.adminType)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { admin_id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const target = await Admin.findOne({ admin_id });
    if (!target) return res.status(404).json({ success: false, message: 'Admin not found' });

    target.password = newPassword; // pre-save hook will hash
    await target.save();
    return res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset Admin Password Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Reset Admin Personal Access Code (Super Admin / Developer only)
 */
const resetAdminAccessCode = async (req, res) => {
  try {
    const userId = req.query.user_id || req.body.requester_id || req.headers['x-user-id'];
    const adminUser = await Admin.findOne({ admin_id: userId, isActive: true });
    if (!adminUser || !['SUPER_ADMIN', 'DEVELOPER'].includes(adminUser.adminType)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { admin_id } = req.params;
    const { newAccessCode } = req.body;
    if (!newAccessCode || !/^\d{4}$/.test(newAccessCode)) {
      return res.status(400).json({ success: false, message: 'Access code must be 4 digits' });
    }

    const target = await Admin.findOne({ admin_id });
    if (!target) return res.status(404).json({ success: false, message: 'Admin not found' });

    const salt = await bcrypt.genSalt(10);
    target.personalAccessCode = await bcrypt.hash(newAccessCode, salt);
    target.accessCodeCreatedAt = new Date();
    await target.save();
    return res.status(200).json({ success: true, message: 'Access code reset successfully' });
  } catch (err) {
    console.error('Reset Admin Access Code Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  verifyCommonAccessCode,
  adminLogin,
  sendAdminSignupOtp,
  adminSignup,
  getUserStatistics,
  getAllUsersAdmin,
  getAllMasterAuctionsWithConfig,
  createMasterAuctionAdmin,
  getAllMasterAuctionsAdmin,
  updateMasterAuctionAdmin,
  updateDailyAuctionSlot,
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
  verifyAccessCode,
  setAccessCode,
  sendAccessCodeResetOtp,
  resetAccessCodeWithOtp,
  getAccessCodeStatus,
  sendMobileViewOtp,
  verifyMobileViewOtp,
  getAdminAuditLogs,
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  resetAdminPassword,
  resetAdminAccessCode,
};
