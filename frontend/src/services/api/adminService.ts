import { User, UsersFilter, UsersResponse } from './../../types/user.types';
import { apiRequest } from '../../utils/apiUtils';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export const adminService = {
  // Lấy danh sách users với bộ lọc
  getUsers: async (filters: UsersFilter): Promise<UsersResponse> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiRequest<UsersResponse>(
      `${API_BASE_URL}/api/users?${queryParams}`, // Sửa thành /api/users
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    return response;
  },

  // Cập nhật thông tin user
  updateUser: async (userId: string, userData: Partial<User>): Promise<User> => {
    const response = await apiRequest<User>(
      `${API_BASE_URL}/api/users/${userId}`, // Sửa thành /api/users/:userId
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(userData)
      }
    );

    return response;
  },

  // Xóa user
  deleteUser: async (userId: string): Promise<void> => {
    await apiRequest<void>(
      `${API_BASE_URL}/api/users/${userId}`, // Sửa thành /api/users/:userId
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
  },

  // Lấy thống kê users
getUsersStats: async (): Promise<any> => {
  const response = await apiRequest<any>(
    `${API_BASE_URL}/api/users/stats/overview`,// Gọi endpoint thông thường
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }
  );
  return response;
}
};