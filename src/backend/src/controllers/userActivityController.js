const UserActivity = require('../models/UserActivity');
const User = require('../models/user');
const { randomUUID } = require('crypto');

const formatDateIST = (date) => {
  const d = new Date(new Date(date).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const getDateStrIST = (date) => {
  const d = new Date(new Date(date).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return d.toISOString().split('T')[0];
};

const startSession = async (req, res) => {
  try {
    const { userId, username, deviceInfo } = req.body;
    
    if (!userId || !username) {
      return res.status(400).json({ success: false, message: 'userId and username required' });
    }

    const sessionId = randomUUID();
    const now = new Date();
    const todayStr = getDateStrIST(now);

    let userActivity = await UserActivity.findOne({ userId });

    if (!userActivity) {
      userActivity = new UserActivity({
        userId,
        username,
        dailyActivities: [],
        lifetimeStats: {
          totalSessions: 0,
          totalActiveTime: 0,
          totalPageViews: 0,
          totalInteractions: 0,
          firstSeen: now,
          lastSeen: now,
          favoritePages: {},
          averageSessionDuration: 0,
        },
        currentSession: {
          sessionId,
          startTime: now,
          lastHeartbeat: now,
          currentPage: '/',
          isActive: true,
        },
      });
    } else {
      if (userActivity.currentSession?.isActive && userActivity.currentSession?.sessionId) {
        await endSessionInternal(userActivity);
      }

      userActivity.currentSession = {
        sessionId,
        startTime: now,
        lastHeartbeat: now,
        currentPage: '/',
        isActive: true,
      };
      userActivity.lifetimeStats.lastSeen = now;
    }

    let todayActivity = userActivity.dailyActivities.find(d => d.dateStr === todayStr);
    if (!todayActivity) {
      todayActivity = {
        date: new Date(todayStr + 'T00:00:00+05:30'),
        dateStr: todayStr,
        sessions: [],
        totalSessions: 0,
        totalActiveTime: 0,
        totalPageViews: 0,
        totalInteractions: 0,
        firstActivity: now,
        lastActivity: now,
        pageStats: {},
      };
      userActivity.dailyActivities.push(todayActivity);
    }

    const todayIdx = userActivity.dailyActivities.findIndex(d => d.dateStr === todayStr);
    userActivity.dailyActivities[todayIdx].sessions.push({
      sessionId,
      startTime: now,
      isActive: true,
      deviceInfo: deviceInfo || {},
      pageViews: [],
      interactions: [],
      totalPageViews: 0,
      totalInteractions: 0,
    });
    userActivity.dailyActivities[todayIdx].totalSessions += 1;
    userActivity.dailyActivities[todayIdx].firstActivity = userActivity.dailyActivities[todayIdx].firstActivity || now;
    userActivity.lifetimeStats.totalSessions += 1;

    await userActivity.save();

    return res.status(200).json({
      success: true,
      sessionId,
      message: 'Session started',
    });
  } catch (err) {
    console.error('Start Session Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const endSessionInternal = async (userActivity) => {
  const session = userActivity.currentSession;
  if (!session?.sessionId || !session?.isActive) return;

  const now = new Date();
  const duration = Math.floor((now - new Date(session.startTime)) / 1000);
  const todayStr = getDateStrIST(session.startTime);

  const todayIdx = userActivity.dailyActivities.findIndex(d => d.dateStr === todayStr);
  if (todayIdx >= 0) {
    const sessionIdx = userActivity.dailyActivities[todayIdx].sessions.findIndex(
      s => s.sessionId === session.sessionId
    );
    if (sessionIdx >= 0) {
      userActivity.dailyActivities[todayIdx].sessions[sessionIdx].endTime = now;
      userActivity.dailyActivities[todayIdx].sessions[sessionIdx].duration = duration;
      userActivity.dailyActivities[todayIdx].sessions[sessionIdx].isActive = false;
    }
    userActivity.dailyActivities[todayIdx].totalActiveTime += duration;
    userActivity.dailyActivities[todayIdx].lastActivity = now;
  }

  userActivity.lifetimeStats.totalActiveTime += duration;
  userActivity.lifetimeStats.lastSeen = now;
  
  const totalSessions = userActivity.lifetimeStats.totalSessions || 1;
  userActivity.lifetimeStats.averageSessionDuration = Math.floor(
    userActivity.lifetimeStats.totalActiveTime / totalSessions
  );

  userActivity.currentSession.isActive = false;
  userActivity.currentSession.lastHeartbeat = now;
};

const endSession = async (req, res) => {
  try {
    const { userId, sessionId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId required' });
    }

    const userActivity = await UserActivity.findOne({ userId });
    if (!userActivity) {
      return res.status(404).json({ success: false, message: 'User activity not found' });
    }

    if (sessionId && userActivity.currentSession?.sessionId !== sessionId) {
      return res.status(400).json({ success: false, message: 'Session mismatch' });
    }

    await endSessionInternal(userActivity);
    await userActivity.save();

    return res.status(200).json({ success: true, message: 'Session ended' });
  } catch (err) {
    console.error('End Session Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const heartbeat = async (req, res) => {
  try {
    const { userId, sessionId, currentPage } = req.body;
    
    if (!userId || !sessionId) {
      return res.status(400).json({ success: false, message: 'userId and sessionId required' });
    }

    const now = new Date();
    await UserActivity.updateOne(
      { userId, 'currentSession.sessionId': sessionId },
      {
        $set: {
          'currentSession.lastHeartbeat': now,
          'currentSession.currentPage': currentPage || '/',
          'lifetimeStats.lastSeen': now,
        },
      }
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Heartbeat Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const trackPageView = async (req, res) => {
  try {
    const { userId, sessionId, page, path, enterTime, duration, scrollDepth } = req.body;
    
    if (!userId || !sessionId || !page || !path) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const now = new Date();
    const todayStr = getDateStrIST(enterTime || now);
    const safePath = path.replace(/\./g, '_');

    const updateOps = {
      $push: {
        'dailyActivities.$[day].sessions.$[sess].pageViews': {
          page,
          path,
          enterTime: enterTime || now,
          exitTime: null,
          duration: duration || 0,
          scrollDepth: scrollDepth || 0,
        }
      },
      $inc: {
        'dailyActivities.$[day].sessions.$[sess].totalPageViews': 1,
        'dailyActivities.$[day].totalPageViews': 1,
        [`dailyActivities.$[day].pageStats.${safePath}.views`]: 1,
        [`dailyActivities.$[day].pageStats.${safePath}.totalTime`]: duration || 0,
        'lifetimeStats.totalPageViews': 1,
        [`lifetimeStats.favoritePages.${safePath}.views`]: 1,
        [`lifetimeStats.favoritePages.${safePath}.totalTime`]: duration || 0,
      },
      $set: {
        'dailyActivities.$[day].lastActivity': now,
        'lifetimeStats.lastSeen': now,
        'currentSession.currentPage': path,
        'currentSession.lastHeartbeat': now,
      }
    };

    const arrayFilters = [
      { 'day.dateStr': todayStr },
      { 'sess.sessionId': sessionId }
    ];

    await UserActivity.updateOne(
      { userId, 'dailyActivities.dateStr': todayStr, 'dailyActivities.sessions.sessionId': sessionId },
      updateOps,
      { arrayFilters }
    );

    return res.status(200).json({ success: true, message: 'Page view tracked' });
  } catch (err) {
    console.error('Track Page View Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const trackInteraction = async (req, res) => {
  try {
    const { userId, sessionId, type, element, page, path, metadata } = req.body;
    
    if (!userId || !sessionId || !type) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const now = new Date();
    const todayStr = getDateStrIST(now);

    const updateOps = {
      $push: {
        'dailyActivities.$[day].sessions.$[sess].interactions': {
          type,
          element: element || '',
          page: page || '',
          path: path || '',
          timestamp: now,
          metadata: metadata || {},
        }
      },
      $inc: {
        'dailyActivities.$[day].sessions.$[sess].totalInteractions': 1,
        'dailyActivities.$[day].totalInteractions': 1,
        'lifetimeStats.totalInteractions': 1,
      },
      $set: {
        'dailyActivities.$[day].lastActivity': now,
        'lifetimeStats.lastSeen': now,
      }
    };

    const arrayFilters = [
      { 'day.dateStr': todayStr },
      { 'sess.sessionId': sessionId }
    ];

    await UserActivity.updateOne(
      { userId, 'dailyActivities.dateStr': todayStr, 'dailyActivities.sessions.sessionId': sessionId },
      updateOps,
      { arrayFilters }
    );

    return res.status(200).json({ success: true, message: 'Interaction tracked' });
  } catch (err) {
    console.error('Track Interaction Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const trackBatch = async (req, res) => {
  try {
    const { userId, sessionId, pageViews, interactions } = req.body;
    
    if (!userId || !sessionId) {
      return res.status(400).json({ success: false, message: 'userId and sessionId required' });
    }

    const now = new Date();
    const todayStr = getDateStrIST(now);

    const updateOps = {
      $inc: {
        'lifetimeStats.totalPageViews': (pageViews && Array.isArray(pageViews)) ? pageViews.length : 0,
        'lifetimeStats.totalInteractions': (interactions && Array.isArray(interactions)) ? interactions.length : 0,
      },
      $set: {
        'lifetimeStats.lastSeen': now,
        'currentSession.lastHeartbeat': now,
      }
    };

    const arrayFilters = [
      { 'day.dateStr': todayStr },
      { 'sess.sessionId': sessionId }
    ];

    const pushOps = {};
    if (pageViews && Array.isArray(pageViews) && pageViews.length > 0) {
      pushOps['dailyActivities.$[day].sessions.$[sess].pageViews'] = { $each: pageViews.map(pv => ({
        page: pv.page || '',
        path: pv.path || '',
        enterTime: pv.enterTime || now,
        exitTime: pv.exitTime || null,
        duration: pv.duration || 0,
        scrollDepth: pv.scrollDepth || 0,
      })) };
      
      updateOps.$inc['dailyActivities.$[day].sessions.$[sess].totalPageViews'] = pageViews.length;
      updateOps.$inc['dailyActivities.$[day].totalPageViews'] = pageViews.length;
      updateOps.$set['dailyActivities.$[day].lastActivity'] = now;

      // Update page stats and favorite pages
      for (const pv of pageViews) {
        const path = pv.path || '/';
        const safePath = path.replace(/\./g, '_'); // Replace dots in path for mongo keys
        updateOps.$inc[`dailyActivities.$[day].pageStats.${safePath}.views`] = 1;
        updateOps.$inc[`dailyActivities.$[day].pageStats.${safePath}.totalTime`] = pv.duration || 0;
        updateOps.$inc[`lifetimeStats.favoritePages.${safePath}.views`] = 1;
        updateOps.$inc[`lifetimeStats.favoritePages.${safePath}.totalTime`] = pv.duration || 0;
      }
    }

    if (interactions && Array.isArray(interactions) && interactions.length > 0) {
      pushOps['dailyActivities.$[day].sessions.$[sess].interactions'] = { $each: interactions.map(inter => ({
        type: inter.type || 'other',
        element: inter.element || '',
        page: inter.page || '',
        path: inter.path || '',
        timestamp: inter.timestamp || now,
        metadata: inter.metadata || {},
      })) };

      updateOps.$inc['dailyActivities.$[day].sessions.$[sess].totalInteractions'] = interactions.length;
      updateOps.$inc['dailyActivities.$[day].totalInteractions'] = interactions.length;
      updateOps.$set['dailyActivities.$[day].lastActivity'] = now;
    }

    if (Object.keys(pushOps).length > 0) {
      updateOps.$push = pushOps;
    }

    const result = await UserActivity.updateOne(
      { userId, 'dailyActivities.dateStr': todayStr, 'dailyActivities.sessions.sessionId': sessionId },
      updateOps,
      { arrayFilters }
    );

    if (result.matchedCount === 0) {
      return res.status(200).json({ success: true, message: 'Session or daily activity not found, skipping' });
    }

    return res.status(200).json({ success: true, message: 'Batch tracked' });
  } catch (err) {
    console.error('Track Batch Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getUserActivityList = async (req, res) => {
  try {
    const adminUserId = req.query.user_id || req.headers['x-user-id'];
    
    if (!adminUserId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const adminUser = await User.findOne({ user_id: adminUserId });
    if (!adminUser || adminUser.userType !== 'ADMIN' || !adminUser.isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Super Admin access required' });
    }

    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);

    const activities = await UserActivity.find({})
      .select('userId username lifetimeStats.totalSessions lifetimeStats.totalActiveTime lifetimeStats.totalPageViews lifetimeStats.totalInteractions lifetimeStats.lastSeen currentSession')
      .sort({ 'lifetimeStats.lastSeen': -1 })
      .lean();

    const userList = activities.map(a => {
      const lastHeartbeat = a.currentSession?.lastHeartbeat ? new Date(a.currentSession.lastHeartbeat) : null;
      const isOnline = a.currentSession?.isActive && lastHeartbeat && lastHeartbeat >= thirtySecondsAgo;
      
      return {
        userId: a.userId,
        username: a.username,
        totalSessions: a.lifetimeStats?.totalSessions || 0,
        totalActiveTime: a.lifetimeStats?.totalActiveTime || 0,
        totalPageViews: a.lifetimeStats?.totalPageViews || 0,
        totalInteractions: a.lifetimeStats?.totalInteractions || 0,
        lastSeen: a.lifetimeStats?.lastSeen,
        isOnline,
        currentPage: isOnline ? a.currentSession?.currentPage : null,
      };
    });

    return res.status(200).json({
      success: true,
      data: userList,
      total: userList.length,
    });
  } catch (err) {
    console.error('Get User Activity List Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getUserActivityDetail = async (req, res) => {
  try {
    const adminUserId = req.query.admin_user_id || req.headers['x-user-id'];
    const targetUserId = req.params.userId;
    const { date, startDate, endDate, viewType = 'today' } = req.query;
    
    if (!adminUserId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const adminUser = await User.findOne({ user_id: adminUserId });
    if (!adminUser || adminUser.userType !== 'ADMIN' || !adminUser.isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Super Admin access required' });
    }

    const userActivity = await UserActivity.findOne({ userId: targetUserId }).lean();
    if (!userActivity) {
      return res.status(404).json({ success: false, message: 'User activity not found' });
    }

    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    let rangeStart, rangeEnd;

    switch (viewType) {
      case 'yesterday':
        rangeStart = new Date(nowIST);
        rangeStart.setDate(rangeStart.getDate() - 1);
        rangeEnd = new Date(rangeStart);
        break;
      case 'week':
        rangeStart = new Date(nowIST);
        rangeStart.setDate(rangeStart.getDate() - 7);
        rangeEnd = new Date(nowIST);
        break;
      case 'month':
        rangeStart = new Date(nowIST);
        rangeStart.setDate(rangeStart.getDate() - 30);
        rangeEnd = new Date(nowIST);
        break;
      case 'custom':
        if (startDate && endDate) {
          rangeStart = new Date(startDate);
          rangeEnd = new Date(endDate);
        } else {
          rangeStart = new Date(nowIST);
          rangeEnd = new Date(nowIST);
        }
        break;
      case 'today':
      default:
        rangeStart = new Date(nowIST);
        rangeEnd = new Date(nowIST);
        break;
    }

    const rangeStartStr = rangeStart.toISOString().split('T')[0];
    const rangeEndStr = rangeEnd.toISOString().split('T')[0];

    const filteredDays = userActivity.dailyActivities.filter(d => {
      return d.dateStr >= rangeStartStr && d.dateStr <= rangeEndStr;
    });

    let totalSessions = 0;
    let totalActiveTime = 0;
    let totalPageViews = 0;
    let totalInteractions = 0;
    const pageStats = {};
    const sessionDetails = [];
    let firstActivity = null;
    let lastActivity = null;

    for (const day of filteredDays) {
      totalSessions += day.totalSessions || 0;
      totalActiveTime += day.totalActiveTime || 0;
      totalPageViews += day.totalPageViews || 0;
      totalInteractions += day.totalInteractions || 0;

      if (day.firstActivity && (!firstActivity || new Date(day.firstActivity) < new Date(firstActivity))) {
        firstActivity = day.firstActivity;
      }
      if (day.lastActivity && (!lastActivity || new Date(day.lastActivity) > new Date(lastActivity))) {
        lastActivity = day.lastActivity;
      }

      for (const [path, stats] of Object.entries(day.pageStats || {})) {
        if (!pageStats[path]) {
          pageStats[path] = { views: 0, totalTime: 0 };
        }
        pageStats[path].views += stats.views || 0;
        pageStats[path].totalTime += stats.totalTime || 0;
      }

      for (const session of day.sessions || []) {
        sessionDetails.push({
          date: formatDateIST(day.date),
          sessionId: session.sessionId,
          startTime: session.startTime,
          endTime: session.endTime,
          duration: session.duration || 0,
          deviceInfo: session.deviceInfo,
          totalPageViews: session.totalPageViews || 0,
          totalInteractions: session.totalInteractions || 0,
          pageViews: session.pageViews || [],
          interactions: session.interactions || [],
          isActive: session.isActive || false,
        });
      }
    }

    const sortedPageStats = Object.entries(pageStats)
      .map(([path, stats]) => ({ path, ...stats }))
      .sort((a, b) => b.totalTime - a.totalTime);

    return res.status(200).json({
      success: true,
      data: {
        userId: userActivity.userId,
        username: userActivity.username,
        viewType,
        startDate: formatDateIST(rangeStart),
        endDate: formatDateIST(rangeEnd),
        currentSession: userActivity.currentSession,
        lifetimeStats: userActivity.lifetimeStats,
        periodStats: {
          totalSessions,
          totalActiveTime,
          totalPageViews,
          totalInteractions,
          firstActivity,
          lastActivity,
        },
        pageStats: sortedPageStats,
        sessions: sessionDetails.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)),
        dailyBreakdown: filteredDays.map(d => ({
          date: formatDateIST(d.date),
          dateStr: d.dateStr,
          totalSessions: d.totalSessions,
          totalActiveTime: d.totalActiveTime,
          totalPageViews: d.totalPageViews,
          totalInteractions: d.totalInteractions,
          firstActivity: d.firstActivity,
          lastActivity: d.lastActivity,
        })),
      },
    });
  } catch (err) {
    console.error('Get User Activity Detail Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getOnlineUsers = async (req, res) => {
  try {
    const adminUserId = req.query.user_id || req.headers['x-user-id'];
    
    if (!adminUserId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const adminUser = await User.findOne({ user_id: adminUserId });
    if (!adminUser || adminUser.userType !== 'ADMIN' || !adminUser.isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Super Admin access required' });
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const onlineUsers = await UserActivity.find({
      'currentSession.isActive': true,
      'currentSession.lastHeartbeat': { $gte: fiveMinutesAgo },
    })
      .select('userId username currentSession')
      .lean();

    return res.status(200).json({
      success: true,
      data: onlineUsers.map(u => ({
        userId: u.userId,
        username: u.username,
        currentPage: u.currentSession?.currentPage,
        sessionStart: u.currentSession?.startTime,
        lastHeartbeat: u.currentSession?.lastHeartbeat,
      })),
      count: onlineUsers.length,
    });
  } catch (err) {
    console.error('Get Online Users Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  startSession,
  endSession,
  heartbeat,
  trackPageView,
  trackInteraction,
  trackBatch,
  getUserActivityList,
  getUserActivityDetail,
  getOnlineUsers,
};
