import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Course, CoursesResponse, courseService } from '../../../services/api/courseService';
import AdminCourseActions from '../../../components/admin/CourseActions/AdminCourseActions';

interface FilterState {
  page: number;
  limit: number;
  search: string;
  category: string;
  level: string;
  status: string;
  sortBy: string;
  sortOrder: string;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalCourses: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const CoursesManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [searchInput, setSearchInput] = useState<string>(''); // Separate state for search input
  const [searchLoading, setSearchLoading] = useState<boolean>(false); // Loading state for search

  const [filters, setFilters] = useState<FilterState>({
    page: 1,
    limit: 10,
    search: '',
    category: '',
    level: '',
    status: 'published',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalCourses: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setSearchLoading(true);
    setError(null);
    try {
      const response: CoursesResponse = await courseService.getCourses(filters);
      if (response?.courses && response?.pagination) {
        setCourses(response.courses);
        setPagination(response.pagination);
      } else {
        setCourses([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalCourses: 0,
          hasNext: false,
          hasPrev: false,
        });
      }
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      const errorMessage = error?.response?.data?.message || 'Unable to load course list.';
      setError(errorMessage);
      setCourses([]);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, [filters]);

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
    }, 600); // Debounce 600ms
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Fetch courses when filters change
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterState, value: string | number) => {
    if (key !== 'search') {
      setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    }
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  // Handle approve action
  const handleApprove = async (courseId: string) => {
    const actionKey = `approve_${courseId}`;
    setActionLoading((prev) => ({ ...prev, [actionKey]: true }));
    try {
      await courseService.approveCourse(courseId); // ✅ use approveCourse
      await fetchCourses();
      setError(null);
    } catch (error: any) {
      console.error('Error approving course:', error);
      setError(error?.response?.data?.message || 'Unable to approve course.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  // Handle reject action
  const handleReject = async (courseId: string) => {
    const actionKey = `reject_${courseId}`;
    setActionLoading((prev) => ({ ...prev, [actionKey]: true }));
    try {
      await courseService.rejectCourse(courseId, "Inappropriate content"); // ✅ use rejectCourse
      await fetchCourses();
      setError(null);
    } catch (error: any) {
      console.error('Error rejecting course:', error);
      setError(error?.response?.data?.message || 'Unable to reject course.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  // Handle delete action

const handleDeleteCourse = async (courseId: string) => {
  const course = courses.find(c => c._id === courseId);
  if (!course) return;

  let confirmMessage = '';
  
  if (course.currentEnrollments > 0) {
    alert('Không thể xóa khóa học đang có học viên đăng ký');
    return;
  }

  if (course.status === 'archived') {
    confirmMessage = 'Bạn có chắc muốn XÓA VĨNH VIỄN khóa học này? Hành động này không thể hoàn tác!';
  } else {
    confirmMessage = 'Bạn có chắc muốn xóa khóa học này?';
  }

  if (!window.confirm(confirmMessage)) return;

  const actionKey = `delete_${courseId}`;
  setActionLoading((prev) => ({ ...prev, [actionKey]: true }));
  try {
    await courseService.deleteCourse(courseId);
    await fetchCourses();
    setError(null);
  } catch (error: any) {
    console.error('Error deleting course:', error);
    const errorMessage = error?.response?.data?.message || 'Unable to delete course.';
    alert(errorMessage);
  } finally {
    setActionLoading((prev) => ({ ...prev, [actionKey]: false }));
  }
};

  // Handle view action
  const handleView = (courseId: string) => {
    navigate(`/admin/courses/${courseId}`);
  };

  // Handle create course
  const handleCreateCourse = () => {
    navigate('/admin/courses/create');
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      category: '',
      level: '',
      status: 'published',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setSearchInput('');
  };

  // Format currency, status color, and translations
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD', // Changed to USD for English context; adjust as needed
    }).format(amount || 0);
  };

  const getStatusColor = (status: string): string => {
    const statusColors: { [key: string]: string } = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      pending_review: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      archived: 'bg-gray-100 text-gray-800',
      suspended: 'bg-purple-100 text-purple-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const translateStatus = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      published: 'Published',
      draft: 'Draft',
      pending_review: 'Pending Review',
      rejected: 'Rejected',
      archived: 'Archived',
      suspended: 'Suspended',
    };
    return statusMap[status] || status;
  };

  const translateCategory = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      programming: 'Programming',
      design: 'Design',
      business: 'Business',
      marketing: 'Marketing',
      language: 'Language',
      music: 'Music',
      photography: 'Photography',
      cooking: 'Cooking',
      fitness: 'Fitness',
      art: 'Art',
      writing: 'Writing',
      other: 'Other',
    };
    return categoryMap[category] || category;
  };

  const translateLevel = (level: string): string => {
    const levelMap: { [key: string]: string } = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    };
    return levelMap[level] || level;
  };

  // Pagination rendering
  const renderPaginationButton = (page: number) => (
    <button
      key={page}
      onClick={() => handlePageChange(page)}
      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
        filters.page === page
          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
      }`}
    >
      {page}
    </button>
  );

  const renderPaginationNumbers = () => {
    const buttons = [];
    const totalPages = pagination.totalPages;
    const currentPage = filters.page;
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(renderPaginationButton(i));
      }
    } else {
      buttons.push(renderPaginationButton(1));
      let start = Math.max(2, currentPage - 2);
      let end = Math.min(totalPages - 1, currentPage + 2);
      if (start > 2) {
        buttons.push(
          <span
            key="ellipsis1"
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
          >
            ...
          </span>
        );
        start = Math.max(start, currentPage - 1);
      }
      for (let i = start; i <= end; i++) {
        buttons.push(renderPaginationButton(i));
      }
      if (end < totalPages - 1) {
        buttons.push(
          <span
            key="ellipsis2"
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
          >
            ...
          </span>
        );
      }
      if (totalPages > 1) {
        buttons.push(renderPaginationButton(totalPages));
      }
    }
    return buttons;
  };

  if (loading && courses.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <span className="animate-spin text-2xl">⏳</span>
          <span className="ml-3 text-gray-600">Loading data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Course Management</h1>
          <p className="text-gray-600 mt-1">Total: {pagination.totalCourses} courses</p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <div className="flex items-center">
            <span className="mr-2">⚠️</span>
            <span>{error}</span>
            <button
              type="button"
              className="ml-auto text-red-700 hover:text-red-900"
              onClick={() => setError(null)}
            >
              <span>❌</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Filters</h2>
          {loading && courses.length > 0 && (
            <div className="flex items-center text-blue-600">
              <span className="animate-spin mr-2">⏳</span>
              <span className="text-sm">Updating...</span>
            </div>
          )}
        </div>
        <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Course name..."
                className="w-full p-2 pl-8 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <span className="absolute left-2.5 top-2.5 text-gray-400">🔍</span>
              {searchLoading && (
                <span className="absolute right-2.5 top-2.5 text-gray-400 animate-spin">⏳</span>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All</option>
              <option value="programming">Programming</option>
              <option value="design">Design</option>
              <option value="business">Business</option>
              <option value="marketing">Marketing</option>
              <option value="language">Language</option>
              <option value="music">Music</option>
              <option value="photography">Photography</option>
              <option value="cooking">Cooking</option>
              <option value="fitness">Fitness</option>
              <option value="art">Art</option>
              <option value="writing">Writing</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
            >
              <option value="">All</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="pending_review">Pending Review</option>
              <option value="rejected">Rejected</option>
              <option value="archived">Archived</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </form>
        <div className="flex justify-end mt-4">
          <button
            type="button"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
            onClick={resetFilters}
          >
            <span className="mr-2">🔄</span> Reset
          </button>
        </div>
      </div>

      {/* Courses table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instructor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-4xl text-gray-300 mb-4">📚</span>
                      <p className="text-gray-500 text-lg">
                        {filters.search || filters.category || filters.level || filters.status !== 'published'
                          ? 'No courses found matching the criteria'
                          : 'No courses available yet'}
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        {filters.search || filters.category || filters.level || filters.status !== 'published'
                          ? 'Try adjusting the filters to see more results'
                          : 'Create your first course'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <img
                            className="h-12 w-12 rounded-md object-cover"
                            src={course.thumbnail || 'https://via.placeholder.com/300x200?text=Course'}
                            alt={course.title}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://via.placeholder.com/300x200?text=Course';
                            }}
                          />
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="text-sm font-medium text-gray-900" title={course.title}>
                            {course.title.length > 60 ? `${course.title.substring(0, 60)}...` : course.title}
                          </div>
                          <div
                            className="text-sm text-gray-500 mt-1"
                            title={course.shortDescription || course.description}
                          >
                            {(course.shortDescription || course.description)?.length > 80
                              ? `${(course.shortDescription || course.description).substring(0, 80)}...`
                              : course.shortDescription || course.description}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {course.totalLessons || 0} lessons • Created:{' '}
                            {new Date(course.createdAt).toLocaleDateString('en-US')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={
                              course.instructor?.profile?.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                course.instructor?.fullName || 'Unknown'
                              )}&background=random`
                            }
                            alt={course.instructor?.fullName || 'Unknown'}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                course.instructor?.fullName || 'Unknown'
                              )}&background=random`;
                            }}
                          />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {course.instructor?.fullName || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {course.instructor?.email || 'unknown@example.com'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{translateCategory(course.category)}</div>
                      <div className="text-sm text-gray-500">{translateLevel(course.level)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {course.currentEnrollments || 0}/{course.maxStudents || 0}
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              ((course.currentEnrollments || 0) / (course.maxStudents || 1)) * 100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {((course.currentEnrollments || 0) / (course.maxStudents || 1) * 100).toFixed(1)}% full
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {course.fullCoursePrice ? (
                        <div>
                          <div className="font-medium text-gray-900">
                            {formatCurrency(course.fullCoursePrice)}
                          </div>
                          {course.discount && (
                            <div className="text-xs text-green-600">
                              Discount {course.discount.percentage}%
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-green-600 font-medium">Free</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          course.status
                        )}`}
                      >
                        {translateStatus(course.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <AdminCourseActions
                        course={course}
                        onView={handleView}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onDelete={handleDeleteCourse}
                        loading={actionLoading}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {Math.min((filters.page - 1) * filters.limit + 1, pagination.totalCourses)}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(filters.page * filters.limit, pagination.totalCourses)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.totalCourses}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    disabled={!pagination.hasPrev}
                    onClick={() => handlePageChange(filters.page - 1)}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium transition-colors ${
                      pagination.hasPrev
                        ? 'bg-white text-gray-500 hover:bg-gray-50'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <span>⬅️</span>
                  </button>
                  {renderPaginationNumbers()}
                  <button
                    disabled={!pagination.hasNext}
                    onClick={() => handlePageChange(filters.page + 1)}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium transition-colors ${
                      pagination.hasNext
                        ? 'bg-white text-gray-500 hover:bg-gray-50'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <span>➡️</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesManagementPage;