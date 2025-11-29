import React from 'react';
import { Users, UserCheck, Shield, PieChart } from 'lucide-react';

interface UserStatsProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    usersByRole: { _id: string; count: number }[];
  };
}

const UserStats: React.FC<UserStatsProps> = ({ stats }) => {
  const getRoleColor = (role: string) => {
    const colors = {
      student: 'from-blue-500 to-cyan-500',
      instructor: 'from-emerald-500 to-green-500',
      admin: 'from-purple-500 to-indigo-500',
      default: 'from-gray-500 to-gray-600'
    };
    return colors[role as keyof typeof colors] || colors.default;
  };

  const getRoleIcon = (role: string) => {
    const icons = {
      student: '🎓',
      instructor: '👨‍🏫',
      admin: '⚡'
    };
    return icons[role as keyof typeof icons] || '👤';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Users */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium mb-1">Total Users</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
            <p className="text-xs text-emerald-600 mt-1">
              All platform users
            </p>
          </div>
          <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Active Users */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium mb-1">Active Users</p>
            <p className="text-3xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
            <p className="text-xs text-emerald-600 mt-1">
              {stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0}% of total
            </p>
          </div>
          <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl shadow-lg">
            <UserCheck className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Verified Users */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium mb-1">Verified Users</p>
            <p className="text-3xl font-bold text-gray-900">{stats.verifiedUsers.toLocaleString()}</p>
            <p className="text-xs text-emerald-600 mt-1">
              {stats.totalUsers > 0 ? ((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(1) : 0}% of total
            </p>
          </div>
          <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Role Distribution */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600 text-sm font-medium">Role Distribution</p>
          <PieChart className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="space-y-3">
          {stats.usersByRole?.map((role) => (
            <div key={role._id} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-100 to-green-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <span className="text-sm">{getRoleIcon(role._id)}</span>
                </div>
                <span className="text-sm font-medium text-gray-700 capitalize">{role._id}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-900">{role.count}</span>
                <span className="text-xs text-emerald-600 block">
                  {stats.totalUsers > 0 ? ((role.count / stats.totalUsers) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserStats;