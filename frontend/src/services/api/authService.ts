// Types
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

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

const login = async (data: LoginData): Promise<AuthResponse> => {
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
};


const register = async (data: RegisterData): Promise<AuthResponse> => {
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
};

const getProfile = async (): Promise<{ user: User }> => {
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

    return await response.json();
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};

// Logout function (client-side only)
const logout = (): void => {
  localStorage.removeItem('token');
};

export const authService = {
  login,
  register,
  getProfile,
  logout
};