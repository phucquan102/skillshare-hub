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
      student: 'bg-blue-100 text-blue-800 border border-blue-200',
      instructor: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      admin: 'bg-purple-100 text-purple-800 border border-purple-200'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200';
  };

  if (users.length === 0 && !loading) {
    return (
      <div className="text-center py-16 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl">
        <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg font-medium mb-2">No users found</p>
        <p className="text-gray-400 text-sm">Try adjusting your search criteria or filters</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                User Information
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Contact Details
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                User Role
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Account Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Verification
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Registration Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/60">
            {users.map(user => (
              <tr key={user._id} className="hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-green-50/50 transition-all duration-200 group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {user.profile?.avatar ? (
                        <img 
                          src={user.profile.avatar} 
                          alt={user.fullName}
                          className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-sm">
                          <span className="text-white font-medium text-sm">
                            {user.fullName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors duration-200">
                        {user.fullName}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">ID: {user._id.slice(-8)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="font-medium">{user.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select 
                    value={user.role} 
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    disabled={user.role === 'admin'}
                    className={`text-xs font-semibold px-3 py-2 rounded-xl border-0 focus:ring-2 focus:ring-emerald-500 transition-all duration-200 ${
                      getRoleBadgeColor(user.role)
                    } ${user.role === 'admin' ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}`}
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
                    <div className="relative w-12 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    <span className={`ml-3 text-xs font-semibold px-3 py-1 rounded-xl ${getStatusBadgeColor(user.isActive)}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl ${
                    user.isVerified ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}>
                    <Shield className="w-3 h-3" />
                    {user.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
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
                      className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200 hover:scale-110"
                      title="Edit user details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDeleteUser(user._id)}
                      disabled={user.role === 'admin'}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      title="Delete user account"
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