// src/layouts/InstructorLayout/InstructorLayout.tsx
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './InstructorLayout.module.scss';

const InstructorLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={styles.instructorDashboard}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>SkillShare Hub</h2>
          <p>Instructor Dashboard</p>
        </div>
        
        <ul className={styles.sidebarMenu}>
          <li>
            <Link 
              to="/instructor/dashboard" 
              className={isActive('/instructor/dashboard') ? styles.active : ''}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 2.5A1.5 1.5 0 012.5 1h11A1.5 1.5 0 0115 2.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 13.5v-11zM2.5 2a.5.5 0 00-.5.5v11a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5h-11z"/>
              </svg>
              Dashboard
            </Link>
          </li>
          <li>
            <Link 
              to="/instructor/courses" 
              className={isActive('/instructor/courses') ? styles.active : ''}
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
              to="/instructor/sessions" 
              className={isActive('/instructor/sessions') ? styles.active : ''}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 2.5A1.5 1.5 0 012.5 1h11A1.5 1.5 0 0115 2.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 13.5v-11zM2.5 2a.5.5 0 00-.5.5v11a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5h-11z"/>
              </svg>
              Session Management
            </Link>
          </li>
          <li>
            <Link 
              to="/instructor/students" 
              className={isActive('/instructor/students') ? styles.active : ''}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM8 9c-2.8 0-5 1.8-5 4v1h10v-1c0-2.2-2.2-4-5-4z"/>
              </svg>
              Students List
            </Link>
          </li>
          <li>
            <Link 
              to="/instructor/earnings" 
              className={isActive('/instructor/earnings') ? styles.active : ''}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 2.5A1.5 1.5 0 012.5 1h11A1.5 1.5 0 0115 2.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 13.5v-11zM2.5 2a.5.5 0 00-.5.5v11a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5h-11z"/>
              </svg>
              Earnings & Payments
            </Link>
          </li>
          <li>
            <Link 
              to="/instructor/profile" 
              className={isActive('/instructor/profile') ? styles.active : ''}
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

export default InstructorLayout;