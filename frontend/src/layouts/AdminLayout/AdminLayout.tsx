import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import './AdminLayout.module.scss';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

const navigationItems = [
  { path: 'dashboard', label: 'Dashboard', icon: '📊' },
  { path: 'users', label: 'Quản lý Người dùng', icon: '👥' },
  { path: 'courses', label: 'Quản lý Khóa học', icon: '📚' },
  { path: 'reports', label: 'Báo cáo', icon: '📈' },
];
  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
          <button 
            className="toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {navigationItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActivePath(item.path) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <Link to="/" className="back-to-site">
            ← Quay lại trang chính
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-content">
        <div className="content-header">
          <h1>Quản trị hệ thống</h1>
        </div>
        <div className="content-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;