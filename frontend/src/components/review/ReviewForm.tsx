import React, { useState } from 'react';
import { reviewService } from '../../services/api/reviewService';
import { 
  FiStar, 
  FiSend, 
  FiCheckCircle, 
  FiXCircle,
  FiPlus,
  FiX
} from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi';

interface ReviewFormProps {
  courseId: string;
  onReviewSubmitted?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ 
  courseId, 
  onReviewSubmitted 
}) => {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPro, setCurrentPro] = useState('');
  const [currentCon, setCurrentCon] = useState('');

  const handleAddPro = () => {
    if (currentPro.trim() && !pros.includes(currentPro.trim())) {
      setPros([...pros, currentPro.trim()]);
      setCurrentPro('');
    }
  };

  const handleAddCon = () => {
    if (currentCon.trim() && !cons.includes(currentCon.trim())) {
      setCons([...cons, currentCon.trim()]);
      setCurrentCon('');
    }
  };

  const handleRemovePro = (index: number) => {
    setPros(pros.filter((_, i) => i !== index));
  };

  const handleRemoveCon = (index: number) => {
    setCons(cons.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      setError('Please enter a comment');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Comment must be at least 10 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await reviewService.createReview({
        courseId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        pros,
        cons,
        wouldRecommend
      });

      setSuccess('Review submitted successfully! 🎉');
      
      // Reset form
      setRating(5);
      setTitle('');
      setComment('');
      setPros([]);
      setCons([]);
      setWouldRecommend(true);
      setCurrentPro('');
      setCurrentCon('');

      setTimeout(() => {
        onReviewSubmitted?.();
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      const errorMsg = err.response?.data?.error || 
                       err.response?.data?.details ||
                       'Failed to submit review';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            className={`p-2 rounded-2xl transition-all duration-200 ${
              star <= rating 
                ? 'bg-amber-500 text-white scale-110' 
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
            onClick={() => setRating(star)}
          >
            <FiStar className="w-6 h-6" fill={star <= rating ? 'currentColor' : 'none'} />
          </button>
        ))}
        <span className="ml-2 text-lg font-bold text-gray-700">
          {rating}.0 / 5
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl">
          <HiOutlineSparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-emerald-700 bg-clip-text text-transparent">
            Share Your Experience
          </h3>
          <p className="text-gray-600">Help others make the right choice</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Course Rating
          </label>
          {renderStars()}
        </div>

        {/* Title */}
        <div className="space-y-3">
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700">
            Review Title (Optional)
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience..."
            maxLength={100}
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 outline-none"
          />
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Optional</span>
            <span className="text-gray-500">{title.length}/100</span>
          </div>
        </div>

        {/* Comment */}
        <div className="space-y-3">
          <label htmlFor="comment" className="block text-sm font-semibold text-gray-700">
            Your Detailed Review
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like about this course? What could be improved? Share your honest thoughts..."
            maxLength={1000}
            rows={5}
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 outline-none resize-none"
            required
          />
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Minimum 10 characters</span>
            <span className={`${comment.length < 10 ? 'text-red-500' : 'text-gray-500'}`}>
              {comment.length}/1000
            </span>
          </div>
        </div>

        {/* Pros */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            What you liked
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={currentPro}
              onChange={(e) => setCurrentPro(e.target.value)}
              placeholder="Add something you liked..."
              className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 outline-none"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddPro();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddPro}
              className="px-4 py-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all duration-200 font-semibold flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {pros.map((pro, index) => (
              <span key={index} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-2xl text-sm font-medium border border-emerald-200">
                <FiCheckCircle className="w-4 h-4" />
                {pro}
                <button
                  type="button"
                  onClick={() => handleRemovePro(index)}
                  className="hover:text-emerald-900 transition-colors duration-200"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Cons */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            What could be improved
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={currentCon}
              onChange={(e) => setCurrentCon(e.target.value)}
              placeholder="Add area for improvement..."
              className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 outline-none"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCon();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddCon}
              className="px-4 py-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-all duration-200 font-semibold flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {cons.map((con, index) => (
              <span key={index} className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-2xl text-sm font-medium border border-red-200">
                <FiXCircle className="w-4 h-4" />
                {con}
                <button
                  type="button"
                  onClick={() => handleRemoveCon(index)}
                  className="hover:text-red-900 transition-colors duration-200"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Recommendation */}
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-200">
          <input
            type="checkbox"
            id="recommend"
            checked={wouldRecommend}
            onChange={(e) => setWouldRecommend(e.target.checked)}
            className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500"
          />
          <label htmlFor="recommend" className="text-sm font-semibold text-gray-700 cursor-pointer">
            I would recommend this course to others
          </label>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
            <div className="flex items-center gap-2 text-red-700">
              <FiXCircle className="w-5 h-5" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <div className="flex items-center gap-2 text-emerald-700">
              <FiCheckCircle className="w-5 h-5" />
              <span className="font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting Review...
            </>
          ) : (
            <>
              <FiSend className="w-5 h-5" />
              Submit Your Review
            </>
          )}
        </button>
      </form>
    </div>
  );
};