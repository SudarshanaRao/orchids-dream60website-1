const mongoose = require('mongoose');

const PageViewSchema = new mongoose.Schema({
  page: { type: String, required: true },
  path: { type: String, required: true },
  enterTime: { type: Date, required: true },
  exitTime: { type: Date },
  duration: { type: Number, default: 0 },
  scrollDepth: { type: Number, default: 0 },
}, { _id: false });

const InteractionSchema = new mongoose.Schema({
  type: { type: String, enum: ['click', 'scroll', 'input', 'navigation', 'auction_join', 'bid', 'purchase', 'download', 'button_click', 'link_click', 'form_submit', 'modal_open', 'modal_close', 'tab_switch', 'other'], required: true },
  element: { type: String },
  page: { type: String },
  path: { type: String },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { _id: false });

const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  deviceInfo: {
    userAgent: { type: String },
    platform: { type: String },
    screenWidth: { type: Number },
    screenHeight: { type: Number },
    isMobile: { type: Boolean },
  },
  pageViews: [PageViewSchema],
  interactions: [InteractionSchema],
  totalPageViews: { type: Number, default: 0 },
  totalInteractions: { type: Number, default: 0 },
}, { _id: false });

const DailyActivitySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  dateStr: { type: String, required: true },
  sessions: [SessionSchema],
  totalSessions: { type: Number, default: 0 },
  totalActiveTime: { type: Number, default: 0 },
  totalPageViews: { type: Number, default: 0 },
  totalInteractions: { type: Number, default: 0 },
  firstActivity: { type: Date },
  lastActivity: { type: Date },
  pageStats: { type: mongoose.Schema.Types.Mixed, default: {} },
});

const userActivitySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  username: { type: String, required: true, index: true },
  
  dailyActivities: [DailyActivitySchema],
  
  lifetimeStats: {
    totalSessions: { type: Number, default: 0 },
    totalActiveTime: { type: Number, default: 0 },
    totalPageViews: { type: Number, default: 0 },
    totalInteractions: { type: Number, default: 0 },
    firstSeen: { type: Date },
    lastSeen: { type: Date },
    favoritePages: { type: mongoose.Schema.Types.Mixed, default: {} },
    averageSessionDuration: { type: Number, default: 0 },
  },
  
  currentSession: {
    sessionId: { type: String },
    startTime: { type: Date },
    lastHeartbeat: { type: Date },
    currentPage: { type: String },
    isActive: { type: Boolean, default: false },
  },
}, { timestamps: true });

userActivitySchema.index({ userId: 1, 'dailyActivities.dateStr': 1 });
userActivitySchema.index({ 'currentSession.isActive': 1 });
userActivitySchema.index({ 'lifetimeStats.lastSeen': -1 });

module.exports = mongoose.models.UserActivity || mongoose.model('UserActivity', userActivitySchema);
