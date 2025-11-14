// frontend/src/components/instructor/StudentList/InstructorStudentList.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import instructorService from '../../../services/api/instructorService';
import {
  InstructorStudent,
  InstructorStudentListResponse
} from '../../../types/student.types';
import styles from './InstructorStudentList.module.scss';

type StatusFilter = 'all' | 'active' | 'completed' | 'cancelled' | 'paused';

interface StudentListState {
  students: InstructorStudent[];
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  status: StatusFilter;
  search: string;
  stats: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
    paused: number;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalStudents: number;
  };
}

const InstructorStudentList: React.FC = () => {
  const [state, setState] = useState<StudentListState>({
    students: [],
    loading: false,
    error: null,
    page: 1,
    limit: 10,
    status: 'all',
    search: '',
    stats: {
      total: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
      paused: 0
    },
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalStudents: 0
    }
  });

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [coursesLoading, setCoursesLoading] = useState(false);

  // Lấy danh sách khóa học của instructor
  useEffect(() => {
    loadInstructorCourses();
  }, []);

  // Lấy danh sách học viên khi course thay đổi
  useEffect(() => {
    if (selectedCourse) {
      loadStudents();
    }
  }, [selectedCourse, state.page, state.status, state.search]);

  const loadInstructorCourses = async () => {
    try {
      setCoursesLoading(true);
      const response = await instructorService.getMyCourses(1, 50);
      setCourses(response.courses || []);
      
      // Nếu không có course selected và có courses, chọn cái đầu tiên
      if (!selectedCourse && response.courses && response.courses.length > 0) {
        setSelectedCourse(response.courses[0]._id);
      }
    } catch (error) {
      console.error('Failed to load courses:', error);
      setState(prev => ({
        ...prev,
        error: 'Không thể tải danh sách khóa học'
      }));
    } finally {
      setCoursesLoading(false);
    }
  };

  const loadStudents = async () => {
    if (!selectedCourse) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response: InstructorStudentListResponse = 
        await instructorService.getStudentsByCourse(selectedCourse, {
          page: state.page,
          limit: state.limit,
          status: state.status === 'all' ? undefined : state.status,
          search: state.search
        });

      setState(prev => ({
        ...prev,
        students: response.students,
        stats: response.stats,
        pagination: {
          currentPage: response.pagination.currentPage,
          totalPages: response.pagination.totalPages,
          totalStudents: response.pagination.totalStudents
        },
        loading: false
      }));
    } catch (error: any) {
      console.error('Failed to load students:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Không thể tải danh sách học viên'
      }));
    }
  };

  const handleSearch = (value: string) => {
    setState(prev => ({
      ...prev,
      search: value,
      page: 1
    }));
  };

  const handleStatusFilter = (status: StatusFilter) => {
    setState(prev => ({
      ...prev,
      status,
      page: 1
    }));
  };

  const handlePageChange = (page: number) => {
    setState(prev => ({
      ...prev,
      page
    }));
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return styles.badgeActive;
      case 'completed':
        return styles.badgeCompleted;
      case 'cancelled':
        return styles.badgeCancelled;
      case 'paused':
        return styles.badgePaused;
      default:
        return '';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      active: 'Đang học',
      completed: 'Hoàn thành',
      cancelled: 'Hủy',
      paused: 'Tạm dừng'
    };
    return statusMap[status] || status;
  };

  if (coursesLoading) {
    return (
      <div className={styles.container}>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Danh Sách Học Viên</h1>
        </div>
        <div className={styles.emptyState}>
          <p>Bạn chưa có khóa học nào. Hãy tạo khóa học đầu tiên!</p>
          <Link to="/instructor/courses/create" className={styles.createButton}>
            Tạo khóa học
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Danh Sách Học Viên</h1>
        <p className={styles.subtitle}>Quản lý và theo dõi tiến độ học viên của bạn</p>
      </div>

      {/* Course Selector */}
      <div className={styles.courseSelector}>
        <label htmlFor="course-select" className={styles.label}>
          Chọn khóa học:
        </label>
        <select
          id="course-select"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className={styles.select}
        >
          <option value="">-- Chọn khóa học --</option>
          {courses.map(course => (
            <option key={course._id} value={course._id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      {selectedCourse && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{state.stats.total}</div>
            <div className={styles.statLabel}>Tổng cộng</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber} style={{ color: '#10b981' }}>
              {state.stats.active}
            </div>
            <div className={styles.statLabel}>Đang học</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber} style={{ color: '#3b82f6' }}>
              {state.stats.completed}
            </div>
            <div className={styles.statLabel}>Hoàn thành</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber} style={{ color: '#f59e0b' }}>
              {state.stats.cancelled}
            </div>
            <div className={styles.statLabel}>Hủy</div>
          </div>
        </div>
      )}

      {/* Filters */}
      {selectedCourse && (
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={state.search}
              onChange={(e) => handleSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.statusFilters}>
            {(['all', 'active', 'completed', 'cancelled', 'paused'] as const).map(status => (
              <button
                key={status}
                onClick={() => handleStatusFilter(status)}
                className={`${styles.filterButton} ${
                  state.status === status ? styles.active : ''
                }`}
              >
                {status === 'all' ? 'Tất cả' : getStatusText(status)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {state.error && (
        <div className={styles.errorAlert}>
          <p>{state.error}</p>
        </div>
      )}

      {/* Loading State */}
      {state.loading ? (
        <div className={styles.loadingContainer}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : selectedCourse ? (
        <>
          {/* Table */}
          {state.students.length > 0 ? (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Học Viên</th>
                    <th>Email</th>
                    <th>Trạng Thái</th>
                    <th>Tiến Độ</th>
                    <th>Ngày Tham Gia</th>
                    <th>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {state.students.map(student => (
                    <tr key={student.enrollmentId}>
                      <td className={styles.studentName}>
                        <div className={styles.studentInfo}>
                          {student.student.avatar ? (
                            <img 
                              src={student.student.avatar} 
                              alt={student.student.fullName}
                              className={styles.avatar}
                            />
                          ) : (
                            <div className={styles.avatarPlaceholder}>
                              {student.student.fullName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className={styles.name}>
                              {student.student.fullName}
                            </div>
                            {student.student.phoneNumber && (
                              <div className={styles.phone}>
                                {student.student.phoneNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={styles.email}>{student.student.email}</td>
                      <td>
                        <span className={`${styles.badge} ${getStatusBadgeClass(student.enrollment.status)}`}>
                          {getStatusText(student.enrollment.status)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.progressContainer}>
                          <div className={styles.progressBar}>
                            <div
                              className={styles.progressFill}
                              style={{ width: `${student.progress.progressPercentage}%` }}
                            />
                          </div>
                          <span className={styles.progressText}>
                            {student.progress.completedLessons}/{student.progress.totalLessons}
                          </span>
                        </div>
                      </td>
                      <td className={styles.joinedDate}>
                        {new Date(student.enrollment.enrolledAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td>
                        <Link
                          to={`/instructor/students/${student.student.userId}/progress?courseId=${selectedCourse}`}
                          className={styles.detailButton}
                        >
                          Chi tiết
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.noData}>
              <p>Không có học viên nào</p>
            </div>
          )}

          {/* Pagination */}
          {state.pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => handlePageChange(state.pagination.currentPage - 1)}
                disabled={state.pagination.currentPage === 1}
                className={styles.paginationButton}
              >
                ← Trước
              </button>

              <div className={styles.pageInfo}>
                Trang {state.pagination.currentPage} / {state.pagination.totalPages}
              </div>

              <button
                onClick={() => handlePageChange(state.pagination.currentPage + 1)}
                disabled={state.pagination.currentPage === state.pagination.totalPages}
                className={styles.paginationButton}
              >
                Sau →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className={styles.noData}>
          <p>Vui lòng chọn một khóa học</p>
        </div>
      )}
    </div>
  );
};

export default InstructorStudentList;