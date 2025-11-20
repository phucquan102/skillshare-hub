import api from './apiConfig';
import { 
  Review, 
  CourseRating, 
  RatingStats, 
  ReviewResponse, 
  MarkHelpfulResponse 
} from '../../types/review.types';

const REVIEWS_API = '/reviews';
const RATINGS_API = '/ratings';

export const reviewService = {
  // Get reviews for a course
  getCourseReviews: async (
    courseId: string,
    options?: { page?: number; limit?: number }
  ): Promise<ReviewResponse> => {
    try {
      if (!courseId) {
        throw new Error('Course ID is required');
      }
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      console.log(`📥 Fetching reviews for course: ${courseId}`);
      
      const response = await api.get<ReviewResponse>(
        `${REVIEWS_API}/course/${courseId}?page=${page}&limit=${limit}`
      );
      
      console.log(`✅ Successfully fetched ${response.data.data?.length || 0} reviews`);
      
      // Populate repliedBy từ instructorId nếu chưa có
      const enrichedData = response.data.data?.map(review => {
        if (review.reply && !review.reply.repliedBy && review.reply.instructorId) {
          return {
            ...review,
            reply: {
              ...review.reply,
              repliedBy: review.reply.instructorId // Tạm thời dùng ID, backend nên populate full name
            }
          };
        }
        return review;
      }) || [];
      
      return {
        ...response.data,
        data: enrichedData
      };
    } catch (error: any) {
      console.error('❌ Failed to get course reviews:', error.message);
      if (error.response?.status === 500) {
        console.error('Backend error details:', error.response?.data);
        throw new Error('Server error. Please check backend logs.');
      }
      throw error;
    }
  },

  // Get user's own reviews
  getUserReviews: async (
    options?: { page?: number; limit?: number }
  ): Promise<ReviewResponse> => {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const response = await api.get<ReviewResponse>(
        `${REVIEWS_API}/my-reviews?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to get user reviews:', error);
      throw error;
    }
  },

  // Create a new review
  createReview: async (reviewData: {
    courseId: string;
    rating: number;
    title?: string;
    comment: string;
    pros?: string[];
    cons?: string[];
    wouldRecommend?: boolean;
  }): Promise<{ data: Review }> => {
    try {
      console.log('📝 Creating review...');
      const response = await api.post<{ data: Review }>(
        REVIEWS_API,
        reviewData
      );
      console.log('✅ Review created successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create review:', error.message);
      throw error;
    }
  },

  // Mark review as helpful
  markHelpful: async (reviewId: string): Promise<MarkHelpfulResponse> => {
    try {
      const response = await api.post<MarkHelpfulResponse>(
        `${REVIEWS_API}/${reviewId}/helpful`
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to mark review as helpful:', error);
      throw error;
    }
  },

  // Get course rating
  getCourseRating: async (courseId: string): Promise<CourseRating> => {
    try {
      if (!courseId) {
        throw new Error('Course ID is required');
      }
      const response = await api.get<CourseRating>(
        `${RATINGS_API}/course/${courseId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to get course rating:', error);
      return {
        courseId,
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }
  },

  // Get rating stats
  getRatingStats: async (courseId: string): Promise<RatingStats> => {
    try {
      const response = await api.get<RatingStats>(
        `${RATINGS_API}/stats/${courseId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to get rating stats:', error);
      throw error;
    }
  },

  // Get top rated courses
  getTopRatedCourses: async (limit: number = 10): Promise<CourseRating[]> => {
    try {
      const response = await api.get<CourseRating[]>(
        `${RATINGS_API}/top-rated?limit=${limit}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to get top rated courses:', error);
      return [];
    }
  },

  // Get multiple course ratings
  getMultipleCourseRatings: async (
    courseIds: string[]
  ): Promise<Record<string, CourseRating>> => {
    try {
      const response = await api.post<Record<string, CourseRating>>(
        `${RATINGS_API}/multiple`,
        { courseIds }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to get multiple course ratings:', error);
      return {};
    }
  },

  // Update review
  updateReview: async (
    reviewId: string,
    updates: Partial<Review>
  ): Promise<{ data: Review }> => {
    try {
      const response = await api.put<{ data: Review }>(
        `${REVIEWS_API}/${reviewId}`,
        updates
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to update review:', error);
      throw error;
    }
  },

  // Delete review
  deleteReview: async (reviewId: string): Promise<{ success: boolean }> => {
    try {
      const response = await api.delete<{ success: boolean }>(
        `${REVIEWS_API}/${reviewId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to delete review:', error);
      throw error;
    }
  },

  // Reply to review - IMPROVED
  replyToReview: async (
    reviewId: string,
    message: string,
    instructorInfo?: { _id: string; fullName?: string }
  ): Promise<{ 
    data: Review & {
      reply?: {
        message: string;
        repliedAt: string;
        instructorId: string;
        repliedBy?: string;
      }
    }
  }> => {
    try {
      console.log('📨 Replying to review:', { reviewId, message });
      
      const response = await api.post<any>(
        `${REVIEWS_API}/${reviewId}/reply`,
        { 
          message,
          repliedBy: instructorInfo?.fullName // ← TRUYỀN TÊN INSTRUCTOR
        }
      );
      
      console.log('✅ Reply sent successfully:', response.data);
      
      // Ensure repliedBy is set
      if (response.data.data?.reply && !response.data.data.reply.repliedBy) {
        response.data.data.reply.repliedBy = instructorInfo?.fullName || 'Instructor';
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to reply to review:', error);
      throw error;
    }
  }
};

export default reviewService;