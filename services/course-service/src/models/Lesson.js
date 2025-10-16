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
  
  // ========== LIÊN KẾT VỚI SCHEDULE ==========
  scheduleIndex: {
    type: Number,
    required: true,
    min: 0
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
      // Validation sẽ được xử lý ở controller
      return false;
    }
  },
  isPreview: {
    type: Boolean,
    default: false
  },
  isFree: {
    type: Boolean,
    default: false
  },
  
  // ========== LEARNING CONTENT ==========
  contents: [contentSchema],
  resources: [resourceSchema],
  
  // ========== ONLINE LEARNING - THÔNG TIN BUỔI HỌC ONLINE ==========
  lessonType: {
    type: String,
    enum: ['self_paced', 'live_online', 'hybrid'],
    default: 'live_online' // Mặc định là học online trực tiếp
  },
  
  // Thông tin phòng học online (có thể ghi đè từ course schedule)
  meetingUrl: { 
    type: String,
    validate: {
      validator: function(v) {
        return v === undefined || v === '' || /^https?:\/\/.+\..+/.test(v);
      },
      message: 'Meeting URL must be a valid URL'
    }
  },
  meetingId: { type: String },
  meetingPassword: { type: String },
  
  // ========== CÁC TRƯỜNG MỚI CHO JITSI MEETING ==========
  meetingData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isMeetingActive: {
    type: Boolean,
    default: false
  },
  
  // Thời gian thực tế của buổi học (có thể khác với schedule)
  actualStartTime: { type: Date },
  actualEndTime: { type: Date },
  
  // Link ghi hình buổi học
  recordingUrl: { 
    type: String,
    validate: {
      validator: function(v) {
        return v === undefined || v === '' || /^https?:\/\/.+\..+/.test(v);
      },
      message: 'Recording URL must be a valid URL'
    }
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
    enum: ['draft', 'published', 'completed', 'cancelled'],
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
  },

  // ========== THÔNG TIN BỔ SUNG CHO HỆ THỐNG MỚI ==========
  // Số lượng học viên tối đa cho buổi học này
  maxParticipants: {
    type: Number,
    default: 0
  },
  
  // Số lượng học viên đã đăng ký
  currentParticipants: {
    type: Number,
    default: 0
  },
  
  // Thời hạn đăng ký trước buổi học (số phút)
  registrationDeadline: {
    type: Number,
    default: 60 // 60 phút trước khi buổi học bắt đầu
  },
  
  // Thông tin instructor cho buổi học cụ thể (nếu có co-instructor)
  assignedInstructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Metadata bổ sung
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
lessonSchema.index({ courseId: 1, order: 1 });
lessonSchema.index({ courseId: 1, status: 1 });
lessonSchema.index({ courseId: 1, scheduleIndex: 1 });
lessonSchema.index({ isPreview: 1 });
lessonSchema.index({ isFree: 1 });
lessonSchema.index({ lessonType: 1 });
lessonSchema.index({ 'actualStartTime': 1 });
lessonSchema.index({ isMeetingActive: 1 }); // Thêm index cho trường mới

// Virtuals
lessonSchema.virtual('totalDuration').get(function() {
  if (this.contents && this.contents.length > 0) {
    return this.contents.reduce((total, content) => total + (content.duration || 0), 0);
  }
  return 0;
});

// Virtual để lấy thông tin schedule từ course
lessonSchema.virtual('scheduleInfo', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
  options: {
    select: { schedules: { $slice: [this.scheduleIndex, 1] } }
  }
});

// Virtual để kiểm tra xem lesson có đang diễn ra không
lessonSchema.virtual('isLive').get(function() {
  if (this.lessonType !== 'live_online' || !this.actualStartTime || !this.actualEndTime) {
    return false;
  }
  
  const now = new Date();
  const startTime = new Date(this.actualStartTime);
  const endTime = new Date(this.actualEndTime);
  
  return now >= startTime && now <= endTime;
});

// Virtual để kiểm tra xem lesson sắp diễn ra
lessonSchema.virtual('isUpcoming').get(function() {
  if (this.lessonType !== 'live_online' || !this.actualStartTime) {
    return false;
  }
  
  const now = new Date();
  const startTime = new Date(this.actualStartTime);
  
  return now < startTime;
});

// Virtual để kiểm tra xem lesson đã kết thúc
lessonSchema.virtual('isCompleted').get(function() {
  if (this.lessonType !== 'live_online' || !this.actualEndTime) {
    return false;
  }
  
  const now = new Date();
  const endTime = new Date(this.actualEndTime);
  
  return now > endTime;
});

lessonSchema.virtual('hasRecording').get(function() {
  return !!this.recordingUrl;
});

// Virtual để kiểm tra xem lesson còn chỗ trống
lessonSchema.virtual('hasAvailableSpots').get(function() {
  if (this.maxParticipants === 0) return true; // Không giới hạn
  return this.currentParticipants < this.maxParticipants;
});

// Virtual để kiểm tra xem còn thời gian đăng ký
lessonSchema.virtual('canRegister').get(function() {
  if (!this.actualStartTime) return true;
  
  const now = new Date();
  const startTime = new Date(this.actualStartTime);
  const deadline = new Date(startTime.getTime() - (this.registrationDeadline * 60 * 1000));
  
  return now < deadline;
});

// ========== VIRTUAL MỚI CHO MEETING ==========
lessonSchema.virtual('canStartMeeting').get(function() {
  // Instructor có thể bắt đầu meeting nếu lesson là live_online và chưa active
  return this.lessonType === 'live_online' && !this.isMeetingActive;
});

lessonSchema.virtual('canJoinMeeting').get(function() {
  // Có thể join meeting nếu meeting đang active
  return this.lessonType === 'live_online' && this.isMeetingActive;
});

lessonSchema.virtual('meetingStatus').get(function() {
  if (this.lessonType !== 'live_online') return 'not_live';
  if (this.isMeetingActive) return 'active';
  if (this.actualStartTime && new Date() < new Date(this.actualStartTime)) return 'scheduled';
  if (this.actualEndTime && new Date() > new Date(this.actualEndTime)) return 'ended';
  return 'ready';
});

// Pre-save middleware
lessonSchema.pre('save', function(next) {
  // Auto-calculate estimatedStudyTime from contents
  if (this.isModified('contents')) {
    this.estimatedStudyTime = this.totalDuration;
  }

  // 🎯 FIX: Chỉ validate khi cả start và end time đều có giá trị VÀ end time phải sau start time
  if (this.actualStartTime && this.actualEndTime) {
    const start = new Date(this.actualStartTime);
    const end = new Date(this.actualEndTime);
    
    if (end <= start) {
      return next(new Error('End time must be after start time for lessons'));
    }

    // Auto-calculate duration if not provided (tính bằng phút)
    if (!this.duration) {
      this.duration = Math.round((end - start) / (1000 * 60));
    }
  }

  // Ensure estimatedStudyTime has a value
  if (!this.estimatedStudyTime) {
    this.estimatedStudyTime = this.duration || 60;
  }

  // Set default price based on course pricing
  if (this.price === undefined || this.price === null) {
    this.price = 0;
  }

  // Set default status
  if (!this.status) {
    this.status = 'draft';
  }

  // Đảm bảo scheduleIndex không âm
  if (this.scheduleIndex < 0) {
    return next(new Error('Schedule index cannot be negative'));
  }
  
  next();
});
// Post-save hook để đồng bộ với course
lessonSchema.post('save', async function(doc, next) {
  try {
    // Cập nhật thông tin lesson trong course nếu cần
    const Course = mongoose.model('Course');
    await Course.findByIdAndUpdate(doc.courseId, { 
      $addToSet: { lessons: doc._id } 
    });
  } catch (error) {
    console.error('Error updating course with lesson:', error);
  }
  next();
});

// Static methods
lessonSchema.statics.findByCourse = function(courseId) {
  return this.find({ courseId, status: { $ne: 'cancelled' }, isActive: true })
    .sort({ order: 1 })
    .populate('assignedInstructor', 'fullName email profile.avatar');
};

lessonSchema.statics.findPreviewLessons = function(courseId) {
  return this.find({ 
    courseId, 
    $or: [{ isPreview: true }, { isFree: true }],
    status: { $ne: 'cancelled' },
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

lessonSchema.statics.findByScheduleIndex = function(courseId, scheduleIndex) {
  return this.findOne({
    courseId,
    scheduleIndex,
    isActive: true
  });
};

lessonSchema.statics.findUpcomingLessons = function() {
  const now = new Date();
  return this.find({
    lessonType: 'live_online',
    status: 'published',
    isActive: true,
    actualStartTime: { $gt: now }
  }).sort({ actualStartTime: 1 });
};

// ========== STATIC METHODS MỚI CHO MEETING ==========
lessonSchema.statics.findActiveMeetings = function() {
  return this.find({
    lessonType: 'live_online',
    isMeetingActive: true,
    isActive: true
  });
};

lessonSchema.statics.findByMeetingId = function(meetingId) {
  return this.findOne({
    meetingId: meetingId,
    isMeetingActive: true
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

lessonSchema.methods.incrementParticipants = function() {
  if (this.maxParticipants > 0 && this.currentParticipants >= this.maxParticipants) {
    throw new Error('Lesson is full');
  }
  this.currentParticipants += 1;
  return this.save();
};

lessonSchema.methods.decrementParticipants = function() {
  this.currentParticipants = Math.max(0, this.currentParticipants - 1);
  return this.save();
};

lessonSchema.methods.updateMeetingInfo = function(meetingData) {
  const { meetingUrl, meetingId, meetingPassword, meetingData: mData } = meetingData;
  if (meetingUrl) this.meetingUrl = meetingUrl;
  if (meetingId) this.meetingId = meetingId;
  if (meetingPassword) this.meetingPassword = meetingPassword;
  if (mData) this.meetingData = mData;
  return this.save();
};

// ========== INSTANCE METHODS MỚI CHO MEETING ==========
lessonSchema.methods.startMeeting = function(meetingInfo = {}) {
  this.isMeetingActive = true;
  this.actualStartTime = new Date();
  
  // Cập nhật thông tin meeting nếu có
  if (meetingInfo.meetingUrl) this.meetingUrl = meetingInfo.meetingUrl;
  if (meetingInfo.meetingId) this.meetingId = meetingInfo.meetingId;
  if (meetingInfo.meetingData) this.meetingData = meetingInfo.meetingData;
  
  return this.save();
};

lessonSchema.methods.endMeeting = function(recordingUrl = null) {
  this.isMeetingActive = false;
  this.actualEndTime = new Date();
  if (recordingUrl) {
    this.recordingUrl = recordingUrl;
  }
  return this.save();
};

lessonSchema.methods.getMeetingInfo = function() {
  return {
    meetingUrl: this.meetingUrl,
    meetingId: this.meetingId,
    meetingPassword: this.meetingPassword,
    meetingData: this.meetingData,
    isMeetingActive: this.isMeetingActive,
    actualStartTime: this.actualStartTime,
    actualEndTime: this.actualEndTime
  };
};

lessonSchema.methods.completeLesson = function(recordingUrl = null) {
  this.status = 'completed';
  this.actualEndTime = new Date();
  this.isMeetingActive = false;
  if (recordingUrl) {
    this.recordingUrl = recordingUrl;
  }
  return this.save();
};

lessonSchema.methods.cancelLesson = function() {
  this.status = 'cancelled';
  this.isMeetingActive = false;
  return this.save();
};

// Middleware để tự động xóa lesson khỏi course khi bị xóa
lessonSchema.post('remove', async function(doc, next) {
  try {
    const Course = mongoose.model('Course');
    await Course.findByIdAndUpdate(doc.courseId, {
      $pull: { lessons: doc._id }
    });
  } catch (error) {
    console.error('Error removing lesson from course:', error);
  }
  next();
});

module.exports = mongoose.model('Lesson', lessonSchema);