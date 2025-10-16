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
  actualStartTime?: string;
  actualEndTime?: string;
  status: string;
  isPreview: boolean;
  isFree: boolean;
  hasAccess: boolean;
  isCompleted: boolean;
  canJoin: boolean;
  progress: number;
}

export interface StudentCourseResponse {
  success: boolean;
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
  coursesByCategory: { [category: string]: number };
  recentActivity: Array<{
    courseId: string;
    courseTitle: string;
    lastAccessed: string;
    progress: number;
  }>;
}
export interface StudentCourseResponse {
  success: boolean;
  message?: string; // Thêm property message (optional)
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
  message?: string; // Thêm cho consistency
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