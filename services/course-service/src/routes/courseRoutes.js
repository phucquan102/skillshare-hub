const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authMiddleware, instructorMiddleware, studentMiddleware } = require('../middleware/auth');

// Debug logging
router.use((req, res, next) => {
  console.log(`📚 CourseRoutes: ${req.method} ${req.path}`);
  next();
});

// ========== PUBLIC ROUTES ==========
router.get('/', courseController.getCourses);

// ========== INSTRUCTOR ROUTES ==========
// Đặt route '/my' trước route '/:courseId'
router.get('/my', authMiddleware, instructorMiddleware, courseController.getMyCourses);
router.get('/instructor/:courseId', authMiddleware, instructorMiddleware, courseController.getCourseById);

// Course CRUD
router.post('/', authMiddleware, instructorMiddleware, courseController.createCourse);
router.put('/:courseId', authMiddleware, instructorMiddleware, courseController.updateCourse);
router.patch('/:courseId', authMiddleware, instructorMiddleware, courseController.editCourse);
router.delete('/:courseId', authMiddleware, instructorMiddleware, courseController.deleteCourse);
router.patch('/:courseId/status', authMiddleware, instructorMiddleware, courseController.updateCourseStatus);
router.get('/:courseId/schedules/available-by-type', 
  authMiddleware, 
  courseController.getAvailableSchedulesByType
);

// Lesson CRUD
router.post('/:courseId/lessons', authMiddleware, instructorMiddleware, courseController.createLesson);
router.put('/lessons/:lessonId', authMiddleware, instructorMiddleware, courseController.updateLesson);
router.delete('/lessons/:lessonId', authMiddleware, instructorMiddleware, courseController.deleteLesson);
router.get('/lessons/:lessonId', authMiddleware, courseController.getLessonById);
router.get('/:courseId/lessons', authMiddleware, courseController.getLessonsByCourse);
 
router.get('/lessons/:lessonId/detailed', authMiddleware, courseController.getLessonById);
// 🆕 THÊM ROUTES MỚI CHO LESSON DETAIL
router.get('/lessons/:lessonId/preview', authMiddleware, courseController.getLessonPreview);
router.get('/lessons/:lessonId/access', authMiddleware, courseController.checkLessonAccess);
router.get('/lessons/:lessonId/contents', authMiddleware, courseController.getLessonContents);
router.get('/lessons/:lessonId/preview', courseController.getLessonPreview);
// Lesson Meeting
router.post('/lessons/:lessonId/meeting/start', authMiddleware, instructorMiddleware, courseController.startLessonMeeting);
router.get('/lessons/:lessonId/meeting/join', authMiddleware, courseController.joinLessonMeeting);
router.post('/lessons/:lessonId/meeting/end', authMiddleware, instructorMiddleware, courseController.endLessonMeeting);

// ========== 🆕 NEW ROUTES - LESSON CONTENT & RESOURCES ==========
router.post('/lessons/:lessonId/content', authMiddleware, instructorMiddleware, courseController.addLessonContent);
router.delete('/lessons/:lessonId/content/:contentIndex', authMiddleware, instructorMiddleware, courseController.removeLessonContent);
router.post('/lessons/:lessonId/resources', authMiddleware, instructorMiddleware, courseController.addLessonResource);
router.delete('/lessons/:lessonId/resources/:resourceIndex', authMiddleware, instructorMiddleware, courseController.removeLessonResource);

// ========== 🆕 NEW ROUTES - COURSE IMAGE MANAGEMENT ==========
router.post('/:courseId/upload-image', authMiddleware, instructorMiddleware, courseController.uploadCourseImage);
router.post('/:courseId/gallery', authMiddleware, instructorMiddleware, courseController.addGalleryImage);
router.delete('/:courseId/gallery/:imageIndex', authMiddleware, instructorMiddleware, courseController.removeGalleryImage);

// ========== 🆕 NEW ROUTES - COURSE SCHEDULE MANAGEMENT ==========
router.post('/:courseId/schedules', authMiddleware, instructorMiddleware, courseController.addCourseSchedule);
router.put('/:courseId/schedules/:scheduleIndex', authMiddleware, instructorMiddleware, courseController.updateCourseSchedule);
router.delete('/:courseId/schedules/:scheduleIndex', authMiddleware, instructorMiddleware, courseController.removeCourseSchedule);

// ========== 🆕 NEW ROUTES - ANALYTICS & STATISTICS ==========
router.get('/:courseId/lessons/stats', authMiddleware, instructorMiddleware, courseController.getLessonStats);
router.get('/:courseId/stats', authMiddleware, instructorMiddleware, courseController.getCourseStats);
router.get('/:courseId/history', authMiddleware, instructorMiddleware, courseController.getCourseEditHistory);

// ========== PUBLIC ROUTE - GET COURSE BY ID (phải đặt sau các route cụ thể) ==========
router.get('/:courseId', courseController.getCourseById);

module.exports = router;