// payment-service/src/models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function() { return this.type !== 'instructor_fee'; }
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'VND',
    enum: ['VND', 'USD']
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['stripe', 'paypal', 'momo']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['course_payment', 'lesson_payment', 'instructor_fee'],
    required: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  adminShare: {
    type: Number,
    required: true
  },
  instructorShare: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

paymentSchema.index({ userId: 1 });
paymentSchema.index({ courseId: 1 });
paymentSchema.index({ transactionId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);