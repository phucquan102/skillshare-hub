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
    const Course = mongoose.model('Course');
    const course = await Course.findById(this.courseId).populate('lessons');
    
    if (course && course.lessons && course.lessons.length > 0) {
      // Tính phần trăm dựa trên số lesson đã hoàn thành
      const completedCount = this.progress.completedLessons.length;
      const totalLessons = course.lessons.length;
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
  const Course = mongoose.model('Course');
  const course = await Course.findById(this.courseId);
  if (!course) return false;

  const now = new Date();
  
  // Kiểm tra nếu khóa học đã hết hạn
  if (course.endDate && new Date(course.endDate) < now) {
    this.status = 'completed';
    this.completedAt = now;
    this.progress.overallProgress = 100;
    this.progress.lastAccessed = now;
    await this.save();
    return true;
  }
  
  return false;
};

// 🆕 THÊM: Method để lấy thông tin progress chi tiết (dùng cho studentController)
enrollmentSchema.methods.getDetailedProgress = async function() {
  const Course = mongoose.model('Course');
  const Lesson = mongoose.model('Lesson');
  
  const course = await Course.findById(this.courseId)
    .populate('lessons', 'title order duration scheduleIndex lessonType meetingUrl actualStartTime actualEndTime status isPreview isFree')
    .lean();

  if (!course) {
    return null;
  }

  const lessons = course.lessons.map(lesson => {
    const isCompleted = this.progress.completedLessons.some(
      completed => completed.lessonId && completed.lessonId.toString() === lesson._id.toString()
    );
    
    const hasAccess = this.hasFullAccess || 
      this.purchasedLessons.some(purchase => 
        purchase.lessonId && purchase.lessonId.toString() === lesson._id.toString()
      );

    return {
      _id: lesson._id,
      title: lesson.title,
      order: lesson.order,
      duration: lesson.duration,
      scheduleIndex: lesson.scheduleIndex,
      lessonType: lesson.lessonType,
      meetingUrl: lesson.meetingUrl,
      actualStartTime: lesson.actualStartTime,
      actualEndTime: lesson.actualEndTime,
      status: lesson.status,
      isPreview: lesson.isPreview,
      isFree: lesson.isFree,
      hasAccess,
      isCompleted,
      canJoin: hasAccess && lesson.lessonType === 'live_online' && lesson.meetingUrl,
      progress: isCompleted ? 100 : 0
    };
  });

  // Sort lessons by order
  lessons.sort((a, b) => a.order - b.order);

  return {
    enrollmentId: this._id,
    overallProgress: this.progress.overallProgress,
    completedLessons: this.progress.completedLessons.length,
    totalLessons: lessons.length,
    hasFullAccess: this.hasFullAccess,
    purchasedLessons: this.purchasedLessons.length,
    enrolledAt: this.enrolledAt,
    lastAccessed: this.progress.lastAccessed,
    lessons
  };
};

// 🆕 THÊM: Method để lấy lessons có quyền truy cập (dùng cho learning schedule)
enrollmentSchema.methods.getAccessibleLessons = async function() {
  const Lesson = mongoose.model('Lesson');
  let lessons = [];

  try {
    if (this.hasFullAccess) {
      // Student mua full course - lấy tất cả lessons
      lessons = await Lesson.find({
        courseId: this.courseId,
        status: { $in: ['published', 'completed'] }
      }).sort({ order: 1 });
    } else {
      // Student mua lesson riêng lẻ - chỉ lấy lessons đã mua
      const purchasedLessonIds = this.purchasedLessons.map(p => p.lessonId);
      if (purchasedLessonIds.length > 0) {
        lessons = await Lesson.find({
          _id: { $in: purchasedLessonIds },
          status: { $in: ['published', 'completed'] }
        }).sort({ order: 1 });
      }
    }
  } catch (error) {
    console.error("Error in getAccessibleLessons:", error);
  }

  return lessons;
};

// 🆕 THÊM: Middleware để tự động cập nhật progress trước khi save
enrollmentSchema.pre('save', function(next) {
  if (this.isModified('progress.completedLessons') || this.isNew) {
    this.progress.lastAccessed = new Date();
  }
  next();
});

// 🆕 THÊM: Static method để tìm enrollment với đầy đủ thông tin
enrollmentSchema.statics.findByStudentAndCourse = function(studentId, courseId) {
  return this.findOne({ studentId, courseId })
    .populate('progress.completedLessons.lessonId')
    .populate('purchasedLessons.lessonId');
};

// 🆕 THÊM: Static method để lấy tất cả enrollments của student với thông tin đầy đủ
enrollmentSchema.statics.findByStudentId = function(studentId, options = {}) {
  const { status, page = 1, limit = 10 } = options;
  
  const query = { studentId };
  if (status && status !== 'all') {
    query.status = status;
  }

  return this.find(query)
    .populate('courseId', 'title thumbnail description instructor category level pricingType fullCoursePrice currentEnrollments maxStudents status ratings lessons')
    .populate('progress.completedLessons.lessonId', 'title order duration')
    .sort({ enrolledAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .lean();
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);