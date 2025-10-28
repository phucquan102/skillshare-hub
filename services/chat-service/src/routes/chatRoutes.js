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

// ========================
// 📨 CONVERSATION ROUTES
// ========================
router.get('/conversations', chatController.getConversations);
router.post('/conversations', chatController.createConversation);

// ========================
// 🎓 COURSE-SPECIFIC ROUTES
// ========================
// Get instructors for a course
router.get('/courses/:courseId/instructors', chatController.getCourseInstructors);

// Create/get course group conversation
router.post('/courses/conversation/create', chatController.createCourseConversation);

// Get all conversations for a course
router.get('/courses/:courseId/conversations', chatController.getCourseConversations);

// Create 1-1 conversation with instructor
router.post('/courses/instructor/conversation', chatController.createInstructorConversation);

// ========================
// 💌 MESSAGE ROUTES
// ========================
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.post('/messages', messageLimiter, chatController.sendMessage);
router.post('/conversations/:conversationId/read', chatController.markAsRead);

module.exports = router;