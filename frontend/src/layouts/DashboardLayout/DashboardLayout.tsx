import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './DashboardLayout.module.scss';

const DashboardLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const isActive = (path: string) => location.pathname === path;

  const getDashboardTitle = () => {
    switch (user?.role) {
      case 'instructor': return 'Instructor Dashboard';
      case 'admin': return 'Admin Dashboard';
      default: return 'Student Dashboard';
    }
  };

  return (
    <div className={styles.dashboard}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            
            <span className={styles.logoText}>SkillShare Hub</span>
          </div>
          <p className={styles.dashboardSubtitle}>{getDashboardTitle()}</p>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user?.profile?.avatar ? (
                <img src={user.profile.avatar} alt="Avatar" />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user?.fullName || 'User'}</span>
              <span className={styles.userRole}>
                {user?.role === 'admin' ? 'Administrator' : 
                 user?.role === 'instructor' ? 'Instructor' : 'Student'}
              </span>
            </div>
          </div>
        </div>

        <nav className={styles.sidebarMenu}>
          <Link 
            to="/dashboard" 
            className={`${styles.menuItem} ${isActive('/dashboard') ? styles.active : ''}`}
          >
            <svg className={styles.menuIcon} width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
            <span className={styles.menuText}>Dashboard</span>
          </Link>

          <Link 
            to="/dashboard/courses" 
            className={`${styles.menuItem} ${isActive('/dashboard/courses') ? styles.active : ''}`}
          >
            <svg className={styles.menuIcon} width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
            </svg>
            <span className={styles.menuText}>My Courses</span>
          </Link>

          {/* 🆕 THÊM CHAT MENU ITEM */}
          <Link 
            to="/dashboard/chat" 
            className={`${styles.menuItem} ${isActive('/dashboard/chat') ? styles.active : ''}`}
          >
            <svg className={styles.menuIcon} width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
            </svg>
            <span className={styles.menuText}>Messages</span>
          </Link>

          <Link 
            to="/dashboard/sessions" 
            className={`${styles.menuItem} ${isActive('/dashboard/sessions') ? styles.active : ''}`}
          >
            <svg className={styles.menuIcon} width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
            </svg>
            <span className={styles.menuText}>Upcoming Sessions</span>
          </Link>

          <Link 
            to="/dashboard/schedule" 
            className={`${styles.menuItem} ${isActive('/dashboard/schedule') ? styles.active : ''}`}
          >
            <svg className={styles.menuIcon} width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
            </svg>
            <span className={styles.menuText}>Learning Schedule</span>
          </Link>

          <Link 
            to="/dashboard/payments" 
            className={`${styles.menuItem} ${isActive('/dashboard/payments') ? styles.active : ''}`}
          >
            <svg className={styles.menuIcon} width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
            </svg>
            <span className={styles.menuText}>Payment History</span>
          </Link>

          <Link 
            to="/dashboard/profile" 
            className={`${styles.menuItem} ${isActive('/dashboard/profile') ? styles.active : ''}`}
          >
            <svg className={styles.menuIcon} width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
            </svg>
            <span className={styles.menuText}>Profile Settings</span>
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <Link to="/" className={styles.backLink}>
            <svg className={styles.backIcon} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M12 8a.5.5 0 01-.5.5H5.707l2.147 2.146a.5.5 0 01-.708.708l-3-3a.5.5 0 010-.708l3-3a.5.5 0 11.708.708L5.707 7.5H11.5a.5.5 0 01.5.5z" clipRule="evenodd"/>
            </svg>
            Back to main site
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;