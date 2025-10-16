import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import StudentCourseList from '../../../components/student/StudentCourseList/StudentCourseList';
import styles from './MyCoursesPage.module.scss';

const MyCoursesPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Khóa học của tôi</h1>
        <p className={styles.subtitle}>
          Chào {user?.fullName}, đây là tất cả khóa học bạn đã đăng ký
        </p>
      </div>

      <div className={styles.content}>
        <StudentCourseList />
      </div>
    </div>
  );
};

export default MyCoursesPage;