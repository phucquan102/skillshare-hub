// course-service/src/models/Course.js
const mongoose = require('mongoose');

// ========== SCHEMAS PHỤ ==========
const scheduleSchema = new mongoose.Schema({
  dayOfWeek: { 
    type: Number, 
    required: true,
    min: 0,
    max: 6 
  },
  startTime: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Start time must be in HH:mm format'
    }
  },
  endTime: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'End time must be in HH:mm format'
    }
  },
  timezone: { 
    type: String, 
    default: 'Asia/Ho_Chi_Minh' 
  },
  meetingPlatform: {
    type: String,
    enum: ['zoom', 'google_meet', 'microsoft_teams', 'other', 'none'],
    default: 'zoom'
  },
  meetingUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || v.startsWith('http') || v.startsWith('https');
      },
      message: 'Meeting URL must be a valid URL'
    }
  },
  meetingId: String,
  meetingPassword: String,
  isActive: { type: Boolean, default: true },
  notes: String,
  hasLesson: { type: Boolean, default: false },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null }
}, { _id: true });

// DATED SCHEDULE SCHEMA - HỖ TRỢ NGÀY CỤ THỂ
const datedScheduleSchema = new mongoose.Schema({
  date: { 
    type: Date, 
    required: true 
  },
  startTime: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Start time must be in HH:mm format'
    }
  },
  endTime: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'End time must be in HH:mm format'
    }
  },
  timezone: { 
    type: String, 
    default: 'Asia/Ho_Chi_Minh' 
  },
  meetingPlatform: {
    type: String,
    enum: ['zoom', 'google_meet', 'microsoft_teams', 'other', 'none'],
    default: 'zoom'
  },
  meetingUrl: String,
  meetingId: String,
  meetingPassword: String,
  isActive: { type: Boolean, default: true },
  hasLesson: { type: Boolean, default: false },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  //  THÊM: Thông tin giá cho từng buổi học (nếu bán riêng)
  individualPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  //  THÊM: Có được bán riêng không
  availableForIndividualPurchase: {
    type: Boolean,
    default: false
  },
  // THÊM: Ghi chú cho schedule
  notes: {
    type: String,
    default: ''
  }
}, { _id: true });

const discountSchema = new mongoose.Schema({
  percentage: { type: Number, min: 0, max: 100 },
  amount: { type: Number, min: 0 },
  validUntil: { type: Date }
});

const certificateSchema = new mongoose.Schema({
  template: String,
  issuedBy: String,
  isEnabled: { type: Boolean, default: true }
});

const ratingsSchema = new mongoose.Schema({
  average: { type: Number, default: 0, min: 0, max: 5 },
  count: { type: Number, default: 0 }
});

const analyticsSchema = new mongoose.Schema({
  views: { type: Number, default: 0 },
  enrollments: { type: Number, default: 0 },
  completions: { type: Number, default: 0 }
});

const galleryImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  alt: { type: String, default: '' },
  caption: { type: String, default: '' },
  order: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false }
});

// 🆕 CẬP NHẬT: Course settings với hỗ trợ dated schedules
const courseSettingsSchema = new mongoose.Schema({
  allowIndividualLessonPurchase: {
    type: Boolean,
    default: true
  },
  autoCreateLessonsFromSchedules: {
    type: Boolean,
    default: false
  },
  // 🆕 THÊM: Cấu hình cho dated schedules
  useDatedSchedules: {
    type: Boolean,
    default: false // Mặc định dùng schedules cũ, có thể chuyển đổi
  },
  maxStudentsPerLesson: {
    type: Number,
    default: 50
  },
  requireApprovalForEnrollment: {
    type: Boolean,
    default: false
  },
  allowRecordingAccess: {
    type: Boolean,
    default: true
  },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true }
  },
  // 🆕 THÊM: Cấu hình thanh toán lesson riêng
  lessonPricing: {
    allowIndividualPurchase: {
      type: Boolean,
      default: false
    },
    defaultLessonPrice: {
      type: Number,
      min: 0,
      default: 0
    },
    bundleDiscount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  }
});

// ========== COURSE SCHEMA CHÍNH ==========
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  slug: { type: String, unique: true },
  description: { type: String, required: true, maxlength: 2000 },
  shortDescription: { type: String, maxlength: 300 },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coInstructors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  category: {
    type: String,
    required: true,
    enum: ['programming', 'design', 'business', 'marketing', 'language', 'music', 'photography', 'cooking', 'fitness', 'art', 'writing', 'other']
  },
  subcategory: { type: String },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  pricingType: { 
    type: String, 
    enum: ['full_course', 'per_lesson', 'both'], 
    required: true, 
    default: 'full_course' 
  },
  fullCoursePrice: {
    type: Number,
    required: function() { 
      return this.pricingType === 'full_course' || this.pricingType === 'both'; 
    },
    min: 0,
    validate: {
      validator: function(v) {
        if ((this.pricingType === 'full_course' || this.pricingType === 'both') && (!v || v <= 0)) {
          return false;
        }
        return true;
      },
      message: 'Full course price is required when pricing type is full_course or both'
    }
  },
  currency: { type: String, default: 'USD', enum: ['VND', 'USD'] },
  
  //  THÊM: startDate và endDate
  startDate: { 
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v instanceof Date && !isNaN(v);
      },
      message: 'Start date is required and must be a valid date'
    }
  },
  endDate: { 
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v instanceof Date && !isNaN(v);
      },
      message: 'End date is required and must be a valid date'
    }
  },
  
  discount: discountSchema,
  lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
  
  // CẬP NHẬT: Cả schedules cũ và datedSchedules mới
  schedules: [scheduleSchema],
  datedSchedules: [datedScheduleSchema], // 🆕 THÊM: Dated schedules
  
  duration: { type: Number, default: 0 },
  maxStudents: { type: Number, default: 20, min: 1, max: 100 },
  currentEnrollments: { type: Number, default: 0 },
  prerequisites: [String],
  learningOutcomes: [String],
  materialsIncluded: [String],
  requirements: [String],
  tags: [String],
  language: { type: String, default: 'english' },
  
  // THÊM: Course settings
  settings: {
    type: courseSettingsSchema,
    default: () => ({})
  },

  courseType: {
    type: String,
    enum: ['self_paced', 'live_online', 'hybrid', 'in_person'],
    default: 'live_online'
  },
  totalSessions: {
    type: Number,
    default: 0
  },
  sessionDuration: {
    type: Number,
    default: 90
  },

  thumbnail: { 
    type: String, 
    default: '/images/default-course-thumbnail.jpg',
    validate: {
      validator: function(v) {
        return v === '' || 
               /^https?:\/\/.+\..+/.test(v) || 
               v.startsWith('/') || 
               v.startsWith('data:image') ||
               v.startsWith('http');
      },
      message: 'Thumbnail must be a valid URL or file path'
    }
  },
  
  coverImage: { 
    type: String,
    default: '/images/default-course-cover.jpg',
    validate: {
      validator: function(v) {
        return v === '' || 
               /^https?:\/\/.+\..+/.test(v) || 
               v.startsWith('/') || 
               v.startsWith('data:image') ||
               v.startsWith('http');
      },
      message: 'Cover image must be a valid URL or file path'
    }
  },
  
  gallery: [galleryImageSchema],
  
  promoVideo: { 
    type: String,
    validate: {
      validator: function(v) {
        return v === undefined || 
               v === '' || 
               /^https?:\/\/.+\..+/.test(v) ||
               v.startsWith('http');
      },
      message: 'Promo video must be a valid URL'
    }
  },
  
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'published', 'rejected', 'archived', 'suspended'],
    default: 'draft'
  },
  approvalStatus: {
    type: {
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      reason: { type: String },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: { type: Date }
    },
    default: { status: 'pending' }
  },
  featured: { type: Boolean, default: false },
  certificate: certificateSchema,
  ratings: ratingsSchema,
  analytics: analyticsSchema,
  isActive: { type: Boolean, default: true },

  metadata: {
    hasRecordings: { type: Boolean, default: false },
    hasLiveSessions: { type: Boolean, default: true },
    supportsIndividualPurchase: {
      type: Boolean,
      default: function() {
        return this.pricingType === 'per_lesson' || this.pricingType === 'both';
      }
    },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    totalSchedules: { type: Number, default: 0 },
    schedulesWithLessons: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    // 🆕 THÊM: Metadata cho dated schedules
    totalDatedSchedules: { type: Number, default: 0 },
    datedSchedulesWithLessons: { type: Number, default: 0 },
    usesDatedSchedules: {
      type: Boolean,
      default: function() {
        return this.settings?.useDatedSchedules || false;
      }
    }
  }

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ========== INDEXES ==========
courseSchema.index({ title: 'text', description: 'text', shortDescription: 'text', tags: 'text' }, { name: 'course_text_search' });
courseSchema.index({ instructor: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ 'ratings.average': -1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ featured: -1 });
courseSchema.index({ 'schedules.dayOfWeek': 1 });
courseSchema.index({ 'schedules.startTime': 1 });
courseSchema.index({ courseType: 1 });
courseSchema.index({ title: 1 });
courseSchema.index({ description: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ startDate: 1 });
courseSchema.index({ endDate: 1 });
courseSchema.index({ startDate: 1, endDate: 1 });
courseSchema.index({ 'schedules.hasLesson': 1 });
courseSchema.index({ 'schedules.lessonId': 1 });

// 🆕 THÊM: Indexes cho dated schedules
courseSchema.index({ 'datedSchedules.date': 1 });
courseSchema.index({ 'datedSchedules.hasLesson': 1 });
courseSchema.index({ 'datedSchedules.lessonId': 1 });
courseSchema.index({ 'datedSchedules.availableForIndividualPurchase': 1 });

// ========== VIRTUALS ==========
courseSchema.virtual('availableSpots').get(function() {
  return Math.max(0, this.maxStudents - this.currentEnrollments);
});

courseSchema.virtual('totalLessons').get(function() {
  return this.lessons ? this.lessons.length : 0;
});

courseSchema.virtual('isFull').get(function() {
  return this.currentEnrollments >= this.maxStudents;
});

courseSchema.virtual('courseDuration').get(function() {
  if (!this.startDate || !this.endDate) return 'N/A';
  
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) {
    return `${diffDays} ngày`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} tháng`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} năm`;
  }
});

courseSchema.virtual('timeProgress').get(function() {
  if (!this.startDate || !this.endDate) return 0;
  
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const now = new Date();
  
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  
  if (elapsed <= 0) return 0;
  if (elapsed >= totalDuration) return 100;
  
  return Math.round((elapsed / totalDuration) * 100);
});

courseSchema.virtual('timeStatus').get(function() {
  if (!this.startDate || !this.endDate) return 'unknown';
  
  const now = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  
  if (now < start) return 'upcoming';
  if (now > end) return 'completed';
  return 'in_progress';
});

// Virtuals cho schedules cũ
courseSchema.virtual('activeSchedules').get(function() {
  if (!this.schedules) return [];
  return this.schedules.filter(schedule => schedule.isActive);
});

courseSchema.virtual('availableSchedules').get(function() {
  if (!this.schedules) return [];
  return this.schedules.filter(schedule => schedule.isActive && !schedule.hasLesson);
});

courseSchema.virtual('occupiedSchedules').get(function() {
  if (!this.schedules) return [];
  return this.schedules.filter(schedule => schedule.isActive && schedule.hasLesson);
});

// 🆕 THÊM: Virtuals cho dated schedules
courseSchema.virtual('activeDatedSchedules').get(function() {
  if (!this.datedSchedules) return [];
  return this.datedSchedules.filter(schedule => schedule.isActive);
});

courseSchema.virtual('availableDatedSchedules').get(function() {
  if (!this.datedSchedules) return [];
  const now = new Date();
  return this.datedSchedules.filter(schedule => 
    schedule.isActive && 
    !schedule.hasLesson && 
    new Date(schedule.date) >= now
  );
});

courseSchema.virtual('occupiedDatedSchedules').get(function() {
  if (!this.datedSchedules) return [];
  return this.datedSchedules.filter(schedule => schedule.isActive && schedule.hasLesson);
});

courseSchema.virtual('upcomingDatedSchedules').get(function() {
  if (!this.datedSchedules) return [];
  const now = new Date();
  return this.datedSchedules.filter(schedule => 
    schedule.isActive && 
    new Date(schedule.date) >= now
  );
});

courseSchema.virtual('pastDatedSchedules').get(function() {
  if (!this.datedSchedules) return [];
  const now = new Date();
  return this.datedSchedules.filter(schedule => 
    schedule.isActive && 
    new Date(schedule.date) < now
  );
});

courseSchema.virtual('purchasableDatedSchedules').get(function() {
  if (!this.datedSchedules) return [];
  const now = new Date();
  return this.datedSchedules.filter(schedule => 
    schedule.isActive && 
    !schedule.hasLesson && 
    schedule.availableForIndividualPurchase &&
    new Date(schedule.date) >= now
  );
});

courseSchema.virtual('usesDatedScheduling').get(function() {
  return this.settings?.useDatedSchedules || false;
});

courseSchema.virtual('thumbnailUrl').get(function() {
  if (!this.thumbnail) return '/images/default-course-thumbnail.jpg';
  if (this.thumbnail.startsWith('http')) return this.thumbnail;
  return `${process.env.CDN_BASE_URL || ''}${this.thumbnail}`;
});

courseSchema.virtual('coverImageUrl').get(function() {
  if (!this.coverImage) return '/images/default-course-cover.jpg';
  if (this.coverImage.startsWith('http')) return this.coverImage;
  return `${process.env.CDN_BASE_URL || ''}${this.coverImage}`;
});

courseSchema.virtual('galleryUrls').get(function() {
  if (!this.gallery || this.gallery.length === 0) return [];
  return this.gallery.map(img => ({
    ...img.toObject ? img.toObject() : img,
    url: img.url.startsWith('http') ? img.url : `${process.env.CDN_BASE_URL || ''}${img.url}`
  }));
});

courseSchema.virtual('canPurchaseIndividualLessons').get(function() {
  return this.pricingType === 'per_lesson' || this.pricingType === 'both';
});

courseSchema.virtual('averageLessonPrice').get(function() {
  if (!this.fullCoursePrice || !this.schedules || this.schedules.length === 0) return 0;
  return Math.round(this.fullCoursePrice / this.schedules.length);
});

courseSchema.virtual('scheduleCompletionRate').get(function() {
  if (!this.schedules || this.schedules.length === 0) return 0;
  const occupied = this.schedules.filter(s => s.hasLesson).length;
  return Math.round((occupied / this.schedules.length) * 100);
});

// 🆕 THÊM: Virtual cho dated schedules completion rate
courseSchema.virtual('datedScheduleCompletionRate').get(function() {
  if (!this.datedSchedules || this.datedSchedules.length === 0) return 0;
  const occupied = this.datedSchedules.filter(s => s.hasLesson).length;
  return Math.round((occupied / this.datedSchedules.length) * 100);
});

// ========== PRE-SAVE HOOKS ==========
courseSchema.pre('save', async function(next) {
  // Validate dates
  if (this.startDate && this.endDate) {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    
    if (start >= end) {
      return next(new Error('End date must be after start date'));
    }
  }

  // Tính tổng duration từ lessons
  if (this.isModified('lessons')) {
    try {
      const lessons = await this.model('Lesson').find({ _id: { $in: this.lessons } });
      this.duration = lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
    } catch (error) {
      console.error('Error calculating course duration:', error);
    }
  }

  // Cập nhật totalSessions từ schedules
  if (this.isModified('schedules')) {
    this.totalSessions = this.schedules ? this.schedules.length : 0;
    this.metadata.totalSchedules = this.schedules.length;
    this.metadata.schedulesWithLessons = this.schedules.filter(s => s.hasLesson).length;
    this.metadata.completionRate = this.scheduleCompletionRate;
  }

  // 🆕 THÊM: Cập nhật dated schedules metadata
  if (this.isModified('datedSchedules')) {
    this.metadata.totalDatedSchedules = this.datedSchedules.length;
    this.metadata.datedSchedulesWithLessons = this.datedSchedules.filter(s => s.hasLesson).length;
    this.metadata.usesDatedSchedules = this.settings?.useDatedSchedules || false;
  }

  if (this.isModified('schedules.hasLesson') || this.isModified('schedules.lessonId')) {
    this.metadata.schedulesWithLessons = this.schedules.filter(s => s.hasLesson).length;
    this.metadata.completionRate = this.scheduleCompletionRate;
  }

  // 🆕 THÊM: Cập nhật dated schedules khi thay đổi lesson status
  if (this.isModified('datedSchedules.hasLesson') || this.isModified('datedSchedules.lessonId')) {
    this.metadata.datedSchedulesWithLessons = this.datedSchedules.filter(s => s.hasLesson).length;
  }

  // Cập nhật metadata
  if (this.isModified('pricingType') || this.isModified('schedules') || this.isModified('datedSchedules')) {
    this.metadata.supportsIndividualPurchase = this.pricingType === 'per_lesson' || this.pricingType === 'both';
    this.metadata.hasLiveSessions = this.courseType === 'live_online' || this.courseType === 'hybrid';
  }
  
  // Tạo slug từ title nếu chưa có
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Đảm bảo luôn có thumbnail và coverImage
  if (!this.thumbnail || this.thumbnail === '') {
    this.thumbnail = '/images/default-course-thumbnail.jpg';
  }
  
  if (!this.coverImage || this.coverImage === '') {
    this.coverImage = '/images/default-course-cover.jpg';
  }
  
  // Nếu course được publish, set approval status
  if (this.isModified('status') && this.status === 'published') {
    this.approvalStatus = { 
      status: 'approved',
      reviewedAt: new Date()
    };
  }
  
  next();
});

// ========== METHODS CHO SCHEDULES CŨ (GIỮ NGUYÊN) ==========
courseSchema.methods.addSchedule = function(scheduleData) {
  const isDuplicate = this.schedules.some(s => 
    s.dayOfWeek === scheduleData.dayOfWeek && 
    s.startTime === scheduleData.startTime && 
    s.endTime === scheduleData.endTime
  );

  if (isDuplicate) {
    throw new Error('Schedule với cùng ngày và giờ đã tồn tại');
  }

  this.schedules.push({
    ...scheduleData,
    hasLesson: false,
    lessonId: null
  });
  this.totalSessions = this.schedules.length;
  this.metadata.totalSchedules = this.schedules.length;
  return this.save();
};

courseSchema.methods.removeSchedule = async function(scheduleIndex) {
  if (this.schedules[scheduleIndex]) {
    const schedule = this.schedules[scheduleIndex];
    
    if (schedule.hasLesson && schedule.lessonId) {
      const Lesson = mongoose.model('Lesson');
      await Lesson.findByIdAndDelete(schedule.lessonId);
      this.lessons.pull(schedule.lessonId);
    }

    this.schedules.splice(scheduleIndex, 1);
    this.totalSessions = this.schedules.length;
    this.metadata.totalSchedules = this.schedules.length;
    this.metadata.schedulesWithLessons = this.schedules.filter(s => s.hasLesson).length;
    this.metadata.completionRate = this.scheduleCompletionRate;
    
    return this.save();
  }
  return Promise.resolve(this);
};

courseSchema.methods.updateSchedule = function(scheduleIndex, updateData) {
  if (this.schedules[scheduleIndex]) {
    const { hasLesson, lessonId, ...allowedUpdates } = updateData;
    this.schedules[scheduleIndex] = {
      ...this.schedules[scheduleIndex].toObject(),
      ...allowedUpdates
    };
    return this.save();
  }
  return Promise.resolve(this);
};

courseSchema.methods.assignLessonToSchedule = function(scheduleIndex, lessonId) {
  if (this.schedules[scheduleIndex]) {
    if (this.schedules[scheduleIndex].hasLesson) {
      throw new Error('Schedule này đã có bài học');
    }

    this.schedules[scheduleIndex].hasLesson = true;
    this.schedules[scheduleIndex].lessonId = lessonId;
    this.metadata.schedulesWithLessons = this.schedules.filter(s => s.hasLesson).length;
    this.metadata.completionRate = this.scheduleCompletionRate;
    
    return this.save();
  }
  throw new Error('Schedule không tồn tại');
};

courseSchema.methods.removeLessonFromSchedule = function(scheduleIndex) {
  if (this.schedules[scheduleIndex]) {
    this.schedules[scheduleIndex].hasLesson = false;
    this.schedules[scheduleIndex].lessonId = null;
    this.metadata.schedulesWithLessons = this.schedules.filter(s => s.hasLesson).length;
    this.metadata.completionRate = this.scheduleCompletionRate;
    
    return this.save();
  }
  return Promise.resolve(this);
};

// ========== 🆕 METHODS CHO DATED SCHEDULES ==========
courseSchema.methods.addDatedSchedule = function(scheduleData) {
  const scheduleDate = new Date(scheduleData.date);
  const now = new Date();
  
  // Validate date không trong quá khứ
  if (scheduleDate < now) {
    throw new Error('Ngày schedule không được trong quá khứ');
  }

  // Kiểm tra trùng lặp schedule
  const isDuplicate = this.datedSchedules.some(s => 
    new Date(s.date).toDateString() === scheduleDate.toDateString() &&
    s.startTime === scheduleData.startTime
  );

  if (isDuplicate) {
    throw new Error('Đã có schedule vào cùng ngày và giờ này');
  }

  this.datedSchedules.push({
    ...scheduleData,
    date: scheduleDate,
    hasLesson: false,
    lessonId: null
  });
  
  this.metadata.totalDatedSchedules = this.datedSchedules.length;
  return this.save();
};

courseSchema.methods.removeDatedSchedule = async function(scheduleId) {
  const schedule = this.datedSchedules.id(scheduleId);
  if (schedule) {
    // Nếu schedule có lesson, xóa lesson trước
    if (schedule.hasLesson && schedule.lessonId) {
      const Lesson = mongoose.model('Lesson');
      await Lesson.findByIdAndDelete(schedule.lessonId);
      this.lessons.pull(schedule.lessonId);
    }

    this.datedSchedules.pull(scheduleId);
    this.metadata.totalDatedSchedules = this.datedSchedules.length;
    this.metadata.datedSchedulesWithLessons = this.datedSchedules.filter(s => s.hasLesson).length;
    
    return this.save();
  }
  return Promise.resolve(this);
};

courseSchema.methods.updateDatedSchedule = function(scheduleId, updateData) {
  const schedule = this.datedSchedules.id(scheduleId);
  if (schedule) {
    // Không cho phép cập nhật date nếu đã có lesson
    if (updateData.date && schedule.hasLesson) {
      throw new Error('Không thể thay đổi ngày của schedule đã có lesson');
    }

    // Validate date mới không trong quá khứ
    if (updateData.date) {
      const newDate = new Date(updateData.date);
      const now = new Date();
      if (newDate < now) {
        throw new Error('Ngày schedule không được trong quá khứ');
      }
      schedule.date = newDate;
    }

    // Cập nhật các trường khác
    const allowedUpdates = ['startTime', 'endTime', 'timezone', 'meetingPlatform', 
                           'meetingUrl', 'meetingId', 'meetingPassword', 'isActive',
                           'individualPrice', 'availableForIndividualPurchase', 'notes'];
    
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        schedule[field] = updateData[field];
      }
    });

    return this.save();
  }
  throw new Error('Dated schedule không tồn tại');
};

courseSchema.methods.assignLessonToDatedSchedule = function(scheduleId, lessonId) {
  const schedule = this.datedSchedules.id(scheduleId);
  if (schedule) {
    if (schedule.hasLesson) {
      throw new Error('Schedule này đã có bài học');
    }

    schedule.hasLesson = true;
    schedule.lessonId = lessonId;
    this.metadata.datedSchedulesWithLessons = this.datedSchedules.filter(s => s.hasLesson).length;
    
    return this.save();
  }
  throw new Error('Dated schedule không tồn tại');
};

courseSchema.methods.removeLessonFromDatedSchedule = function(scheduleId) {
  const schedule = this.datedSchedules.id(scheduleId);
  if (schedule) {
    schedule.hasLesson = false;
    schedule.lessonId = null;
    this.metadata.datedSchedulesWithLessons = this.datedSchedules.filter(s => s.hasLesson).length;
    
    return this.save();
  }
  return Promise.resolve(this);
};

courseSchema.methods.getDatedSchedule = function(scheduleId) {
  const schedule = this.datedSchedules.id(scheduleId);
  if (!schedule) {
    throw new Error('Dated schedule không tồn tại');
  }
  return schedule;
};

courseSchema.methods.getAvailableDatedSchedules = function() {
  return this.datedSchedules.filter(schedule => 
    schedule.isActive && 
    !schedule.hasLesson
  );
};

courseSchema.methods.getPurchasableDatedSchedules = function() {
  const now = new Date();
  return this.datedSchedules.filter(schedule => 
    schedule.isActive && 
    !schedule.hasLesson && 
    schedule.availableForIndividualPurchase &&
    new Date(schedule.date) >= now
  );
};

courseSchema.methods.enableDatedScheduling = function() {
  if (!this.settings) {
    this.settings = {};
  }
  this.settings.useDatedSchedules = true;
  this.metadata.usesDatedSchedules = true;
  return this.save();
};

courseSchema.methods.disableDatedScheduling = function() {
  if (!this.settings) {
    this.settings = {};
  }
  this.settings.useDatedSchedules = false;
  this.metadata.usesDatedSchedules = false;
  return this.save();
};

// ========== CÁC METHODS KHÁC ==========
courseSchema.methods.getSchedulesByDay = function(dayOfWeek) {
  return this.schedules.filter(schedule => schedule.dayOfWeek === dayOfWeek && schedule.isActive);
};

courseSchema.methods.getAvailableSchedules = function() {
  return this.schedules.filter(schedule => schedule.isActive && !schedule.hasLesson);
};

courseSchema.methods.getOccupiedSchedules = function() {
  return this.schedules.filter(schedule => schedule.isActive && schedule.hasLesson);
};

courseSchema.methods.hasSchedules = function() {
  return this.schedules && this.schedules.length > 0;
};

courseSchema.methods.hasAvailableSchedules = function() {
  return this.getAvailableSchedules().length > 0;
};

courseSchema.methods.hasDatedSchedules = function() {
  return this.datedSchedules && this.datedSchedules.length > 0;
};

courseSchema.methods.hasAvailableDatedSchedules = function() {
  return this.getAvailableDatedSchedules().length > 0;
};

courseSchema.methods.getNextSchedule = function() {
  if (!this.schedules || this.schedules.length === 0) return null;
  
  const now = new Date();
  const today = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5);
  
  const activeSchedules = this.schedules.filter(s => s.isActive);
  const sortedSchedules = activeSchedules.sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return a.startTime.localeCompare(b.startTime);
  });
  
  for (let schedule of sortedSchedules) {
    if (schedule.dayOfWeek > today) return schedule;
    if (schedule.dayOfWeek === today && schedule.startTime > currentTime) return schedule;
  }
  
  return sortedSchedules[0] || null;
};

// 🆕 THÊM: Method để lấy next dated schedule
courseSchema.methods.getNextDatedSchedule = function() {
  if (!this.datedSchedules || this.datedSchedules.length === 0) return null;
  
  const now = new Date();
  const upcomingSchedules = this.datedSchedules
    .filter(s => s.isActive && new Date(s.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return upcomingSchedules[0] || null;
};

courseSchema.methods.getScheduleByIndex = function(scheduleIndex) {
  if (scheduleIndex < 0 || scheduleIndex >= this.schedules.length) {
    throw new Error('Schedule index không hợp lệ');
  }
  return this.schedules[scheduleIndex];
};

courseSchema.methods.isScheduleAvailable = function(scheduleIndex) {
  try {
    const schedule = this.getScheduleByIndex(scheduleIndex);
    return schedule.isActive && !schedule.hasLesson;
  } catch (error) {
    return false;
  }
};

courseSchema.methods.isDatedScheduleAvailable = function(scheduleId) {
  try {
    const schedule = this.getDatedSchedule(scheduleId);
    return schedule.isActive && !schedule.hasLesson;
  } catch (error) {
    return false;
  }
};

courseSchema.methods.isActiveNow = function() {
  if (!this.startDate || !this.endDate) return false;
  
  const now = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  
  return now >= start && now <= end;
};

courseSchema.methods.isCompleted = function() {
  if (!this.endDate) return false;
  
  const now = new Date();
  const end = new Date(this.endDate);
  
  return now > end;
};

courseSchema.methods.isUpcoming = function() {
  if (!this.startDate) return false;
  
  const now = new Date();
  const start = new Date(this.startDate);
  
  return now < start;
};

courseSchema.methods.getDaysRemaining = function() {
  if (!this.endDate) return 0;
  
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

courseSchema.methods.getScheduleInfo = function(scheduleIndex) {
  if (!this.schedules || scheduleIndex < 0 || scheduleIndex >= this.schedules.length) {
    return null;
  }
  
  const schedule = this.schedules[scheduleIndex];
  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  
  return {
    index: scheduleIndex,
    dayOfWeek: schedule.dayOfWeek,
    dayName: dayNames[schedule.dayOfWeek],
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    timezone: schedule.timezone,
    meetingPlatform: schedule.meetingPlatform,
    hasLesson: schedule.hasLesson,
    isActive: schedule.isActive
  };
};

// 🆕 THÊM: Method để lấy dated schedule info
courseSchema.methods.getDatedScheduleInfo = function(scheduleId) {
  const schedule = this.datedSchedules.id(scheduleId);
  if (!schedule) {
    return null;
  }
  
  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const scheduleDate = new Date(schedule.date);
  const dayOfWeek = scheduleDate.getDay();
  
  return {
    _id: schedule._id,
    date: schedule.date,
    dayOfWeek: dayOfWeek,
    dayName: dayNames[dayOfWeek],
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    timezone: schedule.timezone,
    meetingPlatform: schedule.meetingPlatform,
    hasLesson: schedule.hasLesson,
    isActive: schedule.isActive,
    individualPrice: schedule.individualPrice,
    availableForIndividualPurchase: schedule.availableForIndividualPurchase,
    notes: schedule.notes
  };
};

courseSchema.methods.incrementEnrollments = function() {
  this.currentEnrollments += 1;
  return this.save();
};

courseSchema.methods.decrementEnrollments = function() {
  this.currentEnrollments = Math.max(0, this.currentEnrollments - 1);
  return this.save();
};

courseSchema.methods.addToGallery = function(imageData) {
  this.gallery.push(imageData);
  return this.save();
};

courseSchema.methods.removeFromGallery = function(imageIndex) {
  if (this.gallery[imageIndex]) {
    this.gallery.splice(imageIndex, 1);
    return this.save();
  }
  return Promise.resolve(this);
};

// ========== STATIC METHODS ==========
courseSchema.statics.findByInstructor = function(instructorId) {
  return this.find({ instructor: instructorId }).sort({ createdAt: -1 });
};

courseSchema.statics.findPublished = function() {
  return this.find({ status: 'published', isActive: true });
};

courseSchema.statics.findFeatured = function() {
  return this.find({ 
    status: 'published', 
    isActive: true, 
    featured: true 
  }).sort({ createdAt: -1 });
};

courseSchema.statics.findActiveCourses = function() {
  const now = new Date();
  return this.find({
    status: 'published',
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  });
};

courseSchema.statics.findUpcomingCourses = function() {
  const now = new Date();
  return this.find({
    status: 'published',
    isActive: true,
    startDate: { $gt: now }
  });
};

courseSchema.statics.findCompletedCourses = function() {
  const now = new Date();
  return this.find({
    status: 'published',
    isActive: true,
    endDate: { $lt: now }
  });
};

courseSchema.statics.findByScheduleDay = function(dayOfWeek) {
  return this.find({ 
    status: 'published',
    isActive: true,
    'schedules.dayOfWeek': dayOfWeek,
    'schedules.isActive': true
  });
};

courseSchema.statics.findOnlineCourses = function() {
  return this.find({
    status: 'published',
    isActive: true,
    courseType: { $in: ['live_online', 'hybrid'] }
  });
};

courseSchema.statics.findWithAvailableSchedules = function() {
  return this.find({
    status: 'published',
    isActive: true,
    'schedules.isActive': true,
    'schedules.hasLesson': false
  });
};

// 🆕 THÊM: Static methods cho dated schedules
courseSchema.statics.findWithDatedSchedules = function() {
  return this.find({
    status: 'published',
    isActive: true,
    'datedSchedules.0': { $exists: true }
  });
};

courseSchema.statics.findWithAvailableDatedSchedules = function() {
  return this.find({
    status: 'published',
    isActive: true,
    'datedSchedules.isActive': true,
    'datedSchedules.hasLesson': false,
    'datedSchedules.date': { $gte: new Date() }
  });
};

courseSchema.statics.findWithPurchasableLessons = function() {
  return this.find({
    status: 'published',
    isActive: true,
    $or: [
      { 
        pricingType: { $in: ['per_lesson', 'both'] },
        'datedSchedules.availableForIndividualPurchase': true,
        'datedSchedules.isActive': true,
        'datedSchedules.hasLesson': true,
        'datedSchedules.date': { $gte: new Date() }
      },
      {
        pricingType: { $in: ['per_lesson', 'both'] },
        'schedules.hasLesson': true
      }
    ]
  });
};

module.exports = mongoose.model('Course', courseSchema);