const express = require('express');
const router = express.Router();
const jitsiService = require('../services/jitsiService');
const { authMiddleware } = require('../middleware/auth');

// 📌 Tạo phòng họp cho một buổi học
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { courseId, lessonId, subject, userInfo, isModerator } = req.body;
    const roomName = jitsiService.generateRoomName(courseId, lessonId);

    const meeting = await jitsiService.createMeeting({
      roomName,
      subject,
      userInfo,
      isModerator,
      lessonId
    });

    res.json(meeting);
  } catch (error) {
    console.error('❌ /jitsi/create error:', error);
    res.status(500).json({ message: error.message });
  }
});

// 📡 Kiểm tra trạng thái phòng
router.get('/status/:roomName', async (req, res) => {
  try {
    const { roomName } = req.params;
    const status = await jitsiService.checkMeetingStatus(roomName);
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🔚 Kết thúc meeting
router.post('/end', authMiddleware, async (req, res) => {
  try {
    const { lessonId } = req.body;
    const result = await jitsiService.endMeeting({ lessonId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
