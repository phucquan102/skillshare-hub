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
  level: string;
  pricingType: string;
  fullCoursePrice: number;
  currentEnrollments: number;
  maxStudents: number;
  status: string;
  thumbnail?: string;
  createdAt: string;
  ratings: {
    average: number;
    count: number;
  };
  availableSpots: number;
  totalLessons: number;
}

export interface CoursesFilter {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
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

export const courseService = {
  getCourses: async (filters: CoursesFilter): Promise<CoursesResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    // ✅ Gateway expose /api/courses
    const endpoint = `${API_BASE_URL}/api/courses?${queryParams.toString()}`;

    try {
      return await apiRequest<CoursesResponse>(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error(`Failed to fetch from ${endpoint}:`, error);
      throw error;
    }
  },

  updateCourseStatus: async (courseId: string, { status }: { status: string }): Promise<any> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}/status`;
    return await apiRequest(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status })
    });
  },

  deleteCourse: async (courseId: string): Promise<any> => {
    const endpoint = `${API_BASE_URL}/api/courses/${courseId}`;
    return await apiRequest(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  }
};
