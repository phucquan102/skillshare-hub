// routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authMiddleware, instructorMiddleware } = require('../middleware/auth');

// Public routes - NO authentication needed
router.get('/', courseController.getCourses);

// Protected routes - Authentication required
// IMPORTANT: Specific routes MUST come before parameterized routes
router.get('/my/courses', authMiddleware, instructorMiddleware, courseController.getMyCourses);

// Parameterized routes
router.get('/:courseId', courseController.getCourseById);
router.post('/', authMiddleware, instructorMiddleware, courseController.createCourse);
router.put('/:courseId', authMiddleware, instructorMiddleware, courseController.updateCourse);
router.delete('/:courseId', authMiddleware, instructorMiddleware, courseController.deleteCourse);
router.patch('/:courseId/status', authMiddleware, instructorMiddleware, courseController.updateCourseStatus);

module.exports = router;