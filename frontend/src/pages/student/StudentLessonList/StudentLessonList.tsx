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
  const [courseInfo, setCourseInfo] = useState<{ 
    _id: string; 
    title: string; 
    description: string; 
    thumbnail: string;
    instructor?: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'upcoming' | 'live'>('all');

  // Hàm kiểm tra ObjectId hợp lệ
  const isValidObjectId = (id: string | undefined): id is string => {
    return !!id && /^[0-9a-fA-F]{24}$/.test(id);
  };

  console.log('🎯 StudentLessonList rendered with courseId:', courseId);
  console.log('🎯 courseId type:', typeof courseId);
  console.log('🎯 courseId valid:', isValidObjectId(courseId));

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
      // Kiểm tra courseId tồn tại và hợp lệ
      if (!courseId) {
        console.error('❌ No courseId provided');
        setError('Không tìm thấy ID khóa học');
        setLoading(false);
        return;
      }

      if (!isValidObjectId(courseId)) {
        console.error('❌ Invalid courseId format:', courseId);
        setError('ID khóa học không hợp lệ');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
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
        // Kiểm tra loại lỗi cụ thể
        if (err.message?.includes('ID khóa học không hợp lệ')) {
          setError('ID khóa học không hợp lệ. Vui lòng kiểm tra lại.');
        } else if (err.response?.status === 404) {
          setError('Không tìm thấy khóa học. Có thể khóa học đã bị xóa hoặc bạn không có quyền truy cập.');
        } else if (err.response?.status === 401) {
          setError('Bạn cần đăng nhập để xem nội dung này.');
          // Có thể redirect đến login
          navigate('/login');
        } else {
          setError(err.message || 'Lỗi kết nối đến server');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourseProgress();
  }, [courseId, navigate]);

  const handleLessonClick = (lesson: LessonProgress) => {
    if (lesson.hasAccess) {
      if (lesson.lessonType === 'live_online' && lesson.canJoin) {
        navigate(`/student/course/${courseId}/lesson/${lesson._id}/meeting`);
      } else {
        navigate(`/student/lessons/${lesson._id}`);
      }
    }
  };

  const handleJoinLesson = (e: React.MouseEvent, lesson: LessonProgress) => {
    e.stopPropagation();
    if (lesson.hasAccess && lesson.canJoin) {
      navigate(`/student/course/${courseId}/lesson/${lesson._id}/meeting`);
    }
  };

  const handleBackToCourses = () => {
    navigate('/dashboard/courses');
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Reload the component
    window.location.reload();
  };

  // Hàm lọc lessons theo trạng thái
  const getFilteredLessons = () => {
    if (!progress?.lessons) return [];
    
    const uniqueLessons = getUniqueLessons(progress.lessons);
    
    switch (filter) {
      case 'completed':
        return uniqueLessons.filter(lesson => lesson.isCompleted);
      case 'upcoming':
        return uniqueLessons.filter(lesson => 
          !lesson.isCompleted && 
          lesson.hasAccess && 
          lesson.lessonType === 'live_online'
        );
      case 'live':
        return uniqueLessons.filter(lesson => 
          lesson.canJoin && 
          lesson.lessonType === 'live_online'
        );
      default:
        return uniqueLessons;
    }
  };

  // Hàm lấy trạng thái lesson để hiển thị
  const getLessonStatus = (lesson: LessonProgress) => {
    if (lesson.isCompleted) return { text: 'Đã hoàn thành', type: 'completed' };
    if (lesson.canJoin) return { text: 'Tham gia ngay', type: 'live' };
    if (!lesson.hasAccess) return { text: 'Khóa', type: 'locked' };
    return { text: 'Có thể học', type: 'accessible' };
  };

  // Hàm format thời gian nếu có
  const formatLessonTime = (lesson: LessonProgress) => {
    if (lesson.actualDate && lesson.actualStartTime) {
      const date = new Date(lesson.actualDate);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year} • ${lesson.actualStartTime}`;
    }
    
    if (lesson.actualDate) {
      const date = new Date(lesson.actualDate);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    
    return null;
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
        <div className={styles.errorContent}>
          <h3>Lỗi</h3>
          <p>{error || 'Không tìm thấy thông tin khóa học'}</p>
          <div className={styles.errorActions}>
            <button onClick={handleRetry} className={styles.retryButton}>
              Thử lại
            </button>
            <button onClick={handleBackToCourses} className={styles.backButton}>
              Quay lại danh sách khóa học
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!courseInfo) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <h3>Lỗi</h3>
          <p>Không tìm thấy thông tin khóa học</p>
          <button onClick={handleBackToCourses} className={styles.backButton}>
            Quay lại danh sách khóa học
          </button>
        </div>
      </div>
    );
  }

  const filteredLessons = getFilteredLessons();
  const uniqueLessons = progress.lessons ? getUniqueLessons(progress.lessons) : [];

  return (
    <div className={styles.container}>
      {/* Header với thông tin khóa học */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <button onClick={handleBackToCourses} className={styles.backButton}>
            ← Quay lại khóa học
          </button>
          <div className={styles.courseThumbnail}>
            <img 
              src={courseInfo.thumbnail || '/images/default-course-thumbnail.jpg'} 
              alt={courseInfo.title}
              className={styles.thumbnailImage}
              onError={(e) => {
                e.currentTarget.src = '/images/default-course-thumbnail.jpg';
              }}
            />
          </div>
        </div>
        
        <div className={styles.courseInfo}>
          <h1 className={styles.title}>{courseInfo.title}</h1>
          <p className={styles.description}>{courseInfo.description}</p>
          {courseInfo.instructor && (
            <div className={styles.instructor}>
              <span className={styles.instructorLabel}>Giảng viên: </span>
              <span className={styles.instructorName}>
                {courseInfo.instructor.fullName || courseInfo.instructor.name || 'Unknown Instructor'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Section */}
      <div className={styles.progressSection}>
        <div className={styles.progressCard}>
          <div className={styles.progressVisual}>
            <ProgressCircle progress={progress.overallProgress} size={120} />
            <div className={styles.progressText}>
              <span className={styles.progressPercent}>{progress.overallProgress}%</span>
              <span className={styles.progressLabel}>Hoàn thành</span>
            </div>
          </div>
          
          <div className={styles.progressDetails}>
            <div className={styles.progressItem}>
              <span className={styles.progressNumber}>{progress.completedLessons}</span>
              <span className={styles.progressLabel}>Bài đã hoàn thành</span>
            </div>
            <div className={styles.progressItem}>
              <span className={styles.progressNumber}>{progress.totalLessons}</span>
              <span className={styles.progressLabel}>Tổng số bài học</span>
            </div>
            <div className={styles.progressItem}>
              <span className={styles.progressNumber}>
                {progress.hasFullAccess ? 'Toàn bộ' : progress.purchasedLessons}
              </span>
              <span className={styles.progressLabel}>
                {progress.hasFullAccess ? 'Quyền truy cập' : 'Bài đã mua'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter và Lesson List */}
      <div className={styles.lessonsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Danh sách bài học</h2>
          
          {/* Filter Buttons */}
          <div className={styles.filterButtons}>
            <button 
              className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
              onClick={() => setFilter('all')}
            >
              Tất cả ({uniqueLessons.length})
            </button>
            <button 
              className={`${styles.filterButton} ${filter === 'completed' ? styles.active : ''}`}
              onClick={() => setFilter('completed')}
            >
              Đã hoàn thành ({uniqueLessons.filter(l => l.isCompleted).length})
            </button>
            <button 
              className={`${styles.filterButton} ${filter === 'upcoming' ? styles.active : ''}`}
              onClick={() => setFilter('upcoming')}
            >
              Sắp diễn ra ({uniqueLessons.filter(l => !l.isCompleted && l.hasAccess && l.lessonType === 'live_online').length})
            </button>
            <button 
              className={`${styles.filterButton} ${filter === 'live' ? styles.active : ''}`}
              onClick={() => setFilter('live')}
            >
              Có thể tham gia ({uniqueLessons.filter(l => l.canJoin && l.lessonType === 'live_online').length})
            </button>
          </div>
        </div>

        <div className={styles.lessonsList}>
          {filteredLessons.length > 0 ? (
            filteredLessons.map((lesson, index) => {
              const status = getLessonStatus(lesson);
              const lessonTime = formatLessonTime(lesson);
              
              return (
                <div
                  key={lesson._id}
                  className={`${styles.lessonItem} ${
                    lesson.hasAccess ? styles.accessible : styles.locked
                  } ${lesson.isCompleted ? styles.completed : ''} ${
                    lesson.canJoin ? styles.live : ''
                  }`}
                  onClick={() => handleLessonClick(lesson)}
                >
                  <div className={styles.lessonOrder}>
                    {lesson.isCompleted ? (
                      <div className={styles.completedIcon}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path 
                            d="M20 6L9 17L4 12" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    ) : (
                      <span className={styles.orderNumber}>{index + 1}</span>
                    )}
                  </div>

                  <div className={styles.lessonContent}>
                    <div className={styles.lessonHeader}>
                      <h3 className={styles.lessonTitle}>{lesson.title}</h3>
                      <div className={styles.lessonMeta}>
                        {lesson.lessonType === 'live_online' && (
                          <span className={styles.liveBadge}>
                            <span className={styles.liveDot}></span>
                            Trực tuyến
                          </span>
                        )}
                        {lesson.lessonType === 'self_paced' && (
                          <span className={styles.selfPacedBadge}>Tự học</span>
                        )}
                        {lesson.isPreview && (
                          <span className={styles.previewBadge}>Xem trước</span>
                        )}
                        {lessonTime && (
                          <span className={styles.timeBadge}>{lessonTime}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className={styles.lessonFooter}>
                      <div className={styles.lessonInfo}>
                        <span className={styles.duration}>
                          ⏱️ {lesson.duration || 0} phút
                        </span>
                        {lesson.progress > 0 && !lesson.isCompleted && (
                          <span className={styles.progressText}>
                            • {lesson.progress}% đã học
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.lessonActions}>
                    <div className={`${styles.statusBadge} ${styles[status.type]}`}>
                      {status.text}
                    </div>
                    
                    {lesson.hasAccess && lesson.canJoin && (
                      <button 
                        className={styles.joinButton}
                        onClick={(e) => handleJoinLesson(e, lesson)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path 
                            d="M8 5L19 5C20.1046 5 21 5.89543 21 7V17C21 18.1046 20.1046 19 19 19H8C6.89543 19 6 18.1046 6 17V7C6 5.89543 6.89543 5 8 5Z" 
                            stroke="currentColor" 
                            strokeWidth="2"
                          />
                          <path 
                            d="M12 15L16 12L12 9V15Z" 
                            fill="currentColor" 
                          />
                        </svg>
                        Tham gia
                      </button>
                    )}
                    
                    {lesson.hasAccess && !lesson.canJoin && !lesson.isCompleted && (
                      <button 
                        className={styles.studyButton}
                        onClick={() => handleLessonClick(lesson)}
                      >
                        Học ngay
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path 
                    d="M12 13V15M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21Z" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3>Không có bài học nào</h3>
              <p>Hiện không có bài học nào phù hợp với bộ lọc của bạn.</p>
              <button 
                className={styles.clearFilterButton}
                onClick={() => setFilter('all')}
              >
                Hiển thị tất cả bài học
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentLessonList;