// services/review-service/src/routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { auth, instructorAuth } = require('../middleware/auth');

// Public routes
router.get('/course/:courseId', reviewController.getCourseReviews);

// Protected routes - require authentication
router.post('/', auth, reviewController.createReview);
router.get('/my-reviews', auth, reviewController.getUserReviews);
router.put('/:reviewId', auth, reviewController.updateReview);
router.delete('/:reviewId', auth, reviewController.deleteReview);
router.post('/:reviewId/helpful', auth, reviewController.markHelpful);
router.post('/:reviewId/reply', auth, reviewController.replyToReview);

module.exports = router;