import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import StudentCourseList from '../../../components/student/StudentCourseList/StudentCourseList';
import styles from './MyCoursesPage.module.scss';

const MyCoursesPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Courses</h1>
        <p className={styles.subtitle}>
          Hello {user?.fullName}, here are all the courses you have enrolled in.
        </p>
      </div>

      <div className={styles.content}>
        <StudentCourseList />
      </div>
    </div>
  );
};

export default MyCoursesPage;
