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

  const testimonials = [
    {
      id: 1,
      title: 'Life-changing Platform',
      content: '"SkillShare Hub has allowed me to reach students globally and turn my passion into a full-time career. The platform is intuitive and the support team is always helpful."',
      author: 'Dr. Sarah Chen, Data Science Instructor'
    },
    {
      id: 2,
      title: 'Excellent Earning Potential',
      content: '"I\'ve been able to triple my income since starting on SkillShare Hub. The flexible schedule allows me to teach while pursuing other professional interests."',
      author: 'Michael Rodriguez, Web Development Instructor'
    }
  ];

  const steps = [
    {
      number: 1,
      title: 'Create Your Course',
      description: 'Develop your course content, add materials, and set pricing options.'
    },
    {
      number: 2,
      title: 'Schedule Sessions',
      description: 'Set up live sessions, define the curriculum, and prepare interactive elements.'
    },
    {
      number: 3,
      title: 'Engage with Students',
      description: 'Interact with your students through live sessions, chat, and feedback.'
    }
  ];

  return (
    <div className={styles.instructorDashboardPage}>
      {/* Welcome Section */}
      <div className={styles.welcomeSection}>
        <h2>Welcome back, {user?.fullName || 'Instructor'}!</h2>
        <p>Here's an overview of your teaching performance and upcoming schedule.</p>
      </div>

      {/* Stats Section */}
      <div className={styles.statsCards}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.blue}`}>
            💰
          </div>
          <div className={styles.statInfo}>
            <h3>${stats.totalEarnings.toLocaleString()}</h3>
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
        <h3>Teaching Summary</h3>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <h4>Earnings Overview</h4>
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
            <h4>Teaching Schedule</h4>
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
        <h3>Instructor Features</h3>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📚</div>
            <h4>Create & Manage Courses</h4>
            <p>Develop new courses, update existing content, and organize your teaching materials.</p>
            <Link to="/instructor/courses" className={styles.btn}>Manage Courses</Link>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎥</div>
            <h4>Host Live Sessions</h4>
            <p>Conduct interactive live classes with video, screen sharing, and real-time chat.</p>
            <Link to="/instructor/sessions" className={styles.btn}>Schedule Session</Link>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📊</div>
            <h4>Track Revenue & Performance</h4>
            <p>Monitor your earnings, student engagement, and course performance metrics.</p>
            <Link to="/instructor/earnings" className={styles.btn}>View Analytics</Link>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className={styles.benefitsSection}>
        <h3>Benefits of Teaching on SkillShare Hub</h3>
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

      {/* How It Works Section */}
      <div className={styles.howItWorks}>
        <h3>How To Get Started</h3>
        <p>Follow these simple steps to create and manage your courses effectively.</p>
        
        <div className={styles.steps}>
          {steps.map(step => (
            <div key={step.number} className={styles.step}>
              <div className={styles.stepNumber}>{step.number}</div>
              <h4>{step.title}</h4>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className={styles.ctaSection}>
        <h3>Ready to Create Your Next Course?</h3>
        <p>Start developing new content or schedule your next teaching session.</p>
        <div className={styles.actionButtons}>
          <Link to="/instructor/courses/create" className={styles.btnPrimary}>Create New Course</Link>
          <Link to="/instructor/sessions" className={styles.btnSecondary}>Schedule Session</Link>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className={styles.testimonialsSection}>
        <h3>What Other Instructors Say</h3>
        <div className={styles.testimonials}>
          {testimonials.map(testimonial => (
            <div key={testimonial.id} className={styles.testimonialCard}>
              <h4>{testimonial.title}</h4>
              <p>{testimonial.content}</p>
              <p className={styles.testimonialAuthor}>— {testimonial.author}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboardPage;