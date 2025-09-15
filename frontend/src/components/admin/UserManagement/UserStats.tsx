import React from 'react';

interface UserStatsProps {
  stats: any;
}

const UserStats: React.FC<UserStatsProps> = ({ stats }) => {
  return (
    <div className="user-stats">
      <div className="stat-card">
        <h3>Tổng số người dùng</h3>
        <p className="stat-number">{stats.totalUsers}</p>
      </div>
      
      <div className="stat-card">
        <h3>Người dùng hoạt động</h3>
        <p className="stat-number">{stats.activeUsers}</p>
      </div>
      
      <div className="stat-card">
        <h3>Đã xác thực</h3>
        <p className="stat-number">{stats.verifiedUsers}</p>
      </div>
      
      <div className="stat-card">
        <h3>Phân bổ vai trò</h3>
        <div className="role-stats">
          {stats.usersByRole && stats.usersByRole.map((role: any) => (
            <div key={role._id} className="role-stat">
              <span>{role._id}: </span>
              <strong>{role.count}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserStats;