import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Course, CoursesResponse, courseService } from '../../../services/api/courseServices';
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
      const errorMessage = error?.response?.data?.message || 'Không thể tải danh sách khóa học.';
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
      await courseService.updateCourseStatus(courseId, { status: 'published' });
      await fetchCourses();
      setError(null);
    } catch (error: any) {
      console.error('Error approving course:', error);
      setError(error?.response?.data?.message || 'Không thể phê duyệt khóa học.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  // Handle reject action
  const handleReject = async (courseId: string) => {
    const actionKey = `reject_${courseId}`;
    setActionLoading((prev) => ({ ...prev, [actionKey]: true }));
    try {
      await courseService.updateCourseStatus(courseId, { status: 'rejected' });
      await fetchCourses();
      setError(null);
    } catch (error: any) {
      console.error('Error rejecting course:', error);
      setError(error?.response?.data?.message || 'Không thể từ chối khóa học.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  // Handle delete action
  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khóa học này?')) return;
    const actionKey = `delete_${courseId}`;
    setActionLoading((prev) => ({ ...prev, [actionKey]: true }));
    try {
      await courseService.deleteCourse(courseId);
      await fetchCourses();
      setError(null);
    } catch (error: any) {
      console.error('Error deleting course:', error);
      const errorMessage = error?.response?.data?.message || 'Không thể xóa khóa học.';
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
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
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
      published: 'Đã xuất bản',
      draft: 'Bản nháp',
      pending_review: 'Chờ duyệt',
      rejected: 'Đã từ chối',
      archived: 'Đã lưu trữ',
      suspended: 'Đã tạm ngừng',
    };
    return statusMap[status] || status;
  };

  const translateCategory = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      programming: 'Lập trình',
      design: 'Thiết kế',
      business: 'Kinh doanh',
      marketing: 'Tiếp thị',
      language: 'Ngôn ngữ',
      music: 'Âm nhạc',
      photography: 'Nhiếp ảnh',
      cooking: 'Nấu ăn',
      fitness: 'Thể dục',
      art: 'Nghệ thuật',
      writing: 'Viết lách',
      other: 'Khác',
    };
    return categoryMap[category] || category;
  };

  const translateLevel = (level: string): string => {
    const levelMap: { [key: string]: string } = {
      beginner: 'Cơ bản',
      intermediate: 'Trung cấp',
      advanced: 'Nâng cao',
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
          <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Khóa học</h1>
          <p className="text-gray-600 mt-1">Tổng số: {pagination.totalCourses} khóa học</p>
        </div>
        <button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          onClick={handleCreateCourse}
        >
          <span className="mr-2">➕</span> Tạo khóa học mới
        </button>
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
          <h2 className="text-xl font-semibold">Bộ lọc</h2>
          {loading && courses.length > 0 && (
            <div className="flex items-center text-blue-600">
              <span className="animate-spin mr-2">⏳</span>
              <span className="text-sm">Đang cập nhật...</span>
            </div>
          )}
        </div>
        <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Tên khóa học..."
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="programming">Lập trình</option>
              <option value="design">Thiết kế</option>
              <option value="business">Kinh doanh</option>
              <option value="marketing">Tiếp thị</option>
              <option value="language">Ngôn ngữ</option>
              <option value="music">Âm nhạc</option>
              <option value="photography">Nhiếp ảnh</option>
              <option value="cooking">Nấu ăn</option>
              <option value="fitness">Thể dục</option>
              <option value="art">Nghệ thuật</option>
              <option value="writing">Viết lách</option>
              <option value="other">Khác</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cấp độ</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="beginner">Cơ bản</option>
              <option value="intermediate">Trung cấp</option>
              <option value="advanced">Nâng cao</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="published">Đã xuất bản</option>
              <option value="draft">Bản nháp</option>
              <option value="pending_review">Chờ duyệt</option>
              <option value="rejected">Đã từ chối</option>
              <option value="archived">Đã lưu trữ</option>
              <option value="suspended">Đã tạm ngừng</option>
            </select>
          </div>
        </form>
        <div className="flex justify-end mt-4">
          <button
            type="button"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
            onClick={resetFilters}
          >
            <span className="mr-2">🔄</span> Đặt lại
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
                  Khóa học
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giảng viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Học viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
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
                          ? 'Không tìm thấy khóa học nào phù hợp'
                          : 'Chưa có khóa học nào'}
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        {filters.search || filters.category || filters.level || filters.status !== 'published'
                          ? 'Thử thay đổi bộ lọc để xem thêm kết quả'
                          : 'Tạo khóa học đầu tiên của bạn'}
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
                            src={course.thumbnail || 'https://via.placeholder.com/300x200?text=Khóa+học'}
                            alt={course.title}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://via.placeholder.com/300x200?text=Khóa+học';
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
                            {course.totalLessons || 0} bài học • Tạo:{' '}
                            {new Date(course.createdAt).toLocaleDateString('vi-VN')}
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
                        {((course.currentEnrollments || 0) / (course.maxStudents || 1) * 100).toFixed(1)}% đầy
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
                              Giảm {course.discount.percentage}%
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-green-600 font-medium">Miễn phí</span>
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
                  Hiển thị{' '}
                  <span className="font-medium">
                    {Math.min((filters.page - 1) * filters.limit + 1, pagination.totalCourses)}
                  </span>{' '}
                  đến{' '}
                  <span className="font-medium">
                    {Math.min(filters.page * filters.limit, pagination.totalCourses)}
                  </span>{' '}
                  của <span className="font-medium">{pagination.totalCourses}</span> kết quả
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