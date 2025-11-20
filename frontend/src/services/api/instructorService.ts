import { paymentService } from './paymentService';
import { authService } from './authService';
import {
  InstructorStudent,
  InstructorStudentListResponse,
  InstructorStudentProgressResponse,
  StudentListFilters
} from '../../types/student.types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export interface InstructorRequirements {
  minCourses?: number;
  verificationRequired?: boolean;
  profileCompletion?: boolean;
  paymentRequired?: boolean;
}

export interface InstructorResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  tokenUpdated?: boolean;
}

export const instructorService = {
  /**
   * Tạo thanh toán để trở thành instructor
   */
  async createInstructorPayment(): Promise<InstructorResponse> {
    try {
      console.log('🎯 [InstructorService] Creating instructor payment...');

      const response = await paymentService.createInstructorFee('stripe');
      
      if (!response.clientSecret) {
        throw new Error('Không nhận được client secret từ server');
      }

      console.log('✅ [InstructorService] Instructor payment created successfully');
      return {
        success: true,
        message: 'Tạo thanh toán instructor thành công',
        data: response
      };

    } catch (error: any) {
      console.error('❌ [InstructorService] Create payment error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể tạo thanh toán instructor',
        error: error.message
      };
    }
  },

  /**
   * Xác nhận thanh toán instructor
   */
  async confirmInstructorPayment(paymentId: string, paymentIntentId: string): Promise<InstructorResponse> {
    try {
      console.log('🎯 [InstructorService] Confirming instructor payment:', { paymentId, paymentIntentId });

      const response = await paymentService.confirmPayment({
        paymentId,
        paymentIntentId,
        status: 'completed'
      });

      console.log('✅ [InstructorService] Instructor payment confirmed successfully');
      return {
        success: true,
        message: 'Xác nhận thanh toán instructor thành công',
        data: response
      };

    } catch (error: any) {
      console.error('❌ [InstructorService] Confirm payment error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể xác nhận thanh toán instructor',
        error: error.message
      };
    }
  },

  /**
   * Nâng cấp user lên instructor
   */
  async upgradeToInstructor(): Promise<InstructorResponse> {
    const endpoint = `${API_BASE_URL}/api/users/upgrade-to-instructor`;
    
    try {
      console.log('🔄 [InstructorService] Upgrading to instructor...', endpoint);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      console.log('🔍 [InstructorService] Current token debug:', {
        tokenExists: !!token,
        tokenLength: token.length
      });

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🎭 [InstructorService] Current token payload:', {
          role: payload.role,
          userId: payload.userId,
          exp: new Date(payload.exp * 1000)
        });
      } catch (e) {
        console.error('❌ [InstructorService] Token decode error:', e);
      }

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const responseText = await response.text();
      let responseData;

      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ [InstructorService] Failed to parse response:', responseText);
        throw new Error('Lỗi khi xử lý phản hồi từ server');
      }

      if (!response.ok) {
        console.error('❌ [InstructorService] Upgrade failed:', {
          status: response.status,
          data: responseData
        });
        throw new Error(responseData.message || `Lỗi server: ${response.status}`);
      }

      console.log('✅ [InstructorService] Upgrade API call successful');

      let tokenUpdated = false;
      let newToken = null;

      if (responseData.token) {
        console.log('🔄 [InstructorService] New token received from backend');
        newToken = responseData.token;
        localStorage.setItem('token', newToken);
        tokenUpdated = true;
      }
      
      if (responseData.user) {
        console.log('🔄 [InstructorService] New user data received:', {
          role: responseData.user.role,
          id: responseData.user._id
        });
        localStorage.setItem('user', JSON.stringify(responseData.user));
      }

      console.log('🔄 [InstructorService] Fetching updated profile...');
      try {
        const profileResponse = await authService.getProfile();
        console.log('✅ [InstructorService] Updated profile received:', {
          role: profileResponse.user.role,
          id: profileResponse.user._id
        });
        
        localStorage.setItem('user', JSON.stringify(profileResponse.user));
        
        if (!tokenUpdated) {
          console.warn('⚠️ [InstructorService] No new token received, current token may have old role');
          tokenUpdated = true;
        }
      } catch (profileError) {
        console.error('❌ [InstructorService] Failed to get updated profile:', profileError);
      }

      console.log('✅ [InstructorService] Upgrade to instructor completed successfully');
      return {
        success: true,
        message: responseData.message || 'Nâng cấp lên instructor thành công',
        data: responseData,
        tokenUpdated
      };

    } catch (error: any) {
      console.error('❌ [InstructorService] Upgrade error:', error);
      
      return {
        success: false,
        message: error.message || 'Không thể nâng cấp tài khoản lên instructor',
        error: error.message
      };
    }
  },

  /**
   * Force refresh token và profile
   */
  async forceRefreshUserProfile(): Promise<boolean> {
    try {
      console.log('🔄 [InstructorService] Force refreshing user profile...');
      
      const profileResponse = await authService.getProfile();
      console.log('✅ [InstructorService] Profile refreshed:', {
        role: profileResponse.user.role,
        id: profileResponse.user._id
      });
      
      localStorage.setItem('user', JSON.stringify(profileResponse.user));
      return true;
    } catch (error) {
      console.error('❌ [InstructorService] Force refresh failed:', error);
      return false;
    }
  },

  /**
   * Kiểm tra và xử lý token sau khi upgrade
   */
  async handlePostUpgradeToken(): Promise<{ success: boolean; needsRelogin: boolean }> {
    try {
      console.log('🔍 [InstructorService] Handling post-upgrade token check...');
      
      const refreshed = await this.forceRefreshUserProfile();
      if (!refreshed) {
        return { success: false, needsRelogin: true };
      }

      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, needsRelogin: true };
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        console.log('🔍 [InstructorService] Token vs User comparison:', {
          tokenRole: payload.role,
          userRole: user?.role,
          match: payload.role === user?.role
        });

        if (payload.role !== user?.role) {
          console.warn('⚠️ [InstructorService] Token role mismatch, needs relogin');
          return { success: false, needsRelogin: true };
        }

        return { success: true, needsRelogin: false };
      } catch (e) {
        console.error('❌ [InstructorService] Token check error:', e);
        return { success: false, needsRelogin: true };
      }
    } catch (error) {
      console.error('❌ [InstructorService] Post-upgrade handling failed:', error);
      return { success: false, needsRelogin: true };
    }
  },

  /**
   * Lấy yêu cầu để trở thành instructor
   */
  async getInstructorRequirements(): Promise<InstructorRequirements> {
    console.log('📋 [InstructorService] Getting requirements...');
    
    return {
      minCourses: 0,
      verificationRequired: true,
      profileCompletion: true,
      paymentRequired: true
    };
  },

  /**
   * Kiểm tra xem user đã là instructor chưa
   */
  async checkInstructorStatus(): Promise<{ 
    isInstructor: boolean; 
    canBecomeInstructor: boolean;
    needsTokenRefresh?: boolean;
  }> {
    console.log('🔍 [InstructorService] Checking instructor status...');
    
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      try {
        const user = JSON.parse(userData);
        
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('🔍 [InstructorService] Status check - Token vs User:', {
            tokenRole: payload.role,
            userRole: user.role,
            matches: payload.role === user.role
          });
          
          const needsTokenRefresh = payload.role !== user.role;
          
          return {
            isInstructor: user.role === 'instructor',
            canBecomeInstructor: user.role === 'student',
            needsTokenRefresh
          };
        } catch (tokenError) {
          console.error('❌ [InstructorService] Token decode in status check:', tokenError);
        }
        
        return {
          isInstructor: user.role === 'instructor',
          canBecomeInstructor: user.role === 'student'
        };
      } catch (error) {
        console.error('❌ [InstructorService] Error parsing user data:', error);
      }
    }
    
    return { 
      isInstructor: false, 
      canBecomeInstructor: false 
    };
  },

  // ========== STUDENT LIST METHODS ==========

 /**
 * Lấy danh sách học viên của một khóa học
 * Sử dụng endpoint thực tế từ backend
 */
async getStudentsByCourse(
  courseId: string,
  filters?: StudentListFilters
): Promise<InstructorStudentListResponse> {
  try {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const status = filters?.status || 'all';
    const search = filters?.search || '';

    console.log('👥 [InstructorService] Getting students for course:', {
      courseId,
      page,
      limit,
      status,
      search
    });

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Không tìm thấy token xác thực');
    }

    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status && status !== 'all') {
      params.append('status', status);
    }
    if (search && search.trim()) {
      params.append('search', search.trim());
    }

    // 🔥 SỬA: Sử dụng endpoint chính xác từ backend
    const endpoint = `${API_BASE_URL}/api/enrollments/course/${courseId}/enrollments?${params}`;

    console.log('📤 [InstructorService] Sending request to:', endpoint);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [InstructorService] Error response:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    console.log('✅ [InstructorService] API response:', responseData);

    // 🔥 CHUYỂN ĐỔI: Từ định dạng backend sang định dạng frontend
    // Backend trả về { enrollments, stats, pagination }
    // Frontend cần { students, stats, pagination }
    
    const students: InstructorStudent[] = responseData.enrollments.map((enrollment: any) => ({
      enrollmentId: enrollment._id,
      student: {
        userId: enrollment.studentId?._id || enrollment.studentId,
        email: enrollment.studentId?.email || 'N/A',
        fullName: enrollment.studentId?.fullName || 'Unknown Student',
        avatar: enrollment.studentId?.profile?.avatar || enrollment.studentId?.avatar || '',
        phoneNumber: enrollment.studentId?.phoneNumber || ''
      },
      enrollment: {
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt
      },
      progress: {
        progressPercentage: enrollment.progress?.overallProgress || 0,
        completedLessons: enrollment.progress?.completedLessons?.length || 0,
        totalLessons: 0, // Cần tính từ course
        lastAccessed: enrollment.progress?.lastAccessed || enrollment.enrolledAt
      }
    }));

    // Tính totalLessons cho mỗi student (cần gọi API khác hoặc optimize)
    // Tạm thời để 0, có thể cải thiện sau

    const result: InstructorStudentListResponse = {
      success: true,
      students: students,
      stats: responseData.stats || {
        total: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
        paused: 0
      },
      pagination: responseData.pagination || {
        currentPage: page,
        totalPages: 0,
        totalStudents: 0,
        hasNext: false,
        hasPrev: false
      }
    };

    console.log('✅ [InstructorService] Transformed data:', {
      studentsCount: result.students.length,
      stats: result.stats
    });

    return result;

  } catch (error: any) {
    console.error('❌ [InstructorService] Get students error:', error);
    
    // Fallback: trả về dữ liệu rỗng
    return {
      success: true,
      students: [],
      stats: {
        total: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
        paused: 0
      },
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalStudents: 0,
        hasNext: false,
        hasPrev: false
      }
    };
  }
},
  /**
   * Lấy chi tiết tiến độ học tập của một học viên
   * GET /api/courses/:courseId/students/:studentId/progress
   */
  async getStudentProgress(
    courseId: string,
    studentId: string
  ): Promise<InstructorStudentProgressResponse> {
    try {
      console.log('📈 [InstructorService] Getting student progress:', {
        courseId,
        studentId
      });

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      const endpoint = `${API_BASE_URL}/api/courses/${courseId}/students/${studentId}/progress`;

      console.log('📤 [InstructorService] Sending get student progress request:', endpoint);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [InstructorService] Error response:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data: InstructorStudentProgressResponse = await response.json();
      console.log('✅ [InstructorService] Student progress retrieved successfully');

      return data;

    } catch (error: any) {
      console.error('❌ [InstructorService] Get student progress error:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách khóa học của giảng viên
   * GET /api/courses/my-courses
   */
  async getMyCourses(
  page: number = 1,
  limit: number = 10,
  status?: string
): Promise<any> {
  try {
    console.log('📚 [InstructorService] Getting my courses:', {
      page,
      limit,
      status
    });

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Không tìm thấy token xác thực');
    }

    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status && status !== 'all') {
      params.append('status', status);
    }

    // 🔥 FIX: Sửa endpoint từ /api/courses/my-courses thành /api/courses/my-courses
    const endpoint = `${API_BASE_URL}/api/courses/my?${params}`;

    console.log('📤 [InstructorService] Sending get my courses request:', endpoint);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [InstructorService] Error response:', response.status, errorText);
      
      // Nếu 404, trả về response rỗng
      if (response.status === 404) {
        console.warn('⚠️ [InstructorService] Endpoint not found, returning empty response');
        return {
          success: false,
          courses: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalCourses: 0,
            hasNext: false,
            hasPrev: false
          }
        };
      }
      
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ [InstructorService] My courses retrieved successfully:', {
      count: data.courses?.length || 0,
      total: data.pagination?.totalCourses || 0
    });

    return data;

  } catch (error: any) {
    console.error('❌ [InstructorService] Get my courses error:', error);
    
    // Trả về response rỗng thay vì throw
    return {
      success: false,
      courses: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalCourses: 0,
        hasNext: false,
        hasPrev: false
      }
    };
  }
},
  /**
   * Lấy chi tiết một khóa học
   * GET /api/courses/:courseId
   */
  async getCourseById(courseId: string): Promise<any> {
    try {
      const token = localStorage.getItem('token');

      const endpoint = `${API_BASE_URL}/api/courses/${courseId}`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();

    } catch (error: any) {
      console.error('❌ Get course error:', error);
      throw error;
    }
  },

  /**
   * Cập nhật khóa học
   * PATCH /api/courses/:courseId
   */
  async updateCourse(courseId: string, updateData: any): Promise<any> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      const endpoint = `${API_BASE_URL}/api/courses/${courseId}`;

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();

    } catch (error: any) {
      console.error('❌ Update course error:', error);
      throw error;
    }
  },

  /**
   * Xóa khóa học
   * DELETE /api/courses/:courseId
   */
  async deleteCourse(courseId: string): Promise<any> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      const endpoint = `${API_BASE_URL}/api/courses/${courseId}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();

    } catch (error: any) {
      console.error('❌ Delete course error:', error);
      throw error;
    }
  },

  /**
   * Lấy thống kê khóa học
   * GET /api/courses/:courseId/stats
   */
  async getCourseStats(courseId: string): Promise<any> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      const endpoint = `${API_BASE_URL}/api/courses/${courseId}/stats`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();

    } catch (error: any) {
      console.error('❌ Get course stats error:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách bài học của khóa học
   * GET /api/courses/:courseId/lessons
   */
  async getLessonsByCourse(
    courseId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<any> {
    try {
      const token = localStorage.getItem('token');

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const endpoint = `${API_BASE_URL}/api/courses/${courseId}/lessons?${params}`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();

    } catch (error: any) {
      console.error('❌ Get lessons error:', error);
      throw error;
    }
  }
};

export default instructorService;