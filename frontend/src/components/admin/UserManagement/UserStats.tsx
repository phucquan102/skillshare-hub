import React from 'react';

interface UserStatsProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    usersByRole: { _id: string; count: number }[];
  };
}

const UserStats: React.FC<UserStatsProps> = ({ stats }) => {
  return (
    <div className="user-stats grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Total Users */}
      <div className="stat-card bg-white shadow rounded-lg p-6 text-center">
        <h3 className="text-gray-600 font-medium">Total Users</h3>
        <p className="stat-number text-3xl font-bold text-[#3a0ca3]">
          {stats.totalUsers}
        </p>
      </div>
      
      {/* Active Users */}
      <div className="stat-card bg-white shadow rounded-lg p-6 text-center">
        <h3 className="text-gray-600 font-medium">Active Users</h3>
        <p className="stat-number text-3xl font-bold text-green-600">
          {stats.activeUsers}
        </p>
      </div>
      
      {/* Verified Users */}
      <div className="stat-card bg-white shadow rounded-lg p-6 text-center">
        <h3 className="text-gray-600 font-medium">Verified Users</h3>
        <p className="stat-number text-3xl font-bold text-blue-600">
          {stats.verifiedUsers}
        </p>
      </div>
      
      {/* Role Distribution */}
      <div className="stat-card bg-white shadow rounded-lg p-6">
        <h3 className="text-gray-600 font-medium mb-2">Role Distribution</h3>
        <div className="role-stats space-y-1">
          {stats.usersByRole && stats.usersByRole.map((role) => (
            <div key={role._id} className="flex justify-between text-sm">
              <span className="capitalize">{role._id}</span>
              <strong className="text-[#3a0ca3]">{role.count}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserStats;
