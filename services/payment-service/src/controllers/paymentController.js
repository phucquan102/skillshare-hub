const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const axios = require('axios');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Helper: Lấy instructorId từ course/lesson (optional - fail gracefully)
 */
const getInstructorIdFromCourse = async (courseId, lessonId) => {
  try {
    const targetId = courseId || lessonId;
    if (!targetId) {
      console.warn('⚠️ No courseId or lessonId provided');
      return null;
    }

    console.log('🔍 Attempting to fetch instructor for:', { courseId, lessonId });

    const baseUrl = process.env.COURSE_SERVICE_URL || 'http://course-service:3002';
    const endpoints = [
      courseId ? `${baseUrl}/courses/${courseId}` : null,
      courseId ? `${baseUrl}/api/courses/${courseId}` : null,
      lessonId ? `${baseUrl}/lessons/${lessonId}` : null,
      lessonId ? `${baseUrl}/api/lessons/${lessonId}` : null,
      `${baseUrl}/courses/public/instructor/${targetId}`
    ].filter(Boolean);

    for (const url of endpoints) {
      try {
        const response = await axios.get(url, {
          headers: {
            'X-Service-Auth': process.env.SERVICE_TOKEN || 'internal-service-call',
            'Content-Type': 'application/json'
          },
          timeout: 3000
        });

        const instructorId = 
          response.data?.instructor || 
          response.data?.instructorId ||
          response.data?.course?.instructor || 
          response.data?.lesson?.instructor;

        if (instructorId) {
          console.log('✅ Found instructor ID:', instructorId);
          return instructorId;
        }
      } catch (err) {
        continue;
      }
    }

    console.warn('⚠️ Could not find instructor ID from any endpoint');
    return null;

  } catch (error) {
    console.warn('⚠️ Error in getInstructorIdFromCourse:', error.message);
    return null;
  }
};

/**
 * Helper: Kiểm tra user đã mua course/lesson này chưa
 */
const checkUserEnrollment = async (userId, courseId, lessonId) => {
  try {
    console.log('🔍 [KIỂM TRA ENROLLMENT]:', { userId, courseId, lessonId });

    const params = new URLSearchParams();
    params.append('userId', userId.toString());
    if (courseId) params.append('courseId', courseId.toString());
    if (lessonId) params.append('lessonId', lessonId.toString());

    const response = await axios.get(
      `${process.env.COURSE_SERVICE_URL || 'http://course-service:3002'}/enrollments/public/check?${params}`,
      {
        headers: {
          'X-Service-Auth': process.env.SERVICE_TOKEN || 'internal-service-call',
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );

    console.log('✅ Enrollment check result:', response.data);

    const { isEnrolled, enrollmentType, hasAccessToRequestedLesson } = response.data;

    if (isEnrolled && enrollmentType === 'full_course') {
      return {
        isEnrolled: true,
        enrollmentType: 'full_course',
        blockPayment: true,
        message: 'Bạn đã mua toàn bộ khóa học này.'
      };
    }

    if (isEnrolled && enrollmentType === 'single_lesson' && lessonId && hasAccessToRequestedLesson) {
      return {
        isEnrolled: true,
        enrollmentType: 'single_lesson',
        blockPayment: true,
        message: 'Bạn đã mua bài học này rồi.'
      };
    }

    return {
      isEnrolled,
      enrollmentType,
      blockPayment: false
    };

  } catch (error) {
    console.warn('⚠️ Could not verify enrollment:', error.message);
    return {
      isEnrolled: false,
      enrollmentType: 'unknown',
      blockPayment: false
    };
  }
};

const paymentController = {
  /**
   * Student thanh toán khóa học - Tạo Stripe Payment Intent
   */
  createStudentPayment: async (req, res) => {
    try {
      const { courseId, lessonId, amount, paymentMethod } = req.body;

      console.log('👉 Payment request received:', {
        courseId,
        lessonId,
        amount,
        paymentMethod,
        userId: req.userId
      });

      if (!courseId && !lessonId) {
        return res.status(400).json({
          success: false,
          message: 'Phải cung cấp courseId hoặc lessonId'
        });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Số tiền thanh toán không hợp lệ'
        });
      }

      // 🔥 Validate amount against Stripe limits
      // Stripe max amount is $999,999.99
      const STRIPE_MAX_AMOUNT = 999999.99;
      const STRIPE_MIN_AMOUNT = 0.50;

      if (amount > STRIPE_MAX_AMOUNT) {
        return res.status(400).json({
          success: false,
          message: `Số tiền thanh toán không được vượt quá ${STRIPE_MAX_AMOUNT}. Vui lòng liên hệ hỗ trợ để xử lý thanh toán lớn.`,
          maxAmount: STRIPE_MAX_AMOUNT,
          requestedAmount: amount
        });
      }

      if (amount < STRIPE_MIN_AMOUNT) {
        return res.status(400).json({
          success: false,
          message: `Số tiền thanh toán phải tối thiểu ${STRIPE_MIN_AMOUNT}`,
          minAmount: STRIPE_MIN_AMOUNT,
          requestedAmount: amount
        });
      }

      // Kiểm tra enrollment
      const enrollmentCheck = await checkUserEnrollment(req.userId, courseId, lessonId);

      if (enrollmentCheck.blockPayment) {
        return res.status(403).json({
          success: false,
          message: enrollmentCheck.message || 'Bạn đã mua khóa học/bài học này rồi.',
          enrollmentType: enrollmentCheck.enrollmentType
        });
      }

      console.log('✅ [PASSED] User is not enrolled, proceeding with payment');

      // Lấy instructor ID (optional)
      let instructorId = await getInstructorIdFromCourse(courseId, lessonId);

      // Tạo Stripe Payment Intent
      let paymentIntent;
      try {
        console.log('💳 Creating Stripe payment intent...');

        const stripeAmount = Math.round(amount * 100);

        paymentIntent = await stripe.paymentIntents.create({
          amount: stripeAmount,
          currency: 'usd',
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            courseId: courseId || '',
            lessonId: lessonId || '',
            userId: req.userId.toString(),
            type: lessonId ? 'lesson_payment' : 'course_payment'
          }
        });

        console.log('✅ Stripe payment intent created:', paymentIntent.id);

      } catch (stripeError) {
        console.error('❌ Stripe error:', stripeError);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi tạo thanh toán Stripe',
          error: stripeError.message
        });
      }

      // Tạo payment record
      const adminFeePercent = 0.15;
      const adminShare = Math.round(amount * adminFeePercent * 100) / 100;
      const instructorShare = Math.round((amount - adminShare) * 100) / 100;

      const payment = new Payment({
        userId: req.userId,
        instructorId: instructorId || null,
        courseId: courseId || null,
        lessonId: lessonId || null,
        amount: amount,
        currency: 'usd',
        paymentMethod: paymentMethod || 'stripe',
        paymentStatus: 'pending',
        type: lessonId ? 'lesson_payment' : 'course_payment',
        transactionId: paymentIntent.id,
        adminShare,
        instructorShare,
        stripePaymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret
      });

      await payment.save();
      console.log('✅ Payment record created:', payment._id);

      res.status(201).json({
        success: true,
        message: 'Payment intent created successfully',
        clientSecret: paymentIntent.client_secret,
        paymentId: payment._id.toString(),
        amount: amount,
        currency: 'usd'
      });

    } catch (error) {
      console.error('💥 Create student payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi tạo thanh toán',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  /**
   * Xác nhận thanh toán thành công
   */
  confirmPayment: async (req, res) => {
    try {
      const { paymentId, paymentIntentId, status } = req.body;

      console.log('✅ Confirm payment request:', { paymentId, paymentIntentId, status });

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thanh toán'
        });
      }

      if (payment.userId.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền xác nhận thanh toán này'
        });
      }

      // Double-check enrollment
      const enrollmentCheck = await checkUserEnrollment(req.userId, payment.courseId, payment.lessonId);

      if (enrollmentCheck.blockPayment) {
        payment.paymentStatus = 'failed';
        payment.failedAt = new Date();
        await payment.save();

        return res.status(403).json({
          success: false,
          message: 'Không thể xác nhận thanh toán vì bạn đã mua khóa học/bài học này.'
        });
      }

      let stripePaymentIntent;
      try {
        stripePaymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        console.log('✅ Stripe payment intent status:', stripePaymentIntent.status);
      } catch (stripeError) {
        console.error('❌ Error retrieving payment intent:', stripeError);
      }

      const finalStatus = status || (stripePaymentIntent?.status === 'succeeded' ? 'completed' : 'pending');

      payment.paymentStatus = finalStatus;
      payment.transactionId = paymentIntentId;
      payment.completedAt = finalStatus === 'completed' ? new Date() : null;

      await payment.save();

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        payment: {
          _id: payment._id,
          status: payment.paymentStatus,
          transactionId: payment.transactionId,
          amount: payment.amount
        }
      });

    } catch (error) {
      console.error('💥 Confirm payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xác nhận thanh toán',
        error: error.message
      });
    }
  },

  /**
   * Lịch sử thanh toán của user
   */
  getPaymentHistory: async (req, res) => {
    try {
      const { page = 1, limit = 10, type, status } = req.query;
      const skip = (page - 1) * limit;

      const query = { userId: req.userId };
      if (type && ['course_payment', 'lesson_payment', 'instructor_fee'].includes(type)) {
        query.type = type;
      }
      if (status && ['pending', 'completed', 'failed', 'refunded'].includes(status)) {
        query.paymentStatus = status;
      }

      const payments = await Payment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v -clientSecret')
        .lean();

      const total = await Payment.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      const totalAmount = await Payment.aggregate([
        { $match: { ...query, paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      res.json({
        success: true,
        payments,
        pagination: {
          current: parseInt(page),
          total: totalPages,
          count: payments.length,
          totalRecords: total
        },
        summary: {
          totalSpent: totalAmount[0]?.total || 0
        },
        message: 'Lấy lịch sử thanh toán thành công'
      });

    } catch (error) {
      console.error('💥 Get payment history error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server',
        error: error.message
      });
    }
  },

  /**
   * Get payment by ID
   */
  getPaymentById: async (req, res) => {
    try {
      const { paymentId } = req.params;

      const payment = await Payment.findById(paymentId).select('-__v').lean();

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thanh toán'
        });
      }

      if (payment.userId.toString() !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền'
        });
      }

      res.json({
        success: true,
        payment,
        message: 'Lấy thông tin thanh toán thành công'
      });

    } catch (error) {
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID thanh toán không hợp lệ'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Lỗi server',
        error: error.message
      });
    }
  },

  /**
   * Check payment status
   */
  checkPaymentStatus: async (req, res) => {
    try {
      const { paymentId } = req.params;

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thanh toán'
        });
      }

      if (payment.userId.toString() !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền'
        });
      }

      let stripePaymentIntent;
      try {
        stripePaymentIntent = await stripe.paymentIntents.retrieve(payment.transactionId);

        if (stripePaymentIntent.status === 'succeeded' && payment.paymentStatus !== 'completed') {
          payment.paymentStatus = 'completed';
          payment.completedAt = new Date();
          await payment.save();
        }
      } catch (stripeError) {
        console.error('❌ Error retrieving payment intent:', stripeError);
      }

      res.json({
        success: true,
        payment: {
          _id: payment._id,
          status: payment.paymentStatus,
          amount: payment.amount,
          createdAt: payment.createdAt
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi kiểm tra trạng thái',
        error: error.message
      });
    }
  },

  /**
   * Instructor tạo phí đăng khóa
   */
  createInstructorFee: async (req, res) => {
    try {
      const { courseId, paymentMethod } = req.body;
      const fee = 10;

      console.log('👉 Instructor fee request:', {
        courseId,
        paymentMethod,
        userId: req.userId
      });

      let paymentIntent;
      try {
        const stripeAmount = Math.round(fee * 100);

        paymentIntent = await stripe.paymentIntents.create({
          amount: stripeAmount,
          currency: 'usd',
          automatic_payment_methods: { enabled: true },
          metadata: {
            courseId: courseId || '',
            userId: req.userId.toString(),
            type: 'instructor_fee'
          }
        });

        console.log('✅ Instructor fee payment intent created:', paymentIntent.id);
      } catch (stripeError) {
        console.error('❌ Stripe error:', stripeError);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi tạo thanh toán',
          error: stripeError.message
        });
      }

      const payment = new Payment({
        userId: req.userId,
        courseId: courseId || null,
        instructorId: req.userId,
        amount: fee,
        currency: 'usd',
        paymentMethod: paymentMethod || 'stripe',
        paymentStatus: 'pending',
        type: 'instructor_fee',
        transactionId: paymentIntent.id,
        stripePaymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        adminShare: fee,
        instructorShare: 0
      });

      await payment.save();

      res.status(201).json({
        success: true,
        message: 'Payment intent created',
        clientSecret: paymentIntent.client_secret,
        paymentId: payment._id.toString(),
        amount: fee,
        currency: 'usd'
      });

    } catch (error) {
      console.error('💥 Instructor fee error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống',
        error: error.message
      });
    }
  },

  /**
   * Get instructor earnings
   */
  getInstructorEarnings: async (req, res) => {
    try {
      const instructorId = req.userId;
      console.log('💰 Fetching earnings for instructor:', instructorId);

      const totalEarningsResult = await Payment.aggregate([
        {
          $match: {
            instructorId: new mongoose.Types.ObjectId(instructorId),
            paymentStatus: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$instructorShare' }
          }
        }
      ]);

      const totalEarnings = totalEarningsResult[0]?.total || 0;

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const monthlyRevenueResult = await Payment.aggregate([
        {
          $match: {
            instructorId: new mongoose.Types.ObjectId(instructorId),
            paymentStatus: 'completed',
            createdAt: { $gte: firstDayOfMonth, $lte: now }
          }
        },
        {
          $group: {
            _id: null,
            monthly: { $sum: '$instructorShare' }
          }
        }
      ]);

      const monthlyRevenue = monthlyRevenueResult[0]?.monthly || 0;

      console.log(`✅ Total: $${totalEarnings}, Monthly: $${monthlyRevenue}`);

      res.json({
        success: true,
        totalEarnings: totalEarnings,
        monthlyRevenue: monthlyRevenue,
        message: 'Lấy thống kê thu nhập thành công'
      });

    } catch (error) {
      console.error('💥 Get instructor earnings error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server',
        error: error.message
      });
    }
  },

  /**
   * Get payments stats (admin)
   */
  getPaymentsStats: async (req, res) => {
    try {
      const { startDate, endDate, groupBy = 'type' } = req.query;

      const matchStage = { paymentStatus: 'completed' };
      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
      }

      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: `$${groupBy}`,
            totalAmount: { $sum: '$amount' },
            totalAdminShare: { $sum: '$adminShare' },
            totalInstructorShare: { $sum: '$instructorShare' },
            totalTransactions: { $sum: 1 }
          }
        },
        { $sort: { totalAmount: -1 } }
      ];

      const stats = await Payment.aggregate(pipeline);

      const overallStats = {
        totalRevenue: stats.reduce((sum, item) => sum + item.totalAmount, 0),
        totalAdminRevenue: stats.reduce((sum, item) => sum + item.totalAdminShare, 0),
        totalInstructorRevenue: stats.reduce((sum, item) => sum + item.totalInstructorShare, 0),
        totalTransactions: stats.reduce((sum, item) => sum + item.totalTransactions, 0)
      };

      res.json({
        success: true,
        stats,
        overall: overallStats,
        message: 'Thống kê thanh toán'
      });

    } catch (error) {
      console.error('💥 Get payments stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server',
        error: error.message
      });
    }
  },

  /**
   * Refund payment
   */
  refundPayment: async (req, res) => {
    try {
      const { paymentId, reason } = req.body;

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thanh toán'
        });
      }

      if (payment.userId.toString() !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền'
        });
      }

      if (payment.paymentStatus !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Chỉ có thể hoàn tiền cho thanh toán đã thành công'
        });
      }

      let refund;
      try {
        refund = await stripe.refunds.create({
          payment_intent: payment.transactionId,
          amount: Math.round(payment.amount * 100),
          reason: reason || 'requested_by_customer'
        });

        console.log('✅ Refund created:', refund.id);
      } catch (stripeError) {
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi hoàn tiền',
          error: stripeError.message
        });
      }

      payment.paymentStatus = 'refunded';
      payment.refundReason = reason;
      payment.refundedAt = new Date();
      await payment.save();

      res.json({
        success: true,
        message: 'Hoàn tiền thành công',
        refund: {
          id: refund.id,
          amount: refund.amount / 100,
          status: refund.status
        }
      });

    } catch (error) {
      console.error('💥 Refund payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống',
        error: error.message
      });
    }
  },

  /**
   * Handle Stripe webhook
   */
  handleStripeWebhook: async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log('✅ Webhook verified:', event.type);
    } catch (err) {
      console.error('❌ Webhook error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          const payment = await Payment.findOne({ transactionId: event.data.object.id });
          if (payment) {
            payment.paymentStatus = 'completed';
            payment.completedAt = new Date();
            await payment.save();
            console.log('✅ Payment marked as completed:', payment._id);
          }
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = await Payment.findOne({ transactionId: event.data.object.id });
          if (failedPayment) {
            failedPayment.paymentStatus = 'failed';
            failedPayment.failedAt = new Date();
            await failedPayment.save();
          }
          break;
      }

      res.json({ received: true });
    } catch (error) {
      console.error('❌ Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
};

module.exports = paymentController;