// frontend/src/components/student/StudentCourseCard/StudentCourseCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentCourse } from '../../../types/student.types';
import ProgressCircle from '../CourseProgress/CourseProgress';
import styles from './StudentCourseCard.module.scss';

interface StudentCourseCardProps {
  course: StudentCourse;
}

const StudentCourseCard: React.FC<StudentCourseCardProps> = ({ course }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    console.log('🖱️ Course card clicked:', course.course._id);
    navigate(`/dashboard/courses/${course.course._id}`);
  };

  const handleContinueLearning = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🚀 Continue learning clicked:', course.course._id);
    navigate(`/dashboard/courses/${course.course._id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      active: 'Đang học',
      completed: 'Đã hoàn thành',
      cancelled: 'Đã hủy',
      paused: 'Tạm dừng'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      active: '#10b981',
      completed: '#6366f1',
      cancelled: '#ef4444',
      paused: '#f59e0b'
    };
    return colorMap[status] || '#6b7280';
  };

  return (
    <div className={styles.courseCard} onClick={handleCardClick}>
      <div className={styles.courseImage}>
        <img 
          src={course.course.thumbnail || '/default-course.jpg'} 
          alt={course.course.title}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/default-course.jpg';
          }}
        />
        <div 
          className={styles.statusBadge}
          style={{ backgroundColor: getStatusColor(course.status) }}
        >
          {getStatusText(course.status)}
        </div>
        {course.progress.overallProgress > 0 && (
          <div className={styles.progressOverlay}>
            <ProgressCircle 
              progress={course.progress.overallProgress} 
              size={60} 
              strokeWidth={4}
              showText={false}
            />
          </div>
        )}
      </div>

      <div className={styles.courseContent}>
        <h3 className={styles.courseTitle}>{course.course.title}</h3>
        <p className={styles.courseDescription}>
          {course.course.description?.substring(0, 100)}...
        </p>
        
        <div className={styles.courseMeta}>
          <div className={styles.instructor}>
            Giảng viên: {course.course.instructor?.fullName || 'Unknown'}
          </div>
          <div className={styles.enrollmentDate}>
            Đăng ký: {formatDate(course.enrolledAt)}
          </div>
        </div>

        <div className={styles.progressInfo}>
          <div className={styles.lessonProgress}>
            {course.progress.completedLessons}/{course.course.totalLessons || 0} bài học
          </div>
          <div className={styles.overallProgress}>
            {course.progress.overallProgress}% hoàn thành
          </div>
        </div>

        <div className={styles.accessInfo}>
          {course.hasFullAccess ? (
            <span className={styles.fullAccess}>Toàn quyền truy cập</span>
          ) : (
            <span className={styles.partialAccess}>
              Đã mua {course.purchasedLessons} bài học
            </span>
          )}
        </div>

        <button 
          className={styles.continueButton}
          onClick={handleContinueLearning}
        >
          {course.progress.overallProgress > 0 ? 'Tiếp tục học' : 'Bắt đầu học'}
        </button>
      </div>
    </div>
  );
};

export default StudentCourseCard;