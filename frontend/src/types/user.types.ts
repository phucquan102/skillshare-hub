// src/types/user.types.ts
export interface User {
  _id: string;
  id?: string; // Alias cho _id
  email: string;
  fullName: string;
  role: 'student' | 'instructor' | 'admin';
  isVerified: boolean;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
  profile?: {
    avatar?: string;
    bio?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    gender?: string;
  };
  preferences?: {
    language?: string;
    timezone?: string;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
  };
  stats?: {
    coursesCompleted?: number;
    totalLearningHours?: number;
    avgRating?: number;
  };
}

export interface UsersFilter {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  isVerified?: boolean;
}

export interface UsersResponse {
  users: User[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  usersByRole: Array<{
    _id: string;
    count: number;
  }>;
}

// Thêm các types cho auth
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role?: 'student' | 'instructor';
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export interface UpdateProfileData {
  fullName?: string;
  profile?: {
    bio?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    gender?: string;
  };
  preferences?: {
    language?: string;
    timezone?: string;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
  };
}
export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export interface VerifyEmailData {
  token: string;
}

export interface ResendVerificationData {
  email: string;
}