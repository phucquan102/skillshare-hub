const express = require('express');
const router = express.Router();
const courseChatController = require('../controllers/courseChatController');
const auth = require('../middleware/auth');

// Tất cả routes đều cần authentication
router.use(auth);

// Course chat routes - SỬA LẠI PATH Ở ĐÂY
router.get('/:courseId/instructors', courseChatController.getCourseInstructors);
router.get('/:courseId/conversations', courseChatController.getCourseConversations);
router.post('/:courseId/conversation', courseChatController.createCourseConversation);
router.post('/:courseId/instructors/:instructorId/conversation', courseChatController.createInstructorConversation);

module.exports = router;