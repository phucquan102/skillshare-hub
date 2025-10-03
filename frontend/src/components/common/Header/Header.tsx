// src/components/common/Header/Header.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import styles from './Header.module.scss';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLoginPage = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';

  // Hàm check active nav link
  const isActive = (path: string) => location.pathname === path;

  // Close dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setDropdownOpen(false);
  };

  // Điều hướng đến dashboard khi click vào user info
  const handleUserClick = () => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard');
    } else if (user?.role === 'instructor') {
      navigate('/instructor/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  // Lấy tên dashboard hiển thị dựa trên role
  const getDashboardName = () => {
    switch (user?.role) {
      case 'admin': return 'Admin Panel';
      case 'instructor': return 'Instructor Dashboard';
      default: return 'Student Dashboard';
    }
  };

  // Lấy đường dẫn dashboard dựa trên role
  const getDashboardPath = () => {
    switch (user?.role) {
      case 'admin': return '/admin/dashboard';
      case 'instructor': return '/instructor/dashboard';
      default: return '/dashboard';
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <div className={styles.logo}>
          <img src="/logo.svg" alt="Logo" className={styles.logoImage} />
          <span className={styles.logoText}>SkillShare Hub</span>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          <Link 
            to="/" 
            className={`${styles.navLink} ${isActive('/') ? styles.active : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/courses" 
            className={`${styles.navLink} ${isActive('/courses') ? styles.active : ''}`}
          >
            Courses
          </Link>
          <Link 
            to="/instructors" 
            className={`${styles.navLink} ${isActive('/instructors') ? styles.active : ''}`}
          >
            Instructors
          </Link>
          <Link 
            to="/about" 
            className={`${styles.navLink} ${isActive('/about') ? styles.active : ''}`}
          >
            About Us
          </Link>
          <Link 
            to="/contact" 
            className={`${styles.navLink} ${isActive('/contact') ? styles.active : ''}`}
          >
            Contact
          </Link>
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          {user ? (
            <div className={styles.userMenu} ref={dropdownRef}>
              <button 
                className={styles.userButton}
                onClick={toggleDropdown}
              >
                <div className={styles.userInfo} onClick={handleUserClick} style={{cursor: 'pointer'}}>
                  <span className={styles.userName}>
                    {user.fullName || user.email}
                  </span>
                  <span className={styles.userRole}>
                    {user.role === 'admin' ? 'Administrator' : 
                     user.role === 'instructor' ? 'Instructor' : 'Student'}
                  </span>
                </div>
                <svg 
                  className={`${styles.dropdownArrow} ${dropdownOpen ? styles.rotated : ''}`}
                  width="16" 
                  height="16" 
                  viewBox="0 0 16 16" 
                  fill="currentColor"
                >
                  <path d="M8 11.5L3.5 7l1-1L8 9.5 11.5 6l1 1-4.5 4.5z"/>
                </svg>
              </button>

              {dropdownOpen && (
                <div className={styles.dropdownMenu}>
                  <div className={styles.dropdownHeader}>
                    <div className={styles.userAvatar}>
                      {user.profile?.avatar ? (
                        <img src={user.profile.avatar} alt="Avatar" />
                      ) : (
                        <div className={styles.avatarPlaceholder}>
                          {user.fullName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className={styles.userDetails}>
                      <strong>{user.fullName}</strong>
                      <span>{user.email}</span>
                    </div>
                  </div>

                  <div className={styles.dropdownDivider}></div>

                  {/* Dashboard/Admin Panel - HIỂN THỊ DUY NHẤT 1 MỤC */}
                  <button 
                    className={styles.dropdownItem}
                    onClick={() => handleNavigation(getDashboardPath())}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M1 2.5A1.5 1.5 0 012.5 1h11A1.5 1.5 0 0115 2.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 13.5v-11zM2.5 2a.5.5 0 00-.5.5v11a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5h-11z"/>
                    </svg>
                    {getDashboardName()}
                  </button>

                  {/* Profile */}
                  {user.role === 'admin' ? (
                    <button 
                      className={styles.dropdownItem}
                      onClick={() => handleNavigation('/admin/profile')}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM8 9c-2.8 0-5 1.8-5 4v1h10v-1c0-2.2-2.2-4-5-4z"/>
                      </svg>
                      Admin Profile
                    </button>
                  ) : (
                    <button 
                      className={styles.dropdownItem}
                      onClick={() => handleNavigation('/dashboard/profile')}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM8 9c-2.8 0-5 1.8-5 4v1h10v-1c0-2.2-2.2-4-5-4z"/>
                      </svg>
                      My Profile
                    </button>
                  )}

                  {/* My Courses - chỉ hiển thị cho student/instructor */}
                  {user.role !== 'admin' && (
                    <button 
                      className={styles.dropdownItem}
                      onClick={() => handleNavigation('/dashboard/courses')}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M1 2.5A1.5 1.5 0 012.5 1h11A1.5 1.5 0 0115 2.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 13.5v-11zM2.5 2a.5.5 0 00-.5.5v11a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5h-11z"/>
                        <path d="M4.5 5a.5.5 0 010-1h7a.5.5 0 010 1h-7zM4 7.5a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5zM4.5 10a.5.5 0 010-1h4a.5.5 0 010 1h-4z"/>
                      </svg>
                      My Courses
                    </button>
                  )}

                  {/* Session Management - chỉ hiển thị cho instructor */}
                  {user.role === 'instructor' && (
                    <button 
                      className={styles.dropdownItem}
                      onClick={() => handleNavigation('/instructor/sessions')}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M1 2.5A1.5 1.5 0 012.5 1h11A1.5 1.5 0 0115 2.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 13.5v-11zM2.5 2a.5.5 0 00-.5.5v11a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5h-11z"/>
                      </svg>
                      Session Management
                    </button>
                  )}

                  {/* Earnings - chỉ hiển thị cho instructor */}
                  {user.role === 'instructor' && (
                    <button 
                      className={styles.dropdownItem}
                      onClick={() => handleNavigation('/instructor/earnings')}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M1 2.5A1.5 1.5 0 012.5 1h11A1.5 1.5 0 0115 2.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 13.5v-11zM2.5 2a.5.5 0 00-.5.5v11a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5h-11z"/>
                      </svg>
                      Earnings & Payments
                    </button>
                  )}

                  <div className={styles.dropdownDivider}></div>

                  <button 
                    className={`${styles.dropdownItem} ${styles.logoutItem}`}
                    onClick={handleLogout}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M10 12.5a.5.5 0 01-.5.5h-8a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5h8a.5.5 0 01.5.5v2a.5.5 0 001 0v-2A1.5 1.5 0 009.5 2h-8A1.5 1.5 0 000 3.5v9A1.5 1.5 0 001.5 14h8a1.5 1.5 0 001.5-1.5v-2a.5.5 0 00-1 0v2z"/>
                      <path d="M15.854 8.354a.5.5 0 000-.708l-3-3a.5.5 0 10-.708.708L14.293 7.5H5.5a.5.5 0 000 1h8.793l-2.147 2.146a.5.5 0 00.708.708l3-3z"/>
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className={`${styles.authButton} ${styles.loginButton} ${isLoginPage ? styles.active : ''}`}
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className={`${styles.authButton} ${styles.registerButton} ${isRegisterPage ? styles.active : ''}`}
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;