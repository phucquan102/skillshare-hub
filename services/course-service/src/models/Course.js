// course-service/src/models/Course.js
const mongoose = require('mongoose');

// CẬP NHẬT: Schedule schema với thông tin meeting online
const scheduleSchema = new mongoose.Schema({
  dayOfWeek: { 
    type: Number, 
    required: true,
    min: 0,
    max: 6 
  }, // 0: Chủ nhật, 1: Thứ 2, ..., 6: Thứ 7
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
  // THÊM: Thông tin phòng học online
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
  // THÊM: Trạng thái schedule
  isActive: {
    type: Boolean,
    default: true
  },
  // THÊM: Ghi chú cho schedule
  notes: String
}, { _id: true }); // THÊM: _id để có thể reference

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

// Schema cho gallery images với metadata
const galleryImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  alt: { type: String, default: '' },
  caption: { type: String, default: '' },
  order: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false }
});

// THÊM: Schema cho course settings
const courseSettingsSchema = new mongoose.Schema({
  allowIndividualLessonPurchase: {
    type: Boolean,
    default: true
  },
  autoCreateLessonsFromSchedules: {
    type: Boolean,
    default: true
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
  }
});

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
  discount: discountSchema,
  lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
  
  // CẬP NHẬT: Schedules với thông tin đầy đủ
  schedules: [scheduleSchema],
  
  duration: { type: Number, default: 0 },
  maxStudents: { type: Number, default: 20, min: 1, max: 100 },
  currentEnrollments: { type: Number, default: 0 },
  prerequisites: [String],
  learningOutcomes: [String],
  materialsIncluded: [String],
  requirements: [String],
  tags: [String],
  language: { type: String, enum: ['en', 'vi'], default: 'vi' },
  
  // THÊM: Course settings
  settings: {
    type: courseSettingsSchema,
    default: () => ({})
  },

  // THÊM: Thông tin khóa học online
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
    type: Number, // in minutes
    default: 90
  },

  // ========== CÁC TRƯỜNG ẢNH ĐÃ ĐƯỢC CẬP NHẬT ==========
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
  // ========== END CÁC TRƯỜNG ẢNH ==========
  
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

  // THÊM: Metadata cho khóa học online
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
    totalReviews: { type: Number, default: 0 }
  }

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

courseSchema.index({ instructor: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ 'ratings.average': -1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ featured: -1 });
courseSchema.index({ 'schedules.dayOfWeek': 1 });
courseSchema.index({ 'schedules.startTime': 1 });
courseSchema.index({ courseType: 1 });

// Text search index
courseSchema.index({ title: 'text', description: 'text', tags: 'text' }, { 
  default_language: 'english',
  language_override: 'en',
  weights: {
    title: 10,
    tags: 5,
    description: 1
  }
});

// Virtuals
courseSchema.virtual('availableSpots').get(function() {
  return Math.max(0, this.maxStudents - this.currentEnrollments);
});

courseSchema.virtual('totalLessons').get(function() {
  return this.lessons ? this.lessons.length : 0;
});

courseSchema.virtual('isFull').get(function() {
  return this.currentEnrollments >= this.maxStudents;
});

// THÊM: Virtual cho schedules
courseSchema.virtual('activeSchedules').get(function() {
  if (!this.schedules) return [];
  return this.schedules.filter(schedule => schedule.isActive);
});

courseSchema.virtual('upcomingSchedules').get(function() {
  if (!this.schedules) return [];
  const now = new Date();
  const today = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5);
  
  return this.schedules.filter(schedule => {
    if (!schedule.isActive) return false;
    
    const scheduleTime = schedule.startTime;
    if (schedule.dayOfWeek > today) return true;
    if (schedule.dayOfWeek === today && scheduleTime > currentTime) return true;
    return false;
  });
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

// THÊM: Virtual để kiểm tra có thể mua lesson riêng không
courseSchema.virtual('canPurchaseIndividualLessons').get(function() {
  return this.pricingType === 'per_lesson' || this.pricingType === 'both';
});

// THÊM: Virtual để tính giá trung bình mỗi lesson
courseSchema.virtual('averageLessonPrice').get(function() {
  if (!this.fullCoursePrice || !this.schedules || this.schedules.length === 0) return 0;
  return Math.round(this.fullCoursePrice / this.schedules.length);
});

// Pre-save hooks
courseSchema.pre('save', async function(next) {
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
  }

  // Cập nhật metadata
  if (this.isModified('pricingType') || this.isModified('schedules')) {
    this.metadata.supportsIndividualPurchase = this.pricingType === 'per_lesson' || this.pricingType === 'both';
    this.metadata.hasLiveSessions = this.courseType === 'live_online' || this.courseType === 'hybrid';
  }
  
  // Tạo slug từ title nếu chưa có
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
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

// THÊM: Method để thêm schedule
courseSchema.methods.addSchedule = function(scheduleData) {
  this.schedules.push(scheduleData);
  this.totalSessions = this.schedules.length;
  return this.save();
};

// THÊM: Method để xóa schedule
courseSchema.methods.removeSchedule = function(scheduleIndex) {
  if (this.schedules[scheduleIndex]) {
    this.schedules.splice(scheduleIndex, 1);
    this.totalSessions = this.schedules.length;
    return this.save();
  }
  return Promise.resolve(this);
};

// THÊM: Method để cập nhật schedule
courseSchema.methods.updateSchedule = function(scheduleIndex, updateData) {
  if (this.schedules[scheduleIndex]) {
    this.schedules[scheduleIndex] = {
      ...this.schedules[scheduleIndex].toObject(),
      ...updateData
    };
    return this.save();
  }
  return Promise.resolve(this);
};

// THÊM: Method để lấy schedule theo dayOfWeek
courseSchema.methods.getSchedulesByDay = function(dayOfWeek) {
  return this.schedules.filter(schedule => schedule.dayOfWeek === dayOfWeek && schedule.isActive);
};

// THÊM: Method để kiểm tra xem course có schedule không
courseSchema.methods.hasSchedules = function() {
  return this.schedules && this.schedules.length > 0;
};

// THÊM: Method để lấy schedule sắp tới
courseSchema.methods.getNextSchedule = function() {
  if (!this.schedules || this.schedules.length === 0) return null;
  
  const now = new Date();
  const today = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5);
  
  const activeSchedules = this.schedules.filter(s => s.isActive);
  
  // Sắp xếp schedules theo ngày và giờ
  const sortedSchedules = activeSchedules.sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return a.startTime.localeCompare(b.startTime);
  });
  
  // Tìm schedule tiếp theo
  for (let schedule of sortedSchedules) {
    if (schedule.dayOfWeek > today) return schedule;
    if (schedule.dayOfWeek === today && schedule.startTime > currentTime) return schedule;
  }
  
  // Nếu không tìm thấy trong tuần này, trả về schedule đầu tiên của tuần sau
  return sortedSchedules[0] || null;
};

// Post-save hook để update related data
courseSchema.post('save', function(doc, next) {
  // Có thể thêm logic để clear cache hoặc update search index
  next();
});

// Static methods
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

// THÊM: Static method để tìm courses theo schedule day
courseSchema.statics.findByScheduleDay = function(dayOfWeek) {
  return this.find({ 
    status: 'published',
    isActive: true,
    'schedules.dayOfWeek': dayOfWeek,
    'schedules.isActive': true
  });
};

// THÊM: Static method để tìm courses online
courseSchema.statics.findOnlineCourses = function() {
  return this.find({
    status: 'published',
    isActive: true,
    courseType: { $in: ['live_online', 'hybrid'] }
  });
};

// Instance methods
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

module.exports = mongoose.model('Course', courseSchema);