// src/pages/Instructor/InstructorDashboardPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './InstructorDashboardPage.module.scss';

const InstructorDashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Mock data
  const stats = {
    totalEarnings: 3245,
    studentsEnrolled: 324,
    upcomingSessions: 12,
    coursesCreated: 8,
    totalReviews: 156,
    averageRating: 4.8
  };

  const upcomingSessions = [
    {
      id: 1,
      title: 'React Workshop with John Smith',
      date: 'Tomorrow at 2:00 PM - 4:00 PM (GMT+7)',
      students: 25
    },
    {
      id: 2,
      title: 'Python Data Analysis',
      date: 'June 15, 10 AM - 12 PM (GMT+7)',
      students: 18
    }
  ];

  return (
    <div className={styles.instructorDashboardPage}>
      {/* Welcome Section */}
      <div className={styles.welcomeSection}>
        <h1>Welcome back, {user?.fullName || 'Instructor'}!</h1>
        <p>Here's an overview of your teaching performance and upcoming schedule.</p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsCards}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.blue}`}>
            💰
          </div>
          <div className={styles.statInfo}>
            <h3>${stats.totalEarnings}</h3>
            <p>Total Earnings</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.green}`}>
            👥
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.studentsEnrolled}</h3>
            <p>Students Enrolled</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.orange}`}>
            📅
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.upcomingSessions}</h3>
            <p>Upcoming Sessions</p>
          </div>
        </div>
      </div>

      {/* Teaching Summary */}
      <div className={styles.teachingSummary}>
        <h2>Teaching Summary</h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <h3>Earnings Overview</h3>
            <div className={styles.summaryItem}>
              <span>Monthly revenue:</span>
              <strong>$1,250</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>Last payment:</span>
              <strong>$845 (June 15)</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>Next payment:</span>
              <strong>July 5</strong>
            </div>
          </div>
          
          <div className={styles.summaryCard}>
            <h3>Teaching Schedule</h3>
            <div className={styles.summaryItem}>
              <span>Next session:</span>
              <strong>Tomorrow, 2:00 PM</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>This week:</span>
              <strong>4 sessions</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>Next week:</span>
              <strong>6 sessions</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Instructor Features */}
      <div className={styles.featuresSection}>
        <h2>Instructor Features</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📚</div>
            <h3>Create & Manage Courses</h3>
            <p>Develop new courses, update existing content, and organize your teaching materials.</p>
            <Link to="/instructor/courses" className={styles.btn}>Manage Courses</Link>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎥</div>
            <h3>Host Live Sessions</h3>
            <p>Conduct interactive live classes with video, screen sharing, and real-time chat.</p>
            <Link to="/instructor/sessions" className={styles.btn}>Schedule Session</Link>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📊</div>
            <h3>Track Revenue & Performance</h3>
            <p>Monitor your earnings, student engagement, and course performance metrics.</p>
            <Link to="/instructor/earnings" className={styles.btn}>View Analytics</Link>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className={styles.benefitsSection}>
        <h2>Benefits of Teaching on SkillShare Hub</h2>
        <div className={styles.benefitsGrid}>
          <div className={styles.benefitItem}>
            <div className={styles.benefitIcon}>🌍</div>
            <div>
              <h4>Global Reach</h4>
              <p>Teach students from around the world and build an international reputation.</p>
            </div>
          </div>
          
          <div className={styles.benefitItem}>
            <div className={styles.benefitIcon}>⏰</div>
            <div>
              <h4>Flexible Schedule</h4>
              <p>Set your own teaching hours and work from anywhere with an internet connection.</p>
            </div>
          </div>
          
          <div className={styles.benefitItem}>
            <div className={styles.benefitIcon}>💰</div>
            <div>
              <h4>Earning Potential</h4>
              <p>Earn competitive rates with multiple revenue streams from courses and sessions.</p>
            </div>
          </div>
          
          <div className={styles.benefitItem}>
            <div className={styles.benefitIcon}>🛠</div>
            <div>
              <h4>Teaching Tools</h4>
              <p>Access our comprehensive suite of teaching tools and resources.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h2>Ready to Create Your Next Course?</h2>
        <p>Start developing new content or schedule your next teaching session.</p>
        <div className={styles.actionButtons}>
          <Link to="/instructor/courses/create" className={styles.btnPrimary}>Create New Course</Link>
          <Link to="/instructor/sessions" className={styles.btnSecondary}>Schedule Session</Link>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboardPage;