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

  // Fetch instructor's courses
  useEffect(() => {
    loadInstructorCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch students whenever selected course or filters change
  useEffect(() => {
    if (selectedCourse) {
      loadStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse, state.page, state.status, state.search]);

  const loadInstructorCourses = async () => {
    try {
      setCoursesLoading(true);
      console.log('Fetching instructor courses...');
      const response = await instructorService.getMyCourses(1, 50);
      console.log('Instructor courses response:', response);
      
      // Handle various response formats
      let coursesData: any[] = [];
      
      if (response && response.courses) {
        // Format 1: response.courses
        coursesData = response.courses;
      } else if (response && Array.isArray(response)) {
        // Format 2: response is an array
        coursesData = response;
      } else if (response && response.data && response.data.courses) {
        // Format 3: response.data.courses
        coursesData = response.data.courses;
      } else if (response && response.success === false) {
        // API returned success: false but might still include data
        console.warn('API returned success: false; checking for courses field');
        coursesData = response.courses || [];
      }

      console.log('Processed courses data:', coursesData);

      if (coursesData && coursesData.length > 0) {
        setCourses(coursesData);

        // Auto-select the first course if none selected
        if (!selectedCourse && coursesData.length > 0) {
          setSelectedCourse(coursesData[0]._id);
          console.log('Auto-selected course:', coursesData[0]._id, coursesData[0].title);
        }
      } else {
        console.warn('No courses found after processing response');
        setCourses([]);
      }
    } catch (error: any) {
      console.error('Failed to load courses:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Unable to load course list'
      }));
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  };

  const loadStudents = async () => {
    if (!selectedCourse) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      console.log(`Fetching students for course: ${selectedCourse}`);
      
      const response: InstructorStudentListResponse = 
        await instructorService.getStudentsByCourse(selectedCourse, {
          page: state.page,
          limit: state.limit,
          status: state.status === 'all' ? undefined : state.status,
          search: state.search
        });

      console.log('Students response:', response);

      // Normalize response into consistent structures
      let studentsData: InstructorStudent[] = [];
      let statsData = {
        total: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
        paused: 0
      };
      let paginationData = {
        currentPage: state.page,
        totalPages: 0,
        totalStudents: 0
      };

      if (response && 'students' in response) {
        // Format 1: InstructorStudentListResponse
        studentsData = response.students || [];
        statsData = response.stats || statsData;
        paginationData = response.pagination || paginationData;
      } else if (response && Array.isArray(response)) {
        // Format 2: response is an array of students
        studentsData = response;
      } else if (response && 'data' in response) {
        // Format 3: nested data payload
        const responseWithData = response as any;
        studentsData = responseWithData.data?.students || responseWithData.data || [];
        statsData = responseWithData.data?.stats || statsData;
        paginationData = responseWithData.data?.pagination || paginationData;
      }

      console.log('Processed students data:', {
        studentsCount: studentsData.length,
        stats: statsData,
        pagination: paginationData
      });

      setState(prev => ({
        ...prev,
        students: studentsData,
        stats: statsData,
        pagination: paginationData,
        loading: false,
        error: null
      }));
    } catch (error: any) {
      console.error('Failed to load students:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Unable to load student list'
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
      active: 'Active',
      completed: 'Completed',
      cancelled: 'Cancelled',
      paused: 'Paused'
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
          <h1 className={styles.title}>Student List</h1>
        </div>
        <div className={styles.emptyState}>
          <p>You don't have any courses yet. Create your first course!</p>
          <Link to="/instructor/courses/create" className={styles.createButton}>
            Create Course
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Student List</h1>
        <p className={styles.subtitle}>Manage and track your students' progress</p>
      </div>

      {/* Course Selector */}
      <div className={styles.courseSelector}>
        <label htmlFor="course-select" className={styles.label}>
          Select course:
        </label>
        <select
          id="course-select"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className={styles.select}
        >
          <option value="">-- Select a course --</option>
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
            <div className={styles.statLabel}>Total</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber} style={{ color: '#10b981' }}>
              {state.stats.active}
            </div>
            <div className={styles.statLabel}>Active</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber} style={{ color: '#3b82f6' }}>
              {state.stats.completed}
            </div>
            <div className={styles.statLabel}>Completed</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber} style={{ color: '#f59e0b' }}>
              {state.stats.cancelled}
            </div>
            <div className={styles.statLabel}>Cancelled</div>
          </div>
        </div>
      )}

      {/* Filters */}
      {selectedCourse && (
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search by name or email..."
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
                {status === 'all' ? 'All' : getStatusText(status)}
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
          <p>Loading data...</p>
        </div>
      ) : selectedCourse ? (
        <>
          {/* Table */}
          {state.students.length > 0 ? (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Joined At</th>
                    <th>Actions</th>
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
                        {new Date(student.enrollment.enrolledAt).toLocaleDateString()}
                      </td>
                      <td>
                        <Link
                          to={`/instructor/students/${student.student.userId}/progress?courseId=${selectedCourse}`}
                          className={styles.detailButton}
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.noData}>
              <p>No students found</p>
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
                ← Prev
              </button>

              <div className={styles.pageInfo}>
                Page {state.pagination.currentPage} / {state.pagination.totalPages}
              </div>

              <button
                onClick={() => handlePageChange(state.pagination.currentPage + 1)}
                disabled={state.pagination.currentPage === state.pagination.totalPages}
                className={styles.paginationButton}
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className={styles.noData}>
          <p>Please select a course</p>
        </div>
      )}
    </div>
  );
};

export default InstructorStudentList;
