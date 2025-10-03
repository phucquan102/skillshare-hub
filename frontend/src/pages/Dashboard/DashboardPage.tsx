// src/pages/Dashboard/DashboardPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './DashboardPage.module.scss';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Mock data - bạn sẽ thay thế bằng API call thực tế
  const stats = {
    coursesEnrolled: 8,
    coursesCompleted: 3,
    upcomingSessions: 2,
    totalLearningHours: 45,
    avgRating: 4.5
  };

  const upcomingSessions = [
    {
      id: 1,
      title: 'React Workshop with John Smith',
      date: 'Tomorrow at 2:00 PM - 4:00 PM (GMT+7)',
      description: 'Learn React fundamentals and build your first React application with hands-on exercises.'
    },
    {
      id: 2,
      title: 'Python Data Analysis',
      date: 'June 15, 10 AM - 12 PM (GMT+7)',
      description: 'Master data analysis with Python and popular libraries like Pandas and NumPy.'
    }
  ];

  const purchasedCourses = [
    'Web Development Bootcamp',
    'Data Science Fundamentals', 
    'UI/UX Design Masterclass',
    'Mobile App Development'
  ];

  return (
    <div className={styles.dashboardPage}>
      {/* Welcome Section */}
      <div className={styles.welcomeSection}>
        <h1>Welcome back, {user?.fullName || 'Student'}!</h1>
        <p>Here's your learning progress and upcoming sessions.</p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsCards}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.blue}`}>
            <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 2.5A1.5 1.5 0 012.5 1h11A1.5 1.5 0 0115 2.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 13.5v-11zM2.5 2a.5.5 0 00-.5.5v11a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5h-11z"/>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.coursesEnrolled}</h3>
            <p>Courses Enrolled</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.green}`}>
            <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
              <path d="M10.97 4.97a.75.75 0 011.07 1.05l-3.99 4.99a.75.75 0 01-1.08.02L4.324 8.384a.75.75 0 111.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 01.02-.022z"/>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.coursesCompleted}</h3>
            <p>Courses Completed</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.orange}`}>
            <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 2.5A1.5 1.5 0 012.5 1h11A1.5 1.5 0 0115 2.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 13.5v-11zM2.5 2a.5.5 0 00-.5.5v11a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5h-11z"/>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.upcomingSessions}</h3>
            <p>Upcoming Sessions</p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className={styles.featuresGrid}>
        <div className={styles.featureCard}>
          <h3>Purchased Courses</h3>
          <div className={styles.courseList}>
            {purchasedCourses.map((course, index) => (
              <div key={index} className={styles.courseItem}>
                {course}
              </div>
            ))}
          </div>
          <Link to="/dashboard/courses" className={styles.btn}>View All Courses</Link>
        </div>
        
        <div className={styles.featureCard}>
          <h3>Upcoming Sessions</h3>
          <div className={styles.sessionList}>
            {upcomingSessions.map(session => (
              <div key={session.id} className={styles.sessionItem}>
                <strong>{session.title}</strong>
                <span>{session.date}</span>
              </div>
            ))}
          </div>
          <Link to="/dashboard/sessions" className={styles.btn}>View Schedule</Link>
        </div>
        
        <div className={styles.featureCard}>
          <h3>Learning Progress</h3>
          <div className={styles.progressInfo}>
            <div className={styles.progressItem}>
              <span>Total Learning Hours:</span>
              <strong>{stats.totalLearningHours}h</strong>
            </div>
            <div className={styles.progressItem}>
              <span>Average Rating:</span>
              <strong>{stats.avgRating}/5</strong>
            </div>
          </div>
          <Link to="/dashboard/profile" className={styles.btn}>View Profile</Link>
        </div>
      </div>

      {/* Next Upcoming Session */}
      {upcomingSessions.length > 0 && (
        <div className={styles.upcomingSession}>
          <h2>Next Upcoming Session</h2>
          <div className={styles.sessionCard}>
            <h3>{upcomingSessions[0].title}</h3>
            <p>{upcomingSessions[0].date}</p>
            <div className={styles.sessionDescription}>
              <p>{upcomingSessions[0].description}</p>
            </div>
            <div className={styles.sessionActions}>
              <Link to="/dashboard/sessions" className={styles.btn}>View Session Details</Link>
              <button className={styles.btnSecondary}>Add to Calendar</button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h2>Quick Actions</h2>
        <div className={styles.actionButtons}>
          <Link to="/dashboard/courses" className={styles.btn}>My Courses</Link>
          <Link to="/dashboard/sessions" className={styles.btn}>Session Details</Link>
          <Link to="/dashboard/profile" className={styles.btn}>Profile Settings</Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;