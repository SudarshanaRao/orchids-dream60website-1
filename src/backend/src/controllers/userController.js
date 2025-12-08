// src/controllers/userController.js
const bcrypt = require('bcryptjs');
const userRepo = require('../repositories/userRepository');
const AuctionHistory = require('../models/AuctionHistory');

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
 * - If user_id is provided -> return that user (sanitized)
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

    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    console.error('getMe error:', err);
    if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid user id format' });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /auth/me/profile
 * Requires user_id
 * Returns user profile with auction statistics (totalWins, totalAmountSpent, totalAmountWon)
 */
const getProfile = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(400).json({ success: false, message: 'user_id required' });

    const user = await userRepo.getUserById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // ✅ Fetch auction statistics from AuctionHistory
    let auctionStats = {
      totalWins: 0,
      totalAmountSpent: 0,
      totalAmountWon: 0,
    };

    try {
      const stats = await AuctionHistory.getUserStats(userId);
      if (stats) {
        auctionStats = {
          totalWins: stats.totalWins || 0,
          totalAmountSpent: stats.totalSpent || 0,
          totalAmountWon: stats.totalWon || 0,
        };
      }
    } catch (statsError) {
      console.error('Error fetching auction stats:', statsError);
      // Continue with default values if stats fetch fails
    }

    // ✅ Combine user profile with auction stats
    const profileData = {
      ...sanitizeUser(user),
      ...auctionStats,
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
};