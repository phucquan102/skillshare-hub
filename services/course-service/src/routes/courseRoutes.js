const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authMiddleware, instructorMiddleware, studentMiddleware } = require('../middleware/auth');

// Debug logging
router.use((req, res, next) => {
  console.log(`📚 CourseRoutes: ${req.method} ${req.path}`);
  next();
});


// Instructor-specific routes
router.get('/instructor/:courseId', authMiddleware, instructorMiddleware, courseController.getCourseById);
router.get('/my', authMiddleware, instructorMiddleware, courseController.getMyCourses);

// Public and general course routes
router.get('/', courseController.getCourses);
router.get('/:courseId', courseController.getCourseById);

// CRUD for instructors
router.post('/', authMiddleware, instructorMiddleware, courseController.createCourse);
router.put('/:courseId', authMiddleware, instructorMiddleware, courseController.updateCourse);
router.patch('/:courseId', authMiddleware, instructorMiddleware, courseController.editCourse);
router.delete('/:courseId', authMiddleware, instructorMiddleware, courseController.deleteCourse);
router.patch('/:courseId/status', authMiddleware, instructorMiddleware, courseController.updateCourseStatus);

// Lesson routes
router.post('/:courseId/lessons', authMiddleware, instructorMiddleware, courseController.createLesson);
router.put('/lessons/:lessonId', authMiddleware, instructorMiddleware, courseController.updateLesson);
router.delete('/lessons/:lessonId', authMiddleware, instructorMiddleware, courseController.deleteLesson);
router.get('/lessons/:lessonId', authMiddleware, courseController.getLessonById);
router.get('/:courseId/lessons', authMiddleware, courseController.getLessonsByCourse);

module.exports = router;
