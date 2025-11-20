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
  url: { type: String },
  duration: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
  metadata: mongoose.Schema.Types.Mixed
});

const resourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: {
    type: String,
    enum: ['pdf', 'video', 'document', 'link', 'image', 'code'],
    required: true
  },
  size: { type: Number },
  description: { type: String }
});

const lessonSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  
  // 🆕 CẬP NHẬT: Hỗ trợ cả scheduleIndex cũ và datedScheduleId mới
  scheduleIndex: {
    type: Number,
    min: 0,
    required: function() {
      return !this.datedScheduleId; // Chỉ required nếu không có datedScheduleId
    }
  },
  
  datedScheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course.datedSchedules',
    required: function() {
      return !this.scheduleIndex; // Chỉ required nếu không có scheduleIndex
    }
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
  
  // 🆕 THÊM: Ngày và giờ cụ thể (lấy từ dated schedule hoặc tự nhập)
  actualDate: { 
    type: Date 
  },
  actualStartTime: { 
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Start time must be in HH:mm format'
    }
  },
  actualEndTime: { 
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'End time must be in HH:mm format'
    }
  },
  
  // ========== PRICING & ACCESS ==========
  price: {
    type: Number,
    min: 0,
    default: 0
  },
  isPreview: {
    type: Boolean,
    default: false
  },
  isFree: {
    type: Boolean,
    default: false
  },
  
  // 🆕 THÊM: Có được bán riêng không
  availableForIndividualPurchase: {
    type: Boolean,
    default: false
  },
  
  // ========== LEARNING CONTENT ==========
  contents: [contentSchema],
  resources: [resourceSchema],
  
  // ========== ONLINE LEARNING ==========
  lessonType: {
    type: String,
    enum: ['self_paced', 'live_online', 'hybrid'],
    default: 'live_online'
  },
  
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
  
  meetingData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isMeetingActive: {
    type: Boolean,
    default: false
  },
  
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
    type: Number,
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

  // ========== THÔNG TIN BỔ SUNG ==========
  maxParticipants: {
    type: Number,
    default: 0
  },
  
  currentParticipants: {
    type: Number,
    default: 0
  },
  
  registrationDeadline: {
    type: Number,
    default: 60
  },
  
  assignedInstructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ========== INDEXES ==========
lessonSchema.index({ courseId: 1, order: 1 });
lessonSchema.index({ courseId: 1, status: 1 });
lessonSchema.index({ courseId: 1, scheduleIndex: 1 });
lessonSchema.index({ datedScheduleId: 1 });
lessonSchema.index({ isPreview: 1 });
lessonSchema.index({ isFree: 1 });
lessonSchema.index({ lessonType: 1 });
lessonSchema.index({ 'actualDate': 1 });
lessonSchema.index({ isMeetingActive: 1 });
lessonSchema.index({ availableForIndividualPurchase: 1 });

// ========== VIRTUALS ==========
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
  justOne: true
});

// 🆕 THÊM: Virtual để lấy thông tin dated schedule
lessonSchema.virtual('datedScheduleInfo', {
  ref: 'Course',
  localField: 'datedScheduleId',
  foreignField: 'datedSchedules._id',
  justOne: true
});

// Virtual để kiểm tra xem lesson có đang diễn ra không
lessonSchema.virtual('isLive').get(function() {
  if (this.lessonType !== 'live_online') {
    return false;
  }
  
  // Nếu có actualDate và actualStartTime, actualEndTime
  if (this.actualDate && this.actualStartTime && this.actualEndTime) {
    const now = new Date();
    const lessonDate = new Date(this.actualDate);
    const startTime = new Date(lessonDate.toDateString() + ' ' + this.actualStartTime);
    const endTime = new Date(lessonDate.toDateString() + ' ' + this.actualEndTime);
    
    return now >= startTime && now <= endTime;
  }
  
  return this.isMeetingActive;
});

// Virtual để kiểm tra xem lesson sắp diễn ra
lessonSchema.virtual('isUpcoming').get(function() {
  if (this.lessonType !== 'live_online') {
    return false;
  }
  
  if (this.actualDate && this.actualStartTime) {
    const now = new Date();
    const lessonDate = new Date(this.actualDate);
    const startTime = new Date(lessonDate.toDateString() + ' ' + this.actualStartTime);
    
    return now < startTime;
  }
  
  return false;
});

// Virtual để kiểm tra xem lesson đã kết thúc
lessonSchema.virtual('isCompleted').get(function() {
  if (this.lessonType !== 'live_online') {
    return false;
  }
  
  if (this.actualDate && this.actualEndTime) {
    const now = new Date();
    const lessonDate = new Date(this.actualDate);
    const endTime = new Date(lessonDate.toDateString() + ' ' + this.actualEndTime);
    
    return now > endTime;
  }
  
  return this.status === 'completed';
});

lessonSchema.virtual('hasRecording').get(function() {
  return !!this.recordingUrl;
});

lessonSchema.virtual('hasAvailableSpots').get(function() {
  if (this.maxParticipants === 0) return true;
  return this.currentParticipants < this.maxParticipants;
});

lessonSchema.virtual('canRegister').get(function() {
  if (!this.actualDate || !this.actualStartTime) return true;
  
  const now = new Date();
  const lessonDate = new Date(this.actualDate);
  const startTime = new Date(lessonDate.toDateString() + ' ' + this.actualStartTime);
  const deadline = new Date(startTime.getTime() - (this.registrationDeadline * 60 * 1000));
  
  return now < deadline;
});

// 🆕 THÊM: Virtual để kiểm tra xem lesson có thể mua riêng không
lessonSchema.virtual('canBePurchasedIndividually').get(function() {
  return this.availableForIndividualPurchase && this.price > 0;
});

// 🆕 THÊM: Virtual để lấy thông tin schedule type
lessonSchema.virtual('scheduleType').get(function() {
  if (this.datedScheduleId) {
    return 'dated';
  } else if (this.scheduleIndex !== undefined) {
    return 'weekly';
  }
  return 'unscheduled';
});

// ========== PRE-SAVE MIDDLEWARE ==========
lessonSchema.pre('save', async function(next) {
  // Auto-calculate estimatedStudyTime from contents
  if (this.isModified('contents')) {
    this.estimatedStudyTime = this.totalDuration;
  }

  // 🆕 THÊM: Nếu có datedScheduleId, lấy thông tin date và time từ schedule
  if (this.datedScheduleId && this.isNew) {
    try {
      const Course = mongoose.model('Course');
      const course = await Course.findOne({ 
        'datedSchedules._id': this.datedScheduleId 
      });
      
      if (course) {
        const schedule = course.datedSchedules.id(this.datedScheduleId);
        if (schedule) {
          // Copy thông tin từ schedule sang lesson
          this.actualDate = schedule.date;
          this.actualStartTime = schedule.startTime;
          this.actualEndTime = schedule.endTime;
          
          // Copy thông tin giá nếu chưa có
          if (!this.price && schedule.individualPrice > 0) {
            this.price = schedule.individualPrice;
          }
          
          // Copy thông tin individual purchase
          if (this.availableForIndividualPurchase === undefined) {
            this.availableForIndividualPurchase = schedule.availableForIndividualPurchase;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching dated schedule info:', error);
    }
  }

  // Validate actual times
  if (this.actualStartTime && this.actualEndTime) {
    const start = new Date(`2000-01-01T${this.actualStartTime}`);
    const end = new Date(`2000-01-01T${this.actualEndTime}`);
    
    if (end <= start) {
      return next(new Error('End time must be after start time for lessons'));
    }

    // Auto-calculate duration if not provided
    if (!this.duration) {
      this.duration = Math.round((end - start) / (1000 * 60));
    }
  }

  // Ensure estimatedStudyTime has a value
  if (!this.estimatedStudyTime) {
    this.estimatedStudyTime = this.duration || 60;
  }

  // Set default price
  if (this.price === undefined || this.price === null) {
    this.price = 0;
  }

  // Set default status
  if (!this.status) {
    this.status = 'draft';
  }

  // Validate schedule reference
  if (!this.datedScheduleId && (this.scheduleIndex === undefined || this.scheduleIndex === null)) {
    return next(new Error('Lesson must have either datedScheduleId or scheduleIndex'));
  }
  
  next();
});

// 🆕 THÊM: Post-save hook để đồng bộ với course dated schedule
lessonSchema.post('save', async function(doc, next) {
  try {
    const Course = mongoose.model('Course');
    
    // Nếu lesson có datedScheduleId, cập nhật schedule
    if (doc.datedScheduleId) {
      await Course.findOneAndUpdate(
        { 
          'datedSchedules._id': doc.datedScheduleId 
        },
        { 
          $set: { 
            'datedSchedules.$.hasLesson': true,
            'datedSchedules.$.lessonId': doc._id
          },
          $addToSet: { lessons: doc._id }
        }
      );
    } else if (doc.scheduleIndex !== undefined) {
      // Cập nhật cho schedule cũ
      await Course.findByIdAndUpdate(doc.courseId, { 
        $addToSet: { lessons: doc._id } 
      });
    }
  } catch (error) {
    console.error('Error updating course with lesson:', error);
  }
  next();
});

// ========== STATIC METHODS ==========
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

// 🆕 THÊM: Static method để tìm lesson bằng datedScheduleId
lessonSchema.statics.findByDatedScheduleId = function(courseId, datedScheduleId) {
  return this.findOne({
    courseId,
    datedScheduleId,
    isActive: true
  });
};

lessonSchema.statics.findUpcomingLessons = function() {
  const now = new Date();
  return this.find({
    lessonType: 'live_online',
    status: 'published',
    isActive: true,
    $or: [
      { actualDate: { $gt: now } },
      { 
        actualDate: { $exists: false },
        isMeetingActive: false 
      }
    ]
  }).sort({ actualDate: 1, order: 1 });
};

// 🆕 THÊM: Static method để tìm lessons có thể mua riêng
lessonSchema.statics.findPurchasableLessons = function(courseId = null) {
  const query = {
    availableForIndividualPurchase: true,
    price: { $gt: 0 },
    status: 'published',
    isActive: true,
    $or: [
      { actualDate: { $gte: new Date() } },
      { actualDate: { $exists: false } }
    ]
  };
  
  if (courseId) {
    query.courseId = courseId;
  }
  
  return this.find(query)
    .populate('courseId', 'title instructor pricingType')
    .sort({ actualDate: 1, order: 1 });
};

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

// ========== INSTANCE METHODS ==========
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

lessonSchema.methods.startMeeting = function(meetingInfo = {}) {
  this.isMeetingActive = true;
  this.actualStartTime = this.actualStartTime || new Date().toTimeString().slice(0, 5);
  
  if (!this.actualDate) {
    this.actualDate = new Date();
  }
  
  if (meetingInfo.meetingUrl) this.meetingUrl = meetingInfo.meetingUrl;
  if (meetingInfo.meetingId) this.meetingId = meetingInfo.meetingId;
  if (meetingInfo.meetingData) this.meetingData = meetingInfo.meetingData;
  
  return this.save();
};

lessonSchema.methods.endMeeting = function(recordingUrl = null) {
  this.isMeetingActive = false;
  this.actualEndTime = this.actualEndTime || new Date().toTimeString().slice(0, 5);
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
    actualEndTime: this.actualEndTime,
    actualDate: this.actualDate
  };
};

lessonSchema.methods.completeLesson = function(recordingUrl = null) {
  this.status = 'completed';
  this.actualEndTime = this.actualEndTime || new Date().toTimeString().slice(0, 5);
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

// 🆕 THÊM: Method để lấy thông tin schedule
lessonSchema.methods.getScheduleDetails = async function() {
  try {
    const Course = mongoose.model('Course');
    const course = await Course.findById(this.courseId);
    
    if (!course) {
      return null;
    }
    
    if (this.datedScheduleId) {
      const schedule = course.datedSchedules.id(this.datedScheduleId);
      if (schedule) {
        const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        const scheduleDate = new Date(schedule.date);
        const dayOfWeek = scheduleDate.getDay();
        
        return {
          type: 'dated',
          _id: schedule._id,
          date: schedule.date,
          dayOfWeek: dayOfWeek,
          dayName: dayNames[dayOfWeek],
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          timezone: schedule.timezone,
          meetingPlatform: schedule.meetingPlatform,
          individualPrice: schedule.individualPrice,
          availableForIndividualPurchase: schedule.availableForIndividualPurchase
        };
      }
    } else if (this.scheduleIndex !== undefined && course.schedules[this.scheduleIndex]) {
      const schedule = course.schedules[this.scheduleIndex];
      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      
      return {
        type: 'weekly',
        index: this.scheduleIndex,
        dayOfWeek: schedule.dayOfWeek,
        dayName: dayNames[schedule.dayOfWeek],
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        timezone: schedule.timezone,
        meetingPlatform: schedule.meetingPlatform
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting schedule details:', error);
    return null;
  }
};

// Middleware để tự động xóa lesson khỏi course khi bị xóa
lessonSchema.post('remove', async function(doc, next) {
  try {
    const Course = mongoose.model('Course');
    
    // Xóa lesson khỏi course lessons array
    await Course.findByIdAndUpdate(doc.courseId, {
      $pull: { lessons: doc._id }
    });
    
    // Nếu có datedScheduleId, cập nhật schedule
    if (doc.datedScheduleId) {
      await Course.findOneAndUpdate(
        { 
          'datedSchedules._id': doc.datedScheduleId 
        },
        { 
          $set: { 
            'datedSchedules.$.hasLesson': false,
            'datedSchedules.$.lessonId': null
          }
        }
      );
    }
  } catch (error) {
    console.error('Error removing lesson from course:', error);
  }
  next();
});

module.exports = mongoose.model('Lesson', lessonSchema);