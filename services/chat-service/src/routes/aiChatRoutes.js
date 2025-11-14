const express = require('express');
const router = express.Router();
const simpleAIChatController = require('../controllers/simpleAIChatController');
const auth = require('../middleware/auth');

//  Chat chính với AI (cần token)
router.post('/ai/chat', auth, simpleAIChatController.chatWithAI);

//  Quick search (public)
router.get('/ai/search', simpleAIChatController.quickRecommend);

//  Khởi tạo conversation (public)
router.get('/ai/conversation/init', simpleAIChatController.initConversation);

//  Refresh cache (cần token)
router.post('/ai/refresh-cache', auth, simpleAIChatController.refreshCourseCache);

module.exports = router;
