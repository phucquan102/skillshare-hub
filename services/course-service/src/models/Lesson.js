// course-service/src/models/Lesson.js
const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['video', 'document', 'quiz', 'assignment', 'text', 'live_stream'],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String },
  url: { type: String }, // URL video, document, etc.
  duration: { type: Number, default: 0 }, // Duration in minutes
  order: { type: Number, default: 0 },
  metadata: mongoose.Schema.Types.Mixed // Flexible field for type-specific data
});

const resourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: {
    type: String,
    enum: ['pdf', 'video', 'document', 'link', 'image', 'code'],
    required: true
  },
  size: { type: Number }, // File size in bytes
  description: { type: String }
});

const lessonSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  shortDescription: {
    type: String,
    maxlength: 300
  },
  order: {
    type: Number,
    required: true,
    min: 1
  },
  
  // ========== PRICING & ACCESS ==========
  price: {
    type: Number,
    min: 0,
    default: 0,
    required: function() {
      const course = this.parent(); // Get course reference
      return course && (course.pricingType === 'per_lesson' || course.pricingType === 'both');
    }
  },
  isPreview: {
    type: Boolean,
    default: false // Cho phép xem trước không cần mua
  },
  isFree: {
    type: Boolean,
    default: false // Bài học miễn phí
  },
  
  // ========== LEARNING CONTENT ==========
  // Multiple content items for each lesson
  contents: [contentSchema],
  
  // Additional resources
  resources: [resourceSchema],
  
  // ========== ONLINE LEARNING ==========
  lessonType: {
    type: String,
    enum: ['self_paced', 'live_online', 'hybrid'],
    default: 'self_paced'
  },
  
  // For live online lessons
  schedule: {
    startTime: { type: Date }, // For live sessions
    endTime: { type: Date },
    duration: { type: Number }, // Total minutes
    timezone: { type: String, default: 'Asia/Ho_Chi_Minh' },
    meetingUrl: { type: String }, // Zoom, Google Meet, etc.
    meetingId: { type: String },
    password: { type: String },
    recordingUrl: { type: String } // For replay
  },
  
  // ========== LEARNING OBJECTIVES ==========
  objectives: [{
    type: String,
    maxlength: 200
  }],
  prerequisites: [{
    type: String,
    maxlength: 200
  }],
  
  // ========== METADATA ==========
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  estimatedStudyTime: {
    type: Number, // in minutes
    default: 0
  },
  tags: [String],
  
  // ========== STATUS & ANALYTICS ==========
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Analytics
  viewCount: {
    type: Number,
    default: 0
  },
  completionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
lessonSchema.index({ courseId: 1, order: 1 });
lessonSchema.index({ courseId: 1, status: 1 });
lessonSchema.index({ 'schedule.startTime': 1 });
lessonSchema.index({ isPreview: 1 });
lessonSchema.index({ isFree: 1 });

// Virtuals
lessonSchema.virtual('totalDuration').get(function() {
  if (this.contents && this.contents.length > 0) {
    return this.contents.reduce((total, content) => total + (content.duration || 0), 0);
  }
  return this.schedule?.duration || 0;
});

lessonSchema.virtual('isLive').get(function() {
  if (this.lessonType !== 'live_online' || !this.schedule?.startTime) return false;
  
  const now = new Date();
  const startTime = new Date(this.schedule.startTime);
  const endTime = new Date(this.schedule.endTime);
  
  return now >= startTime && now <= endTime;
});

lessonSchema.virtual('isUpcoming').get(function() {
  if (this.lessonType !== 'live_online' || !this.schedule?.startTime) return false;
  
  const now = new Date();
  const startTime = new Date(this.schedule.startTime);
  
  return now < startTime;
});

lessonSchema.virtual('hasRecording').get(function() {
  return !!(this.schedule?.recordingUrl);
});

// Pre-save middleware
lessonSchema.pre('save', function(next) {
  // Auto-calculate estimatedStudyTime from contents
  if (this.isModified('contents')) {
    this.estimatedStudyTime = this.totalDuration;
  }
  
  // Validate schedule for live lessons
  if (this.lessonType === 'live_online' && this.schedule) {
    const startTime = new Date(this.schedule.startTime);
    const endTime = new Date(this.schedule.endTime);
    
    if (startTime >= endTime) {
      return next(new Error('End time must be after start time for live lessons'));
    }
    
    this.schedule.duration = Math.round((endTime - startTime) / (1000 * 60)); // Convert to minutes
  }
  
  next();
});

// Static methods
lessonSchema.statics.findByCourse = function(courseId) {
  return this.find({ courseId, status: 'published', isActive: true })
    .sort({ order: 1 });
};

lessonSchema.statics.findPreviewLessons = function(courseId) {
  return this.find({ 
    courseId, 
    $or: [{ isPreview: true }, { isFree: true }],
    status: 'published',
    isActive: true 
  }).sort({ order: 1 });
};

lessonSchema.statics.findLiveLessons = function() {
  return this.find({ 
    lessonType: 'live_online',
    status: 'published',
    isActive: true 
  });
};

// Instance methods
lessonSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

lessonSchema.methods.addContent = function(contentData) {
  this.contents.push(contentData);
  return this.save();
};

lessonSchema.methods.removeContent = function(contentIndex) {
  if (this.contents[contentIndex]) {
    this.contents.splice(contentIndex, 1);
    return this.save();
  }
  return Promise.resolve(this);
};

module.exports = mongoose.model('Lesson', lessonSchema);