// frontend/src/components/student/StudentCourseList/StudentCourseList.tsx
import React, { useState, useEffect } from 'react';
import { StudentCourse, StudentCourseResponse } from '../../../types/student.types';
import { getStudentCourses } from '../../../services/api/enrollmentService';
import StudentCourseCard from '../StudentCourseCard/StudentCourseCard';
import styles from './StudentCourseList.module.scss';

const StudentCourseList: React.FC = () => {
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 9,
    status: 'all'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCourses: 0,
    hasNext: false,
    hasPrev: false
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    cancelled: 0
  });

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: StudentCourseResponse = await getStudentCourses(
        filters.page, 
        filters.limit, 
        filters.status === 'all' ? undefined : filters.status
      );
      
      if (response.success) {
        setCourses(response.courses || []);
        setPagination(response.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCourses: 0,
          hasNext: false,
          hasPrev: false
        });
        setStats(response.stats || {
          total: 0,
          active: 0,
          completed: 0,
          cancelled: 0
        });
      } else {
        // Sửa: response.message có thể undefined, nên dùng fallback
        setError(response.message || 'Có lỗi xảy ra khi tải dữ liệu');
      }
    } catch (err: any) {
      console.error('Error fetching courses:', err);
      setError(err.message || 'Không thể kết nối đến server');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [filters]);

  const handleFilterChange = (status: string) => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleRetry = () => {
    fetchCourses();
  };

  if (loading && courses.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Đang tải khóa học...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        <button
          className={`${styles.tab} ${filters.status === 'all' ? styles.active : ''}`}
          onClick={() => handleFilterChange('all')}
        >
          Tất cả ({stats.total})
        </button>
        <button
          className={`${styles.tab} ${filters.status === 'active' ? styles.active : ''}`}
          onClick={() => handleFilterChange('active')}
        >
          Đang học ({stats.active})
        </button>
        <button
          className={`${styles.tab} ${filters.status === 'completed' ? styles.active : ''}`}
          onClick={() => handleFilterChange('completed')}
        >
          Đã hoàn thành ({stats.completed})
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorContainer}>
          <p>{error}</p>
          <button onClick={handleRetry}>Thử lại</button>
        </div>
      )}

      {/* Course Grid */}
      {!error && (
        <>
          <div className={styles.courseGrid}>
            {courses.map(course => (
              <StudentCourseCard key={course.enrollmentId} course={course} />
            ))}
          </div>

          {/* Empty State */}
          {courses.length === 0 && !loading && (
            <div className={styles.emptyState}>
              <h3>Không có khóa học nào</h3>
              <p>Bạn chưa đăng ký khóa học nào hoặc không có khóa học phù hợp với bộ lọc.</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                disabled={!pagination.hasPrev}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                className={styles.paginationButton}
              >
                Trước
              </button>
              
              <span className={styles.pageInfo}>
                Trang {pagination.currentPage} / {pagination.totalPages}
              </span>
              
              <button
                disabled={!pagination.hasNext}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                className={styles.paginationButton}
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentCourseList;