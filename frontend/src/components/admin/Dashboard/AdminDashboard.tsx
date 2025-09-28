import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../../services/api/adminService';

// Định nghĩa types cho dữ liệu
interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  revenue: number;
  rating: number;
}

interface Activity {
  id: string;
  type: 'user' | 'course' | 'payment';
  message: string;
  time: string;
  icon: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    revenue: 0,
    rating: 0
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hàm gọi API lấy thống kê
  const fetchStats = async () => {
    try {
      const usersStats = await adminService.getUsersStats();
      
      setStats({
        totalUsers: usersStats.totalUsers || 0,
        totalCourses: usersStats.totalCourses || 0,
        revenue: usersStats.revenue || 0,
        rating: usersStats.rating || 4.8
      });
    } catch (err) {
      console.error('Lỗi khi lấy thống kê:', err);
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    }
  };

  // Hàm gọi API lấy hoạt động gần đây
  const fetchActivities = async () => {
    try {
      // Nếu chưa có API này, có thể để trống hoặc tạo endpoint
      // const activitiesData = await adminService.getRecentActivities();
      // setActivities(activitiesData || []);
      
      // Tạm thời để trống cho đến khi có API
      setActivities([]);
    } catch (err) {
      console.error('Lỗi khi lấy hoạt động:', err);
      setActivities([]);
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([fetchStats(), fetchActivities()]);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Chuẩn bị dữ liệu hiển thị stats
  const statsDisplay = [
    { 
      title: 'Tổng người dùng', 
      value: stats.totalUsers.toLocaleString('vi-VN'), 
      icon: '👥', 
      link: '/admin/users' 
    },
    { 
      title: 'Tổng khóa học', 
      value: stats.totalCourses.toLocaleString('vi-VN'), 
      icon: '📚', 
      link: '/admin/courses' 
    },
    { 
      title: 'Doanh thu', 
      value: `${stats.revenue.toLocaleString('vi-VN')} VNĐ`, 
      icon: '💰', 
      link: '/admin/reports' 
    },
    { 
      title: 'Đánh giá', 
      value: `${stats.rating.toFixed(1)}/5`, 
      icon: '⭐', 
      link: '/admin/reports' 
    },
  ];

  if (loading) {
    return (
      <div className="admin-dashboard" style={{ padding: '20px' }}>
        <div className="loading" style={{ textAlign: 'center' }}>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard" style={{ padding: '20px' }}>
        <div className="error" style={{ textAlign: 'center', color: 'red' }}>
          <p>Lỗi: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard" style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '30px' }}>Dashboard</h2>
      
      <div className="stats-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '40px'
      }}>
        {statsDisplay.map((stat, index) => (
          <Link 
            to={stat.link} 
            key={index} 
            className="stat-card"
            style={{
              display: 'block',
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'inherit',
              border: '1px solid #e9ecef',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div className="stat-icon" style={{ fontSize: '24px' }}>
                {stat.icon}
              </div>
              <div className="stat-content">
                <h3 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 'bold' }}>
                  {stat.value}
                </h3>
                <p style={{ margin: 0, color: '#6c757d' }}>{stat.title}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="dashboard-content" style={{ 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr', 
        gap: '30px' 
      }}>
        <div className="recent-activity" style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ marginBottom: '20px' }}>Hoạt động gần đây</h3>
          <div className="activity-list">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="activity-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    padding: '15px 0',
                    borderBottom: '1px solid #e9ecef'
                  }}
                >
                  <span className="activity-icon" style={{ fontSize: '18px' }}>
                    {activity.icon}
                  </span>
                  <div className="activity-details" style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 5px 0' }}>{activity.message}</p>
                    <span className="activity-time" style={{ color: '#6c757d', fontSize: '14px' }}>
                      {activity.time}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#6c757d', padding: '40px 0' }}>
                Không có hoạt động nào gần đây
              </p>
            )}
          </div>
        </div>
        
        <div className="quick-actions" style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ marginBottom: '20px' }}>Thao tác nhanh</h3>
          <div className="actions-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link 
              to="/admin/users" 
              className="action-btn"
              style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0056b3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#007bff';
              }}
            >
              👥 Quản lý người dùng
            </Link>
            <Link 
              to="/admin/courses" 
              className="action-btn"
              style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1e7e34';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#28a745';
              }}
            >
              📚 Quản lý khóa học
            </Link>
            <Link 
              to="/admin/reports" 
              className="action-btn"
              style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#ffc107',
                color: '#212529',
                textDecoration: 'none',
                borderRadius: '6px',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e0a800';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffc107';
              }}
            >
              📈 Xem báo cáo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;