// src/repositories/userRepository.js 
const User = require('../models/user');

/**
 * Utility: remove fields we never want to allow to be updated via updateUser
 */
const stripImmutableFields = (data = {}) => {
  const copy = { ...data };
  // never allow these fields to be mass-updated via repository
  delete copy.user_id;
  delete copy.userCode;
  delete copy.createdAt;
  delete copy.updatedAt;
  delete copy.__v;
  delete copy._id;
  delete copy.password; // password should only be changed via updatePassword
  delete copy.isDeleted; // prefer a dedicated soft-delete method
  return copy;
};

/**
 * Create a new user. Let Mongoose hooks handle password hashing and userCode generation.
 * `payload` should contain at least: { username, mobile, password } and optionally email, preferences, userType.
 * Returns the created user without password.
 */
const createUser = async (payload) => {
  const user = new User(payload);
  await user.save();
  // return sanitized user
  return User.findById(user._id).select('-password').lean();
};

/**
 * Return all non-deleted users (no password)
 * Optionally accept a filter (e.g. for pagination) and projection options.
 */
const getAllUsers = async (filter = {}, options = {}) => {
  const baseFilter = { isDeleted: false, ...filter };
  const query = User.find(baseFilter).select('-password');

  // apply simple options: limit, skip, sort if provided
  if (options.sort) query.sort(options.sort);
  if (typeof options.limit === 'number') query.limit(options.limit);
  if (typeof options.skip === 'number') query.skip(options.skip);

  return query.lean();
};

/**
 * Get one user by user_id (UUID) (no password)
 */
const getUserById = async (userId) => {
  return User.findOne({ user_id: userId, isDeleted: false }).select('-password').lean();
};

/**
 * Find one user by filter (used for duplicate checks) - returns full doc by default.
 * If `opts.projection === 'public'` or opts.excludePassword true, will remove password.
 */
const findOne = async (filter = {}, opts = {}) => {
  const q = User.findOne(filter);
  if (opts.excludePassword || opts.projection === 'public') q.select('-password');
  if (opts.lean) return q.lean();
  return q.exec();
};

/**
 * Update user by user_id, return updated doc (no password)
 * Will strip immutable/unique fields and run validators.
 */
const updateUser = async (userId, data = {}) => {
  const safeData = stripImmutableFields(data);
  const updated = await User.findOneAndUpdate(
    { user_id: userId, isDeleted: false },
    safeData,
    { new: true, runValidators: true, context: 'query' }
  ).select('-password');

  // return lean object
  return updated ? updated.toObject() : null;
};

/**
 * Soft delete user
 */
const softDeleteUser = async (userId) => {
  const updated = await User.findOneAndUpdate(
    { user_id: userId, isDeleted: false },
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  ).select('-password');

  return updated ? updated.toObject() : null;
};

/**
 * Update password (accepts plain password). This uses the model helper/setter
 * so the pre-save hook or setPassword method will ensure hashing.
 *
 * Returns the user without password (public shape) or null if not found.
 */
const updatePassword = async (userId, newPlainPassword) => {
  const user = await User.findOne({ user_id: userId, isDeleted: false });
  if (!user) return null;

  // prefer using the model helper which hashes and sets the password
  if (typeof user.setPassword === 'function') {
    await user.setPassword(newPlainPassword);
  } else {
    user.password = newPlainPassword;
  }

  await user.save();

  // return sanitized user
  return User.findOne({ user_id: userId }).select('-password').lean();
};

/**
 * Update user's mobile number by user_id.
 */
const updateMobileNumber = async (userId, newMobile) => {
  // Only update mobile field, respecting uniqueness & validation on model level
  const updated = await User.findOneAndUpdate(
    { user_id: userId, isDeleted: false },
    { mobile: newMobile },
    { new: true, runValidators: true, context: 'query' }
  ).select('-password');

  return updated ? updated.toObject() : null;
};

/**
 * Find one user by mobile number (no password)
 * Returns user document or null if not found.
 */
const findOneByMobile = async (mobile) => {
  return User.findOne({ mobile: mobile, isDeleted: false }).select('-password').lean();
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  findOne,
  findOneByMobile,
  updateUser,
  softDeleteUser,
  updatePassword,
  updateMobileNumber,
};
