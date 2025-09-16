// course-service/src/models/Lesson.js
const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  order: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // minutes
    required: true
  },
  price: {
    type: Number,
    min: 0
  },
  type: {
    type: String,
    enum: ['video', 'quiz', 'assignment', 'live', 'text'],
    required: true
  },
  content: {
    type: mongoose.Schema.Types.Mixed
  },
  resources: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['pdf', 'video', 'document', 'link']
    }
  }],
  isPreview: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  schedule: {
    dayOfWeek: { type: Number },
    startTime: String,
    endTime: String,
    timezone: { type: String, default: 'Asia/Ho_Chi_Minh' }
  },
  requirements: [String],
  objectives: [String],
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

lessonSchema.index({ courseId: 1 });
lessonSchema.index({ order: 1 });
lessonSchema.index({ status: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);