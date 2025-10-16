// services/api/courseService.ts
import { apiRequest } from '../../utils/apiUtils';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

// ========== INTERFACE DEFINITIONS ==========

export interface GalleryImage {
  url: string;
  alt?: string;
  caption?: string;
  order?: number;
  isFeatured?: boolean;
}

export interface Schedule {
  _id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone?: string;
  meetingPlatform: 'zoom' | 'google_meet' | 'microsoft_teams' | 'other' | 'none';
  meetingUrl?: string;
  meetingId?: string;
  meetingPassword?: string;
  isActive: boolean;
  notes?: string;
  hasLesson: boolean;
  lessonId?: string;
}

export interface ScheduleWithInfo extends Schedule {
  index: number;
  dayName: string;
  isAvailable: boolean;
  lessonInfo?: {
    _id: string;
    title: string;
    order: number;
    status: string;
  };
}

export interface AvailableSchedulesResponse {
  success: boolean;
  course: { _id: string; title: string };
  schedules: ScheduleWithInfo[];
  availableCount: number;
  totalCount: number;
}

export interface CourseSchedulesResponse {
  success: boolean;
  course: { _id: string; title: string };
  schedules: ScheduleWithInfo[];
  schedulesByDay: { [key: number]: ScheduleWithInfo[] };
  summary: {
    totalSchedules: number;
    availableSchedules: number;
    occupiedSchedules: number;
    inactiveSchedules: number;
  };
}

export interface AddScheduleData {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone?: string;
  meetingPlatform?: 'zoom' | 'google_meet' | 'microsoft_teams' | 'other' | 'none';
  meetingUrl?: string;
  meetingId?: string;
  meetingPassword?: string;
  notes?: string;
}

export interface UpdateScheduleData extends Partial<AddScheduleData> {
  isActive?: boolean;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
  instructor: {
    _id: string;
    fullName: string;
    email: string;
    profile: {
      avatar?: string;
      bio?: string;
    };
  };
  category: string;
  subcategory?: string;
  level: string;
  pricingType: string;
  fullCoursePrice?: number;
  currentEnrollments: number;
  maxStudents: number;
  status: string;
  thumbnail: string;
  coverImage?: string;
  gallery?: GalleryImage[];
  promoVideo?: string;
  createdAt: string;
  updatedAt: string;
  startDate: string;
  endDate: string;
  ratings: {
    average: number;
    count: number;
  };
  availableSpots: number;
  totalLessons: number;
  lessons?: Lesson[];
  prerequisites?: string[];
  learningOutcomes?: string[];
  materialsIncluded?: string[];
  requirements?: string[];
  tags?: string[];
  language?: string;
  discount?: {
    percentage: number;
    validUntil: string;
  };
  certificate?: {
    isEnabled: boolean;
    template?: string;
    issuedBy?: string;
  };
  featured?: boolean;
  coInstructors?: string[];
  schedules?: Schedule[];
  approvalStatus?: {
    status: string;
    reason?: string;
    updatedAt?: string;
    reviewedBy?: string;
  };
  isActive: boolean;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  galleryUrls?: GalleryImage[];
  isFull?: boolean;
  courseType?: 'self_paced' | 'live_online' | 'hybrid' | 'in_person';
  totalSessions?: number;
  sessionDuration?: number;
  settings?: {
    jitsiSettings?: {
      defaultDomain: string;
      enableRecording: boolean;
      requirePassword: boolean;
    };
  };
  metadata?: {
    jitsiEnabled: boolean;
    totalMeetings: number;
    hasRecordings: boolean;
    hasLiveSessions: boolean;
    supportsIndividualPurchase: boolean;
    averageRating: number;
    totalReviews: number;
    totalSchedules: number;
    schedulesWithLessons: number;
    completionRate: number;
  };
  // Virtual fields từ model
  activeSchedules?: Schedule[];
  upcomingSchedules?: Schedule[];
  availableSchedules?: Schedule[];
  occupiedSchedules?: Schedule[];
  canPurchaseIndividualLessons?: boolean;
  averageLessonPrice?: number;
  scheduleCompletionRate?: number;
}

export interface Lesson {
  _id: string;
  courseId: string;
  scheduleIndex: number;
  title: string;
  description: string;
  shortDescription?: string;
  order: number;
  duration: number;
  price?: number;
  lessonType: 'self_paced' | 'live_online' | 'hybrid';
  meetingPlatform: 'jitsi' | 'none';
  meetingUrl?: string;
  meetingId?: string;
  meetingPassword?: string;
  jitsiConfig?: {
    roomName: string;
    domain: string;
    configOverwrite: any;
    interfaceConfigOverwrite: any;
  };
  contents: any[];
  resources: any[];
  isPreview: boolean;
  isFree: boolean;
  objectives: string[];
  prerequisites: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedStudyTime: number;
  actualStartTime?: string;
  actualEndTime?: string;
  recordingUrl?: string;
  status: 'draft' | 'published' | 'completed' | 'cancelled';
  isActive: boolean;
  viewCount: number;
  completionRate: number;
  maxParticipants: number;
  currentParticipants: number;
  registrationDeadline: number;
  assignedInstructor?: string;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  totalDuration?: number;
  isLive?: boolean;
  isUpcoming?: boolean;
  isCompleted?: boolean;
  hasRecording?: boolean;
  hasAvailableSpots?: boolean;
  canRegister?: boolean;
  jitsiMeetingUrl?: string;
  isMeetingActive?: boolean;
}

export interface CoursesFilter {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  subcategory?: string;
  level?: string;
  pricingType?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface CoursesResponse {
  courses: Course[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCourses: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateCourseData {
  title: string;
  description: string;
  shortDescription?: string;
  category: string;
  subcategory?: string;
  level: string;
  pricingType: string;
  fullCoursePrice?: number;
  coInstructors?: string[];
  schedules: AddScheduleData[];
  maxStudents: number;
  prerequisites?: string[];
  learningOutcomes?: string[];
  materialsIncluded?: string[];
  requirements?: string[];
  tags?: string[];
  language?: string;
  thumbnail?: string;
  coverImage?: string;
  gallery?: GalleryImage[];
  promoVideo?: string;
  discount?: {
    percentage: number;
    validUntil: string;
  };
  certificate?: boolean;
  featured?: boolean;
  startDate: string;
  endDate: string;
  courseType?: 'self_paced' | 'live_online' | 'hybrid' | 'in_person';
  settings?: any;
}

export interface UpdateCourseData extends Partial<CreateCourseData> {}

export interface EditCourseData extends Partial<CreateCourseData> {
  approvalStatus?: {
    status: string;
    reason?: string;
  };
}

export interface CreateLessonData {
  title: string;
  description: string;
  shortDescription?: string;
  order: number;
  scheduleIndex: number;
  duration: number;
  price?: number;
  lessonType: 'self_paced' | 'live_online' | 'hybrid';
  meetingPlatform: 'jitsi' | 'none';
  contents?: any[];
  resources?: any[];
  isPreview?: boolean;
  isFree?: boolean;
  objectives?: string[];
  prerequisites?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedStudyTime?: number;
  actualStartTime?: string;
  actualEndTime?: string;
  maxParticipants?: number;
  registrationDeadline?: number;
  assignedInstructor?: string;
  metadata?: any;
}

export interface UpdateLessonData extends Partial<CreateLessonData> {
  status?: 'draft' | 'published' | 'completed' | 'cancelled';
  recordingUrl?: string;
}

export interface LessonsResponse {
  lessons: Lesson[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalLessons: number;
  };
}

export interface CourseApprovalRequest {
  courseId: string;
  reason?: string;
  status: 'pending_review' | 'draft' | 'published' | 'archived';
}

export interface CourseApprovalResponse {
  message: string;
  course: Course;
  requiresReapproval?: boolean;
}

export interface MeetingInfo {
  meetingUrl: string;
  meetingId: string;
  meetingPassword: string;
  roomName: string;
  domain: string;
  config: any;
  interfaceConfig: any;
  lessonId: string;
  lessonTitle: string;
  startTime?: string;
  endTime?: string;
  isLive: boolean;
  isUpcoming: boolean;
  hasRecording: boolean;
  recordingUrl?: string;
  isInstructor: boolean;
  currentParticipants: number;
  maxParticipants: number;
}

// ========== NEW INTERFACES FOR MEETING RESPONSES ==========

export interface MeetingStartResponse {
  success: boolean;
  message: string;
  meetingUrl: string;
  meetingId: string;
}

export interface MeetingJoinResponse {
  success: boolean;
  message: string;
  meetingUrl: string;
  meetingId: string;
  jwtToken?: string;
  userRole: string;
  config: any;
}

export interface MeetingEndResponse {
  success: boolean;
  message: string;
}

// ========== COURSE SERVICE IMPLEMENTATION ==========

export const courseService = {
  // ========== COURSE MANAGEMENT ==========

  getCourses: async (filters: CoursesFilter): Promise<CoursesResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        queryParams.append(key, String(value));
      }
    });

    const endpoint = `${API_BASE_URL}/api/courses?${queryParams.toString()}`;
    try {
      return await apiRequest<CoursesResponse>(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error(`Failed to fetch courses from ${endpoint}:`, error);
      throw error;
    }
  },

  getCourseById: async (courseId: string): Promise<{ course: Course }> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}`;
    const token = localStorage.getItem('token');
    try {
      return await apiRequest<{ course: Course }>(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })  
        }
      });
    } catch (error) {
      console.error(`Failed to fetch course ${courseId}:`, error);
      throw error;
    }
  },

  getInstructorCourseById: async (courseId: string): Promise<{ course: Course }> => {
    const endpoint = `${API_BASE_URL}/api/courses/instructor/${courseId}`;
    const token = localStorage.getItem('token');
    try {
      return await apiRequest<{ course: Course }>(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
    } catch (error) {
      console.error(`Failed to fetch instructor course ${courseId}:`, error);
      throw error;
    }
  },

  getMyCourses: async (filters: { page?: number; limit?: number; status?: string }): Promise<CoursesResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        queryParams.append(key, String(value));
      }
    });

    const endpoint = `${API_BASE_URL}/api/courses/my?${queryParams.toString()}`;
    console.log('📡 [getMyCourses] Fixed API Request:', endpoint);
    
    try {
      const response = await apiRequest<CoursesResponse>(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('📥 [getMyCourses] API Response:', response);
      return response;
    } catch (error) {
      console.error('💥 [getMyCourses] API Error:', error);
      throw error;
    }
  },

  createCourse: async (courseData: CreateCourseData): Promise<{ message: string; course: Course }> => {
    const endpoint = `${API_BASE_URL}/api/courses`;
    const token = localStorage.getItem('token');
    
    console.log('🔗 [createCourse] DEBUG START ==========');
    console.log('🌐 API URL:', endpoint);
    console.log('🔐 Token exists:', !!token);
    console.log('📤 Request data:', JSON.stringify(courseData, null, 2));
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🎭 Token payload:', {
          userId: payload.userId,
          role: payload.role,
          exp: new Date(payload.exp * 1000)
        });
      } catch (e) {
        console.error('❌ Token decode error:', e);
      }
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(courseData)
      });

      console.log('📥 Response status:', response.status);
      
      const responseText = await response.text();
      console.log('📥 Response body:', responseText);

      if (!response.ok) {
        let errorMessage = 'Lỗi server';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = responseText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = JSON.parse(responseText);
      console.log('✅ [createCourse] SUCCESS:', result);
      console.log('🔚 [createCourse] DEBUG END ==========');
      return result;

    } catch (error: any) {
      console.error('❌ [createCourse] ERROR:', error.message);
      console.log('🔚 [createCourse] DEBUG END ==========');
      throw error;
    }
  },

  updateCourse: async (courseId: string, courseData: UpdateCourseData): Promise<{ message: string; course: Course }> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}`;
    return await apiRequest<{ message: string; course: Course }>(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(courseData)
    });
  },

  editCourse: async (courseId: string, courseData: EditCourseData): Promise<CourseApprovalResponse> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}`;
    const token = localStorage.getItem('token');
    
    console.log('🔗 [editCourse] DEBUG START ==========');
    console.log('🎯 Editing course:', courseId);
    console.log('📤 Edit data:', JSON.stringify(courseData, null, 2));

    try {
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(courseData)
      });

      console.log('📥 Response status:', response.status);
      
      const responseText = await response.text();
      console.log('📥 Response body:', responseText);

      if (!response.ok) {
        let errorMessage = 'Lỗi server khi cập nhật khóa học';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = responseText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result: CourseApprovalResponse = JSON.parse(responseText);
      console.log('✅ [editCourse] SUCCESS:', result);
      console.log('🔚 [editCourse] DEBUG END ==========');
      return result;

    } catch (error: any) {
      console.error('❌ [editCourse] ERROR:', error.message);
      console.log('🔚 [editCourse] DEBUG END ==========');
      throw error;
    }
  },

  updateCourseStatus: async (
    courseId: string,
    { status }: { status: string }
  ): Promise<{ message: string; course: { id: string; title: string; status: string; isActive: boolean } }> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}/status`;
    return await apiRequest<{ message: string; course: { id: string; title: string; status: string; isActive: boolean } }>(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status })
    });
  },

  submitForApproval: async (courseId: string): Promise<CourseApprovalResponse> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}/status`;
    
    console.log('🔗 [submitForApproval] Submitting course for approval:', courseId);

    try {
      const response = await apiRequest<CourseApprovalResponse>(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'pending_review' })
      });

      console.log('✅ [submitForApproval] SUCCESS:', response);
      return response;

    } catch (error: any) {
      console.error('❌ [submitForApproval] ERROR:', error.message);
      throw error;
    }
  },

  deleteCourse: async (courseId: string): Promise<{ message: string; courseId: string }> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}`;
    return await apiRequest<{ message: string; courseId: string }>(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  // ========== ADMIN FUNCTIONS ==========

  getCoursesForApproval: async (filters: { page?: number; limit?: number; status?: string } = {}): Promise<CoursesResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        queryParams.append(key, String(value));
      }
    });

    const endpoint = `${API_BASE_URL}/api/admin/courses/pending?${queryParams.toString()}`;
    console.log('📡 [getCoursesForApproval] API Request:', endpoint);
    
    try {
      const response = await apiRequest<CoursesResponse>(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('📥 [getCoursesForApproval] API Response:', response);
      return response;
    } catch (error) {
      console.error('💥 [getCoursesForApproval] API Error:', error);
      throw error;
    }
  },

  getPendingCourses: async (filters: { page?: number; limit?: number }): Promise<CoursesResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        queryParams.append(key, String(value));
      }
    });

    const endpoint = `${API_BASE_URL}/api/admin/courses/pending?${queryParams.toString()}`;
    return await apiRequest<CoursesResponse>(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  approveCourse: async (courseId: string): Promise<{ message: string; courseId: string }> => {
    const endpoint = `${API_BASE_URL}/api/admin/courses/${courseId}/approve`;
    return await apiRequest<{ message: string; courseId: string }>(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  rejectCourse: async (courseId: string, reason: string): Promise<{ message: string; courseId: string }> => {
    const endpoint = `${API_BASE_URL}/api/admin/courses/${courseId}/reject`;
    return await apiRequest<{ message: string; courseId: string }>(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ reason })
    });
  },

  reviewCourse: async (courseId: string, approvalData: {
    status: 'approved' | 'rejected';
    reason?: string;
    feedback?: string;
  }): Promise<{ message: string; course: Course }> => {
    const endpoint = `${API_BASE_URL}/api/admin/courses/${courseId}/review`;
    
    console.log('🔗 [reviewCourse] Admin reviewing course:', courseId, approvalData);

    try {
      const response = await apiRequest<{ message: string; course: Course }>(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(approvalData)
      });

      console.log('✅ [reviewCourse] SUCCESS:', response);
      return response;

    } catch (error: any) {
      console.error('❌ [reviewCourse] ERROR:', error.message);
      throw error;
    }
  },

  // ========== LESSON MANAGEMENT ==========

  getLessonsByCourse: async (courseId: string, filters: { page?: number; limit?: number } = {}): Promise<LessonsResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        queryParams.append(key, String(value));
      }
    });

    const endpoint = `${API_BASE_URL}/api/courses/${courseId}/lessons?${queryParams.toString()}`;
    
    console.log('📡 [getLessonsByCourse] API Request:', endpoint);
    
    try {
      const response = await apiRequest<LessonsResponse>(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('📥 [getLessonsByCourse] API Response:', response);
      return response;
    } catch (error) {
      console.error('💥 [getLessonsByCourse] API Error:', error);
      throw error;
    }
  },

  getLessonById: async (lessonId: string): Promise<{ lesson: Lesson }> => {
    const endpoint = `${API_BASE_URL}/api/lessons/${lessonId}`;
    
    console.log('📡 [getLessonById] Fixed API Request:', endpoint);
    
    try {
      const response = await apiRequest<{ lesson: Lesson }>(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('📥 [getLessonById] API Response:', response);
      return response;
    } catch (error) {
      console.error('💥 [getLessonById] API Error:', error);
      throw error;
    }
  },

  createLesson: async (courseId: string, lessonData: CreateLessonData): Promise<{ message: string; lesson: Lesson }> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}/lessons`;
    const token = localStorage.getItem('token');
    
    console.log('🔗 [createLesson] DEBUG START ==========');
    console.log('🌐 API URL:', endpoint);
    console.log('📤 Request data:', JSON.stringify(lessonData, null, 2));

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(lessonData)
      });

      console.log('📥 Response status:', response.status);
      
      const responseText = await response.text();
      console.log('📥 Response body:', responseText);

      if (!response.ok) {
        let errorMessage = 'Lỗi server khi tạo bài học';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = responseText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = JSON.parse(responseText);
      console.log('✅ [createLesson] SUCCESS:', result);
      console.log('🔚 [createLesson] DEBUG END ==========');
      return result;

    } catch (error: any) {
      console.error('❌ [createLesson] ERROR:', error.message);
      console.log('🔚 [createLesson] DEBUG END ==========');
      throw error;
    }
  },

  updateLesson: async (lessonId: string, lessonData: UpdateLessonData): Promise<{ message: string; lesson: Lesson }> => {
    const endpoint = `${API_BASE_URL}/api/lessons/${lessonId}`;
    const token = localStorage.getItem('token');
    
    console.log('🔗 [updateLesson] Fixed API Request:', endpoint);
    console.log('📤 Request data:', JSON.stringify(lessonData, null, 2));

    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(lessonData)
      });

      console.log('📥 Response status:', response.status);
      
      const responseText = await response.text();
      console.log('📥 Response body:', responseText);

      if (!response.ok) {
        let errorMessage = 'Lỗi server khi cập nhật bài học';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = responseText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = JSON.parse(responseText);
      console.log('✅ [updateLesson] SUCCESS:', result);
      return result;

    } catch (error: any) {
      console.error('❌ [updateLesson] ERROR:', error.message);
      throw error;
    }
  },

  deleteLesson: async (lessonId: string): Promise<{ message: string; lessonId: string }> => {
    const endpoint = `${API_BASE_URL}/api/courses/lessons/${lessonId}`;
    console.log('🔗 [deleteLesson] Fixed API Request:', endpoint);

    try {
      const response = await apiRequest<{ message: string; lessonId: string }>(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('✅ [deleteLesson] SUCCESS:', response);
      return response;
    } catch (error: any) {
      console.error('❌ [deleteLesson] ERROR:', error.message);
      throw error;
    }
  },

  // ========== JITSI MEETING METHODS ==========

  startLessonMeeting: async (lessonId: string): Promise<MeetingStartResponse> => {
    const endpoint = `${API_BASE_URL}/api/courses/lessons/${lessonId}/meeting/start`;
    
    console.log('🔗 [startLessonMeeting] API Request:', endpoint);

    try {
      const response = await apiRequest<MeetingStartResponse>(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('✅ [startLessonMeeting] SUCCESS:', response);
      return response;

    } catch (error: any) {
      console.error('❌ [startLessonMeeting] ERROR:', error.message);
      throw error;
    }
  },

  joinLessonMeeting: async (lessonId: string): Promise<MeetingJoinResponse> => {
    const endpoint = `${API_BASE_URL}/api/courses/lessons/${lessonId}/meeting/join`;
    
    console.log('🔗 [joinLessonMeeting] API Request:', endpoint);

    try {
      const response = await apiRequest<MeetingJoinResponse>(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('✅ [joinLessonMeeting] SUCCESS:', response);
      return response;

    } catch (error: any) {
      console.error('❌ [joinLessonMeeting] ERROR:', error.message);
      throw error;
    }
  },

  endLessonMeeting: async (lessonId: string): Promise<MeetingEndResponse> => {
    const endpoint = `${API_BASE_URL}/api/courses/lessons/${lessonId}/meeting/end`;
    
    console.log('🔗 [endLessonMeeting] API Request:', endpoint);

    try {
      const response = await apiRequest<MeetingEndResponse>(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('✅ [endLessonMeeting] SUCCESS:', response);
      return response;

    } catch (error: any) {
      console.error('❌ [endLessonMeeting] ERROR:', error.message);
      throw error;
    }
  },

  getLessonMeetingInfo: async (lessonId: string): Promise<MeetingInfo> => {
    const endpoint = `${API_BASE_URL}/api/lessons/${lessonId}/meeting-info`;
    
    console.log('📡 [getLessonMeetingInfo] API Request:', endpoint);

    try {
      const response = await apiRequest<MeetingInfo>(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('📥 [getLessonMeetingInfo] API Response:', response);
      return response;
    } catch (error) {
      console.error('💥 [getLessonMeetingInfo] API Error:', error);
      throw error;
    }
  },

  startLesson: async (lessonId: string): Promise<{ message: string; lesson: Lesson; meetingInfo: MeetingInfo }> => {
    const endpoint = `${API_BASE_URL}/api/lessons/${lessonId}/start`;
    
    console.log('🔗 [startLesson] API Request:', endpoint);

    try {
      const response = await apiRequest<{ message: string; lesson: Lesson; meetingInfo: MeetingInfo }>(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('✅ [startLesson] SUCCESS:', response);
      return response;

    } catch (error: any) {
      console.error('❌ [startLesson] ERROR:', error.message);
      throw error;
    }
  },

  endLesson: async (lessonId: string, recordingUrl?: string): Promise<{ message: string; lesson: Lesson }> => {
    const endpoint = `${API_BASE_URL}/api/lessons/${lessonId}/end`;
    
    console.log('🔗 [endLesson] API Request:', endpoint);

    try {
      const response = await apiRequest<{ message: string; lesson: Lesson }>(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ recordingUrl })
      });

      console.log('✅ [endLesson] SUCCESS:', response);
      return response;

    } catch (error: any) {
      console.error('❌ [endLesson] ERROR:', error.message);
      throw error;
    }
  },

  // ========== LESSON CONTENT MANAGEMENT ==========

  addLessonContent: async (lessonId: string, contentData: any): Promise<{ message: string; lesson: Lesson }> => {
    const endpoint = `${API_BASE_URL}/api/lessons/${lessonId}/content`;
    
    try {
      const response = await apiRequest<{ message: string; lesson: Lesson }>(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(contentData)
      });

      console.log('✅ [addLessonContent] SUCCESS:', response);
      return response;

    } catch (error: any) {
      console.error('❌ [addLessonContent] ERROR:', error.message);
      throw error;
    }
  },

  removeLessonContent: async (lessonId: string, contentIndex: number): Promise<{ message: string; lesson: Lesson }> => {
    const endpoint = `${API_BASE_URL}/api/lessons/${lessonId}/content/${contentIndex}`;
    
    try {
      const response = await apiRequest<{ message: string; lesson: Lesson }>(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('✅ [removeLessonContent] SUCCESS:', response);
      return response;

    } catch (error: any) {
      console.error('❌ [removeLessonContent] ERROR:', error.message);
      throw error;
    }
  },

  addLessonResource: async (lessonId: string, resourceData: any): Promise<{ message: string; lesson: Lesson }> => {
    const endpoint = `${API_BASE_URL}/api/lessons/${lessonId}/resources`;
    
    try {
      const response = await apiRequest<{ message: string; lesson: Lesson }>(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(resourceData)
      });

      console.log('✅ [addLessonResource] SUCCESS:', response);
      return response;

    } catch (error: any) {
      console.error('❌ [addLessonResource] ERROR:', error.message);
      throw error;
    }
  },

  removeLessonResource: async (lessonId: string, resourceIndex: number): Promise<{ message: string; lesson: Lesson }> => {
    const endpoint = `${API_BASE_URL}/api/lessons/${lessonId}/resources/${resourceIndex}`;
    
    try {
      const response = await apiRequest<{ message: string; lesson: Lesson }>(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('✅ [removeLessonResource] SUCCESS:', response);
      return response;

    } catch (error: any) {
      console.error('❌ [removeLessonResource] ERROR:', error.message);
      throw error;
    }
  },

  // ========== LESSON ANALYTICS ==========

  getLessonAnalytics: async (lessonId: string): Promise<{
    viewCount: number;
    completionRate: number;
    currentParticipants: number;
    maxParticipants: number;
    averageWatchTime: number;
    totalWatchTime: number;
  }> => {
    const endpoint = `${API_BASE_URL}/api/lessons/${lessonId}/analytics`;
    
    try {
      const response = await apiRequest<{
        viewCount: number;
        completionRate: number;
        currentParticipants: number;
        maxParticipants: number;
        averageWatchTime: number;
        totalWatchTime: number;
      }>(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      return response;
    } catch (error) {
      console.error(`Failed to fetch lesson analytics for ${lessonId}:`, error);
      throw error;
    }
  },

  incrementLessonView: async (lessonId: string): Promise<{ message: string; lesson: Lesson }> => {
    const endpoint = `${API_BASE_URL}/api/lessons/${lessonId}/view`;
    
    try {
      const response = await apiRequest<{ message: string; lesson: Lesson }>(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      return response;
    } catch (error) {
      console.error(`Failed to increment view count for lesson ${lessonId}:`, error);
      throw error;
    }
  },

  // ========== ENROLLMENT ==========

  createEnrollment: async (courseId: string, paymentId: string): Promise<{ message: string; enrollment: any }> => {
    const endpoint = `${API_BASE_URL}/api/enrollments`;
    return await apiRequest<{ message: string; enrollment: any }>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ courseId, paymentId })
    });
  },

  // ========== STATISTICS AND ANALYTICS ==========

  getCourseStats: async (courseId?: string): Promise<any> => {
    const endpoint = courseId 
      ? `${API_BASE_URL}/api/courses/${courseId}/stats`
      : `${API_BASE_URL}/api/courses/stats`;
    
    return await apiRequest<any>(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  getCourseEditHistory: async (courseId: string): Promise<{ edits: any[] }> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}/history`;
    
    try {
      return await apiRequest<{ edits: any[] }>(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error(`Failed to fetch course history for ${courseId}:`, error);
      throw error;
    }
  },

  // ========== IMAGE MANAGEMENT ==========

  uploadCourseImage: async (courseId: string, imageFile: File, imageType: 'thumbnail' | 'cover' | 'gallery'): Promise<{ url: string }> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}/upload-image`;
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('type', imageType);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  },

  addGalleryImage: async (courseId: string, imageData: GalleryImage): Promise<{ message: string; gallery: GalleryImage[] }> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}/gallery`;
    return await apiRequest<{ message: string; gallery: GalleryImage[] }>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(imageData)
    });
  },

  removeGalleryImage: async (courseId: string, imageIndex: number): Promise<{ message: string; gallery: GalleryImage[] }> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}/gallery/${imageIndex}`;
    return await apiRequest<{ message: string; gallery: GalleryImage[] }>(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  // ========== COURSE SCHEDULE MANAGEMENT ==========

  getCourseSchedules: async (courseId: string): Promise<CourseSchedulesResponse> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}/schedules`;
    
    console.log('📡 [getCourseSchedules] API Request:', endpoint);

    try {
      const response = await apiRequest<CourseSchedulesResponse>(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('📥 [getCourseSchedules] API Response:', response);
      return response;
    } catch (error) {
      console.error('💥 [getCourseSchedules] API Error:', error);
      throw error;
    }
  },

  getAvailableSchedules: async (courseId: string): Promise<AvailableSchedulesResponse> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}/schedules/available`;
    
    console.log('📡 [getAvailableSchedules] API Request:', endpoint);

    try {
      const response = await apiRequest<AvailableSchedulesResponse>(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('📥 [getAvailableSchedules] API Response:', response);
      return response;
    } catch (error) {
      console.error('💥 [getAvailableSchedules] API Error:', error);
      throw error;
    }
  },

  addSchedule: async (courseId: string, scheduleData: AddScheduleData): Promise<{ message: string; course: Course }> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}/schedules`;
    
    console.log('🔗 [addSchedule] API Request:', endpoint);
    console.log('📤 Schedule data:', scheduleData);

    try {
      const response = await apiRequest<{ message: string; course: Course }>(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(scheduleData)
      });

      console.log('✅ [addSchedule] SUCCESS:', response);
      return response;

    } catch (error: any) {
      console.error('❌ [addSchedule] ERROR:', error.message);
      throw error;
    }
  },

  updateSchedule: async (courseId: string, scheduleIndex: number, scheduleData: UpdateScheduleData): Promise<{ message: string; course: Course }> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}/schedules/${scheduleIndex}`;
    
    console.log('🔗 [updateSchedule] API Request:', endpoint);
    console.log('📤 Schedule data:', scheduleData);

    try {
      const response = await apiRequest<{ message: string; course: Course }>(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(scheduleData)
      });

      console.log('✅ [updateSchedule] SUCCESS:', response);
      return response;

    } catch (error: any) {
      console.error('❌ [updateSchedule] ERROR:', error.message);
      throw error;
    }
  },

  removeSchedule: async (courseId: string, scheduleIndex: number): Promise<{ message: string; course: Course }> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}/schedules/${scheduleIndex}`;
    
    console.log('🔗 [removeSchedule] API Request:', endpoint);

    try {
      const response = await apiRequest<{ message: string; course: Course }>(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('✅ [removeSchedule] SUCCESS:', response);
      return response;

    } catch (error: any) {
      console.error('❌ [removeSchedule] ERROR:', error.message);
      throw error;
    }
  },

  assignLessonToSchedule: async (courseId: string, scheduleIndex: number, lessonId: string): Promise<{ message: string; course: Course }> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}/schedules/${scheduleIndex}/assign-lesson`;
    
    console.log('🔗 [assignLessonToSchedule] API Request:', endpoint);

    try {
      const response = await apiRequest<{ message: string; course: Course }>(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ lessonId })
      });

      console.log('✅ [assignLessonToSchedule] SUCCESS:', response);
      return response;

    } catch (error: any) {
      console.error('❌ [assignLessonToSchedule] ERROR:', error.message);
      throw error;
    }
  },

  removeLessonFromSchedule: async (courseId: string, scheduleIndex: number): Promise<{ message: string; course: Course }> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}/schedules/${scheduleIndex}/remove-lesson`;
    
    console.log('🔗 [removeLessonFromSchedule] API Request:', endpoint);

    try {
      const response = await apiRequest<{ message: string; course: Course }>(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('✅ [removeLessonFromSchedule] SUCCESS:', response);
      return response;

    } catch (error: any) {
      console.error('❌ [removeLessonFromSchedule] ERROR:', error.message);
      throw error;
    }
  },

  // ========== SCHEDULE UTILITIES ==========

  getDayName: (dayOfWeek: number): string => {
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return dayNames[dayOfWeek] || 'Unknown';
  },

  validateScheduleTime: (startTime: string, endTime: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return false;
    }

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return start < end;
  },

  formatScheduleDisplay: (schedule: Schedule): string => {
    const dayName = courseService.getDayName(schedule.dayOfWeek);
    return `${dayName} ${schedule.startTime} - ${schedule.endTime} ${schedule.timezone || ''}`.trim();
  },

  // ========== BULK SCHEDULE OPERATIONS ==========

  createWeeklySchedules: async (
    courseId: string, 
    weeklyTemplate: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      meetingPlatform?: string;
    }>
  ): Promise<{ message: string; course: Course }> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}/schedules/bulk`;
    
    console.log('🔗 [createWeeklySchedules] API Request:', endpoint);
    console.log('📤 Weekly template:', weeklyTemplate);

    try {
      const response = await apiRequest<{ message: string; course: Course }>(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ schedules: weeklyTemplate })
      });

      console.log('✅ [createWeeklySchedules] SUCCESS:', response);
      return response;

    } catch (error: any) {
      console.error('❌ [createWeeklySchedules] ERROR:', error.message);
      throw error;
    }
  },

  // ========== SCHEDULE CONFLICT DETECTION ==========

  checkScheduleConflicts: async (
    courseId: string,
    newSchedule: AddScheduleData
  ): Promise<{ hasConflict: boolean; conflictingSchedules?: ScheduleWithInfo[] }> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}/schedules/check-conflicts`;
    
    console.log('🔗 [checkScheduleConflicts] API Request:', endpoint);

    try {
      const response = await apiRequest<{ hasConflict: boolean; conflictingSchedules?: ScheduleWithInfo[] }>(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newSchedule)
      });

      console.log('✅ [checkScheduleConflicts] SUCCESS:', response);
      return response;

    } catch (error: any) {
      console.error('❌ [checkScheduleConflicts] ERROR:', error.message);
      throw error;
    }
  },

  // ========== UTILITY METHODS ==========

  checkLessonAccess: async (lessonId: string): Promise<{ hasAccess: boolean; reason?: string }> => {
    const endpoint = `${API_BASE_URL}/api/lessons/${lessonId}/check-access`;
    
    try {
      const response = await apiRequest<{ hasAccess: boolean; reason?: string }>(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      return response;
    } catch (error) {
      console.error(`Failed to check lesson access for ${lessonId}:`, error);
      throw error;
    }
  },

  getUpcomingLessons: async (filters: { page?: number; limit?: number } = {}): Promise<LessonsResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        queryParams.append(key, String(value));
      }
    });

    const endpoint = `${API_BASE_URL}/api/lessons/upcoming?${queryParams.toString()}`;
    
    try {
      const response = await apiRequest<LessonsResponse>(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      return response;
    } catch (error) {
      console.error('Failed to fetch upcoming lessons:', error);
      throw error;
    }
  },

  searchLessons: async (query: string, filters: { page?: number; limit?: number } = {}): Promise<LessonsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('search', query);
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        queryParams.append(key, String(value));
      }
    });

    const endpoint = `${API_BASE_URL}/api/lessons/search?${queryParams.toString()}`;
    
    try {
      const response = await apiRequest<LessonsResponse>(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      return response;
    } catch (error) {
      console.error('Failed to search lessons:', error);
      throw error;
    }
  },

  // ========== DEBUG & TEST METHODS ==========

  debugApiEndpoints: async (): Promise<void> => {
    const endpoints = [
      '/api/courses/instructor/my',
      '/api/courses/my',
      '/api/courses'
    ];

    for (const endpoint of endpoints) {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log(`🔍 Testing endpoint: ${url}`);
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log(`✅ ${endpoint}: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.error(`❌ ${endpoint}:`, error);
      }
    }
  },

  // ========== HEALTH CHECK ==========

  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    const endpoint = `${API_BASE_URL}/api/health`;
    
    try {
      const response = await apiRequest<{ status: string; timestamp: string }>(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
};