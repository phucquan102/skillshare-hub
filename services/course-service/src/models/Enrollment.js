// course-service/src/models/Enrollment.js
const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  // For individual lesson purchases (if pricingType is 'per_lesson' or 'both')
  purchasedLessons: [{
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    },
    purchasedAt: {
      type: Date,
      default: Date.now
    },
    price: {
      type: Number,
      min: 0
    }
  }],
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: false
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'paused'],
    default: 'active'
  },
  progress: {
    completedLessons: [{
      lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson'
      },
      completedAt: {
        type: Date,
        default: Date.now
      },
      progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      }
    }],
    overallProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    lastAccessed: {
      type: Date,
      default: Date.now
    }
  },
  // Certificate info
  certificate: {
    issued: {
      type: Boolean,
      default: false
    },
    issuedAt: Date,
    certificateId: String,
    downloadUrl: String
  }
}, { 
  timestamps: true 
});

// Compound indexes
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ studentId: 1, status: 1 });
enrollmentSchema.index({ courseId: 1, status: 1 });

// Virtual for checking if enrollment has full course access
enrollmentSchema.virtual('hasFullAccess').get(function() {
  return this.purchasedLessons.length === 0; // Empty means full course access
});

// Method to check if student has access to a specific lesson
enrollmentSchema.methods.hasAccessToLesson = function(lessonId) {
  // If full course access
  if (this.hasFullAccess) {
    return true;
  }
  
  // Check if lesson was individually purchased
  return this.purchasedLessons.some(purchase => 
    purchase.lessonId && purchase.lessonId.toString() === lessonId.toString()
  );
};

// Method to mark lesson as completed
enrollmentSchema.methods.markLessonCompleted = function(lessonId, progress = 100) {
  const existingIndex = this.progress.completedLessons.findIndex(
    item => item.lessonId && item.lessonId.toString() === lessonId.toString()
  );
  
  if (existingIndex >= 0) {
    this.progress.completedLessons[existingIndex].progress = progress;
    this.progress.completedLessons[existingIndex].completedAt = new Date();
  } else {
    this.progress.completedLessons.push({
      lessonId,
      progress,
      completedAt: new Date()
    });
  }
  
  // Update overall progress
  this.updateOverallProgress();
  
  return this.save();
};

// Method to update overall progress
enrollmentSchema.methods.updateOverallProgress = function() {
  // This should be calculated based on total lessons in course
  // For now, we'll use a simple calculation
  if (this.progress.completedLessons.length > 0) {
    const totalProgress = this.progress.completedLessons.reduce(
      (sum, lesson) => sum + lesson.progress, 0
    );
    this.progress.overallProgress = Math.min(100, 
      Math.round(totalProgress / this.progress.completedLessons.length)
    );
  }
  
  this.progress.lastAccessed = new Date();
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);