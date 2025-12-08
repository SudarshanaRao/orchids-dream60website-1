// src/controllers/authController.js 
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const OTP = require('../models/OTP');
require('dotenv').config();

// -----------------------------
// HELPERS
// -----------------------------
const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// generate 6-digit numeric OTP as string
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// utility: normalize mobile to digits-only and validate length per schema (7-15)
const normalizeMobile = (m) => {
  if (!m && m !== '') return '';
  const cleaned = String(m).replace(/\D/g, '');
  return cleaned;
};

const isValidMobile = (m) => {
  return /^[0-9]{7,15}$/.test(String(m));
};

// utility: find user by identifier (mobile or email)
const findUserByIdentifier = async (identifier, type) => {
  if (type === 'mobile') {
    const normalized = normalizeMobile(identifier);
    return User.findOne({ mobile: normalized });
  }
  // email
  return User.findOne({ email: String(identifier).toLowerCase() });
};

// -----------------------------
// SIGNUP CONTROLLER
// -----------------------------
const signup = async (req, res) => {
  try {
    let { username, mobile, password, confirmPassword, email } = req.body || {};

    // required fields (password & confirm, username & mobile)
    if (!username || !mobile || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Username, mobile, password and confirmPassword are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    // normalize and validate mobile
    const normalizedMobile = normalizeMobile(mobile);
    if (!isValidMobile(normalizedMobile)) {
      return res.status(400).json({ success: false, message: 'Mobile must be a valid number (7-15 digits)' });
    }

    // normalize username & email
    username = String(username).trim();
    email = email ? String(email).trim().toLowerCase() : undefined;

    // check duplicates (username, mobile, email). email check case-insensitive
    const orQuery = [
      { mobile: normalizedMobile },
      { username },
    ];
    if (email) {
      const escaped = escapeRegex(email);
      orQuery.push({ email: new RegExp(`^${escaped}$`, 'i') });
    }

    const existingUser = await User.findOne({ $or: orQuery });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(409).json({ success: false, message: 'Username already taken' });
      }
      if (existingUser.mobile === normalizedMobile) {
        return res.status(409).json({ success: false, message: 'Mobile number already registered' });
      }
      if (email && existingUser.email && existingUser.email.toLowerCase() === email.toLowerCase()) {
        return res.status(409).json({ success: false, message: 'Email already registered' });
      }
      return res.status(409).json({ success: false, message: 'User already exists' });
    }

    // create new user (password hashing handled by model pre-save)
    const newUser = new User({
      username,
      mobile: normalizedMobile,
      email: email || null,
      password,
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        user_id: newUser.user_id,
        username: newUser.username,
        mobile: newUser.mobile,
        email: newUser.email,
        preferences: newUser.preferences || {},
      },
    });
  } catch (error) {
    console.error('Signup Error:', error);

    if (error && error.code === 11000) {
      const dupField = Object.keys(error.keyValue || {})[0];
      const msgMap = {
        username: 'Username already taken',
        mobile: 'Mobile number already registered',
        email: 'Email already registered',
      };
      return res.status(409).json({ success: false, message: msgMap[dupField] || 'Duplicate field value' });
    }

    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// -----------------------------
// LOGIN CONTROLLER
// -----------------------------
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body || {};

    // Validate request
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Both identifier (mobile/email/username) and password are required',
      });
    }

    // Determine type of identifier
    let query = {};
    if (/^\d{7,15}$/.test(identifier)) {
      // Mobile number (digits only)
      const normalizedMobile = String(identifier).replace(/\D/g, '');
      query = { mobile: normalizedMobile };
    } else if (identifier.includes('@')) {
      // Email
      query = { email: String(identifier).trim().toLowerCase() };
    } else {
      // Username
      query = { username: String(identifier).trim().toLowerCase() };
    }

    // Find user
    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Build public user response
    const publicUser = {
      user_id: user.user_id,
      username: user.username,
      mobile: user.mobile,
      email: user.email,
      preferences: user.preferences || {},
    };

    // Success
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: publicUser,
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};




// -----------------------------
// OTP Helpers & Controllers
// -----------------------------

// POST /auth/forgot-password
// Body: { mobile } or { email }
// Returns OTP in response for dev/testing (remove in production)
const forgotPassword = async (req, res) => {
  try {
    const { mobile, email } = req.body || {};
    const identifier = (mobile || email || '').toString().trim();
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Mobile or email is required' });
    }

    const type = mobile ? 'mobile' : 'email';
    const user = await findUserByIdentifier(identifier, type);

    const otpCode = generateOtp();

    await OTP.findOneAndUpdate(
      { identifier, type },
      { otp: otpCode, createdAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'OTP generated',
      otp: otpCode,
      userExists: !!user,
    });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /auth/verify-otp
// Body: { mobile, otp } or { email, otp }
const verifyOtp = async (req, res) => {
  try {
    const { mobile, email, otp } = req.body || {};
    const identifier = (mobile || email || '').toString().trim();
    if (!identifier || !otp) {
      return res.status(400).json({ success: false, message: 'Identifier and OTP are required' });
    }
    const type = mobile ? 'mobile' : 'email';

    const record = await OTP.findOne({ identifier, type });
    if (!record) {
      return res.status(400).json({ success: false, message: 'OTP not found or expired' });
    }

    if (record.otp !== String(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // OTP verified — delete to prevent reuse
    await OTP.deleteOne({ _id: record._id });

    return res.status(200).json({ success: true, message: 'OTP verified' });
  } catch (err) {
    console.error('Verify OTP Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /auth/resend-otp
// Body: { mobile } or { email }
const resendOtp = async (req, res) => {
  try {
    const { mobile, email } = req.body || {};
    const identifier = (mobile || email || '').toString().trim();
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Mobile or email is required' });
    }
    const type = mobile ? 'mobile' : 'email';

    const otpCode = generateOtp();

    await OTP.findOneAndUpdate(
      { identifier, type },
      { otp: otpCode, createdAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, message: 'OTP resent', otp: otpCode });
  } catch (err) {
    console.error('Resend OTP Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { mobile, email, newPassword } = req.body || {};
    const identifier = (mobile || email || '').toString().trim();
    if (!identifier || !newPassword) {
      return res.status(400).json({ success: false, message: 'Identifier and new password are required' });
    }
    const type = mobile ? 'mobile' : 'email';

    // Find the user
    const user = await findUserByIdentifier(identifier, type);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update password (pre-save hook will hash)
    user.password = newPassword;
    await user.save();

    // Remove any OTP records for this identifier (cleanup)
    await OTP.deleteMany({ identifier, type }).catch((e) => {
      console.warn('OTP cleanup warn:', e && e.message ? e.message : e);
    });

    return res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { user_id, oldPassword, newPassword, confirmPassword } = req.body || {};

    // Validate inputs
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'user_id is required' });
    }
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'oldPassword, newPassword, and confirmPassword are required',
      });
    }
    if (typeof oldPassword !== 'string' || typeof newPassword !== 'string' || typeof confirmPassword !== 'string') {
      return res.status(400).json({ success: false, message: 'Passwords must be strings' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirm password do not match' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    // Find user
    const user = await User.findOne({ user_id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Validate old password
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(403).json({ success: false, message: 'Old password is incorrect' });
    }

    // IMPORTANT: assign plain string and let pre('save') hash it once
    user.password = newPassword;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Update Password Error:', err);
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


module.exports = {
  signup,
  login,
  forgotPassword,
  verifyOtp,
  resendOtp,
  resetPassword,
  updatePassword,
};
