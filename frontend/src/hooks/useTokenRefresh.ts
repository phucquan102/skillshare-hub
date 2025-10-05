// hooks/useTokenRefresh.ts
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api/authService';

export const useTokenRefresh = () => {
  const { updateUser } = useAuth();

  const forceRefreshToken = async (): Promise<boolean> => {
    try {
      console.log('🔄 [useTokenRefresh] Force refreshing token...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ [useTokenRefresh] No token found');
        return false;
      }

      // Decode token hiện tại để xem role
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔍 [useTokenRefresh] Current token payload:', {
          role: payload.role,
          userId: payload.userId
        });
      } catch (e) {
        console.error('❌ [useTokenRefresh] Token decode error:', e);
      }

      // Gọi API getProfile để lấy thông tin mới nhất
      const profileResponse = await authService.getProfile();
      
      console.log('✅ [useTokenRefresh] Profile refreshed:', {
        newRole: profileResponse.user.role,
        userId: profileResponse.user._id
      });

      // Cập nhật context và localStorage
      updateUser(profileResponse.user);
      localStorage.setItem('user', JSON.stringify(profileResponse.user));

      return true;
    } catch (error) {
      console.error('❌ [useTokenRefresh] Force refresh failed:', error);
      return false;
    }
  };

  return { forceRefreshToken };
};