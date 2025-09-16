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
  currency: { type: String, default: 'VND', enum: ['VND', 'USD'] },
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
  language: { type: String, enum: ['en', 'vi'], default: 'en' },
  thumbnail: { type: String, default: '' },
  promoVideo: { type: String },
  gallery: [String],
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'published', 'rejected', 'archived', 'suspended'],
    default: 'draft'
  },
  approvalStatus: {
    type: {
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      reason: { type: String }
    },
    default: { status: 'pending' }
  },
  featured: { type: Boolean, default: false },
  certificate: certificateSchema,
  ratings: ratingsSchema,
  analytics: analyticsSchema,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

courseSchema.index({ instructor: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ 'ratings.average': -1 });
courseSchema.index({ createdAt: -1 });

courseSchema.virtual('availableSpots').get(function() {
  return this.maxStudents - this.currentEnrollments;
});

courseSchema.pre('save', async function(next) {
  if (this.isModified('lessons')) {
    const lessons = await this.model('Lesson').find({ _id: { $in: this.lessons } });
    this.duration = lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
  }
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Course', courseSchema);