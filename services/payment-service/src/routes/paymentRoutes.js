// payment-service/src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authMiddleware, studentMiddleware, instructorMiddleware, adminMiddleware } = require('../middleware/auth');

router.post('/create-intent', authMiddleware, studentMiddleware, paymentController.createStudentPayment);
router.post('/confirm', authMiddleware, paymentController.confirmPayment);
router.post('/refund', authMiddleware, paymentController.refundPayment);
router.post('/instructor/fee', authMiddleware, instructorMiddleware, paymentController.createInstructorFee);
router.get('/history', authMiddleware, paymentController.getPaymentHistory);
router.get('/stats', authMiddleware, adminMiddleware, paymentController.getPaymentsStats);
router.get('/:paymentId', authMiddleware, paymentController.getPaymentById);

module.exports = router;