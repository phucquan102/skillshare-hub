import React, { useState, useEffect } from 'react';
import { reviewService } from '../../services/api/reviewService';
import { CourseRating } from '../../types/review.types';
import { FiStar, FiUsers } from 'react-icons/fi';
import { HiOutlineChartBar } from 'react-icons/hi';

interface RatingCardProps {
  courseId: string;
}

export const RatingCard: React.FC<RatingCardProps> = ({ courseId }) => {
  const [rating, setRating] = useState<CourseRating | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRating = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await reviewService.getCourseRating(courseId);
        
        const processedData: CourseRating = {
          courseId: data.courseId || courseId,
          averageRating: data.averageRating || 0,
          totalReviews: data.totalReviews || 0,
          ratingDistribution: data.ratingDistribution || {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
          }
        };
        
        setRating(processedData);
      } catch (error) {
        console.error('Failed to load rating:', error);
        setError('Failed to load rating information');
      } finally {
        setLoading(false);
      }
    };

    loadRating();
  }, [courseId]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`w-5 h-5 ${
              star <= Math.round(rating)
                ? 'text-amber-500 fill-amber-500'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-8">
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-8">
        <div className="text-center text-red-600 py-4">
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  if (!rating || rating.totalReviews === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-8">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiStar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No Ratings Yet
          </h3>
          <p className="text-gray-500 text-sm">
            Be the first to rate this course
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl">
          <HiOutlineChartBar className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-emerald-700 bg-clip-text text-transparent">
            Course Rating
          </h3>
          <p className="text-gray-600 text-sm">Based on student feedback</p>
        </div>
      </div>

      {/* Rating Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Average Rating */}
        <div className="text-center">
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-2xl p-6 shadow-lg">
            <div className="text-5xl font-bold mb-2">{rating.averageRating.toFixed(1)}</div>
            <div className="mb-3">
              {renderStars(rating.averageRating)}
            </div>
            <div className="flex items-center justify-center gap-2 text-amber-100">
              <FiUsers className="w-4 h-4" />
              <span className="font-semibold">
                {rating.totalReviews} {rating.totalReviews === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700 mb-4">Rating Breakdown</h4>
          {[5, 4, 3, 2, 1].map(star => {
            const count = rating.ratingDistribution[star as keyof typeof rating.ratingDistribution] || 0;
            const percentage = rating.totalReviews > 0 
              ? (count / rating.totalReviews) * 100 
              : 0;

            return (
              <div key={star} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-16">
                  <span className="text-sm font-medium text-gray-600 w-4">{star}</span>
                  <FiStar className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
                
                <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-green-500 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                <div className="w-12 text-right">
                  <span className="text-sm font-medium text-gray-700">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600">
            {rating.ratingDistribution[5] || 0}
          </div>
          <div className="text-sm text-gray-600">5 Stars</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {rating.ratingDistribution[4] || 0}
          </div>
          <div className="text-sm text-gray-600">4 Stars</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600">
            {Math.round(rating.averageRating * 10) / 10}
          </div>
          <div className="text-sm text-gray-600">Average</div>
        </div>
      </div>
    </div>
  );
};