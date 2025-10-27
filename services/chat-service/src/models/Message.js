const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true // ❌ bỏ ref: 'User'
  },
  
  content: {
    type: String,
    required: true,
    maxlength: 2000,
    trim: true
  },
  
  type: {
    type: String,
    enum: ['text', 'system'],
    default: 'text'
  },
  
  // Read receipts
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true // ❌ bỏ ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]

}, { timestamps: true });

// Indexes
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ createdAt: 1 });

// Static method — ❌ bỏ .populate('senderId')
messageSchema.statics.findByConversation = function(conversationId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  return this.find({ conversationId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Instance method
messageSchema.methods.markAsRead = function(userId) {
  const alreadyRead = this.readBy.some(read => read.userId.toString() === userId.toString());
  if (!alreadyRead) {
    this.readBy.push({ userId, readAt: new Date() });
  }
  return this.save();
};

module.exports = mongoose.model('Message', messageSchema);
