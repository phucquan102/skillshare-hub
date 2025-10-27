const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['direct', 'course'],
    required: true,
    default: 'direct'
  },
  
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true // ❌ bỏ ref: 'User'
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
  
  title: { type: String, trim: true, maxlength: 200 },
  description: { type: String, maxlength: 500 },
  
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  }

}, { timestamps: true });

// Indexes
conversationSchema.index({ 'participants.userId': 1 });
conversationSchema.index({ courseId: 1 });
conversationSchema.index({ type: 1 });
conversationSchema.index({ updatedAt: -1 });

// Static: find direct
conversationSchema.statics.findDirectConversation = function(userId1, userId2) {
  return this.findOne({
    type: 'direct',
    participants: {
      $all: [
        { $elemMatch: { userId: userId1 } },
        { $elemMatch: { userId: userId2 } }
      ]
    }
  });
};

// Instance: check participant
conversationSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => p.userId.toString() === userId.toString());
};

module.exports = mongoose.model('Conversation', conversationSchema);
