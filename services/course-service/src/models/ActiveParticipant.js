// models/ActiveParticipant.js
const mongoose = require('mongoose');

const activeParticipantSchema = new mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true
  },
  userEmail: String,
  userName: String,
  accessType: {
    type: String,
    enum: ['full_course', 'single_lesson', 'free_preview'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  joinedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  leftAt: Date,
  reason: {
    type: String,
    enum: ['user_left', 'meeting_ended', 'timeout', null],
    default: null
  },
  config: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Compound index để tìm nhanh
activeParticipantSchema.index({ lessonId: 1, userId: 1 });
activeParticipantSchema.index({ lessonId: 1, isActive: 1 });

// TTL index - tự xóa sau 24h
activeParticipantSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('ActiveParticipant', activeParticipantSchema);