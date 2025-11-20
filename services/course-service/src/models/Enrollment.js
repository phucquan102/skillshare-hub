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
enrollmentSchema.methods.markLessonCompleted = async function(lessonId, progress = 100) {
  const existingIndex = this.progress.completedLessons.findIndex(
    item => item.lessonId && item.lessonId.toString() === lessonId.toString()
  );
  
  if (existingIndex >= 0) {
    // Update existing completion
    this.progress.completedLessons[existingIndex].progress = progress;
    this.progress.completedLessons[existingIndex].completedAt = new Date();
  } else {
    // Add new completion
    this.progress.completedLessons.push({
      lessonId,
      progress,
      completedAt: new Date()
    });
  }
  
  // Update overall progress
  await this.updateOverallProgress();
  
  return this.save();
};

// Method to update overall progress
enrollmentSchema.methods.updateOverallProgress = async function() {
  try {
    // Lấy tổng số lessons trong khóa học
    const totalLessons = await mongoose.model('Lesson').countDocuments({
      courseId: this.courseId
    });
    
    if (totalLessons > 0) {
      // Tính phần trăm dựa trên số lesson đã hoàn thành
      const completedCount = this.progress.completedLessons.length;
      this.progress.overallProgress = Math.min(100, 
        Math.round((completedCount / totalLessons) * 100)
      );
    } else {
      this.progress.overallProgress = 0;
    }
    
    this.progress.lastAccessed = new Date();
    
    // Tự động hoàn thành khóa học nếu đã hoàn thành tất cả lessons
    if (this.progress.overallProgress === 100 && this.status === 'active') {
      this.status = 'completed';
      this.completedAt = new Date();
    }
    
  } catch (error) {
    console.error('Error updating overall progress:', error);
    this.progress.overallProgress = 0;
  }
};

// THÊM: Static method để tự động hoàn thành khóa học đã hết hạn
enrollmentSchema.statics.autoCompleteExpiredCourses = async function() {
  try {
    const now = new Date();
    
    // Tìm các khóa học đã hết hạn
    const expiredCourses = await mongoose.model('Course').find({
      endDate: { $lt: now },
      status: 'published'
    });

    let completedCount = 0;
    
    for (const course of expiredCourses) {
      // Cập nhật tất cả enrollment active của khóa học này thành completed
      const result = await this.updateMany(
        {
          courseId: course._id,
          status: 'active'
        },
        {
          status: 'completed',
          completedAt: now,
          $set: {
            'progress.overallProgress': 100,
            'progress.lastAccessed': now
          }
        }
      );
      
      completedCount += result.modifiedCount;
      console.log(`✅ Auto-completed ${result.modifiedCount} enrollments for course: ${course.title}`);
    }
    
    return { completedCount, processedCourses: expiredCourses.length };
  } catch (error) {
    console.error('❌ Error in autoCompleteExpiredCourses:', error);
    throw error;
  }
};

// THÊM: Method để kiểm tra và cập nhật hoàn thành dựa trên progress
enrollmentSchema.methods.checkAndUpdateCompletion = async function() {
  const course = await mongoose.model('Course').findById(this.courseId);
  if (!course) return false;

  const now = new Date();
  
  // Kiểm tra nếu khóa học đã hết hạn
  if (new Date(course.endDate) < now) {
    this.status = 'completed';
    this.completedAt = now;
    this.progress.overallProgress = 100;
    this.progress.lastAccessed = now;
    await this.save();
    return true;
  }
  
  return false;
};
module.exports = mongoose.model('Enrollment', enrollmentSchema);