// course-service/src/routes/enrollmentRoutes.js
const express = require('express');
const router = express.Router();

// Import đúng tên từ middleware
const { authMiddleware, instructorMiddleware, adminMiddleware } = require('../middleware/auth');
const enrollmentController = require('../controllers/enrollmentController');

// Debug chi tiết hơn
console.log('✅ Enrollment Routes loaded successfully');
console.log('🔑 Auth Middleware:', typeof authMiddleware);
console.log('👨‍🏫 Instructor Middleware:', typeof instructorMiddleware);
console.log('🛠️ Enrollment Controller methods:', Object.keys(enrollmentController));

// Student routes - sử dụng authMiddleware thay vì authenticate
router.post('/', authMiddleware, enrollmentController.createEnrollment);
router.post('/purchase-lesson', authMiddleware, enrollmentController.purchaseLesson);
router.get('/my-enrollments', authMiddleware, enrollmentController.getMyEnrollments);
router.get('/course/:courseId', authMiddleware, enrollmentController.getEnrollmentByCourse);
router.get('/progress/:enrollmentId', authMiddleware, enrollmentController.getEnrollmentProgress);
router.get('/check-access/:lessonId', authMiddleware, enrollmentController.checkLessonAccess);
router.patch('/complete-lesson/:lessonId', authMiddleware, enrollmentController.markLessonCompleted);
router.patch('/:enrollmentId/status', authMiddleware, enrollmentController.updateEnrollmentStatus);
router.delete('/:id', authMiddleware, enrollmentController.deleteEnrollment);

router.get('/public/check', enrollmentController.checkEnrollment);

// Instructor routes - sử dụng authMiddleware và instructorMiddleware
router.get('/course/:courseId/enrollments', authMiddleware, instructorMiddleware, enrollmentController.getCourseEnrollments);


// Thêm routes mới cho hoàn thành khóa học
router.post('/:enrollmentId/complete', authMiddleware, instructorMiddleware, enrollmentController.completeCourseForStudent);
router.post('/cron/auto-complete', enrollmentController.autoCompleteExpiredCourses); // Cho cron job



router.get('/progress-details/:enrollmentId', authMiddleware, enrollmentController.getProgressDetails);
router.post('/purchase-dated-lesson/:courseId/:scheduleId', authMiddleware, enrollmentController.purchaseDatedLesson);

console.log('✅ All enrollment routes registered successfully');

module.exports = router;