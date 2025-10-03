// src/services/api/authService.ts
import { User, LoginData, RegisterData, AuthResponse } from '../../types/user.types';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export const authService = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      console.log('Attempting login with:', { email: data.email });
      
      const response = await fetch(`${BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      console.log('Login response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Login failed:', errorData);
        throw new Error(errorData.message || `Login failed with status ${response.status}`);
      }

      const result = await response.json();
      localStorage.setItem('token', result.token);

      console.log('Login successful:', { userId: result.user?.id });
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      console.log('Attempting registration with:', { 
        email: data.email, 
        fullName: data.fullName, 
        role: data.role 
      });
      
      const response = await fetch(`${BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      console.log('Register response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Registration failed:', errorData);
        throw new Error(errorData.message || `Registration failed with status ${response.status}`);
      }

      const result = await response.json();
      localStorage.setItem('token', result.token);

      console.log('Registration successful:', { userId: result.user?.id });
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  googleLogin: async (token: string): Promise<AuthResponse> => {
    try {
      console.log('Attempting Google login');
      
      const response = await fetch(`${BASE_URL}/api/users/google`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });

      console.log('Google login response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Google login failed:', errorData);
        throw new Error(errorData.message || `Google login failed with status ${response.status}`);
      }

      const result = await response.json();
      localStorage.setItem('token', result.token);

      console.log('Google login successful:', { userId: result.user?.id });
      return result;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  },

  getProfile: async (): Promise<{ user: User }> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token');
      }

      const response = await fetch(`${BASE_URL}/api/users/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Lấy thông tin người dùng thất bại');
      }

      const result = await response.json();
      // Đảm bảo có cả id và _id
      if (result.user && result.user._id && !result.user.id) {
        result.user.id = result.user._id;
      }
      return result;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  updateProfile: async (data: any): Promise<{ user: User; message: string }> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token');
      }

      const response = await fetch(`${BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Cập nhật thông tin thất bại');
      }

      const result = await response.json();
      // Đảm bảo có cả id và _id
      if (result.user && result.user._id && !result.user.id) {
        result.user.id = result.user._id;
      }
      return result;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  logout: (): void => {
    localStorage.removeItem('token');
  },
   forgotPassword: async (email: string): Promise<{ message: string }> => {
    try {
      const response = await fetch(`${BASE_URL}/api/users/forgot-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send reset password email');
      }

      return await response.json();
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    try {
      const response = await fetch(`${BASE_URL}/api/users/reset-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to reset password');
      }

      return await response.json();
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  verifyEmail: async (token: string): Promise<{ message: string; user?: User; token?: string }> => {
    try {
      const response = await fetch(`${BASE_URL}/api/users/verify-email`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Email verification failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  },

  resendVerification: async (email: string): Promise<{ message: string }> => {
    try {
      const response = await fetch(`${BASE_URL}/api/users/resend-verification`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to resend verification email');
      }

      return await response.json();
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  }
};