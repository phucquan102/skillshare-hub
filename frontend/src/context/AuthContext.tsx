// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/api/authService';
import { User } from '../types/user.types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role?: 'student' | 'instructor') => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function để normalize user object
const normalizeUser = (userData: any): User => {
  return {
    ...userData,
    _id: userData._id || userData.id, // Nếu API return 'id', chuyển thành '_id'
  };
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      
      console.log('🔍 AuthContext initAuth - Token:', token ? 'EXISTS' : 'NO TOKEN');
      
      if (!token) {
        console.log('❌ No token found, setting loading to false');
        setLoading(false);
        return;
      }

      try {
        console.log('📡 Fetching user profile...');
        const response = await authService.getProfile();
        
        console.log('✅ Profile response:', response);
        
        if (response.user) {
          const normalizedUser = normalizeUser(response.user);
          setUser(normalizedUser);
          console.log('✅ User set successfully:', normalizedUser._id);
        } else {
          console.warn('⚠️ Response has no user data');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Failed to get user profile:', error);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('📝 Attempting login with email:', email);
      const response = await authService.login({ email, password });
      
      console.log('✅ Login successful:', response);
      
      const normalizedUser = normalizeUser(response.user);
      setUser(normalizedUser);
      console.log('✅ User state updated:', normalizedUser._id);
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, fullName: string, role?: 'student' | 'instructor') => {
    try {
      console.log('📝 Attempting register with email:', email);
      const response = await authService.register({ email, password, fullName, role });
      
      console.log('✅ Register successful:', response);
      
      const normalizedUser = normalizeUser(response.user);
      setUser(normalizedUser);
      console.log('✅ User state updated:', normalizedUser._id);
    } catch (error) {
      console.error('❌ Register failed:', error);
      throw error;
    }
  };

  const googleLogin = async (token: string) => {
    try {
      console.log('📝 Attempting Google login');
      const response = await authService.googleLogin(token);
      
      console.log('✅ Google login successful:', response);
      
      const normalizedUser = normalizeUser(response.user);
      setUser(normalizedUser);
      console.log('✅ User state updated:', normalizedUser._id);
    } catch (error) {
      console.error('❌ Google login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('🚪 Logging out...');
    authService.logout();
    setUser(null);
    console.log('✅ Logout successful');
  };

  const updateUser = (userData: User) => {
    console.log('🔄 Updating user:', userData);
    const normalizedUser = normalizeUser(userData);
    setUser(normalizedUser);
  };

  const value = {
    user,
    login,
    register,
    googleLogin,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};