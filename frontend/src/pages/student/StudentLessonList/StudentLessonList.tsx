// frontend/src/pages/student/StudentLessonList/StudentLessonList.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CourseProgress as CourseProgressType, LessonProgress } from '../../../types/student.types';
import { getCourseProgress } from '../../../services/api/enrollmentService';
import ProgressCircle from '../../../components/student/CourseProgress/CourseProgress';
import styles from './StudentLessonList.module.scss';

const StudentLessonList: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<CourseProgressType | null>(null);
  const [courseInfo, setCourseInfo] = useState<{ _id: string; title: string; description: string; thumbnail: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('🎯 StudentLessonList rendered with courseId:', courseId);

  // Hàm lọc lesson trùng
  const getUniqueLessons = (lessons: LessonProgress[]) => {
    const seen = new Set();
    return lessons.filter(lesson => {
      const duplicate = seen.has(lesson._id);
      seen.add(lesson._id);
      return !duplicate;
    });
  };

  useEffect(() => {
    const fetchCourseProgress = async () => {
      if (!courseId) {
        console.error('❌ No courseId provided');
        setError('Không tìm thấy ID khóa học');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('📡 Fetching course progress for:', courseId);
        const response = await getCourseProgress(courseId);
        console.log('📥 Course progress response:', response);
        
        if (response.success) {
          setProgress(response.progress);
          setCourseInfo(response.course || response.progress?.course || null);
        } else {
          setError(response.message || 'Không thể tải thông tin khóa học');
        }
      } catch (err: any) {
        console.error('❌ Error fetching course progress:', err);
        setError(err.message || 'Lỗi kết nối đến server');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseProgress();
  }, [courseId]);

  const handleLessonClick = (lesson: LessonProgress) => {
    if (lesson.hasAccess) {
      if (lesson.lessonType === 'live_online' && lesson.canJoin) {
        // Điều hướng đến meeting
        navigate(`/student/course/${courseId}/lesson/${lesson._id}/meeting`);
      } else {
        // Điều hướng đến lesson detail thông thường
        navigate(`/student/lessons/${lesson._id}`);
      }
    }
  };

  const handleJoinLesson = (e: React.MouseEvent, lesson: LessonProgress) => {
    e.stopPropagation(); // Ngăn sự kiện click lan ra lesson item
    if (lesson.hasAccess && lesson.canJoin) {
      navigate(`/student/course/${courseId}/lesson/${lesson._id}/meeting`);
    }
  };

  const handleBackToCourses = () => {
    navigate('/dashboard/courses');
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Đang tải nội dung khóa học...</p>
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className={styles.errorContainer}>
        <h3>Lỗi</h3>
        <p>{error || 'Không tìm thấy thông tin khóa học'}</p>
        <button onClick={handleBackToCourses}>Quay lại danh sách khóa học</button>
      </div>
    );
  }

  if (!courseInfo) {
    return (
      <div className={styles.errorContainer}>
        <h3>Lỗi</h3>
        <p>Không tìm thấy thông tin khóa học</p>
        <button onClick={handleBackToCourses}>Quay lại danh sách khóa học</button>
      </div>
    );
  }

  const uniqueLessons = progress.lessons ? getUniqueLessons(progress.lessons) : [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={handleBackToCourses} className={styles.backButton}>
          ← Quay lại
        </button>
        <h1 className={styles.title}>{courseInfo.title}</h1>
        <p className={styles.description}>{courseInfo.description}</p>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressCard}>
          <ProgressCircle progress={progress.overallProgress} size={100} />
          <div className={styles.progressInfo}>
            <h3>Tiến độ khóa học</h3>
            <p>
              {progress.completedLessons} / {progress.totalLessons} bài học đã hoàn thành
            </p>
            <div className={styles.progressStats}>
              <span>{progress.overallProgress}% hoàn thành</span>
              <span>•</span>
              <span>
                {progress.hasFullAccess ? 'Toàn quyền truy cập' : `${progress.purchasedLessons} bài đã mua`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.lessonsSection}>
        <h2 className={styles.sectionTitle}>Danh sách bài học</h2>
        <div className={styles.lessonsList}>
          {uniqueLessons.length > 0 ? (
            uniqueLessons.map((lesson, index) => (
              <div
                key={lesson._id}
                className={`${styles.lessonItem} ${
                  lesson.hasAccess ? styles.accessible : styles.locked
                } ${lesson.isCompleted ? styles.completed : ''}`}
                onClick={() => handleLessonClick(lesson)}
              >
                <div className={styles.lessonOrder}>
                  {lesson.isCompleted ? (
                    <div className={styles.completedIcon}>✓</div>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                <div className={styles.lessonContent}>
                  <h3 className={styles.lessonTitle}>{lesson.title}</h3>
                  <div className={styles.lessonMeta}>
                    <span className={styles.duration}>{lesson.duration} phút</span>
                    {lesson.lessonType === 'live_online' && (
                      <span className={styles.liveBadge}>Trực tiếp</span>
                    )}
                    {lesson.isPreview && (
                      <span className={styles.previewBadge}>Xem trước</span>
                    )}
                  </div>
                </div>

                <div className={styles.lessonStatus}>
                  {!lesson.hasAccess && (
                    <span className={styles.lockedText}>Khóa</span>
                  )}
                  {lesson.hasAccess && lesson.canJoin && (
                    <button 
                      className={styles.joinButton}
                      onClick={(e) => handleJoinLesson(e, lesson)}
                    >
                      Tham gia
                    </button>
                  )}
                  {lesson.hasAccess && !lesson.canJoin && (
                    <span className={styles.accessText}>Có thể truy cập</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyLessons}>
              <p>Không có bài học nào trong khóa học này.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentLessonList;