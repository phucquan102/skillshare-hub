import { apiRequest } from '../../utils/apiUtils';

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

export const enrollmentService = {
  /**
   * Tạo enrollment mới
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
   * Lấy danh sách enrollment của user
   */
  getMyEnrollments: async (page = 1, limit = 10, status?: string): Promise<any> => {
    try {
      console.log('📋 [EnrollmentService] Getting enrollments:', { page, limit, status });

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (status) params.append('status', status);

      const endpoint = `${API_BASE_URL}/api/enrollments/me?${params}`;
      
      const response = await apiRequest(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      console.log('✅ [EnrollmentService] Retrieved enrollments successfully');
      return response;

    } catch (error: any) {
      console.error('❌ [EnrollmentService] Get enrollments error:', error);
      throw error;
    }
  },

  /**
   * Xóa enrollment
   */
  deleteEnrollment: async (enrollmentId: string): Promise<any> => {
    try {
      console.log('🗑 [EnrollmentService] Deleting enrollment:', enrollmentId);

      const endpoint = `${API_BASE_URL}/api/enrollments/${enrollmentId}`;
      
      const response = await apiRequest(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      console.log('✅ [EnrollmentService] Enrollment deleted successfully');
      return response;

    } catch (error: any) {
      console.error('❌ [EnrollmentService] Delete enrollment error:', error);
      throw error;
    }
  },

  /**
   * Kiểm tra enrollment
   */
  checkEnrollment: async (courseId: string): Promise<any> => {
    try {
      console.log('🔍 [EnrollmentService] Checking enrollment for course:', courseId);

      const endpoint = `${API_BASE_URL}/api/enrollments/check/${courseId}`;
      
      const response = await apiRequest(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      console.log('✅ [EnrollmentService] Enrollment check completed');
      return response;

    } catch (error: any) {
      console.error('❌ [EnrollmentService] Check enrollment error:', error);
      throw error;
    }
  }
};

export default enrollmentService;