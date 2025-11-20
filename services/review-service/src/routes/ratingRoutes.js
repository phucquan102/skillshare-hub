// services/review-service/src/routes/ratingRoutes.js
const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');

// Public routes - không cần auth
router.get('/course/:courseId', ratingController.getCourseRating);
router.get('/top-rated', ratingController.getTopRatedCourses);
router.get('/stats/:courseId', ratingController.getRatingStats);
router.post('/multiple', ratingController.getMultipleCourseRatings);

module.exports = router;