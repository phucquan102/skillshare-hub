// src/layouts/DashboardLayout/DashboardLayout.tsx
import React from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './DashboardLayout.module.scss';

const DashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Nếu là admin, chuyển hướng đến admin dashboard
  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={styles.dashboard}>
      {/* Sidebar - chỉ hiển thị cho student/instructor */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>SkillShare Hub</h2>
          <p>{user?.role === 'instructor' ? 'Instructor' : 'Student'} Dashboard</p>
        </div>
        
        <ul className={styles.sidebarMenu}>
          <li>
            <Link 
              to="/dashboard" 
              className={isActive('/dashboard') ? styles.active : ''}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 2.5A1.5 1.5 0 012.5 1h11A1.5 1.5 0 0115 2.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 13.5v-11zM2.5 2a.5.5 0 00-.5.5v11a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5h-11z"/>
              </svg>
              Dashboard
            </Link>
          </li>
          <li>
            <Link 
              to="/dashboard/courses" 
              className={isActive('/dashboard/courses') ? styles.active : ''}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 2.5A1.5 1.5 0 012.5 1h11A1.5 1.5 0 0115 2.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 13.5v-11zM2.5 2a.5.5 0 00-.5.5v11a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5h-11z"/>
                <path d="M4.5 5a.5.5 0 010-1h7a.5.5 0 010 1h-7zM4 7.5a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5zM4.5 10a.5.5 0 010-1h4a.5.5 0 010 1h-4z"/>
              </svg>
              My Courses
            </Link>
          </li>
          <li>
            <Link 
              to="/dashboard/sessions" 
              className={isActive('/dashboard/sessions') ? styles.active : ''}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 2.5A1.5 1.5 0 012.5 1h11A1.5 1.5 0 0115 2.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 13.5v-11zM2.5 2a.5.5 0 00-.5.5v11a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5h-11z"/>
              </svg>
              Upcoming Sessions
            </Link>
          </li>
          <li>
            <Link 
              to="/dashboard/schedule" 
              className={isActive('/dashboard/schedule') ? styles.active : ''}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 2.5A1.5 1.5 0 012.5 1h11A1.5 1.5 0 0115 2.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 13.5v-11zM2.5 2a.5.5 0 00-.5.5v11a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5h-11z"/>
              </svg>
              Learning Schedule
            </Link>
          </li>
          <li>
            <Link 
              to="/dashboard/payments" 
              className={isActive('/dashboard/payments') ? styles.active : ''}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 2.5A1.5 1.5 0 012.5 1h11A1.5 1.5 0 0115 2.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 13.5v-11zM2.5 2a.5.5 0 00-.5.5v11a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5h-11z"/>
              </svg>
              Payment History
            </Link>
          </li>
          <li>
            <Link 
              to="/dashboard/profile" 
              className={isActive('/dashboard/profile') ? styles.active : ''}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM8 9c-2.8 0-5 1.8-5 4v1h10v-1c0-2.2-2.2-4-5-4z"/>
              </svg>
              Profile Settings
            </Link>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;