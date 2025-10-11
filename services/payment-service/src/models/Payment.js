// payment-service/src/models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'usd',
    enum: ['usd']
  },
  paymentMethod: {
    type: String,
    default: 'stripe',
    enum: ['stripe', 'momo', 'zalopay']
  },
  paymentStatus: {
    type: String,
    default: 'pending',
    enum: ['pending', 'completed', 'failed', 'canceled', 'refunded']
  },
  type: {
    type: String,
    required: true,
    enum: ['course_payment', 'lesson_payment', 'instructor_fee']
  },
  transactionId: {
    type: String,
    required: true
  },
  stripePaymentIntentId: {
    type: String,
    required: true
  },
  clientSecret: {
    type: String,
    required: true
  },
  adminShare: {
    type: Number,
    default: 0
  },
  instructorShare: {
    type: Number,
    default: 0
  },
  refundReason: {
    type: String,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  failedAt: {
    type: Date,
    default: null
  },
  canceledAt: {
    type: Date,
    default: null
  },
  refundedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better performance
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ type: 1 });
paymentSchema.index({ createdAt: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;