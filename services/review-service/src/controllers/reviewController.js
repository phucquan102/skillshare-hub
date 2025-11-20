const Review = require('../models/Review');
const Rating = require('../models/Rating');
const { StatusCodes } = require('http-status-codes');
const userServiceClient = require('../utils/userServiceClient'); // Import client

const reviewController = {
  // ✅ FIXED: Get course reviews với user data từ user-service
   getCourseReviews: async (req, res) => {
    try {
      const { courseId } = req.params;
      const { 
        page = 1, 
        limit = 10, 
        status = 'approved', // ✅ SỬA
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      console.log(`📥 [getCourseReviews] courseId=${courseId}, page=${page}, limit=${limit}`);

      // Validate courseId
      if (!courseId || !require('mongoose').Types.ObjectId.isValid(courseId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          error: 'Invalid course ID'
        });
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
      const query = { courseId, status };

      // Lấy reviews từ database
      const reviews = await Review.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean()
        .exec();

      const total = await Review.countDocuments(query);

      // ✅ Lấy user data từ user-service
      let userMap = {};
      if (reviews.length > 0) {
        const userIds = [...new Set(reviews.map(review => review.userId.toString()))];
        userMap = await userServiceClient.getUsersBatch(userIds);
        console.log(`👥 [getCourseReviews] User map size: ${Object.keys(userMap).length}`);
      }

      // Kết hợp reviews với user data
      const reviewsWithUsers = reviews.map(review => {
        const userInfo = userMap[review.userId.toString()] || {
          _id: review.userId,
          fullName: 'Unknown User',
          avatar: '',
          email: 'unknown@example.com',
          profile: {}
        };

        return {
          ...review,
          user: userInfo
        };
      });

      console.log(`✅ [getCourseReviews] Found ${reviews.length} reviews`);

      res.json({
        success: true,
        data: reviewsWithUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('❌ [getCourseReviews] Error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch reviews',
        details: error.message
      });
    }
  },


  createReview: async (req, res) => {
    try {
      const { courseId, rating, title, comment, pros, cons, wouldRecommend } = req.body;
      const userId = req.user.userId;

      console.log(`📝 [createReview] courseId=${courseId}, userId=${userId}`);

      // Validation
      if (!courseId || !rating || !comment) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          error: 'Missing required fields: courseId, rating, comment'
        });
      }

      if (comment.length < 10) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          error: 'Comment must be at least 10 characters'
        });
      }

      // Check if user already reviewed
      const existingReview = await Review.findOne({ courseId, userId });
      if (existingReview) {
        return res.status(StatusCodes.CONFLICT).json({
          success: false,
          error: 'You have already reviewed this course'
        });
      }

      // ✅ SỬA: status thành 'approved'
      const review = new Review({
        courseId,
        userId,
        rating,
        title: title || '',
        comment,
        pros: pros || [],
        cons: cons || [],
        wouldRecommend: wouldRecommend !== undefined ? wouldRecommend : true,
        status: 'approved', // ✅ SỬA
        helpfulCount: 0,
        helpfulBy: []
      });

      await review.save();
      
      // Lấy thông tin user từ user-service
      const userInfo = await userServiceClient.getUserById(userId);
      const reviewWithUser = {
        ...review.toObject(),
        user: userInfo || {
          _id: userId,
          fullName: 'Unknown User',
          avatar: '',
          email: 'unknown@example.com',
          profile: {}
        }
      };

      await updateCourseRating(courseId);

      console.log(`✅ [createReview] Review created`);

      res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Review created successfully',
        data: reviewWithUser
      });
    } catch (error) {
      console.error('❌ [createReview] Error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to create review',
        details: error.message
      });
    }
  },


  getUserReviews: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10 } = req.query;

      console.log(`👤 [getUserReviews] userId=${userId}`);

      const skip = (page - 1) * limit;

      const reviews = await Review.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean()
        .exec();

      const total = await Review.countDocuments({ userId });

      // Lấy thông tin user (có thể là chính user đó) và thông tin course (nếu cần)
      // Ở đây chúng ta chỉ cần user info, nhưng nếu cần course info thì phải gọi course service
      const userInfo = await userServiceClient.getUserById(userId);
      const userMap = {
        [userId]: userInfo || {
          _id: userId,
          fullName: 'Unknown User',
          avatar: '',
          email: 'unknown@example.com',
          profile: {}
        }
      };

      // Kết hợp với user data
      const reviewsWithUser = reviews.map(review => ({
        ...review,
        user: userMap[review.userId.toString()] || {
          _id: review.userId,
          fullName: 'Unknown User',
          avatar: '',
          email: 'unknown@example.com',
          profile: {}
        }
      }));

      res.json({
        success: true,
        data: reviewsWithUser,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('❌ [getUserReviews] Error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch user reviews',
        details: error.message
      });
    }
  },

  updateReview: async (req, res) => {
    try {
      const { reviewId } = req.params;
      const { rating, title, comment, pros, cons, wouldRecommend } = req.body;
      const userId = req.user.userId;

      const review = await Review.findOne({ _id: reviewId, userId });
      if (!review) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          error: 'Review not found'
        });
      }

      if (rating !== undefined) review.rating = rating;
      if (title !== undefined) review.title = title;
      if (comment !== undefined) review.comment = comment;
      if (pros !== undefined) review.pros = pros;
      if (cons !== undefined) review.cons = cons;
      if (wouldRecommend !== undefined) review.wouldRecommend = wouldRecommend;

      await review.save();

      // Lấy thông tin user
      const userInfo = await userServiceClient.getUserById(userId);
      const reviewWithUser = {
        ...review.toObject(),
        user: userInfo || {
          _id: userId,
          fullName: 'Unknown User',
          avatar: '',
          email: 'unknown@example.com',
          profile: {}
        }
      };

      await updateCourseRating(review.courseId);

      res.json({
        success: true,
        message: 'Review updated successfully',
        data: reviewWithUser
      });
    } catch (error) {
      console.error('❌ [updateReview] Error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to update review',
        details: error.message
      });
    }
  },

  deleteReview: async (req, res) => {
    try {
      const { reviewId } = req.params;
      const userId = req.user.userId;

      const review = await Review.findOne({ _id: reviewId, userId });
      if (!review) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          error: 'Review not found'
        });
      }

      const courseId = review.courseId;
      await Review.findByIdAndDelete(reviewId);
      await updateCourseRating(courseId);

      res.json({
        success: true,
        message: 'Review deleted successfully'
      });
    } catch (error) {
      console.error('❌ [deleteReview] Error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to delete review',
        details: error.message
      });
    }
  },

  markHelpful: async (req, res) => {
    try {
      const { reviewId } = req.params;
      const userId = req.user.userId;

      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          error: 'Review not found'
        });
      }

      // Initialize if not exists
      if (!review.helpfulBy) review.helpfulBy = [];
      if (!review.helpfulCount) review.helpfulCount = 0;

      // Toggle helpful
      const userIdStr = userId.toString();
      const alreadyHelpful = review.helpfulBy.some(id => id.toString() === userIdStr);

      if (alreadyHelpful) {
        review.helpfulBy = review.helpfulBy.filter(id => id.toString() !== userIdStr);
        review.helpfulCount = Math.max(0, review.helpfulCount - 1);
      } else {
        review.helpfulBy.push(userId);
        review.helpfulCount += 1;
      }

      await review.save();

      res.json({
        success: true,
        message: alreadyHelpful ? 'Helpful removed' : 'Review marked as helpful',
        data: {
          helpfulCount: review.helpfulCount,
          isHelpful: !alreadyHelpful
        }
      });
    } catch (error) {
      console.error('❌ [markHelpful] Error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to mark helpful',
        details: error.message
      });
    }
  },

  replyToReview: async (req, res) => {
    try {
      const { reviewId } = req.params;
      const { message } = req.body;
      const instructorId = req.user.userId;

      if (!message || message.trim().length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          error: 'Reply message is required'
        });
      }

      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          error: 'Review not found'
        });
      }

      review.reply = {
        instructorId,
        message,
        repliedAt: new Date()
      };

      await review.save();

      // Lấy thông tin user của người viết review và instructor (nếu cần)
      const [userInfo, instructorInfo] = await Promise.all([
        userServiceClient.getUserById(review.userId),
        userServiceClient.getUserById(instructorId)
      ]);

      const reviewWithUser = {
        ...review.toObject(),
        user: userInfo || {
          _id: review.userId,
          fullName: 'Unknown User',
          avatar: '',
          email: 'unknown@example.com',
          profile: {}
        },
        reply: review.reply ? {
          ...review.reply,
          instructor: instructorInfo || {
            _id: instructorId,
            fullName: 'Unknown Instructor',
            avatar: '',
            email: 'unknown@example.com',
            profile: {}
          }
        } : undefined
      };

      res.json({
        success: true,
        message: 'Reply added successfully',
        data: reviewWithUser
      });
    } catch (error) {
      console.error('❌ [replyToReview] Error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to add reply',
        details: error.message
      });
    }
  }
};

// ✅ HELPER: Update course rating
async function updateCourseRating(courseId) {
  try {
    const reviews = await Review.find({ 
      courseId: courseId, 
      status: 'approved',
    });

    if (reviews.length === 0) {
      await Rating.findOneAndDelete({ courseId: courseId });
      console.log(`🗑️  Deleted rating for course ${courseId}`);
      return;
    }

    const totalReviewCount = reviews.length;
    const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviewCount;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating]++;
      }
    });

    await Rating.findOneAndUpdate(
      { courseId: courseId },
      {
        courseId: courseId,
        averageRating: parseFloat(avgRating.toFixed(1)),
        totalRatings: totalReviewCount,
        ratingDistribution: distribution,
        totalReviews: totalReviewCount,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Updated rating for course ${courseId}: avg=${avgRating.toFixed(1)}`);
  } catch (error) {
    console.error('❌ [updateCourseRating] Error:', error);
  }
}

module.exports = reviewController;