const express = require('express');
const router = express.Router();
const {
  startSession,
  endSession,
  heartbeat,
  trackPageView,
  trackInteraction,
  trackBatch,
  getUserActivityList,
  getUserActivityDetail,
  getOnlineUsers,
} = require('../controllers/userActivityController');

router.post('/session/start', startSession);
router.post('/session/end', endSession);
router.post('/heartbeat', heartbeat);
router.post('/page-view', trackPageView);
router.post('/interaction', trackInteraction);
router.post('/batch', trackBatch);

router.get('/admin/list', getUserActivityList);
router.get('/admin/user/:userId', getUserActivityDetail);
router.get('/admin/online', getOnlineUsers);

module.exports = router;
