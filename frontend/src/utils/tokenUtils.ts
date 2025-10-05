// utils/tokenUtils.ts
export const forceTokenRefresh = async (): Promise<boolean> => {
  try {
    console.log('🔄 [tokenUtils] Force refreshing token...');
    
    const { authService } = await import('../services/api/authService');
    const profileResponse = await authService.getProfile();
    
    // Cập nhật localStorage
    localStorage.setItem('user', JSON.stringify(profileResponse.user));
    
    console.log('✅ [tokenUtils] Token refresh successful:', {
      role: profileResponse.user.role,
      id: profileResponse.user._id
    });
    
    return true;
  } catch (error) {
    console.error('❌ [tokenUtils] Token refresh failed:', error);
    return false;
  }
};

export const checkTokenRoleMatch = (): { match: boolean; tokenRole?: string; userRole?: string } => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    return { match: false };
  }
  
  try {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    const user = JSON.parse(userStr);
    
    const match = tokenPayload.role === user.role;
    
    console.log('🔍 [tokenUtils] Role check:', {
      tokenRole: tokenPayload.role,
      userRole: user.role,
      match
    });
    
    return { 
      match, 
      tokenRole: tokenPayload.role, 
      userRole: user.role 
    };
  } catch (error) {
    console.error('❌ [tokenUtils] Role check failed:', error);
    return { match: false };
  }
};