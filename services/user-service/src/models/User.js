const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student'
  },
  profile: {
    avatar: String,
    bio: String,
    dateOfBirth: Date,
    phone: String,
    address: {
      street: String,
      city: String,
      country: String
    },
    skills: [String],
    experience: String,
    education: String,
    socialLinks: {
      linkedin: String,
      facebook: String,
      website: String,
      twitter: String
    }
  },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    language: { type: String, default: 'vi' },
    timezone: { type: String, default: 'Asia/Ho_Chi_Minh' }
  },
  stats: {
    coursesCompleted: { type: Number, default: 0 },
    totalLearningHours: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);