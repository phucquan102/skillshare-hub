import React from 'react';
import { User } from '../../../types/user.types';

interface UserTableProps {
  users: User[];
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onDeleteUser: (userId: string) => void;
  loading: boolean;
}

const UserTable: React.FC<UserTableProps> = ({ 
  users, 
  onUpdateUser, 
  onDeleteUser,
  loading 
}) => {
  const handleRoleChange = (userId: string, newRole: string) => {
    onUpdateUser(userId, { role: newRole as any });
  };

  const handleStatusChange = (userId: string, isActive: boolean) => {
    onUpdateUser(userId, { isActive });
  };

  if (users.length === 0 && !loading) {
    return <div className="no-users">Không có người dùng nào</div>;
  }

  return (
    <div className="user-table">
      <table>
        <thead>
          <tr>
            <th>Họ tên</th>
            <th>Email</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Xác thực</th>
            <th>Ngày tạo</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id} className={user.isActive ? '' : 'inactive'}>
              <td>
                <div className="user-info">
                  {user.profile?.avatar && (
                    <img src={user.profile.avatar} alt={user.fullName} className="avatar" />
                  )}
                  <span>{user.fullName}</span>
                </div>
              </td>
              <td>{user.email}</td>
              <td>
                <select 
                  value={user.role} 
                  onChange={(e) => handleRoleChange(user._id, e.target.value)}
                  disabled={user.role === 'admin'} // Không cho đổi role admin
                >
                  <option value="student">Học viên</option>
                  <option value="instructor">Giảng viên</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </td>
              <td>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={user.isActive} 
                    onChange={(e) => handleStatusChange(user._id, e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
                <span>{user.isActive ? 'Hoạt động' : 'Đã khóa'}</span>
              </td>
              <td>
                {user.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
              </td>
              <td>
                {new Date(user.createdAt).toLocaleDateString('vi-VN')}
              </td>
              <td>
                <button 
                  className="btn-delete"
                  onClick={() => onDeleteUser(user._id)}
                  disabled={user.role === 'admin'} // Không cho xóa admin
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;