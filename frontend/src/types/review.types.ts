export interface UserProfile {
  _id: string;
  fullName: string;
  avatar?: string;
  email: string;
  bio?: string;
}

export interface ReviewReply {
  instructorId: string;
  repliedBy?: string;
  message: string;
  repliedAt: Date;
}

export interface Review {
  _id: string;
  courseId: string;
  userId: UserProfile | string; // ← ACCEPT CẢ 2 LOẠI
  rating: number;
  title?: string;
  comment: string;
  pros?: string[];
  cons?: string[];
  wouldRecommend?: boolean;
  helpfulCount: number;
  helpfulBy?: string[];
  reply?: ReviewReply;
  createdAt: Date;
  updatedAt: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}


export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ✅ FIXED: ReviewResponse type
export interface ReviewResponse {
  success: boolean;
  data: Review[];
  pagination: PaginationInfo;
}

// ✅ FIXED: MarkHelpfulResponse type
export interface MarkHelpfulResponse {
  success: boolean;
  message: string;
  data: {
    helpfulCount: number;
    isHelpful: boolean;
  };
}

export interface CourseRating {
  courseId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    [key: number]: number;
  };
}

// ✅ FIXED: Added RatingStats
export interface RatingStats {
  courseId: string;
  stats: {
    average: number;
    total: number;
    ratingDistribution: {
      [key: number]: number;
    };
    percentages: {
      [key: number]: string;
    };
  };
}