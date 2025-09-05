const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  duration: {
    type: Number, // minutes
    required: true
  },
  price: {
    type: Number,
    required: function() {
      return this.parent().pricingType === 'per_lesson';
    }
  },
  order: {
    type: Number,
    required: true
  },
  materials: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['pdf', 'video', 'document', 'link']
    }
  }]
});

const scheduleSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number, // 0=Sunday, 1=Monday, ..., 6=Saturday
    required: true
  },
  startTime: {
    type: String, // "09:00"
    required: true
  },
  endTime: {
    type: String, // "11:00"
    required: true
  },
  timezone: {
    type: String,
    default: 'Asia/Ho_Chi_Minh'
  }
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  shortDescription: {
    type: String,
    maxlength: 300
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'programming', 'design', 'business', 'marketing', 
      'language', 'music', 'photography', 'cooking', 
      'fitness', 'art', 'writing', 'other'
    ]
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
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
    min: 0
  },
  currency: {
    type: String,
    default: 'VND',
    enum: ['VND', 'USD']
  },
  lessons: [lessonSchema],
  schedules: [scheduleSchema],
  duration: {
    type: Number, // Total duration in minutes
    default: 0
  },
  maxStudents: {
    type: Number,
    default: 20,
    min: 1,
    max: 100
  },
  currentEnrollments: {
    type: Number,
    default: 0
  },
  tags: [String],
  requirements: [String], // Prerequisites
  whatYouWillLearn: [String], // Learning outcomes
  thumbnail: {
    type: String,
    default: ''
  },
  images: [String],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'suspended'],
    default: 'draft'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
courseSchema.index({ instructor: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ 'ratings.average': -1 });
courseSchema.index({ createdAt: -1 });

// Virtual for enrollment availability
courseSchema.virtual('availableSpots').get(function() {
  return this.maxStudents - this.currentEnrollments;
});

// Virtual for total course duration
courseSchema.pre('save', function(next) {
  if (this.lessons && this.lessons.length > 0) {
    this.duration = this.lessons.reduce((total, lesson) => total + lesson.duration, 0);
  }
  next();
});

module.exports = mongoose.model('Course', courseSchema);
