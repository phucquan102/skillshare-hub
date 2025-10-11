// payment-service/src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/auth');

// Webhook endpoint - không dùng auth middleware
router.post('/webhook', 
  express.raw({ type: 'application/json' }), 
  paymentController.handleStripeWebhook
);

// Student routes
router.post('/create-intent', authMiddleware, paymentController.createStudentPayment);
router.post('/confirm', authMiddleware, paymentController.confirmPayment);
router.get('/history', authMiddleware, paymentController.getPaymentHistory);
router.get('/:paymentId', authMiddleware, paymentController.getPaymentById);
router.get('/status/:paymentId', authMiddleware, paymentController.checkPaymentStatus);

// Instructor routes
router.post('/instructor-fee', authMiddleware, paymentController.createInstructorFee);

// Admin routes
router.get('/admin/stats', authMiddleware, paymentController.getPaymentsStats);
router.post('/admin/refund', authMiddleware, paymentController.refundPayment);

module.exports = router;