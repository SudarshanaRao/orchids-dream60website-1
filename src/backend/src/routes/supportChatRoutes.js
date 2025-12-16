const express = require('express');
const { startChat, addMessage, getChat } = require('../controllers/supportChatController');

const router = express.Router();

router.post('/start', startChat);
router.post('/:threadId/message', addMessage);
router.get('/:threadId', getChat);

module.exports = router;
