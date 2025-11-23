// frontend/src/types/student.types.ts

// ========== STUDENT COURSE TYPES ==========
export interface StudentCourse {
  enrollmentId: string;
  enrolledAt: string;
  status: string;
  progress: {
    overallProgress: number;
    completedLessons: number;
    lastAccessed: string;
  };
  hasFullAccess: boolean;
  purchasedLessons: number;
  course: {
    _id: string;
    title: string;
    description: string;
    thumbnail: string;
    coverImage?: string;
    instructor: any;
    category: string;
    level: string;
    pricingType: string;
    fullCoursePrice?: number;
    currentEnrollments: number;
    maxStudents: number;
    status: string;
    ratings: {
      average: number;
      count: number;
    };
    totalLessons: number;
  };
}

export interface CourseProgress {
  enrollmentId: string;
  overallProgress: number;
  completedLessons: number;
  totalLessons: number;
  hasFullAccess: boolean;
  purchasedLessons: number;
  enrolledAt: string;
  lastAccessed: string;
  lessons: LessonProgress[];
  course: {
    _id: string;
    title: string;
    description: string;
    thumbnail: string;
  };
}

export interface LessonProgress {
  _id: string;
  title: string;
  order: number;
  duration: number;
  scheduleIndex: number;
  lessonType: string;
  meetingUrl?: string;
  
  // 🆕 THÊM CÁC TRƯỜNG THỜI GIAN THỰC TẾ
  actualDate?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  
  status: string;
  isPreview: boolean;
  isFree: boolean;
  hasAccess: boolean;
  isCompleted: boolean;
  canJoin: boolean;
  progress: number;
  
  // 🆕 CÓ THỂ THÊM CÁC TRƯỜNG KHÁC NẾU CẦN
  description?: string;
  shortDescription?: string;
  meetingId?: string;
  meetingPassword?: string;
  isMeetingActive?: boolean;
  recordingUrl?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  availableForIndividualPurchase?: boolean;
  price?: number;
  assignedInstructor?: any;
  objectives?: string[];
  prerequisites?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedStudyTime?: number;
  tags?: string[];
  viewCount?: number;
  completionRate?: number;
  resources?: Array<{
    name: string;
    url: string;
    type: string;
    size?: number;
    description?: string;
  }>;
  contents?: Array<{
    type: string;
    title: string;
    description?: string;
    url?: string;
    duration?: number;
    order?: number;
    metadata?: any;
  }>;
}

export interface StudentCourseResponse {
  success: boolean;
  message?: string;
  courses: StudentCourse[];
  stats: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCourses: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CourseProgressResponse {
  success: boolean;
  message?: string;
  progress: CourseProgress;
  course: {
    _id: string;
    title: string;
    description: string;
    thumbnail: string;
  };
}

export interface LearningStatistics {
  overview: {
    totalCourses: number;
    completedCourses: number;
    activeCourses: number;
    totalLessons: number;
    completedLessons: number;
    averageProgress: number;
    totalLearningTime: number;
  };
  coursesByCategory: { [key: string]: number };
  recentActivity: Array<{
    courseId: string;
    courseTitle: string;
    lastAccessed: string;
    progress: number;
  }>;
}

// ========== INSTRUCTOR STUDENT LIST TYPES ==========

export interface StudentInfo {
  userId: string;
  fullName: string;
  email: string;
  avatar?: string;
  phoneNumber?: string;
  joinedDate: string;
}

export interface StudentEnrollmentInfo {
  status: 'active' | 'completed' | 'cancelled' | 'paused';
  enrolledAt: string;
  completedAt?: string;
  hasFullAccess: boolean;
  purchasedLessons: number;
}

export interface StudentProgressInfo {
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
  lastAccessed?: string;
}

export interface InstructorStudent {
  enrollmentId: string;
  student: StudentInfo;
  enrollment: StudentEnrollmentInfo;
  progress: StudentProgressInfo;
}

export interface StudentListStats {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
  paused: number;
}

export interface StudentListPagination {
  currentPage: number;
  totalPages: number;
  totalStudents: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface InstructorStudentListResponse {
  success: boolean;
  message?: string;
  students: InstructorStudent[];
  stats: StudentListStats;
  pagination: StudentListPagination;
}

// ========== STUDENT PROGRESS DETAIL (FOR INSTRUCTOR) ==========

export interface CompletedLessonDetail {
  lessonId: string;
  lessonTitle: string;
  lessonOrder: number;
  completedAt: string;
  progress: number;
}

export interface StudentProgressDetailLesson {
  _id: string;
  title: string;
  order: number;
  duration: number;
  lessonType: string;
  status: string;
  isCompleted: boolean;
  completedAt?: string;
  
  // 🆕 THÊM CÁC TRƯỜNG THỜI GIAN
  actualDate?: string;
  actualStartTime?: string;
  actualEndTime?: string;
}

export interface StudentProgressDetail {
  student: StudentInfo;
  enrollment: {
    enrollmentId: string;
    status: string;
    enrolledAt: string;
    completedAt?: string;
    hasFullAccess: boolean;
  };
  progress: {
    overallProgress: number;
    completedLessons: number;
    totalLessons: number;
    lastAccessed?: string;
    completedLessonsDetails: CompletedLessonDetail[];
  };
  lessons: StudentProgressDetailLesson[];
}

export interface InstructorStudentProgressResponse {
  success: boolean;
  message?: string;
  progressDetail: StudentProgressDetail;
}

// ========== INSTRUCTOR FILTER & SEARCH ==========

export interface StudentListFilters {
  page?: number;
  limit?: number;
  status?: 'all' | 'active' | 'completed' | 'cancelled' | 'paused';
  search?: string;
}

export interface StudentListQueryParams {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}

// ========== INSTRUCTOR COURSE STATS ==========

export interface InstructorCourseStats {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  totalRevenue: number;
  totalLessons: number;
  averageRating: number;
  ratingCount: number;
  availableSpots: number;
  completionRate: number;
}

export interface InstructorCourseStatsResponse {
  success: boolean;
  message?: string;
  stats: InstructorCourseStats;
}

// 🆕 THÊM INTERFACE CHO LIVE LESSON STATUS
export interface LiveLessonStatus {
  isLive: boolean;
  isUpcoming: boolean;
  isCompleted: boolean;
  canJoin: boolean;
  hasRecording: boolean;
  hasAvailableSpots: boolean;
  canRegister: boolean;
  canBePurchasedIndividually: boolean;
}

// 🆕 THÊM INTERFACE CHO LESSON SCHEDULE INFO
export interface LessonScheduleInfo {
  type: 'dated' | 'weekly' | 'unscheduled';
  date?: string;
  dayOfWeek?: number;
  dayName?: string;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  meetingPlatform?: string;
  individualPrice?: number;
  availableForIndividualPurchase?: boolean;
}