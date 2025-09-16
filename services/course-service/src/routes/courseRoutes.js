// course-service/src/routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authMiddleware, instructorMiddleware } = require('../middleware/auth');

router.get('/', courseController.getCourses);
router.get('/my/courses', authMiddleware, instructorMiddleware, courseController.getMyCourses);
router.get('/:courseId', courseController.getCourseById);
router.post('/', authMiddleware, instructorMiddleware, courseController.createCourse);
router.put('/:courseId', authMiddleware, instructorMiddleware, courseController.updateCourse);
router.delete('/:courseId', authMiddleware, instructorMiddleware, courseController.deleteCourse);
router.patch('/:courseId/status', authMiddleware, instructorMiddleware, courseController.updateCourseStatus);
router.post('/:courseId/lessons', authMiddleware, instructorMiddleware, courseController.createLesson);
router.put('/lessons/:lessonId', authMiddleware, instructorMiddleware, courseController.updateLesson);
router.delete('/lessons/:lessonId', authMiddleware, instructorMiddleware, courseController.deleteLesson);
router.get('/lessons/:lessonId', authMiddleware, courseController.getLessonById);
router.get('/:courseId/lessons', authMiddleware, courseController.getLessonsByCourse);

module.exports = router;