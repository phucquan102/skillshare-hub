// services/review-service/src/controllers/ratingController.js
const Review = require('../models/Review');
const Rating = require('../models/Rating');

exports.getCourseRating = async (req, res) => {
  try {
    const { courseId } = req.params;
    let rating = await Rating.findOne({ courseId });

    if (!rating) {
      const reviews = await Review.find({ courseId, status: 'APPROVED' });
      if (reviews.length === 0) {
        return res.json({
          courseId,
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
      }

      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = (totalRating / reviews.length).toFixed(1);
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      reviews.forEach(r => {
        distribution[r.rating]++;
      });

      return res.json({
        courseId,
        averageRating: parseFloat(averageRating),
        totalReviews: reviews.length,
        ratingDistribution: distribution
      });
    }

    res.json({
      courseId,
      averageRating: rating.averageRating,
      totalReviews: rating.totalReviews,
      ratingDistribution: rating.ratingDistribution
    });
  } catch (error) {
    console.error('Get course rating error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch rating',
      message: error.message 
    });
  }
};

exports.getTopRatedCourses = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const topCourses = await Rating.find()
      .sort({ averageRating: -1 })
      .limit(parseInt(limit));

    res.json(topCourses);
  } catch (error) {
    console.error('Get top rated courses error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch top rated courses',
      message: error.message 
    });
  }
};

exports.getRatingStats = async (req, res) => {
  try {
    const { courseId } = req.params;
    const rating = await Rating.findOne({ courseId });

    if (!rating) {
      return res.json({
        courseId,
        stats: {
          average: 0,
          total: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
      });
    }

    const percentages = {};
    for (let i = 1; i <= 5; i++) {
      percentages[i] = ((rating.ratingDistribution[i] / rating.totalReviews) * 100).toFixed(1);
    }

    res.json({
      courseId,
      stats: {
        average: rating.averageRating,
        total: rating.totalReviews,
        ratingDistribution: rating.ratingDistribution,
        percentages
      }
    });
  } catch (error) {
    console.error('Get rating stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch rating stats',
      message: error.message 
    });
  }
};

exports.getMultipleCourseRatings = async (req, res) => {
  try {
    const { courseIds } = req.body;

    if (!Array.isArray(courseIds)) {
      return res.status(400).json({ 
        error: 'courseIds must be an array' 
      });
    }

    const ratings = await Rating.find({ courseId: { $in: courseIds } });
    const courseRatings = {};

    courseIds.forEach(id => {
      const rating = ratings.find(r => r.courseId.toString() === id);
      courseRatings[id] = rating ? {
        averageRating: rating.averageRating,
        totalReviews: rating.totalReviews,
        ratingDistribution: rating.ratingDistribution
      } : {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    });

    res.json(courseRatings);
  } catch (error) {
    console.error('Get multiple course ratings error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch multiple ratings',
      message: error.message 
    });
  }
};