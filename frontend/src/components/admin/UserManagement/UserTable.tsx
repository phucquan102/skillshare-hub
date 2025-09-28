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
    return <div className="no-users">No users found</div>;
  }

  return (
    <div className="user-table">
      <table>
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Verification</th>
            <th>Created At</th>
            <th>Actions</th>
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
                  disabled={user.role === 'admin'} // Prevent changing admin role
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Administrator</option>
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
                <span>{user.isActive ? 'Active' : 'Inactive'}</span>
              </td>
              <td>
                {user.isVerified ? 'Verified' : 'Unverified'}
              </td>
              <td>
                {new Date(user.createdAt).toLocaleDateString('en-US')}
              </td>
              <td>
                <button 
                  className="btn-delete"
                  onClick={() => onDeleteUser(user._id)}
                  disabled={user.role === 'admin'} // Prevent deleting admin
                >
                  Delete
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
