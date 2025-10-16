// services/course-service/src/routes/studentRoutes.js
const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../middleware/auth');
const studentController = require('../controllers/studentController');

console.log('✅ Student Routes loaded successfully');

// Student courses and progress routes
router.get('/my-courses', authMiddleware, studentController.getMyCourses);
router.get('/courses/:courseId/progress', authMiddleware, studentController.getCourseProgress);
router.get('/lessons/:lessonId', authMiddleware, studentController.getLessonDetails);
router.get('/upcoming-lessons', authMiddleware, studentController.getUpcomingLessons);
router.get('/statistics', authMiddleware, studentController.getLearningStatistics);

console.log('✅ All student routes registered successfully');

module.exports = router;