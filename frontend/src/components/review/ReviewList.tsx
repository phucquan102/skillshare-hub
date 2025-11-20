import React, { useState, useEffect } from 'react';
import { reviewService } from '../../services/api/reviewService';
import { Review, ReviewResponse, UserProfile } from '../../types/review.types';
import { 
  FiThumbsUp, 
  FiMessageCircle, 
  FiShare2, 
  FiStar,
  FiUser,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiSend,
  FiX
} from 'react-icons/fi';
import { HiOutlineSparkles, HiOutlineAcademicCap } from 'react-icons/hi';

interface ReviewListProps {
  courseId: string;
  currentUser?: any;
}

export const ReviewList: React.FC<ReviewListProps> = ({ courseId, currentUser }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyMessages, setReplyMessages] = useState<{[key: string]: string}>({});
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);

  useEffect(() => {
    console.log('👤 Current User in ReviewList:', currentUser);
    console.log('🎯 User roles:', currentUser?.roles);
    console.log('🔍 Is instructor?', currentUser?.roles?.includes('instructor'));
    console.log('📝 FullName:', currentUser?.fullName);
    console.log('🆔 UserID:', currentUser?._id);
  }, [currentUser]);

  useEffect(() => {
    loadReviews();
  }, [courseId, page]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response: ReviewResponse = await reviewService.getCourseReviews(
        courseId,
        { page, limit: 10 }
      );
      
      console.log('📥 Reviews API Response:', {
        success: response.success,
        dataLength: response.data?.length,
        firstReviewUserId: response.data?.[0]?.userId,
        firstReviewUserIdType: typeof response.data?.[0]?.userId,
      });
      
      setReviews(response.data || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (err: any) {
      console.error('Failed to load reviews:', err);
      setError(err.response?.data?.details || 'Failed to load reviews');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ FIX: Xử lý cả 2 case - userId là object (populated) hoặc string (ID only)
   */
  const getUserInfo = (review: Review): UserProfile => {
    // Case 1: userId là object (backend đã populate)
    if (typeof review.userId === 'object' && review.userId !== null) {
      console.log(`✅ User populated: ${(review.userId as any).fullName}`);
      return {
        _id: (review.userId as any)._id || '',
        fullName: (review.userId as any).fullName || 'Student',
        email: (review.userId as any).email || '',
        avatar: (review.userId as any).avatar,
        bio: (review.userId as any).bio || ''
      };
    }
    
    // Case 2: userId là string (chỉ có ID, backend chưa populate)
    console.warn(`⚠️ User NOT populated - only ID: ${review.userId}`);
    return {
      _id: review.userId as any,
      fullName: 'Student User', // Fallback
      email: '',
      avatar: undefined,
      bio: ''
    };
  };

  const handleMarkHelpful = async (reviewId: string, index: number) => {
    try {
      const response = await reviewService.markHelpful(reviewId);
      
      const updatedReviews = [...reviews];
      updatedReviews[index].helpfulCount = response.data.helpfulCount;
      
      if (!updatedReviews[index].helpfulBy) {
        updatedReviews[index].helpfulBy = [];
      }
      
      if (response.data.isHelpful) {
        updatedReviews[index].helpfulBy?.push('current-user');
      } else {
        updatedReviews[index].helpfulBy = updatedReviews[index].helpfulBy?.filter(
          id => id !== 'current-user'
        );
      }
      
      setReviews(updatedReviews);
    } catch (err: any) {
      console.error('Failed to mark helpful:', err);
    }
  };

  const startReply = (reviewId: string) => {
    setReplyingTo(reviewId);
    setReplyMessages(prev => ({
      ...prev, 
      [reviewId]: prev[reviewId] || ''
    }));
  };

  const handleReplySubmit = async (reviewId: string) => {
    const message = replyMessages[reviewId]?.trim();
    if (!message) return;

    try {
      setSubmittingReply(reviewId);
      
      const replyResponse = await reviewService.replyToReview(
        reviewId, 
        message,
        {
          _id: currentUser?._id,
          fullName: currentUser?.fullName
        }
      );
      
      console.log('✅ Reply Response:', replyResponse);
      
      setReviews(prevReviews => 
        prevReviews.map(review => {
          if (review._id === reviewId) {
            const updatedReview: Review = {
              ...review,
              reply: {
                message: message,
                repliedAt: new Date().toISOString(),
                repliedBy: currentUser?.fullName || 'Instructor',
                instructorId: currentUser?._id || 'instructor',
                ...(replyResponse.data?.reply || {})
              } as any
            };
            return updatedReview;
          }
          return review;
        })
      );
      
      setReplyMessages(prev => ({...prev, [reviewId]: ''}));
      setReplyingTo(null);
      
    } catch (err: any) {
      console.error('❌ Failed to submit reply:', err);
      setError(err.response?.data?.error || 'Failed to submit reply');
    } finally {
      setSubmittingReply(null);
    }
  };

  const cancelReply = (reviewId: string) => {
    setReplyingTo(null);
    setReplyMessages(prev => ({...prev, [reviewId]: ''}));
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`w-4 h-4 ${
              star <= rating
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
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="w-12 h-12 border-4 border-emerald-200 rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiXCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-red-700 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl">
            <HiOutlineSparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-emerald-700 bg-clip-text text-transparent">
              Student Reviews
            </h2>
            <p className="text-gray-600 text-sm">
              Real feedback from enrolled students
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-2 rounded-2xl border border-emerald-100">
          <span className="text-emerald-700 font-bold">{reviews.length}</span>
          <span className="text-gray-600 ml-1">reviews</span>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-3xl border-2 border-dashed border-gray-300">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiMessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Reviews Yet
            </h3>
            <p className="text-gray-500 text-sm">
              Be the first to share your learning experience!
            </p>
          </div>
        ) : (
          reviews.map((review, index) => {
            const userInfo = getUserInfo(review);
            
            return (
              <div key={review._id} className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
                {/* Header with Student Info */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center overflow-hidden">
                        {userInfo.avatar ? (
                          <img 
                            src={userInfo.avatar} 
                            alt={userInfo.fullName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <FiUser className="w-6 h-6 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Student Name & Date */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-base truncate">
                        {userInfo.fullName}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <FiCalendar className="w-4 h-4 flex-shrink-0" />
                        <span>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Rating */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-2 mb-1">
                      {renderStars(review.rating)}
                      <span className="text-lg font-bold text-gray-900 ml-2">{review.rating}.0</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  {review.title && (
                    <h5 className="text-lg font-semibold text-gray-900">{review.title}</h5>
                  )}
                  
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>

                  {/* Pros & Cons */}
                  {(review.pros?.length || review.cons?.length) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {review.pros && review.pros.length > 0 && (
                        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                          <div className="flex items-center gap-2 mb-2">
                            <FiCheckCircle className="w-5 h-5 text-emerald-500" />
                            <strong className="text-emerald-700">Pros</strong>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {review.pros.map((pro, i) => (
                              <span key={i} className="px-3 py-1 bg-white text-emerald-600 rounded-full text-sm font-medium border border-emerald-200">
                                {pro}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {review.cons && review.cons.length > 0 && (
                        <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                          <div className="flex items-center gap-2 mb-2">
                            <FiXCircle className="w-5 h-5 text-red-500" />
                            <strong className="text-red-700">Cons</strong>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {review.cons.map((con, i) => (
                              <span key={i} className="px-3 py-1 bg-white text-red-600 rounded-full text-sm font-medium border border-red-200">
                                {con}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recommendation */}
                  {review.wouldRecommend !== undefined && (
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl ${
                      review.wouldRecommend 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {review.wouldRecommend ? (
                        <>
                          <FiCheckCircle className="w-4 h-4" />
                          <span className="font-medium">Would Recommend</span>
                        </>
                      ) : (
                        <>
                          <FiXCircle className="w-4 h-4" />
                          <span className="font-medium">Would Not Recommend</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-200">
                  <button 
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-all duration-200 font-medium group"
                    onClick={() => handleMarkHelpful(review._id, index)}
                  >
                    <FiThumbsUp className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                    <span>Helpful ({review.helpfulCount || 0})</span>
                  </button>
                  
                  <button 
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-all duration-200 font-medium group"
                    onClick={() => startReply(review._id)}
                  >
                    <FiMessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                    <span>Reply</span>
                  </button>

                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-all duration-200 font-medium group">
                    <FiShare2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                    <span>Share</span>
                  </button>
                </div>

                {/* Reply Input */}
                {replyingTo === review._id && (
                  <div className="mt-4">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <textarea
                          value={replyMessages[review._id] || ''}
                          onChange={(e) => setReplyMessages(prev => ({
                            ...prev,
                            [review._id]: e.target.value
                          }))}
                          placeholder="Write your reply as instructor..."
                          rows={3}
                          className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 outline-none resize-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              handleReplySubmit(review._id);
                            }
                          }}
                        />
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-500">
                            Press Ctrl+Enter to send quickly
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => cancelReply(review._id)}
                              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 text-sm font-medium"
                            >
                              <FiX className="w-4 h-4" />
                              Cancel
                            </button>
                            <button
                              onClick={() => handleReplySubmit(review._id)}
                              disabled={!replyMessages[review._id]?.trim() || submittingReply === review._id}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
                            >
                              {submittingReply === review._id ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <FiSend className="w-4 h-4" />
                                  Send Reply
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Existing Instructor Reply */}
                {review.reply?.message && typeof review.reply.message === 'string' && review.reply.message.trim() !== '' && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <HiOutlineAcademicCap className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                            Instructor
                          </span>
                          <span className="font-semibold text-blue-700 truncate">
                            {review.reply?.repliedBy || 'Instructor'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {review.reply.repliedAt ? 
                            new Date(review.reply.repliedAt).toLocaleDateString('vi-VN') : 
                            'Recently'
                          }
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700">{review.reply.message}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-emerald-200 text-emerald-600 rounded-2xl hover:bg-emerald-50 hover:border-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
          >
            ← Previous
          </button>
          
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-2 rounded-2xl font-bold">
              {page}
            </span>
            <span className="text-gray-600">of {totalPages}</span>
          </div>
          
          <button 
            disabled={page === totalPages} 
            onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};