import React from 'react';
import { User } from '../../../types/user.types';
import { Mail, Calendar, Edit2, Trash2, Shield, User as UserIcon } from 'lucide-react';

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

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      student: 'bg-blue-100 text-blue-800',
      instructor: 'bg-green-100 text-green-800',
      admin: 'bg-purple-100 text-purple-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (users.length === 0 && !loading) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No users found</p>
        <p className="text-gray-400 text-sm">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Verification
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user._id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {user.profile?.avatar ? (
                        <img 
                          src={user.profile.avatar} 
                          alt={user.fullName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {user.fullName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.fullName}</div>
                      <div className="text-sm text-gray-500">ID: {user._id.slice(-8)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select 
                    value={user.role} 
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    disabled={user.role === 'admin'}
                    className={`text-xs font-medium px-3 py-1 rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${getRoleBadgeColor(user.role)}`}
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <label className="inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={user.isActive} 
                      onChange={(e) => handleStatusChange(user._id, e.target.checked)}
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className={`ml-3 text-xs font-medium px-2 py-1 rounded-full ${getStatusBadgeColor(user.isActive)}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                    user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    <Shield className="w-3 h-3" />
                    {user.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateUser(user._id, {})}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="Edit user"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDeleteUser(user._id)}
                      disabled={user.role === 'admin'}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;