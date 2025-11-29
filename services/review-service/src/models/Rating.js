const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      unique: true,
    },
    
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    
    totalRatings: {
      type: Number,
      default: 0,
    },
    
    ratingDistribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 },
    },
    // ✅ FIXED: totalReviews thay vì TotalReviews
    totalReviews: {
      type: Number,
      default: 0,
    },
    // ✅ FIXED: lastUpdated thay vì LastUpdated
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

ratingSchema.pre('save', function (next) {
  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model('Rating', ratingSchema);
