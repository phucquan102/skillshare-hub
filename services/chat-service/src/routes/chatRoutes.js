const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for messages
const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 messages per minute
  message: 'Too many messages, please try again later'
});

// All routes require authentication
router.use(auth);

// Conversation routes
router.get('/conversations', chatController.getConversations);
router.post('/conversations', chatController.createConversation);

// Message routes
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.post('/messages', messageLimiter, chatController.sendMessage);
router.post('/conversations/:conversationId/read', chatController.markAsRead);

module.exports = router;