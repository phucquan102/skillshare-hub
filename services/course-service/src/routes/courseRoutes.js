const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const enrollmentController = require('../controllers/enrollmentController'); // Import enrollmentController
const { authMiddleware, instructorMiddleware, studentMiddleware } = require('../middleware/auth'); // Thêm studentMiddleware vào import

// Debug logging
router.use((req, res, next) => {
  console.log(`📚 CourseRoutes: ${req.method} ${req.path}`);
  next();
});
 
// Course routes - base path là '/courses' được mount ở index.js
router.get('/', courseController.getCourses);  // GET /courses
router.get('/my', authMiddleware, instructorMiddleware, courseController.getMyCourses);  // GET /courses/my
router.get('/:courseId', courseController.getCourseById);  // GET /courses/:courseId
router.post('/', authMiddleware, instructorMiddleware, courseController.createCourse);  // POST /courses
router.put('/:courseId', authMiddleware, instructorMiddleware, courseController.updateCourse);
router.delete('/:courseId', authMiddleware, instructorMiddleware, courseController.deleteCourse);
router.patch('/:courseId/status', authMiddleware, instructorMiddleware, courseController.updateCourseStatus);

// Lesson routes
router.post('/:courseId/lessons', authMiddleware, instructorMiddleware, courseController.createLesson);
router.put('/lessons/:lessonId', authMiddleware, instructorMiddleware, courseController.updateLesson);
router.delete('/lessons/:lessonId', authMiddleware, instructorMiddleware, courseController.deleteLesson);
router.get('/lessons/:lessonId', authMiddleware, courseController.getLessonById);
router.get('/:courseId/lessons', authMiddleware, courseController.getLessonsByCourse);

 
module.exports = router;