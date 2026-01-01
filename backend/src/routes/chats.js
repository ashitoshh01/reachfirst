const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', chatController.createOrGetChat);
router.get('/', chatController.getUserChats);
router.get('/:chatId/messages', chatController.getChatMessages);
router.post('/:chatId/messages', authMiddleware, chatController.sendMessage);
router.put('/messages/:messageId/read', authMiddleware, chatController.markAsRead);
router.get('/:chatId/media', authMiddleware, chatController.getChatMedia);

module.exports = router;
