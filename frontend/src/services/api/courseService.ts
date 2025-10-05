// services/api/courseServices.ts
import { apiRequest } from '../../utils/apiUtils';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

// Định nghĩa interface cho Course
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
  thumbnail?: string;
  promoVideo?: string;
  gallery?: string[];
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
  certificate?: boolean;
  featured?: boolean;
  coInstructors?: string[];
  schedules?: any[];
  approvalStatus?: {
    status: string;
    reason?: string;
  };
  isActive: boolean;
}

export interface Lesson {
  _id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  duration: number;
  price?: number;
  type: string;
  content?: any;
  resources?: any[];
  isPreview: boolean;
  schedule?: any;
  requirements?: string[];
  objectives?: string[];
  metadata?: any;
  status: string;
  createdAt: string;
  updatedAt: string;
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
  schedules?: any[];
  maxStudents: number;
  prerequisites?: string[];
  learningOutcomes?: string[];
  materialsIncluded?: string[];
  requirements?: string[];
  tags?: string[];
  language?: string;
  thumbnail?: string;
  promoVideo?: string;
  gallery?: string[];
  discount?: {
    percentage: number;
    validUntil: string;
  };
  certificate?: boolean;
  featured?: boolean;
  startDate: string;
  endDate: string;
}

export interface UpdateCourseData extends Partial<CreateCourseData> {
  // All fields are optional for updates
}

export interface CreateLessonData {
  title: string;
  description: string;
  order: number;
  duration: number;
  price?: number;
  type: string;
  content?: any;
  resources?: any[];
  isPreview?: boolean;
  schedule?: any;
  requirements?: string[];
  objectives?: string[];
  metadata?: any;
}

export interface UpdateLessonData extends Partial<CreateLessonData> {
  status?: string;
}

export interface LessonsResponse {
  lessons: Lesson[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalLessons: number;
  };
}

export const courseService = {
  // Course Management
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
    try {
      return await apiRequest<{ course: Course }>(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error(`Failed to fetch course ${courseId}:`, error);
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
  
  // Decode token để xem role hiện tại
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
    return await apiRequest(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(courseData)
    });
  },

  updateCourseStatus: async (
    courseId: string,
    { status }: { status: string }
  ): Promise<{ message: string; course: { id: string; title: string; status: string; isActive: boolean } }> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}/status`;
    return await apiRequest(endpoint, {
      method: 'PATCH', // dùng PATCH cho đúng semantics
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status })
    });
  },

  deleteCourse: async (courseId: string): Promise<{ message: string; courseId: string }> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}`;
    return await apiRequest(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  // trong courseService.ts
getMyCourses: async (filters: { page?: number; limit?: number; status?: string }): Promise<CoursesResponse> => {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      queryParams.append(key, String(value));
    }
  });

  const endpoint = `${API_BASE_URL}/api/courses/my?${queryParams.toString()}`;
  console.log('📡 API Request:', endpoint);
  
  try {
    const response = await apiRequest(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }) as CoursesResponse; // Thêm ép kiểu ở đây
    
    console.log('📥 API Response:', response);
    return response;
  } catch (error) {
    console.error('💥 API Error:', error);
    throw error;
  }
},

  // Admin Functions
    getPendingCourses: async (filters: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        queryParams.append(key, String(value));
      }
    });

    const endpoint = `${API_BASE_URL}/api/admin/courses/pending?${queryParams.toString()}`;
    return await apiRequest(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  approveCourse: async (courseId: string): Promise<{ message: string; courseId: string }> => {
    const endpoint = `${API_BASE_URL}/api/admin/courses/${courseId}/approve`;
    return await apiRequest(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  rejectCourse: async (courseId: string, reason: string): Promise<{ message: string; courseId: string }> => {
    const endpoint = `${API_BASE_URL}/api/admin/courses/${courseId}/reject`;
    return await apiRequest(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ reason })
    });
  },

  // Lesson Management
  getLessonsByCourse: async (courseId: string, filters: { page?: number; limit?: number }): Promise<LessonsResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        queryParams.append(key, String(value));
      }
    });

    const endpoint = `${API_BASE_URL}/api/courses/${courseId}/lessons?${queryParams.toString()}`;
    return await apiRequest(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  getLessonById: async (lessonId: string): Promise<{ lesson: Lesson }> => {
    const endpoint = `${API_BASE_URL}/api/lessons/${lessonId}`;
    return await apiRequest(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  createLesson: async (courseId: string, lessonData: CreateLessonData): Promise<{ message: string; lesson: Lesson }> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}/lessons`;
    return await apiRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(lessonData)
    });
  },

  updateLesson: async (lessonId: string, lessonData: UpdateLessonData): Promise<{ message: string; lesson: Lesson }> => {
    const endpoint = `${API_BASE_URL}/api/lessons/${lessonId}`;
    return await apiRequest(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(lessonData)
    });
  },

  deleteLesson: async (lessonId: string): Promise<{ message: string; lessonId: string }> => {
    const endpoint = `${API_BASE_URL}/api/lessons/${lessonId}`;
    return await apiRequest(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  // Enrollment
  createEnrollment: async (courseId: string, paymentId: string): Promise<{ message: string; enrollment: any }> => {
    const endpoint = `${API_BASE_URL}/api/enrollments`;
    return await apiRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ courseId, paymentId })
    });
  },

  // Statistics and Analytics (if needed)
  getCourseStats: async (courseId?: string): Promise<any> => {
    const endpoint = courseId 
      ? `${API_BASE_URL}/api/courses/${courseId}/stats`
      : `${API_BASE_URL}/api/courses/stats`;
    
    return await apiRequest(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  }
};