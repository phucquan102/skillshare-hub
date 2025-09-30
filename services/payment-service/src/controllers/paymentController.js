// payment-service/src/controllers/paymentController.js
const Payment = require('../models/Payment');
const axios = require('axios');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const paymentController = {
  // Student thanh toán khóa học - Tạo Stripe Payment Intent
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

      // 🚨 TẠM THỜI BỎ QUA KIỂM TRA COURSE SERVICE - FIX LỖI KẾT NỐI
      console.log('🚨 TEMPORARY: Bypassing course service validation for testing Stripe');
      console.log('📝 Course ID:', courseId, 'Amount:', amount);

      // Tạo Stripe Payment Intent
      let paymentIntent;
      try {
        console.log('💳 Creating Stripe payment intent...');
        
        paymentIntent = await stripe.paymentIntents.create({
          amount: amount * 100, // Stripe tính bằng cent (VND * 100)
          currency: 'USD',
          payment_method_types: ['card'],
          metadata: {
            courseId: courseId,
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
      const adminShare = Math.round(amount * adminFeePercent);
      const instructorShare = amount - adminShare;

      const payment = new Payment({
        userId: req.userId,
        courseId,
        lessonId: lessonId || null,
        amount,
        currency: 'USD',
        paymentMethod: 'stripe',
        paymentStatus: 'pending',
        type: lessonId ? 'lesson_payment' : 'course_payment',
        transactionId: paymentIntent.id,
        adminShare,
        instructorShare
      });

      await payment.save();
      console.log('✅ Payment record created:', payment._id);

      // Trả về client secret cho frontend
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

  // Xác nhận thanh toán thành công từ frontend
  confirmPayment: async (req, res) => {
    try {
      const { paymentId, paymentIntentId } = req.body;

      console.log('✅ Confirm payment request:', { paymentId, paymentIntentId });

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

      // Xác minh với Stripe rằng payment intent đã thành công
      // let paymentIntent;
      // try {
      //   paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      // } catch (stripeError) {
      //   console.error('❌ Error retrieving payment intent:', stripeError);
      //   return res.status(400).json({ 
      //     success: false,
      //     message: 'Lỗi khi xác minh thanh toán với Stripe',
      //     error: stripeError.message 
      //   });
      // }

      // // Kiểm tra trạng thái của payment intent
      // if (paymentIntent.status !== 'succeeded') {
      //   return res.status(400).json({ 
      //     success: false,
      //     message: 'Thanh toán chưa thành công',
      //     detail: `Payment intent status: ${paymentIntent.status}`
      //   });
      // }

      // Cập nhật trạng thái thanh toán
      payment.paymentStatus = 'completed';
      payment.transactionId = paymentIntentId;
      await payment.save();

      // 🚨 TẠM THỜI BỎ QUA ENROLLMENT TỰ ĐỘNG - FIX SAU
      console.log('🚨 TEMPORARY: Bypassing automatic enrollment');
      console.log('📝 Payment completed for course:', payment.courseId);

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        payment: {
          _id: payment._id,
          status: payment.paymentStatus,
          transactionId: payment.transactionId,
          courseId: payment.courseId
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

  // Instructor thanh toán phí đăng khóa
  createInstructorFee: async (req, res) => {
    try {
      const { courseId, paymentMethod } = req.body;
      const fee = 100000; // Phí cố định 100k VND

      console.log('👉 Instructor fee request:', { 
        courseId, 
        paymentMethod,
        userId: req.userId 
      });

      if (!courseId) {
        return res.status(400).json({ 
          success: false,
          message: 'courseId là bắt buộc' 
        });
      }

      // Tạo Stripe Payment Intent cho instructor fee
      let paymentIntent;
      try {
        console.log('💳 Creating Stripe payment intent for instructor fee...');
        
        paymentIntent = await stripe.paymentIntents.create({
          amount: fee * 100, // 100k VND
          currency: 'USD',
          payment_method_types: ['card'],
          metadata: {
            courseId: courseId,
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

      // Tạo payment record với status 'pending'
      const payment = new Payment({
        userId: req.userId,
        courseId,
        amount: fee,
        currency: 'USD',
        paymentMethod: 'stripe',
        paymentStatus: 'pending',
        type: 'instructor_fee',
        transactionId: paymentIntent.id,
        adminShare: fee, // Toàn bộ phí thuộc về admin
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
        currency: 'vnd'
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

  // Lịch sử thanh toán của user
  getPaymentHistory: async (req, res) => {
    try {
      const { page = 1, limit = 10, type } = req.query;
      const skip = (page - 1) * limit;

      console.log('📋 Fetching payment history for user:', {
        userId: req.userId,
        page,
        limit,
        type
      });

      // Build query
      const query = { userId: req.userId };
      if (type && ['course_payment', 'lesson_payment', 'instructor_fee'].includes(type)) {
        query.type = type;
      }

      // Lấy payments với pagination
      const payments = await Payment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v')
        .lean();

      // Đếm tổng số payments
      const total = await Payment.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      console.log(`✅ Found ${payments.length} payments for user ${req.userId}`);

      res.json({ 
        success: true,
        payments, 
        pagination: {
          current: parseInt(page),
          total: totalPages,
          count: payments.length,
          totalRecords: total
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

  // Thống kê thanh toán (cho admin)
  getPaymentsStats: async (req, res) => {
    try {
      const { startDate, endDate, groupBy = 'type' } = req.query;

      console.log('📊 Fetching payment stats:', {
        startDate,
        endDate,
        groupBy
      });

      // Build match stage for date filtering
      const matchStage = {};
      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
      }

      const pipeline = [];

      // Add match stage if date filters exist
      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
      }

      // Group by specified field
      pipeline.push({
        $group: {
          _id: `$${groupBy}`,
          totalAmount: { $sum: '$amount' },
          totalAdminShare: { $sum: '$adminShare' },
          totalInstructorShare: { $sum: '$instructorShare' },
          totalTransactions: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
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
        totalTransactions: stats.reduce((sum, item) => sum + item.totalTransactions, 0)
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

  // Get payment by ID (chi tiết thanh toán)
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

  // Refund payment (hoàn tiền)
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
      await payment.save();

      res.json({
        success: true,
        message: 'Hoàn tiền thành công',
        refund: {
          id: refund.id,
          amount: refund.amount / 100, // Chuyển từ cent về VND
          status: refund.status
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
  }
};

module.exports = paymentController;