const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { authMiddleware, studentMiddleware } = require('../middleware/auth');

// Debug logging
router.use((req, res, next) => {
  console.log(`🎯 EnrollmentRoutes: ${req.method} ${req.path}`);
  next();
});

// Enrollment routes
router.post('/', authMiddleware, enrollmentController.createEnrollment);
router.get('/my-enrollments', authMiddleware, studentMiddleware, enrollmentController.getMyEnrollments);
router.delete('/:id', authMiddleware, studentMiddleware, enrollmentController.deleteEnrollment);
module.exports = router;