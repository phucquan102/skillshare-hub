// course-service/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/courses/pending', authMiddleware, adminMiddleware, courseController.getPendingCourses);
router.put('/courses/:courseId/approve', authMiddleware, adminMiddleware, courseController.approveCourse);
router.put('/courses/:courseId/reject', authMiddleware, adminMiddleware, courseController.rejectCourse);

module.exports = router;