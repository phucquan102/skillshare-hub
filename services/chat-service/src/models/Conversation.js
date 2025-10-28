const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['direct', 'course_group', 'instructor_group'],
    required: true,
    default: 'direct'
  },
  
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    role: {
      type: String,
      enum: ['student', 'instructor', 'admin'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastReadMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    }
  }],
  
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  
  // For course groups
  courseInfo: {
    title: String,
    thumbnail: String
  },
  
  title: { 
    type: String, 
    trim: true, 
    maxlength: 200 
  },
  description: { 
    type: String, 
    maxlength: 500 
  },
  
  // Settings for different conversation types
  settings: {
    allowStudentMessages: { type: Boolean, default: true },
    onlyInstructorsCanPost: { type: Boolean, default: false },
    autoCreateOnEnrollment: { type: Boolean, default: true }
  },
  
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  
  // For archiving
  isActive: { type: Boolean, default: true }

}, { timestamps: true });

// Indexes
conversationSchema.index({ 'participants.userId': 1 });
conversationSchema.index({ courseId: 1 });
conversationSchema.index({ type: 1 });
conversationSchema.index({ updatedAt: -1 });
conversationSchema.index({ isActive: 1 });

// Static methods
conversationSchema.statics.findDirectConversation = function(userId1, userId2) {
  return this.findOne({
    type: 'direct',
    isActive: true,
    participants: {
      $all: [
        { $elemMatch: { userId: userId1 } },
        { $elemMatch: { userId: userId2 } }
      ]
    }
  });
};

conversationSchema.statics.findCourseConversation = function(courseId) {
  return this.findOne({
    type: 'course_group',
    courseId: courseId,
    isActive: true
  });
};

conversationSchema.statics.findUserCourseConversations = function(userId) {
  return this.find({
    'participants.userId': userId,
    type: 'course_group',
    isActive: true
  });
};

// Instance methods
conversationSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => p.userId.toString() === userId.toString());
};

conversationSchema.methods.canSendMessage = function(userId, userRole) {
  if (!this.isActive) return false;
  
  if (this.type === 'direct') {
    return this.isParticipant(userId);
  }
  
  if (this.type === 'course_group') {
    if (this.settings.onlyInstructorsCanPost) {
      return userRole === 'instructor' || userRole === 'admin';
    }
    return this.isParticipant(userId);
  }
  
  return false;
};

module.exports = mongoose.model('Conversation', conversationSchema);