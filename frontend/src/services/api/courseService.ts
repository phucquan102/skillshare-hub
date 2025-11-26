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
  datedSchedules?: any[];
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
  // THÊM các trường mới
  isMeetingActive?: boolean;
  actualStartTime?: string;
  actualEndTime?: string;
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

export interface LessonAccessInfo {
  hasAccess: boolean;
  accessLevel: 'none' | 'preview' | 'full';
  reason: string;
  requiresPurchase?: boolean;
  purchasePrice?: number;
  isPreview?: boolean;
  isFree?: boolean;
}

export interface LessonContent {
  _id?: string;
  type: 'video' | 'document' | 'quiz' | 'assignment' | 'text' | 'link';
  title: string;
  content?: string;
  url?: string;
  duration?: number;
  order: number;
  isPreview: boolean;
  isRequired: boolean;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonResource {
  _id?: string;
  type: 'file' | 'link' | 'document' | 'other';
  title: string;
  description?: string;
  url?: string;
  fileSize?: number;
  fileType?: string;
  order: number;
  downloadCount?: number;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonContentsResponse {
  success: boolean;
  contents: LessonContent[];
  resources: LessonResource[];
  access: {
    hasFullAccess: boolean;
    totalContents: number;
    previewContents: number;
    totalResources: number;
    availableResources: number;
  };
}

export interface UpdateLessonContentData {
  contents?: LessonContent[];
  resources?: LessonResource[];
}

export interface LessonSearchFilters {
  search?: string;
  lessonType?: string;
  status?: string;
  isPreview?: boolean;
  isFree?: boolean;
  page?: number;
  limit?: number;
}

export interface LessonSearchResponse {
  success: boolean;
  lessons: Lesson[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalLessons: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  searchSummary: {
    searchQuery?: string;
    filters: {
      lessonType?: string;
      status?: string;
      isPreview?: boolean;
      isFree?: boolean;
    };
    resultsCount: number;
    totalCount: number;
  };
}

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
  // ✅ THÊM VALIDATION
  if (!courseId || courseId.trim() === '') {
    throw new Error('ID khóa học không hợp lệ: courseId là rỗng hoặc undefined');
  }
  
  if (typeof courseId !== 'string') {
    throw new Error(`ID khóa học không hợp lệ: kiểu dữ liệu ${typeof courseId}, giá trị ${courseId}`);
  }

  const endpoint = `${API_BASE_URL}/api/courses/${courseId}`;
  const token = localStorage.getItem('token');
  
  console.log('🔗 [getCourseById] API Request:', endpoint);
  console.log('🎯 [getCourseById] courseId:', courseId);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });

    const responseText = await response.text();
    console.log('📥 [getCourseById] Response status:', response.status);

    if (!response.ok) {
      let errorMessage = 'Lỗi server khi lấy thông tin khóa học';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = responseText || `HTTP ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const result = JSON.parse(responseText);
    console.log('✅ [getCourseById] SUCCESS:', result);
    return result;

  } catch (error: any) {
    console.error('❌ [getCourseById] ERROR:', error.message);
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

  // 🆕 Service mới: Lấy available schedules theo type
  getAvailableSchedulesByType: async (
    courseId: string, 
    scheduleType: 'weekly' | 'dated' = 'weekly'
  ): Promise<AvailableSchedulesResponse> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}/schedules/available-by-type?scheduleType=${scheduleType}`;
    
    console.log('📡 [getAvailableSchedulesByType] API Request:', endpoint);

    try {
      const response = await apiRequest<AvailableSchedulesResponse>(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('📥 [getAvailableSchedulesByType] API Response:', response);
      return response;
    } catch (error) {
      console.error('💥 [getAvailableSchedulesByType] API Error:', error);
      throw error;
    }
  },

  // 🆕 Service tạo lesson với cả hai loại schedule
  createLessonWithScheduleType: async (
    courseId: string, 
    lessonData: CreateLessonData & { datedScheduleId?: string }
  ): Promise<{ message: string; lesson: Lesson }> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}/lessons`;
    const token = localStorage.getItem('token');
    
    console.log('🔗 [createLessonWithScheduleType] Creating lesson:', lessonData);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(lessonData)
      });

      const responseText = await response.text();
      console.log('📥 Response:', responseText);

      if (!response.ok) {
        throw new Error(responseText || `HTTP ${response.status}`);
      }

      return JSON.parse(responseText);
    } catch (error: any) {
      console.error('❌ [createLessonWithScheduleType] ERROR:', error.message);
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

  // 🆕 THÊM: Get lesson by ID với kiểm tra quyền truy cập chi tiết
  getLessonById: async (lessonId: string): Promise<{ 
    success: boolean; 
    lesson: Lesson & {
      access: LessonAccessInfo;
      scheduleInfo?: any;
    } 
  }> => {
    // ✅ SỬA: Thay endpoint từ /detailed sang /
     const endpoint = `${API_BASE_URL}/api/courses/lessons/${lessonId}/detailed`;
    const token = localStorage.getItem('token');
    
    console.log('📡 [getLessonById] API Request:', endpoint);

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      const responseText = await response.text();
      console.log('📥 [getLessonById] Response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Lỗi server khi lấy thông tin bài học';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = responseText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = JSON.parse(responseText);
      console.log('✅ [getLessonById] SUCCESS:', result);
      return result;

    } catch (error: any) {
      console.error('❌ [getLessonById] ERROR:', error.message);
      throw error;
    }
  },

  // 🆕 THÊM: Get lesson preview (chế độ xem trước công khai)
 
getLessonPreview: async (lessonId: string): Promise<{ 
  success: boolean; 
  lesson: Lesson;
  note?: string;
}> => {
  console.log('📡 [getLessonPreview] API Request for lesson:', lessonId);

  // THỬ CÁC ENDPOINT KHÁC NHAU
  const endpoints = [
    `${API_BASE_URL}/api/lessons/${lessonId}/preview`,
    `${API_BASE_URL}/api/courses/lessons/${lessonId}/preview`,
    `${API_BASE_URL}/api/lessons/${lessonId}?preview=true`
  ];

  let lastError: any = null;

  for (const endpoint of endpoints) {
    try {
      console.log('🔄 [getLessonPreview] Trying endpoint:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 [getLessonPreview] Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [getLessonPreview] SUCCESS with endpoint:', endpoint);
        return result;
      }
      
      if (response.status !== 404) {
        const errorText = await response.text();
        console.log(`❌ [getLessonPreview] Endpoint ${endpoint} failed:`, errorText);
      }
      
    } catch (error) {
      console.log(`❌ [getLessonPreview] Failed with endpoint ${endpoint}:`, error);
      lastError = error;
      continue;
    }
  }

  // FALLBACK: Sử dụng getLessonById thay thế
  console.log('🔄 [getLessonPreview] Using getLessonById as fallback');
  try {
    const lessonResponse = await courseService.getLessonById(lessonId);
    return {
      success: true,
      lesson: lessonResponse.lesson,
      note: 'Preview mode using regular lesson data'
    };
  } catch (fallbackError) {
    console.error('💥 [getLessonPreview] Fallback also failed:', fallbackError);
    throw lastError || new Error('Unable to load lesson preview');
  }
},

  // 🆕 THÊM: Check lesson access - API riêng để kiểm tra quyền
  checkLessonAccess: async (lessonId: string): Promise<{
    success: boolean;
    access: LessonAccessInfo;
    lesson: {
      _id: string;
      title: string;
      price: number;
    };
  }> => {
    const endpoint = `${API_BASE_URL}/api/lessons/${lessonId}/check-access`;
    const token = localStorage.getItem('token');
    
    console.log('📡 [checkLessonAccess] API Request:', endpoint);

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      const responseText = await response.text();
      console.log('📥 [checkLessonAccess] Response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Lỗi server khi kiểm tra quyền truy cập';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = responseText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = JSON.parse(responseText);
      console.log('✅ [checkLessonAccess] SUCCESS:', result);
      return result;

    } catch (error: any) {
      console.error('❌ [checkLessonAccess] ERROR:', error.message);
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
  console.log('🎯 [joinLessonMeeting] Starting for lesson:', lessonId);
  
  // DANH SÁCH ENDPOINT ƯU TIÊN
  const endpoints = [
    `${API_BASE_URL}/api/courses/lessons/${lessonId}/meeting/join`,
    `${API_BASE_URL}/api/lessons/${lessonId}/meeting/join`,
    `${API_BASE_URL}/api/lessons/${lessonId}/join-meeting`
  ];

  let lastError: any = null;

  for (const endpoint of endpoints) {
    try {
      console.log('🔗 Attempting endpoint:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('📥 Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ SUCCESS with endpoint:', endpoint);
        
        // KIỂM TRA NẾU CÓ LỖI JWT TRONG RESPONSE
        if (result.error && result.error.includes('JWT')) {
          console.warn('⚠️ JWT error in response, trying next endpoint...');
          lastError = new Error(result.error);
          continue;
        }
        
        return result;
      }
      
      // XỬ LÝ CÁC STATUS CODE CỤ THỂ
      if (response.status === 404) {
        console.log('🔍 Endpoint not found, trying next...');
        continue;
      }
      
      if (response.status === 500) {
        const errorText = await response.text();
        console.error('💥 Server error:', errorText);
        
        // PHÂN TÍCH LỖI JWT
        if (errorText.includes('JWT') || errorText.includes('private key')) {
          console.warn('🔑 JWT configuration error detected');
          lastError = new Error('JWT configuration error');
          continue;
        }
      }
      
    } catch (error) {
      console.log(`❌ Network error with ${endpoint}:`, error);
      lastError = error;
      continue;
    }
  }

  // FALLBACK KHI TẤT CẢ ENDPOINT FAIL
  console.log('🔄 All endpoints failed, creating fallback meeting...');
  
  // TẠO MEETING URL ĐƠN GIẢN
  const meetingId = `skillshare-${lessonId}`;
  const meetingUrl = `https://meet.jit.si/${meetingId}`;
  
  console.log('🎯 Created fallback meeting URL:', meetingUrl);
  
  const fallbackResponse: MeetingJoinResponse = {
    success: true,
    message: 'Using fallback meeting configuration',
    meetingUrl: meetingUrl,
    meetingId: meetingId,
    userRole: 'student',
    config: {
      prejoinPageEnabled: false,
      startWithAudioMuted: true,
      startWithVideoMuted: false
    }
  };

  return fallbackResponse;
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
  // SỬA: Dùng endpoint startLessonMeeting thay vì start
  const endpoint = `${API_BASE_URL}/api/courses/lessons/${lessonId}/meeting/start`;
  
  console.log('🔗 [startLesson] Fixed API Request:', endpoint);

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
// Thêm hàm updateLessonStatus riêng
updateLessonStatus: async (lessonId: string, status: 'draft' | 'published' | 'completed' | 'cancelled' | 'live'): Promise<{ message: string; lesson: Lesson }> => {
  const endpoint = `${API_BASE_URL}/api/lessons/${lessonId}/status`;
  const token = localStorage.getItem('token');
  
  console.log('🔗 [updateLessonStatus] API Request:', endpoint);
  console.log('📤 Status update:', status);

  try {
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    console.log('📥 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📥 Response body:', responseText);

    if (!response.ok) {
      let errorMessage = 'Lỗi server khi cập nhật trạng thái bài học';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = responseText || `HTTP ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const result = JSON.parse(responseText);
    console.log('✅ [updateLessonStatus] SUCCESS:', result);
    return result;

  } catch (error: any) {
    console.error('❌ [updateLessonStatus] ERROR:', error.message);
    throw error;
  }
},
// Sửa lại hàm startLessonWithFallback với hàm mới
startLessonWithFallback: async (lessonId: string): Promise<any> => {
  console.log('🎯 [startLessonWithFallback] Starting lesson with fallback:', lessonId);
  
  const endpoints = [
    {
      method: 'startLessonMeeting',
      call: () => courseService.startLessonMeeting(lessonId)
    },
    {
      method: 'startLesson',
      call: () => courseService.startLesson(lessonId)
    },
    {
      method: 'updateLessonStatus',
      call: () => courseService.updateLessonStatus(lessonId, 'live')
    },
    {
      method: 'updateLesson',
      call: () => courseService.updateLesson(lessonId, {
        isMeetingActive: true,
        actualStartTime: new Date().toISOString()
      })
    }
  ];

  let lastError: any = null;

  for (const endpoint of endpoints) {
    try {
      console.log(`🔄 [startLessonWithFallback] Trying method: ${endpoint.method}`);
      const response = await endpoint.call();
      console.log(`✅ [startLessonWithFallback] SUCCESS with method: ${endpoint.method}`);
      return response;
    } catch (error) {
      console.log(`❌ [startLessonWithFallback] Failed with method ${endpoint.method}:`, error);
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error('No valid method found for starting lesson');
},
  // ========== LESSON CONTENT MANAGEMENT ==========

  // 🆕 THÊM: Get lesson contents với phân quyền
  getLessonContents: async (lessonId: string): Promise<LessonContentsResponse> => {
    const endpoint = `${API_BASE_URL}/api/lessons/${lessonId}/contents`;
    const token = localStorage.getItem('token');
    
    console.log('📡 [getLessonContents] API Request:', endpoint);

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      const responseText = await response.text();
      console.log('📥 [getLessonContents] Response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Lỗi server khi lấy nội dung bài học';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = responseText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = JSON.parse(responseText);
      console.log('✅ [getLessonContents] SUCCESS:', result);
      return result;

    } catch (error: any) {
      console.error('❌ [getLessonContents] ERROR:', error.message);
      throw error;
    }
  },

  // 🆕 THÊM: Update lesson content (dành cho instructor)
  updateLessonContent: async (
    lessonId: string, 
    contentData: UpdateLessonContentData
  ): Promise<{
    success: boolean;
    message: string;
    lesson: {
      _id: string;
      contentsCount: number;
      resourcesCount: number;
      updatedAt: string;
    };
  }> => {
    const endpoint = `${API_BASE_URL}/api/lessons/${lessonId}/contents`;
    const token = localStorage.getItem('token');
    
    console.log('📡 [updateLessonContent] API Request:', endpoint);
    console.log('📤 Update data:', contentData);

    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(contentData)
      });

      const responseText = await response.text();
      console.log('📥 [updateLessonContent] Response status:', response.status);
      console.log('📥 [updateLessonContent] Response body:', responseText);

      if (!response.ok) {
        let errorMessage = 'Lỗi server khi cập nhật nội dung bài học';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = responseText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = JSON.parse(responseText);
      console.log('✅ [updateLessonContent] SUCCESS:', result);
      return result;

    } catch (error: any) {
      console.error('❌ [updateLessonContent] ERROR:', error.message);
      throw error;
    }
  },

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

  // 🆕 THÊM: Download lesson resource
  downloadLessonResource: async (
    lessonId: string, 
    resourceId: string
  ): Promise<{
    success: boolean;
    downloadUrl: string;
    resource: LessonResource;
  }> => {
    const endpoint = `${API_BASE_URL}/api/lessons/${lessonId}/resources/${resourceId}/download`;
    const token = localStorage.getItem('token');
    
    console.log('📡 [downloadLessonResource] API Request:', endpoint);

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      const responseText = await response.text();
      console.log('📥 [downloadLessonResource] Response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Lỗi server khi tải tài nguyên';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = responseText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = JSON.parse(responseText);
      console.log('✅ [downloadLessonResource] SUCCESS:', result);
      return result;

    } catch (error: any) {
      console.error('❌ [downloadLessonResource] ERROR:', error.message);
      throw error;
    }
  },

  // ========== LESSON ANALYTICS ==========

  // 🆕 THÊM: Get lesson analytics
  getLessonAnalytics: async (lessonId: string): Promise<{
    success: boolean;
    stats: {
      totalViews: number;
      uniqueViews: number;
      completionRate: number;
      averageWatchTime: number;
      totalWatchTime: number;
      engagementRate: number;
      quizResults?: {
        averageScore: number;
        totalAttempts: number;
        passRate: number;
      };
      resourceDownloads?: {
        totalDownloads: number;
        mostDownloaded: string[];
      };
    };
  }> => {
    const endpoint = `${API_BASE_URL}/api/lessons/${lessonId}/analytics`;
    const token = localStorage.getItem('token');
    
    console.log('📡 [getLessonAnalytics] API Request:', endpoint);

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      const responseText = await response.text();
      console.log('📥 [getLessonAnalytics] Response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Lỗi server khi lấy thống kê bài học';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = responseText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = JSON.parse(responseText);
      console.log('✅ [getLessonAnalytics] SUCCESS:', result);
      return result;

    } catch (error: any) {
      console.error('❌ [getLessonAnalytics] ERROR:', error.message);
      throw error;
    }
  },

  // 🆕 THÊM: Record lesson view (khi học viên xem bài học)
  recordLessonView: async (lessonId: string, data?: {
    duration?: number;
    progress?: number;
    completed?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    viewRecord: any;
  }> => {
    const endpoint = `${API_BASE_URL}/api/lessons/${lessonId}/record-view`;
    const token = localStorage.getItem('token');
    
    console.log('📡 [recordLessonView] API Request:', endpoint);
    console.log('📊 View data:', data);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(data || {})
      });

      const responseText = await response.text();
      console.log('📥 [recordLessonView] Response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Lỗi server khi ghi nhận lượt xem';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = responseText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = JSON.parse(responseText);
      console.log('✅ [recordLessonView] SUCCESS:', result);
      return result;

    } catch (error: any) {
      console.error('❌ [recordLessonView] ERROR:', error.message);
      throw error;
    }
  },

  // 🆕 THÊM: Complete lesson (đánh dấu hoàn thành bài học)
  completeLesson: async (lessonId: string, data?: {
    score?: number;
    timeSpent?: number;
    notes?: string;
  }): Promise<{
    success: boolean;
    message: string;
    completion: any;
  }> => {
    const endpoint = `${API_BASE_URL}/api/lessons/${lessonId}/complete`;
    const token = localStorage.getItem('token');
    
    console.log('📡 [completeLesson] API Request:', endpoint);
    console.log('📝 Completion data:', data);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(data || {})
      });

      const responseText = await response.text();
      console.log('📥 [completeLesson] Response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Lỗi server khi đánh dấu hoàn thành bài học';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = responseText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = JSON.parse(responseText);
      console.log('✅ [completeLesson] SUCCESS:', result);
      return result;

    } catch (error: any) {
      console.error('❌ [completeLesson] ERROR:', error.message);
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

  // 🆕 THÊM: Search lessons trong khóa học
  searchLessonsInCourse: async (
    courseId: string,
    filters: LessonSearchFilters = {}
  ): Promise<LessonSearchResponse> => {
    const queryParams = new URLSearchParams();
    
    // Thêm courseId vào query params
    queryParams.append('courseId', courseId);
    
    // Thêm các filter khác
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        queryParams.append(key, String(value));
      }
    });

    const endpoint = `${API_BASE_URL}/api/courses/${courseId}/lessons/search?${queryParams.toString()}`;
    const token = localStorage.getItem('token');
    
    console.log('📡 [searchLessonsInCourse] API Request:', endpoint);
    console.log('🔍 Search filters:', filters);

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      const responseText = await response.text();
      console.log('📥 [searchLessonsInCourse] Response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Lỗi server khi tìm kiếm bài học';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = responseText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = JSON.parse(responseText);
      console.log('✅ [searchLessonsInCourse] SUCCESS:', result);
      return result;

    } catch (error: any) {
      console.error('❌ [searchLessonsInCourse] ERROR:', error.message);
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

  getUpcomingLessons: async (filters: { page?: number; limit?: number } = {}): Promise<LessonsResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        queryParams.append(key, String(value));
      }
    });

    const endpoint = `${API_BASE_URL}/api/courses/upcoming-lessons?${queryParams.toString()}`;
    
    console.log('📡 [getUpcomingLessons] API Request:', endpoint);

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
      console.error('❌ Failed to fetch upcoming lessons:', error);
      return {
        lessons: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalLessons: 0
        }
      };
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