// routes/jitsiRoutes.js
const express = require('express');
const router = express.Router();
const JitsiService = require('../services/jitsiService');

// ✅ Sửa path - kiểm tra xem authMiddleware ở đâu trong project của bạn
// Nếu không tìm thấy, hãy dùng path đúng, ví dụ:
let verifyToken;
try {
  verifyToken = require('../middleware/authMiddleware').verifyToken;
} catch (e) {
  try {
    verifyToken = require('../middlewares/auth').verifyToken;
  } catch (e2) {
    try {
      verifyToken = require('../middlewares/authMiddleware').verifyToken;
    } catch (e3) {
      // Fallback: middleware đơn giản
      console.warn('⚠️ Could not find authMiddleware, using fallback');
      verifyToken = (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          return res.status(401).json({ success: false, message: 'No token' });
        }
        // Decode token để lấy userId (tùy theo cách bạn encode)
        try {
          const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64'));
          req.user = {
            userId: decoded.userId || decoded.id,
            role: decoded.role || 'student'
          };
          next();
        } catch (err) {
          res.status(401).json({ success: false, message: 'Invalid token' });
        }
      };
    }
  }
}

/**
 * 🎯 POST /jitsi/join
 * Người dùng join meeting
 */
router.post('/join', verifyToken, async (req, res) => {
  try {
    const { lessonId, userInfo, userId } = req.body;
    const authUserId = req.user.userId;

    console.log("🎯 [POST /jitsi/join] Starting");
    console.log("   - LessonId:", lessonId);
    console.log("   - UserId:", userId || authUserId);
    console.log("   - Auth UserId:", authUserId);

    // ✅ Bảo mật: Kiểm tra userId match
    if (userId && userId !== authUserId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: User ID mismatch'
      });
    }

    const finalUserId = userId || authUserId;

    // Tạo room name
    const roomName = JitsiService.generateRoomName(
      req.body.courseId || 'unknown',
      lessonId
    );

    console.log("   - RoomName:", roomName);

    // 🆕 QUAN TRỌNG: Gọi JitsiService.createMeeting()
    const meeting = await JitsiService.createMeeting({
      roomName: roomName,
      subject: userInfo?.displayName || 'Meeting',
      userInfo: {
        id: finalUserId,
        email: userInfo?.email || 'unknown@example.com',
        displayName: userInfo?.displayName || 'Anonymous',
        avatar: userInfo?.avatar || ''
      },
      isModerator: false, // Student join là false
      lessonId: lessonId,
      userId: finalUserId
    });

    console.log("✅ Meeting created successfully");
    console.log("   - Participants:", meeting.currentParticipants);
    console.log("   - Max:", meeting.maxParticipants);

    return res.status(200).json({
      success: true,
      meeting: meeting,
      accessInfo: {
        hasAccess: true,
        accessType: meeting.enrollmentInfo.accessType
      }
    });

  } catch (error) {
    console.error('❌ Error in POST /jitsi/join:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to join meeting'
    });
  }
});

/**
 * 🚪 POST /jitsi/leave
 * Người dùng rời meeting
 */
router.post('/leave', verifyToken, async (req, res) => {
  try {
    const { participantId, lessonId } = req.body;

    console.log("🚪 [POST /jitsi/leave] Starting");
    console.log("   - ParticipantId:", participantId);
    console.log("   - LessonId:", lessonId);

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: 'Missing participantId'
      });
    }

    const result = await JitsiService.removeParticipant(participantId, 'user_left');

    if (result) {
      console.log("✅ Participant removed successfully");
    }

    return res.status(200).json({
      success: true,
      message: 'Left meeting successfully',
      participant: result
    });

  } catch (error) {
    console.error('❌ Error in POST /jitsi/leave:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to leave meeting'
    });
  }
});

/**
 * 🔍 GET /jitsi/status/:roomName
 * Kiểm tra trạng thái meeting
 */
router.get('/status/:roomName', verifyToken, async (req, res) => {
  try {
    const { roomName } = req.params;
    const userId = req.user.userId;

    console.log("🔍 [GET /jitsi/status] Checking:", roomName);

    const status = await JitsiService.checkMeetingStatus(roomName, userId);

    return res.status(200).json({
      success: true,
      status: status
    });

  } catch (error) {
    console.error('❌ Error in GET /jitsi/status:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to check status'
    });
  }
});

/**
 * ✅ GET /jitsi/check-access/:lessonId
 * Kiểm tra quyền trước khi join
 */
router.get('/check-access/:lessonId', verifyToken, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.userId;

    console.log("✅ [GET /jitsi/check-access] Checking access for lesson:", lessonId);

    const accessInfo = await JitsiService.checkLessonAccess(userId, lessonId);

    if (!accessInfo.hasAccess) {
      return res.status(403).json({
        success: false,
        hasAccess: false,
        accessType: accessInfo.accessType,
        message: accessInfo.message || 'You do not have access to this lesson'
      });
    }

    return res.status(200).json({
      success: true,
      hasAccess: true,
      accessType: accessInfo.accessType,
      lesson: accessInfo.lesson,
      message: 'Access granted'
    });

  } catch (error) {
    console.error('❌ Error in GET /jitsi/check-access:', error.message);
    return res.status(400).json({
      success: false,
      hasAccess: false,
      message: error.message || 'Error checking access'
    });
  }
});

/**
 * 🔚 POST /jitsi/end-meeting/:lessonId
 * Kết thúc meeting (chỉ teacher)
 */
router.post('/end-meeting/:lessonId', verifyToken, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userRole = req.user.role;

    console.log("🔚 [POST /jitsi/end-meeting] Ending meeting for lesson:", lessonId);
    console.log("   - User role:", userRole);

    // ✅ Chỉ teacher mới có thể end meeting
    if (userRole !== 'teacher' && userRole !== 'instructor') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can end meetings'
      });
    }

    const result = await JitsiService.endMeeting({ lessonId });

    console.log("✅ Meeting ended successfully");

    return res.status(200).json({
      success: true,
      message: 'Meeting ended successfully',
      result: result
    });

  } catch (error) {
    console.error('❌ Error in POST /jitsi/end-meeting:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to end meeting'
    });
  }
});

/**
 * 🧹 POST /jitsi/cleanup/:lessonId
 * Dọn dẹp inactive participants
 */
router.post('/cleanup/:lessonId', verifyToken, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userRole = req.user.role;

    console.log("🧹 [POST /jitsi/cleanup] Cleaning up for lesson:", lessonId);

    if (userRole !== 'teacher' && userRole !== 'instructor' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await JitsiService.cleanupInactiveParticipants(lessonId);

    return res.status(200).json({
      success: true,
      message: 'Cleanup completed',
      cleaned: result.modifiedCount
    });

  } catch (error) {
    console.error('❌ Error in POST /jitsi/cleanup:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to cleanup'
    });
  }
});

module.exports = router;