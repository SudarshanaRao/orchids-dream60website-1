// src/controllers/userController.js
const bcrypt = require('bcryptjs');
const userRepo = require('../repositories/userRepository');
const AuctionHistory = require('../models/AuctionHistory');
const User = require('../models/user');

/**
 * Removes sensitive fields like password from the user object.
 * Accepts either a Mongoose document or a plain object.
 * @param {object} user
 * @returns {object|null}  
 */
const sanitizeUser = (user) => {
  if (!user) return null;
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.__v;
  delete obj._id;
  return obj;
};

/**
 * Resolve user_id from query, body, params, header or previously attached resolvedUserId
 * @param {object} req
 * @returns {string|null}
 */
const resolveUserId = (req) => {
  return (
    (req.query && req.query.user_id) ||
    (req.body && req.body.user_id) ||
    (req.params && req.params.user_id) ||
    (req.headers && (req.headers['x-user-id'] || req.headers['x_user_id'])) ||
    req.resolvedUserId ||
    null
  );
};

/**
 * Sync user stats from AuctionHistory to User model
 * Called when user joins auction or auction completes (win/loss)
 * @param {string} userId - User ID to sync stats for
 * @returns {object|null} Updated user or null on error
 */
const syncUserStats = async (userId) => {
  try {
    if (!userId) {
      console.error('❌ [SYNC_USER_STATS] No userId provided');
      return null;
    }

    console.log(`🔄 [SYNC_USER_STATS] Syncing stats for user: ${userId}`);

    // Get aggregated stats from AuctionHistory
    const stats = await AuctionHistory.getUserStats(userId);
    
    if (!stats) {
      console.log(`⚠️ [SYNC_USER_STATS] No stats found for user: ${userId}`);
      return null;
    }

      // Update User model with aggregated stats
      const updatedUser = await User.findOneAndUpdate(
        { user_id: userId },
        {
          $set: {
            totalAuctions: stats.totalAuctions || 0,
            totalWins: stats.totalWins || 0,
            totalLosses: stats.totalLosses || 0,
            totalAmountSpent: stats.totalSpent || 0,
            totalAmountWon: stats.totalWon || 0,
            winRate: stats.winRate || 0,
            netGain: stats.netGain || 0,
          }
        },
        { new: true }
      );


    if (updatedUser) {
      console.log(`✅ [SYNC_USER_STATS] Updated user stats:`, {
        userId,
        totalAuctions: updatedUser.totalAuctions,
        totalWins: updatedUser.totalWins,
        totalAmountSpent: updatedUser.totalAmountSpent,
        totalAmountWon: updatedUser.totalAmountWon,
      });
    } else {
      console.log(`⚠️ [SYNC_USER_STATS] User not found: ${userId}`);
    }

    return updatedUser;
  } catch (error) {
    console.error(`❌ [SYNC_USER_STATS] Error syncing stats for user ${userId}:`, error);
    return null;
  }
};

/**
 * Sync stats for all users (utility function for initial data sync)
 * @returns {object} Result with count of updated users
 */
const syncAllUserStats = async (req, res) => {
  try {
    console.log('🔄 [SYNC_ALL_USER_STATS] Starting sync for all users...');

    // Get all users
    const users = await User.find({ isDeleted: { $ne: true } }).select('user_id username');
    
    let updatedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        const result = await syncUserStats(user.user_id);
        if (result) {
          updatedCount++;
        }
      } catch (err) {
        errorCount++;
        console.error(`❌ [SYNC_ALL_USER_STATS] Error for user ${user.username}:`, err.message);
      }
    }

    console.log(`✅ [SYNC_ALL_USER_STATS] Completed. Updated: ${updatedCount}, Errors: ${errorCount}`);

    return res.json({
      success: true,
      message: `Synced ${updatedCount} users successfully`,
      data: {
        totalUsers: users.length,
        updated: updatedCount,
        errors: errorCount,
      }
    });
  } catch (error) {
    console.error('❌ [SYNC_ALL_USER_STATS] Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET all users (no parameters required)
 * Route: GET /auth/users  (or wherever you mount it)
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await userRepo.getAllUsers();
    const safe = Array.isArray(users) ? users.map(sanitizeUser) : [];
    return res.json({ success: true, users: safe });
  } catch (err) {
    console.error('getAllUsers error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /auth/me
 *
 * - If user_id is provided -> return that user (sanitized) with auction stats
 * - If no user_id provided -> return list of all non-deleted users (sanitized) via userRepo.getAllUsers()
 */
const getMe = async (req, res) => {
  try {
    const userId = resolveUserId(req);

    // If no userId provided, return all users (useful for testing/admin)
    if (!userId) {
      const users = await userRepo.getAllUsers();
      const safe = Array.isArray(users) ? users.map(sanitizeUser) : [];
      return res.json({ success: true, users: safe });
    }

    if (typeof userId !== 'string') {
      return res.status(400).json({ success: false, message: 'user_id must be a string' });
    }

    const user = await userRepo.getUserById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // ✅ NEW: Use pre-calculated stats from User model instead of expensive aggregation
    const stats = {
      totalAuctions: user.totalAuctions || 0,
      totalWins: user.totalWins || 0,
      totalLosses: user.totalLosses || 0,
      totalSpent: user.totalAmountSpent || 0,
      totalWon: user.totalAmountWon || 0,
      winRate: user.winRate || 0,
      netGain: user.netGain || 0,
    };

    // ✅ Combine user data with pre-calculated auction stats
    const userData = {
      ...sanitizeUser(user),
      stats,
    };

    return res.json({ success: true, user: userData });
  } catch (err) {
    console.error('getMe error:', err);
    if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid user id format' });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /auth/me/profile
 * Requires user_id
 * Returns user profile with complete auction statistics
 */
const getProfile = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(400).json({ success: false, message: 'user_id required' });

    const user = await userRepo.getUserById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // ✅ NEW: Use pre-calculated stats from User model instead of expensive aggregation
    const stats = {
      totalAuctions: user.totalAuctions || 0,
      totalWins: user.totalWins || 0,
      totalLosses: user.totalLosses || 0,
      totalSpent: user.totalAmountSpent || 0,
      totalWon: user.totalAmountWon || 0,
      winRate: user.winRate || 0,
      netGain: user.netGain || 0,
    };

    // ✅ Combine user profile with pre-calculated auction stats
    const profileData = {
      ...sanitizeUser(user),
      stats,
    };

    return res.json({ success: true, data: profileData, profile: profileData });
  } catch (err) {
    console.error('getProfile error:', err);
    if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid user id format' });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PUT /auth/me/preferences
 * Requires user_id
 */
const updatePreferences = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(400).json({ success: false, message: 'user_id required' });

    const { user_id, ...newPrefs } = req.body;

    const allowed = ['emailNotifications', 'smsNotifications', 'bidAlerts', 'winNotifications'];
    const validPrefs = {};

    for (const [k, v] of Object.entries(newPrefs || {})) {
      if (allowed.includes(k)) {
        if (typeof v === 'boolean') validPrefs[k] = v;
        else if (typeof v !== 'undefined') {
          return res.status(400).json({ success: false, message: `Preference '${k}' must be a boolean` });
        }
      }
    }

    if (Object.keys(validPrefs).length === 0 && Object.keys(newPrefs || {}).length > 0) {
      return res.status(400).json({ success: false, message: 'No valid preferences fields provided' });
    }

    const user = await userRepo.findOne({ user_id: userId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.preferences = { ...user.preferences, ...validPrefs };

    try {
      await user.save();
    } catch (saveErr) {
      console.error('updatePreferences saveErr:', saveErr);
      if (saveErr.name === 'ValidationError') return res.status(400).json({ success: false, message: saveErr.message });
      throw saveErr;
    }

    const refreshed = await userRepo.getUserById(userId);
    return res.json({ success: true, preferences: (refreshed && refreshed.preferences) || {} });
  } catch (err) {
    console.error('updatePreferences error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * DELETE /auth/me
 * Requires user_id
 */
const deleteMe = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(400).json({ success: false, message: 'user_id required' });

    const user = await userRepo.findOne({ user_id: userId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const deleted = await userRepo.softDeleteUser(userId);
    return res.json({ success: true, message: 'Account deleted', user: sanitizeUser(deleted) });
  } catch (err) {
    console.error('deleteMe error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Update user's mobile number
 */
const updateMobile = async (req, res) => {
  try {
    const { user_id, isMobile, isEmail, identifier } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, message: 'user_id is required' });
    }

    if (!isMobile && !isEmail) {
      return res.status(400).json({ success: false, message: 'Either isMobile or isEmail must be true' });
    }

    if (!identifier || typeof identifier !== 'string') {
      return res.status(400).json({ success: false, message: 'identifier is required and must be a string' });
    }

    // Find user by user_id
    const user = await userRepo.findOne({ user_id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (isMobile) {
      // Normalize mobile: remove non-digits
      const normalizedMobile = identifier.replace(/\D/g, '');
      if (!/^[0-9]{7,15}$/.test(normalizedMobile)) {
        return res.status(400).json({ success: false, message: 'Invalid mobile number format' });
      }

      // Check uniqueness
      const existingUser = await userRepo.findOne({ mobile: normalizedMobile, user_id: { $ne: user_id }, isDeleted: false });
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'Mobile number already registered' });
      }

      user.mobile = normalizedMobile;
    } else if (isEmail) {
      // Normalize email
      const normalizedEmail = identifier.trim().toLowerCase();

      // Basic email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
      }

      // Check uniqueness
      const existingUser = await userRepo.findOne({ email: normalizedEmail, user_id: { $ne: user_id }, isDeleted: false });
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'Email already registered' });
      }

      user.email = normalizedEmail;
    }

    try {
      await user.save();
    } catch (saveErr) {
      console.error('updateMobile saveErr:', saveErr);
      if (saveErr.name === 'ValidationError') return res.status(400).json({ success: false, message: saveErr.message });
      if (saveErr.code === 11000) return res.status(409).json({ success: false, message: 'Duplicate field error' });
      throw saveErr;
    }

    const updated = await userRepo.getUserById(user_id);
    return res.json({ success: true, message: `${isMobile ? 'Mobile number' : 'Email'} updated successfully`, user: updated });
  } catch (err) {
    console.error('updateMobile error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


module.exports = {
  getAllUsers,
  getMe,
  getProfile,
  updatePreferences,
  deleteMe,
  updateMobile,
  syncUserStats,
  syncAllUserStats,
};