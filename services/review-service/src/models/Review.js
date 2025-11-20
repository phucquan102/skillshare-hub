const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    default: ''
  },
  comment: {
    type: String,
    required: true
  },
  pros: [{
    type: String
  }],
  cons: [{
    type: String
  }],
  wouldRecommend: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],  
    default: 'approved'
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  helpfulBy: [{
    type: mongoose.Schema.Types.ObjectId
  }],
  reply: {
    instructorId: {
      type: mongoose.Schema.Types.ObjectId
    },
    message: String,
    repliedAt: {
      type: Date,
      default: Date.now
    }
  }
   
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ courseId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ courseId: 1, status: 1 });
reviewSchema.index({ userId: 1 });

module.exports = mongoose.model('Review', reviewSchema);