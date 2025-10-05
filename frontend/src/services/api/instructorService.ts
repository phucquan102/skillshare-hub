import { paymentService } from './paymentService';
import { authService } from './authService'; // Thêm import này

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
  tokenUpdated?: boolean; // Thêm field mới
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
   * Nâng cấp user lên instructor - PHIÊN BẢN ĐÃ SỬA
   */
  async upgradeToInstructor(): Promise<InstructorResponse> {
    const endpoint = `${process.env.REACT_APP_API_BASE_URL}/api/users/upgrade-to-instructor`;
    
    try {
      console.log('🔄 [InstructorService] Upgrading to instructor...', endpoint);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      // Debug token hiện tại
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

      // 🔥 QUAN TRỌNG: Xử lý token và profile sau khi upgrade
      let tokenUpdated = false;
      let newToken = null;

      // Trường hợp 1: Backend trả về token mới trong response
      if (responseData.token) {
        console.log('🔄 [InstructorService] New token received from backend');
        newToken = responseData.token;
        localStorage.setItem('token', newToken);
        tokenUpdated = true;
      }
      
      // Trường hợp 2: Backend trả về user data mới
      if (responseData.user) {
        console.log('🔄 [InstructorService] New user data received:', {
          role: responseData.user.role,
          id: responseData.user._id
        });
        localStorage.setItem('user', JSON.stringify(responseData.user));
      }

      // Trường hợp 3: Luôn gọi API getProfile để đảm bảo có thông tin mới nhất
      console.log('🔄 [InstructorService] Fetching updated profile...');
      try {
        const profileResponse = await authService.getProfile();
        console.log('✅ [InstructorService] Updated profile received:', {
          role: profileResponse.user.role,
          id: profileResponse.user._id
        });
        
        // Cập nhật localStorage với user mới
        localStorage.setItem('user', JSON.stringify(profileResponse.user));
        
        // Nếu chưa có token mới từ backend, sử dụng token hiện tại nhưng đánh dấu cần refresh
        if (!tokenUpdated) {
          console.warn('⚠️ [InstructorService] No new token received, current token may have old role');
          // Vẫn đánh dấu là đã update profile thành công
          tokenUpdated = true;
        }
      } catch (profileError) {
        console.error('❌ [InstructorService] Failed to get updated profile:', profileError);
        // Không throw error ở đây vì upgrade đã thành công
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
   * Force refresh token và profile - METHOD MỚI
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
   * Kiểm tra và xử lý token sau khi upgrade - METHOD MỚI
   */
  async handlePostUpgradeToken(): Promise<{ success: boolean; needsRelogin: boolean }> {
    try {
      console.log('🔍 [InstructorService] Handling post-upgrade token check...');
      
      // Lấy profile mới nhất
      const refreshed = await this.forceRefreshUserProfile();
      if (!refreshed) {
        return { success: false, needsRelogin: true };
      }

      // Kiểm tra token hiện tại
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

        // Nếu token role và user role không khớp, cần đăng nhập lại
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
   * Kiểm tra xem user đã là instructor chưa - PHIÊN BẢN CẢI TIẾN
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
        
        // Debug token để so sánh
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
  }
};

export default instructorService;