import { apiRequest } from '../../utils/apiUtils';
import { 
  StudentCourseResponse, 
  CourseProgressResponse,
  LearningStatistics 
} from '../../types/student.types';


const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export interface EnrollmentResponse {
  success: boolean;
  message: string;
  enrollment?: any;
  error?: string;
}

export interface EnrollmentData {
  courseId: string;
  paymentId: string;
}

export interface PurchaseLessonData {
  courseId: string;
  lessonId: string;
  paymentId: string;
  price: number;
}

export interface LessonAccessResponse {
  success: boolean;
  hasAccess: boolean;
  accessType: string;
  lesson?: any;
  message?: string;
}
 
export const enrollmentService = {
  /**
   * Tạo enrollment mới (đăng ký cả khóa học)
   */
  createEnrollment: async (courseId: string, paymentId: string): Promise<EnrollmentResponse> => {
    try {
      console.log('🎯 [EnrollmentService] Creating enrollment:', { courseId, paymentId });

      // Validate input
      if (!courseId || !courseId.trim()) {
        console.error('❌ [EnrollmentService] Missing courseId');
        return {
          success: false,
          message: 'courseId là bắt buộc'
        };
      }

      if (!paymentId || !paymentId.trim()) {
        console.error('❌ [EnrollmentService] Missing paymentId');
        return {
          success: false,
          message: 'paymentId là bắt buộc'
        };
      }

      // Kiểm tra token
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ [EnrollmentService] No authentication token found');
        return {
          success: false,
          message: 'Không tìm thấy token xác thực'
        };
      }

      const endpoint = `${API_BASE_URL}/api/enrollments`;
      const requestBody: EnrollmentData = {
        courseId: courseId.trim(),
        paymentId: paymentId.trim()
      };

      console.log('📤 [EnrollmentService] Sending request:', {
        endpoint,
        method: 'POST',
        body: requestBody
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 [EnrollmentService] Response status:', response.status);

      const responseText = await response.text();
      let responseData;

      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ [EnrollmentService] Failed to parse response:', responseText);
        return {
          success: false,
          message: 'Lỗi khi xử lý phản hồi từ server'
        };
      }

      if (!response.ok) {
        console.error('❌ [EnrollmentService] API Error:', {
          status: response.status,
          data: responseData
        });

        return {
          success: false,
          message: responseData.message || `Lỗi server: ${response.status}`,
          error: responseData.error
        };
      }

      console.log('✅ [EnrollmentService] Enrollment created successfully:', responseData);
      return {
        success: true,
        message: responseData.message || 'Đăng ký khóa học thành công',
        enrollment: responseData.enrollment
      };

    } catch (error: any) {
      console.error('💥 [EnrollmentService] Unexpected error:', {
        message: error.message,
        stack: error.stack,
        courseId,
        paymentId
      });

      return {
        success: false,
        message: 'Lỗi kết nối đến server. Vui lòng thử lại sau.',
        error: error.message
      };
    }
  },

  /**
   * Mua lesson riêng lẻ
   */
  purchaseLesson: async (courseId: string, lessonId: string, paymentId: string, price: number): Promise<EnrollmentResponse> => {
    try {
      console.log('🛒 [EnrollmentService] Purchasing lesson:', { 
        courseId, 
        lessonId, 
        paymentId, 
        price 
      });

      // Validate input
      if (!courseId || !courseId.trim()) {
        return {
          success: false,
          message: 'courseId là bắt buộc'
        };
      }

      if (!lessonId || !lessonId.trim()) {
        return {
          success: false,
          message: 'lessonId là bắt buộc'
        };
      }

      if (!paymentId || !paymentId.trim()) {
        return {
          success: false,
          message: 'paymentId là bắt buộc'
        };
      }

      if (!price || price <= 0) {
        return {
          success: false,
          message: 'Giá lesson phải lớn hơn 0'
        };
      }

      const token = localStorage.getItem('token');
      if (!token) {
        return {
          success: false,
          message: 'Không tìm thấy token xác thực'
        };
      }

      const endpoint = `${API_BASE_URL}/api/enrollments/purchase-lesson`;
      const requestBody: PurchaseLessonData = {
        courseId: courseId.trim(),
        lessonId: lessonId.trim(),
        paymentId: paymentId.trim(),
        price
      };

      console.log('📤 [EnrollmentService] Sending purchase lesson request:', requestBody);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 [EnrollmentService] Purchase lesson response status:', response.status);

      const responseText = await response.text();
      let responseData;

      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ [EnrollmentService] Failed to parse purchase lesson response:', responseText);
        return {
          success: false,
          message: 'Lỗi khi xử lý phản hồi từ server'
        };
      }

      if (!response.ok) {
        console.error('❌ [EnrollmentService] Purchase lesson API Error:', {
          status: response.status,
          data: responseData
        });

        return {
          success: false,
          message: responseData.message || `Lỗi server: ${response.status}`,
          error: responseData.error
        };
      }

      console.log('✅ [EnrollmentService] Lesson purchased successfully:', responseData);
      return {
        success: true,
        message: responseData.message || 'Mua bài học thành công',
        enrollment: responseData.enrollment
      };

    } catch (error: any) {
      console.error('💥 [EnrollmentService] Purchase lesson unexpected error:', error);
      return {
        success: false,
        message: 'Lỗi kết nối đến server. Vui lòng thử lại sau.',
        error: error.message
      };
    }
  },

  /**
   * Kiểm tra quyền truy cập lesson
   */
  checkLessonAccess: async (lessonId: string): Promise<LessonAccessResponse> => {
    try {
      console.log('🔐 [EnrollmentService] Checking lesson access:', lessonId);

      if (!lessonId || !lessonId.trim()) {
        return {
          success: false,
          hasAccess: false,
          accessType: 'none',
          message: 'lessonId là bắt buộc'
        };
      }

      const token = localStorage.getItem('token');
      if (!token) {
        return {
          success: false,
          hasAccess: false,
          accessType: 'none',
          message: 'Không tìm thấy token xác thực'
        };
      }

      const endpoint = `${API_BASE_URL}/api/enrollments/check-access/${lessonId.trim()}`;

      console.log('📤 [EnrollmentService] Sending check access request:', endpoint);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📥 [EnrollmentService] Check access response status:', response.status);

      const responseText = await response.text();
      let responseData;

      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ [EnrollmentService] Failed to parse check access response:', responseText);
        return {
          success: false,
          hasAccess: false,
          accessType: 'none',
          message: 'Lỗi khi xử lý phản hồi từ server'
        };
      }

      if (!response.ok) {
        console.error('❌ [EnrollmentService] Check access API Error:', {
          status: response.status,
          data: responseData
        });

        return {
          success: false,
          hasAccess: false,
          accessType: 'none',
          message: responseData.message || `Lỗi server: ${response.status}`
        };
      }

      console.log('✅ [EnrollmentService] Lesson access check completed:', responseData);
      return {
        success: true,
        hasAccess: responseData.hasAccess,
        accessType: responseData.accessType,
        lesson: responseData.lesson,
        message: responseData.message
      };

    } catch (error: any) {
      console.error('💥 [EnrollmentService] Check lesson access unexpected error:', error);
      return {
        success: false,
        hasAccess: false,
        accessType: 'none',
        message: 'Lỗi kết nối đến server. Vui lòng thử lại sau.'
      };
    }
  },

  /**
   * Lấy danh sách enrollment của user
   */
  getMyEnrollments: async (page = 1, limit = 10, status?: string): Promise<any> => {
    try {
      console.log('📋 [EnrollmentService] Getting enrollments:', { page, limit, status });

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (status) params.append('status', status);

      const endpoint = `${API_BASE_URL}/api/enrollments/my-enrollments?${params}`;
      
      console.log('📤 [EnrollmentService] Sending get enrollments request:', endpoint);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ [EnrollmentService] Retrieved enrollments successfully');
      return data;

    } catch (error: any) {
      console.error('❌ [EnrollmentService] Get enrollments error:', error);
      throw error;
    }
  },

  /**
   * Lấy enrollment theo course
   */
  getEnrollmentByCourse: async (courseId: string): Promise<any> => {
    try {
      console.log('📚 [EnrollmentService] Getting enrollment by course:', courseId);

      if (!courseId || !courseId.trim()) {
        throw new Error('courseId là bắt buộc');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      const endpoint = `${API_BASE_URL}/api/enrollments/course/${courseId.trim()}`;

      console.log('📤 [EnrollmentService] Sending get enrollment by course request:', endpoint);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Nếu không tìm thấy enrollment, trả về null thay vì lỗi
        if (response.status === 404) {
          return { success: false, enrollment: null, message: 'Chưa đăng ký khóa học này' };
        }
        
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ [EnrollmentService] Retrieved enrollment by course successfully');
      return data;

    } catch (error: any) {
      console.error('❌ [EnrollmentService] Get enrollment by course error:', error);
      throw error;
    }
  },

  /**
   * Lấy tiến độ học tập
   */
  getEnrollmentProgress: async (enrollmentId: string): Promise<any> => {
    try {
      console.log('📈 [EnrollmentService] Getting enrollment progress:', enrollmentId);

      if (!enrollmentId || !enrollmentId.trim()) {
        throw new Error('enrollmentId là bắt buộc');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      const endpoint = `${API_BASE_URL}/api/enrollments/progress/${enrollmentId.trim()}`;

      console.log('📤 [EnrollmentService] Sending get progress request:', endpoint);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ [EnrollmentService] Retrieved enrollment progress successfully');
      return data;

    } catch (error: any) {
      console.error('❌ [EnrollmentService] Get enrollment progress error:', error);
      throw error;
    }
  },

  /**
   * Đánh dấu lesson hoàn thành
   */
  markLessonCompleted: async (lessonId: string, progress = 100): Promise<any> => {
    try {
      console.log('✅ [EnrollmentService] Marking lesson completed:', { lessonId, progress });

      if (!lessonId || !lessonId.trim()) {
        throw new Error('lessonId là bắt buộc');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      const endpoint = `${API_BASE_URL}/api/enrollments/complete-lesson/${lessonId.trim()}`;

      console.log('📤 [EnrollmentService] Sending mark lesson completed request:', endpoint);

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ progress }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ [EnrollmentService] Lesson marked as completed successfully');
      return data;

    } catch (error: any) {
      console.error('❌ [EnrollmentService] Mark lesson completed error:', error);
      throw error;
    }
  },

  /**
   * Cập nhật trạng thái enrollment
   */
  updateEnrollmentStatus: async (enrollmentId: string, status: string): Promise<any> => {
    try {
      console.log('🔄 [EnrollmentService] Updating enrollment status:', { enrollmentId, status });

      if (!enrollmentId || !enrollmentId.trim()) {
        throw new Error('enrollmentId là bắt buộc');
      }

      if (!status || !status.trim()) {
        throw new Error('status là bắt buộc');
      }

      const validStatuses = ['active', 'completed', 'cancelled', 'paused'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Status không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(', ')}`);
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      const endpoint = `${API_BASE_URL}/api/enrollments/${enrollmentId.trim()}/status`;

      console.log('📤 [EnrollmentService] Sending update status request:', endpoint);

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ [EnrollmentService] Enrollment status updated successfully');
      return data;

    } catch (error: any) {
      console.error('❌ [EnrollmentService] Update enrollment status error:', error);
      throw error;
    }
  },

  /**
   * Xóa enrollment
   */
  deleteEnrollment: async (enrollmentId: string): Promise<any> => {
    try {
      console.log('🗑 [EnrollmentService] Deleting enrollment:', enrollmentId);

      if (!enrollmentId || !enrollmentId.trim()) {
        throw new Error('enrollmentId là bắt buộc');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      const endpoint = `${API_BASE_URL}/api/enrollments/${enrollmentId.trim()}`;

      console.log('📤 [EnrollmentService] Sending delete enrollment request:', endpoint);

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ [EnrollmentService] Enrollment deleted successfully');
      return data;

    } catch (error: any) {
      console.error('❌ [EnrollmentService] Delete enrollment error:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách enrollment của khóa học (cho instructor)
   */
  getCourseEnrollments: async (courseId: string, page = 1, limit = 10, status?: string): Promise<any> => {
    try {
      console.log('👥 [EnrollmentService] Getting course enrollments:', { courseId, page, limit, status });

      if (!courseId || !courseId.trim()) {
        throw new Error('courseId là bắt buộc');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (status) params.append('status', status);

      const endpoint = `${API_BASE_URL}/api/enrollments/course/${courseId.trim()}/enrollments?${params}`;

      console.log('📤 [EnrollmentService] Sending get course enrollments request:', endpoint);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ [EnrollmentService] Retrieved course enrollments successfully');
      return data;

    } catch (error: any) {
      console.error('❌ [EnrollmentService] Get course enrollments error:', error);
      throw error;
    }
  },

  /**
   * Kiểm tra enrollment (legacy - giữ để tương thích)
   */
  checkEnrollment: async (courseId: string): Promise<any> => {
    try {
      console.log('🔍 [EnrollmentService] Checking enrollment for course:', courseId);

      // Sử dụng getEnrollmentByCourse thay thế
      return await enrollmentService.getEnrollmentByCourse(courseId);

    } catch (error: any) {
      console.error('❌ [EnrollmentService] Check enrollment error:', error);
      throw error;
    }
  }
};
export const getStudentCourses = async (page = 1, limit = 10, status?: string): Promise<StudentCourseResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Không tìm thấy token xác thực');
    }

    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);

    const endpoint = `${API_BASE_URL}/api/students/my-courses?${params}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error fetching student courses:', error);
    throw error;
  }
};

/**
 * Lấy tiến độ chi tiết của một khóa học
 */
export const getCourseProgress = async (courseId: string): Promise<CourseProgressResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Không tìm thấy token xác thực');
    }

    const endpoint = `${API_BASE_URL}/api/students/courses/${courseId}/progress`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error fetching course progress:', error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết bài học (với kiểm tra quyền truy cập)
 */
export const getStudentLessonDetails = async (lessonId: string): Promise<any> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Không tìm thấy token xác thực');
    }

    const endpoint = `${API_BASE_URL}/api/students/lessons/${lessonId}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error fetching student lesson details:', error);
    throw error;
  }
};

/**
 * Lấy danh sách bài học sắp tới
 */
export const getUpcomingLessons = async (limit = 5): Promise<any> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Không tìm thấy token xác thực');
    }

    const endpoint = `${API_BASE_URL}/api/students/upcoming-lessons?limit=${limit}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error fetching upcoming lessons:', error);
    throw error;
  }
};

/**
 * Lấy thống kê học tập
 */
export const getLearningStatistics = async (): Promise<{ success: boolean; statistics: LearningStatistics }> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Không tìm thấy token xác thực');
    }

    const endpoint = `${API_BASE_URL}/api/students/statistics`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error fetching learning statistics:', error);
    throw error;
  }
};
export default enrollmentService;