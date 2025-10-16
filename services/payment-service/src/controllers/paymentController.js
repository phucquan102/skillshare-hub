// payment-service/src/controllers/paymentController.js
const Payment = require('../models/Payment');
const axios = require('axios');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Helper: Kiểm tra user đã mua course/lesson này chưa - PHIÊN BẢN ĐÃ SỬA
 */
const checkUserEnrollment = async (userId, courseId, lessonId) => {
  try {
    console.log('🔍 [KIỂM TRA ENROLLMENT CHẶT CHẼ]:', { userId, courseId, lessonId });
    
    // Gọi course service để kiểm tra enrollment
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
    
    // 🔥 QUAN TRỌNG: Kiểm tra kỹ hơn
    const { isEnrolled, enrollmentType, hasAccessToRequestedLesson } = response.data;
    
    // Nếu đã enrolled với full_course, không cho mua bất cứ gì trong course đó
    if (isEnrolled && enrollmentType === 'full_course') {
      return {
        isEnrolled: true,
        enrollmentType: 'full_course',
        blockPayment: true, // 🔥 Thêm cờ block
        message: 'Bạn đã mua toàn bộ khóa học này. Không cần mua bài học riêng lẻ.'
      };
    }
    
    // Nếu đã mua lesson riêng, không cho mua lại
    if (isEnrolled && enrollmentType === 'single_lesson' && lessonId && hasAccessToRequestedLesson) {
      return {
        isEnrolled: true,
        enrollmentType: 'single_lesson',
        blockPayment: true, // 🔥 Thêm cờ block
        message: 'Bạn đã mua bài học này rồi. Không thể mua lại.'
      };
    }
    
    // Nếu đã có partial course access và đang cố mua full course, cũng chặn
    if (isEnrolled && enrollmentType === 'partial_course' && !lessonId) {
      return {
        isEnrolled: true,
        enrollmentType: 'partial_course',
        blockPayment: true,
        message: 'Bạn đã mua một số bài học trong khóa học này. Vui lòng liên hệ hỗ trợ để nâng cấp lên full course.'
      };
    }
    
    return {
      isEnrolled,
      enrollmentType,
      blockPayment: false
    };
    
  } catch (error) {
    console.warn('⚠️ Could not verify enrollment:', error.message);
    // 🔥 QUAN TRỌNG: Fail safe - nếu không kết nối được, KHÔNG cho thanh toán để tránh mua trùng
    return {
      isEnrolled: true,
      enrollmentType: 'unknown',
      blockPayment: true,
      message: 'Không thể xác minh trạng thái đăng ký. Vui lòng thử lại sau.'
    };
  }
};

const paymentController = {
  /**
   * Student thanh toán khóa học - Tạo Stripe Payment Intent - PHIÊN BẢN ĐÃ SỬA
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

      // Validate input
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

      // 🔥 KIỂM TRA CHẶT CHẼ: Kiểm tra xem user đã mua course/lesson này chưa
      console.log('🔐 [KIỂM TRA NGHIÊM NGẶT] Checking if user already enrolled...');
      
      const enrollmentCheck = await checkUserEnrollment(req.userId, courseId, lessonId);
      
      // 🔥 QUAN TRỌNG: Sử dụng cờ blockPayment mới
      if (enrollmentCheck.blockPayment) {
        console.log('❌ [BLOCKED] Payment blocked - user already enrolled:', enrollmentCheck.enrollmentType);
        
        return res.status(403).json({ 
          success: false,
          message: enrollmentCheck.message || 'Bạn đã mua khóa học/bài học này rồi. Không thể thanh toán lại.',
          enrollmentType: enrollmentCheck.enrollmentType
        });
      }

      console.log('✅ [PASSED] User is not enrolled, proceeding with payment');

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

      // Tạo payment record với status 'pending'
      const adminFeePercent = 0.15;
      const adminShare = Math.round(amount * adminFeePercent * 100) / 100;
      const instructorShare = Math.round((amount - adminShare) * 100) / 100;

      const payment = new Payment({
        userId: req.userId,
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
      console.error('💥 Create student payment error:', {
        message: error.message,
        stack: error.stack,
        userId: req.userId,
        body: req.body
      });

      res.status(500).json({ 
        success: false,
        message: 'Lỗi hệ thống khi tạo thanh toán', 
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  /**
   * Xác nhận thanh toán thành công từ frontend - PHIÊN BẢN ĐÃ SỬA
   */
  confirmPayment: async (req, res) => {
    try {
      const { paymentId, paymentIntentId, status } = req.body;

      console.log('✅ Confirm payment request:', { paymentId, paymentIntentId, status });

      // Tìm payment trong database
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({ 
          success: false,
          message: 'Không tìm thấy thanh toán' 
        });
      }

      // Kiểm tra quyền: user chỉ được xác nhận thanh toán của chính mình
      if (payment.userId.toString() !== req.userId) {
        return res.status(403).json({ 
          success: false,
          message: 'Không có quyền xác nhận thanh toán này' 
        });
      }

      // 🔥 QUAN TRỌNG: Kiểm tra lại enrollment trước khi xác nhận
      console.log('🔐 [KIỂM TRA LẦN CUỐI] Double-checking enrollment before confirmation...');
      const enrollmentCheck = await checkUserEnrollment(req.userId, payment.courseId, payment.lessonId);
      
      if (enrollmentCheck.blockPayment) {
        console.log('❌ [BLOCKED CONFIRMATION] User already enrolled, cancelling payment');
        
        // Cập nhật trạng thái payment thành failed
        payment.paymentStatus = 'failed';
        payment.failedAt = new Date();
        await payment.save();
        
        return res.status(403).json({ 
          success: false,
          message: enrollmentCheck.message || 'Không thể xác nhận thanh toán vì bạn đã mua khóa học/bài học này.',
          enrollmentType: enrollmentCheck.enrollmentType
        });
      }

      // Xác minh với Stripe rằng payment intent đã thành công
      let stripePaymentIntent;
      try {
        stripePaymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        console.log('✅ Stripe payment intent status:', stripePaymentIntent.status);
      } catch (stripeError) {
        console.error('❌ Error retrieving payment intent:', stripeError);
      }

      // Kiểm tra trạng thái của payment intent từ Stripe
      if (stripePaymentIntent && stripePaymentIntent.status !== 'succeeded') {
        console.warn('⚠️ Payment intent status not succeeded:', stripePaymentIntent.status);
      }

      // Cập nhật trạng thái thanh toán
      const finalStatus = status || (stripePaymentIntent?.status === 'succeeded' ? 'completed' : 'pending');
      
      payment.paymentStatus = finalStatus;
      payment.transactionId = paymentIntentId;
      payment.completedAt = finalStatus === 'completed' ? new Date() : null;
      
      await payment.save();

      console.log('✅ Payment status updated to:', payment.paymentStatus);

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        payment: {
          _id: payment._id,
          status: payment.paymentStatus,
          transactionId: payment.transactionId,
          courseId: payment.courseId,
          amount: payment.amount,
          type: payment.type
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
   * Instructor thanh toán phí đăng khóa
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
        console.log('💳 Creating Stripe payment intent for instructor fee...');
        
        const stripeAmount = Math.round(fee * 100);
        
        paymentIntent = await stripe.paymentIntents.create({
          amount: stripeAmount,
          currency: 'usd',
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            courseId: courseId || '',
            userId: req.userId.toString(),
            type: 'instructor_fee'
          }
        });

        console.log('✅ Stripe payment intent for instructor fee created:', paymentIntent.id);
      } catch (stripeError) {
        console.error('❌ Stripe error for instructor fee:', stripeError);
        return res.status(500).json({ 
          success: false,
          message: 'Lỗi khi tạo thanh toán phí đăng khóa',
          error: stripeError.message 
        });
      }

      const payment = new Payment({
        userId: req.userId,
        courseId: courseId || null,
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
      console.log('✅ Instructor fee payment created:', payment._id);

      res.status(201).json({
        success: true,
        message: 'Payment intent for instructor fee created successfully',
        clientSecret: paymentIntent.client_secret,
        paymentId: payment._id.toString(),
        amount: fee,
        currency: 'usd'
      });

    } catch (error) {
      console.error('💥 Create instructor fee error:', {
        message: error.message,
        stack: error.stack,
        userId: req.userId,
        body: req.body
      });

      res.status(500).json({ 
        success: false,
        message: 'Lỗi hệ thống khi tạo thanh toán phí đăng khóa', 
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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

      console.log('📋 Fetching payment history for user:', {
        userId: req.userId,
        page,
        limit,
        type,
        status
      });

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

      console.log(`✅ Found ${payments.length} payments for user ${req.userId}`);

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
          totalSpent: totalAmount[0]?.total || 0,
          totalTransactions: total
        },
        message: 'Lấy lịch sử thanh toán thành công' 
      });

    } catch (error) {
      console.error('💥 Get payment history error:', {
        message: error.message,
        userId: req.userId
      });

      res.status(500).json({ 
        success: false,
        message: 'Lỗi server khi lấy lịch sử thanh toán', 
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  /**
   * Thống kê thanh toán (cho admin)
   */
  getPaymentsStats: async (req, res) => {
    try {
      const { startDate, endDate, groupBy = 'type' } = req.query;

      console.log('📊 Fetching payment stats:', {
        startDate,
        endDate,
        groupBy
      });

      // Build match stage for date filtering
      const matchStage = { paymentStatus: 'completed' };
      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
      }

      const pipeline = [];

      // Add match stage
      pipeline.push({ $match: matchStage });

      // Group by specified field
      pipeline.push({
        $group: {
          _id: `$${groupBy}`,
          totalAmount: { $sum: '$amount' },
          totalAdminShare: { $sum: '$adminShare' },
          totalInstructorShare: { $sum: '$instructorShare' },
          totalTransactions: { $sum: 1 },
          averageAmount: { $avg: '$amount' },
          minAmount: { $min: '$amount' },
          maxAmount: { $max: '$amount' }
        }
      });

      // Sort by total amount descending
      pipeline.push({ $sort: { totalAmount: -1 } });

      const stats = await Payment.aggregate(pipeline);

      // Calculate overall totals
      const overallStats = {
        totalRevenue: stats.reduce((sum, item) => sum + item.totalAmount, 0),
        totalAdminRevenue: stats.reduce((sum, item) => sum + item.totalAdminShare, 0),
        totalInstructorRevenue: stats.reduce((sum, item) => sum + item.totalInstructorShare, 0),
        totalTransactions: stats.reduce((sum, item) => sum + item.totalTransactions, 0),
        averageTransaction: stats.reduce((sum, item) => sum + item.averageAmount, 0) / stats.length
      };

      console.log(`✅ Payment stats generated: ${stats.length} groups`);

      res.json({ 
        success: true,
        stats, 
        overall: overallStats,
        filters: {
          startDate,
          endDate,
          groupBy
        },
        message: 'Thống kê thanh toán' 
      });

    } catch (error) {
      console.error('💥 Get payments stats error:', {
        message: error.message,
        stack: error.stack
      });

      res.status(500).json({ 
        success: false,
        message: 'Lỗi server khi lấy thống kê thanh toán', 
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  /**
   * Get payment by ID (chi tiết thanh toán)
   */
  getPaymentById: async (req, res) => {
    try {
      const { paymentId } = req.params;

      console.log('🔍 Fetching payment details:', { paymentId });

      const payment = await Payment.findById(paymentId).select('-__v').lean();

      if (!payment) {
        return res.status(404).json({ 
          success: false,
          message: 'Không tìm thấy thông tin thanh toán' 
        });
      }

      // Kiểm tra quyền truy cập (user chỉ có thể xem payment của chính mình, trừ admin)
      if (payment.userId.toString() !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({ 
          success: false,
          message: 'Không có quyền truy cập thông tin thanh toán này' 
        });
      }

      console.log('✅ Payment details retrieved:', paymentId);

      res.json({ 
        success: true,
        payment,
        message: 'Lấy thông tin thanh toán thành công' 
      });

    } catch (error) {
      console.error('💥 Get payment by ID error:', {
        message: error.message,
        paymentId: req.params.paymentId
      });

      if (error.name === 'CastError') {
        return res.status(400).json({ 
          success: false,
          message: 'ID thanh toán không hợp lệ' 
        });
      }

      res.status(500).json({ 
        success: false,
        message: 'Lỗi server khi lấy thông tin thanh toán', 
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  /**
   * Refund payment (hoàn tiền)
   */
  refundPayment: async (req, res) => {
    try {
      const { paymentId, reason } = req.body;

      console.log('🔄 Processing refund for payment:', { paymentId, reason });

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({ 
          success: false,
          message: 'Không tìm thấy thanh toán' 
        });
      }

      // Kiểm tra quyền (chỉ admin hoặc chủ sở hữu)
      if (payment.userId.toString() !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({ 
          success: false,
          message: 'Không có quyền hoàn tiền cho thanh toán này' 
        });
      }

      // Kiểm tra trạng thái thanh toán
      if (payment.paymentStatus !== 'completed') {
        return res.status(400).json({ 
          success: false,
          message: 'Chỉ có thể hoàn tiền cho thanh toán đã thành công' 
        });
      }

      // Thực hiện refund trên Stripe
      let refund;
      try {
        refund = await stripe.refunds.create({
          payment_intent: payment.transactionId,
          amount: Math.round(payment.amount * 100),
          reason: reason || 'requested_by_customer'
        });

        console.log('✅ Stripe refund created:', refund.id);
      } catch (stripeError) {
        console.error('❌ Stripe refund error:', stripeError);
        return res.status(500).json({ 
          success: false,
          message: 'Lỗi khi tạo hoàn tiền trên Stripe',
          error: stripeError.message 
        });
      }

      // Cập nhật trạng thái payment
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
          status: refund.status,
          reason: refund.reason
        }
      });

    } catch (error) {
      console.error('💥 Refund payment error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Lỗi hệ thống khi xử lý hoàn tiền',
        error: error.message 
      });
    }
  },

  /**
   * Webhook endpoint để xử lý sự kiện từ Stripe - PHIÊN BẢN ĐÃ SỬA
   */
  handleStripeWebhook: async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // Xác thực webhook signature
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      
      console.log('✅ Webhook signature verified:', event.type);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log('🔄 Webhook received:', event.type);

    // Xử lý sự kiện
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event.data.object);
          break;
        
        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object);
          break;
        
        case 'payment_intent.canceled':
          await handlePaymentIntentCanceled(event.data.object);
          break;
        
        default:
          console.log(`🔔 Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('❌ Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  },

  /**
   * Kiểm tra trạng thái payment intent từ Stripe
   */
  checkPaymentStatus: async (req, res) => {
    try {
      const { paymentId } = req.params;

      console.log('🔍 Checking payment status:', { paymentId });

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({ 
          success: false,
          message: 'Không tìm thấy thanh toán' 
        });
      }

      // Kiểm tra quyền
      if (payment.userId.toString() !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({ 
          success: false,
          message: 'Không có quyền truy cập' 
        });
      }

      // Lấy thông tin từ Stripe
      let stripePaymentIntent;
      try {
        stripePaymentIntent = await stripe.paymentIntents.retrieve(payment.transactionId);
        
        console.log('✅ Stripe payment intent status:', stripePaymentIntent.status);
        
        // Cập nhật trạng thái nếu có thay đổi
        if (stripePaymentIntent.status === 'succeeded' && payment.paymentStatus !== 'completed') {
          payment.paymentStatus = 'completed';
          payment.completedAt = new Date();
          await payment.save();
          console.log('✅ Payment status updated to completed');
        }
      } catch (stripeError) {
        console.error('❌ Error retrieving payment intent:', stripeError);
      }

      res.json({
        success: true,
        payment: {
          _id: payment._id,
          status: payment.paymentStatus,
          stripeStatus: stripePaymentIntent?.status,
          amount: payment.amount,
          currency: payment.currency,
          createdAt: payment.createdAt,
          completedAt: payment.completedAt
        },
        message: 'Kiểm tra trạng thái thanh toán thành công'
      });

    } catch (error) {
      console.error('💥 Check payment status error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Lỗi khi kiểm tra trạng thái thanh toán',
        error: error.message 
      });
    }
  }
};

/**
 * Helper functions for webhook handling - PHIÊN BẢN ĐÃ SỬA
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    console.log('💰 Payment succeeded:', paymentIntent.id);
    
    // Tìm payment record trong database
    const payment = await Payment.findOne({ transactionId: paymentIntent.id });
    if (payment) {
      // 🔥 QUAN TRỌNG: Kiểm tra enrollment trước khi cập nhật
      const enrollmentCheck = await checkUserEnrollment(
        payment.userId, 
        payment.courseId, 
        payment.lessonId
      );
      
      if (enrollmentCheck.blockPayment) {
        console.log('❌ [WEBHOOK BLOCKED] User already enrolled, marking payment as failed');
        payment.paymentStatus = 'failed';
        payment.failedAt = new Date();
        await payment.save();
        
        // 🔥 HOÀN TIỀN TỰ ĐỘNG nếu đã mua rồi
        try {
          await stripe.refunds.create({
            payment_intent: paymentIntent.id,
            reason: 'duplicate'
          });
          console.log('✅ Automatic refund processed for duplicate purchase');
        } catch (refundError) {
          console.error('❌ Automatic refund failed:', refundError);
        }
        
        return;
      }
      
      payment.paymentStatus = 'completed';
      payment.completedAt = new Date();
      await payment.save();
      
      console.log('✅ Payment status updated to completed:', payment._id);
      
      // TODO: Gọi enrollment service để tạo enrollment
    } else {
      console.warn('⚠️ No payment record found for Stripe payment intent:', paymentIntent.id);
    }
  } catch (error) {
    console.error('❌ Error handling payment success:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    console.log('❌ Payment failed:', paymentIntent.id);
    
    const payment = await Payment.findOne({ transactionId: paymentIntent.id });
    if (payment) {
      payment.paymentStatus = 'failed';
      payment.failedAt = new Date();
      await payment.save();
      console.log('✅ Payment status updated to failed:', payment._id);
    }
  } catch (error) {
    console.error('❌ Error handling payment failure:', error);
  }
}

async function handlePaymentIntentCanceled(paymentIntent) {
  try {
    console.log('🚫 Payment canceled:', paymentIntent.id);
    
    const payment = await Payment.findOne({ transactionId: paymentIntent.id });
    if (payment) {
      payment.paymentStatus = 'canceled';
      payment.canceledAt = new Date();
      await payment.save();
      console.log('✅ Payment status updated to canceled:', payment._id);
    }
  } catch (error) {
    console.error('❌ Error handling payment cancellation:', error);
  }
}

module.exports = paymentController;