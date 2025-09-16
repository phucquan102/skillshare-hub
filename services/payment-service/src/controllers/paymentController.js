// payment-service/src/controllers/paymentController.js
const Payment = require('../models/Payment');
const axios = require('axios');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const paymentController = {
  // Student thanh toán khóa học hoặc lesson
 createStudentPayment: async (req, res) => {
    try {
      const { courseId, lessonId, amount, paymentMethod } = req.body;

      if (!courseId && !lessonId) {
        return res.status(400).json({ message: 'Phải cung cấp courseId hoặc lessonId' });
      }

      const courseServiceUrl = process.env.COURSE_SERVICE_URL || 'http://course-service:3002';
      let course, lesson;
      try {
        const response = await axios.get(`${courseServiceUrl}/courses/${courseId}`, {
          headers: { Authorization: req.header('Authorization') }
        });
        course = response.data.course;
        if (lessonId) {
          lesson = await axios.get(`${courseServiceUrl}/lessons/${lessonId}`, {
            headers: { Authorization: req.header('Authorization') }
          });
          lesson = lesson.data.lesson;
        }
      } catch (error) {
        return res.status(400).json({ message: 'Không tìm thấy khóa học hoặc bài học' });
      }

      if (lessonId && !lesson) {
        return res.status(400).json({ message: 'Không tìm thấy bài học' });
      }

      const adminFeePercent = 0.15;
      const adminShare = amount * adminFeePercent;
      const instructorShare = amount - adminShare;

      const transactionId = `tx_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      const payment = new Payment({
        userId: req.userId,
        courseId,
        lessonId,
        amount,
        currency: 'VND',
        paymentMethod,
        paymentStatus: 'completed',
        type: lessonId ? 'lesson_payment' : 'course_payment',
        transactionId,
        adminShare,
        instructorShare
      });

      await payment.save();

      if (!lessonId) {
        await axios.post(`${courseServiceUrl}/enrollments`, {
          courseId,
          paymentId: payment._id
        }, {
          headers: { Authorization: req.header('Authorization') }
        });
      }

      res.json({ message: 'Thanh toán thành công', payment });
    } catch (error) {
      console.error('Create student payment error:', error);
      res.status(500).json({ message: 'Lỗi thanh toán', error: error.message });
    }
  },
  // Instructor thanh toán phí đăng khóa
  createInstructorFee: async (req, res) => {
    try {
      const { courseId, paymentMethod } = req.body;
      const fee = 100000; // Phí cố định 100k VND

      // Kiểm tra khóa học
      const courseServiceUrl = process.env.COURSE_SERVICE_URL || 'http://course-service:3002';
      try {
        await axios.get(`${courseServiceUrl}/courses/${courseId}`, {
          headers: { Authorization: req.header('Authorization') }
        });
      } catch (error) {
        return res.status(400).json({ message: 'Không tìm thấy khóa học' });
      }

      // Tạo payment intent (placeholder)
      const transactionId = `fee_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      /* Với Stripe:
      const paymentIntent = await stripe.paymentIntents.create({
        amount: fee * 100,
        currency: 'vnd',
        payment_method: paymentMethod,
        confirm: true
      });
      transactionId = paymentIntent.id;
      */

      const payment = new Payment({
        userId: req.userId,
        courseId,
        amount: fee,
        currency: 'VND',
        paymentMethod,
        paymentStatus: 'completed',
        type: 'instructor_fee',
        transactionId,
        adminShare: fee,
        instructorShare: 0
      });

      await payment.save();

      res.json({ message: 'Thanh toán phí đăng khóa thành công', payment });
    } catch (error) {
      console.error('Create instructor fee error:', error);
      res.status(500).json({ message: 'Lỗi thanh toán phí', error: error.message });
    }
  },

  // Lịch sử thanh toán của user
  getPaymentHistory: async (req, res) => {
    try {
      const payments = await Payment.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .lean();

      res.json({ payments, message: 'Lấy lịch sử thanh toán thành công' });
    } catch (error) {
      console.error('Get payment history error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  // Thống kê thanh toán (cho admin)
  getPaymentsStats: async (req, res) => {
    try {
      const stats = await Payment.aggregate([
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
            totalAdminShare: { $sum: '$adminShare' },
            totalInstructorShare: { $sum: '$instructorShare' },
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({ stats, message: 'Thống kê thanh toán' });
    } catch (error) {
      console.error('Get payments stats error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  }
};

module.exports = paymentController;