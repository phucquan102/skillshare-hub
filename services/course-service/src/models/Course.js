// course-service/src/models/Course.js
const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  dayOfWeek: { type: Number, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  timezone: { type: String, default: 'Asia/Ho_Chi_Minh' }
});

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
  pricingType: { type: String, enum: ['full_course', 'per_lesson', 'both'], required: true, default: 'full_course' },
  fullCoursePrice: {
    type: Number,
    required: function() { return this.pricingType === 'full_course' || this.pricingType === 'both'; },
    min: 0
  },
  currency: { type: String, default: 'USD', enum: ['VND', 'USD'] },
  discount: discountSchema,
  lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
  schedules: [scheduleSchema],
  duration: { type: Number, default: 0 },
  maxStudents: { type: Number, default: 20, min: 1, max: 100 },
  currentEnrollments: { type: Number, default: 0 },
  prerequisites: [String],
  learningOutcomes: [String],
  materialsIncluded: [String],
  requirements: [String],
  tags: [String],
  language: { type: String, enum: ['en', 'vi'], default: 'vi' }, // THÊM tiếng Việt
  
  // ========== CÁC TRƯỜNG ẢNH ĐÃ ĐƯỢC CẬP NHẬT ==========
  thumbnail: { 
    type: String, 
    default: '/images/default-course-thumbnail.jpg',
    validate: {
      validator: function(v) {
        // Cho phép empty string, URL hợp lệ, hoặc đường dẫn local
        return v === '' || 
               /^https?:\/\/.+\..+/.test(v) || 
               v.startsWith('/') || 
               v.startsWith('data:image') ||
               v.startsWith('http');
      },
      message: 'Thumbnail must be a valid URL or file path'
    }
  },
  
  // THÊM: Ảnh cover/banner lớn
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
  
  // CẬP NHẬT: Gallery với schema riêng để có metadata
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
  isActive: { type: Boolean, default: true }
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