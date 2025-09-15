import React, { useState, useEffect } from "react";
import { Course, CoursesResponse, courseService } from "../../../services/api/courseServices";

const CoursesManagementPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    category: "",
    level: "",
    status: "",
    sortBy: "createdAt",
    sortOrder: "desc"
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCourses: 0,
    hasNext: false,
    hasPrev: false
  });

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response: CoursesResponse = await courseService.getCourses(filters);
      console.log("API Response:", response);
      
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
          hasPrev: false
        });
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      setError("Không thể tải danh sách khóa học. Vui lòng thử lại sau.");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [filters]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleStatusChange = async (courseId: string, newStatus: string) => {
    try {
      await courseService.updateCourseStatus(courseId, { status: newStatus });
      fetchCourses();
    } catch (error) {
      console.error("Error updating course status:", error);
      setError("Không thể cập nhật trạng thái khóa học.");
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa khóa học này?")) return;

    try {
      await courseService.deleteCourse(courseId);
      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("Không thể xóa khóa học. Có thể khóa học đã có học viên đăng ký.");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'published': return 'Đã xuất bản';
      case 'draft': return 'Bản nháp';
      case 'archived': return 'Đã lưu trữ';
      default: return status;
    }
  };

  const handleEdit = (courseId: string) => {
    console.log("Edit course", courseId);
  };

  const handleView = (courseId: string) => {
    console.log("View course", courseId);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Khóa học</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
          <i className="fas fa-plus mr-2"></i> Tạo khóa học mới
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <div className="flex items-center">
            <i className="fas fa-exclamation-circle mr-2"></i>
            <span>{error}</span>
            <button className="ml-auto text-red-700" onClick={() => setError(null)}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* Filter section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Bộ lọc</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <input
              type="text"
              placeholder="Tên khóa học..."
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="technology">Công nghệ</option>
              <option value="business">Kinh doanh</option>
              <option value="design">Thiết kế</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cấp độ</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
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
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="published">Đã xuất bản</option>
              <option value="draft">Bản nháp</option>
              <option value="archived">Đã lưu trữ</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
            onClick={() => setFilters({
              page: 1,
              limit: 10,
              search: "",
              category: "",
              level: "",
              status: "published",
              sortBy: "createdAt",
              sortOrder: "desc"
            })}
          >
            Đặt lại
          </button>
        </div>
      </div>

      {/* Courses table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khóa học</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giảng viên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Danh mục</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Học viên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <i className="fas fa-book-open text-4xl text-gray-300 mb-4"></i>
                      <p className="text-gray-500 text-lg">Không tìm thấy khóa học nào</p>
                      <p className="text-gray-400 text-sm mt-2">Thử thay đổi bộ lọc hoặc tạo khóa học mới</p>
                    </div>
                  </td>
                </tr>
              ) : (
                courses.map(course => (
                  <tr key={course._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-md object-cover"
                            src={course.thumbnail || "https://via.placeholder.com/300x200?text=Khóa+học"}
                            alt={course.title}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{course.title}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">{course.shortDescription || course.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-full"
                            src={course.instructor.profile?.avatar || "https://randomuser.me/api/portraits/men/1.jpg"}
                            alt={course.instructor.fullName}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{course.instructor.fullName}</div>
                          <div className="text-sm text-gray-500">{course.instructor.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">{course.category}</div>
                      <div className="text-sm text-gray-500 capitalize">{course.level}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {course.currentEnrollments}/{course.maxStudents}
                      </div>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${(course.currentEnrollments / course.maxStudents) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(course.fullCoursePrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(course.status)}`}>
                        {translateStatus(course.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900" onClick={() => handleEdit(course._id)}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteCourse(course._id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                        <button className="text-green-600 hover:text-green-900" onClick={() => handleView(course._id)}>
                          <i className="fas fa-eye"></i>
                        </button>
                        {course.status === 'published' && (
                          <button
                            className="text-yellow-600 hover:text-yellow-900"
                            onClick={() => handleStatusChange(course._id, 'draft')}
                          >
                            <i className="fas fa-eye-slash"></i>
                          </button>
                        )}
                        {course.status === 'draft' && (
                          <button
                            className="text-green-600 hover:text-green-900"
                            onClick={() => handleStatusChange(course._id, 'published')}
                          >
                            <i className="fas fa-check"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span> đến{' '}
                  <span className="font-medium">{Math.min(filters.page * filters.limit, pagination.totalCourses)}</span> của{' '}
                  <span className="font-medium">{pagination.totalCourses}</span> kết quả
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    disabled={!pagination.hasPrev}
                    onClick={() => handlePageChange(filters.page - 1)}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${pagination.hasPrev ? 'bg-white text-gray-500 hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                  >
                    <span className="sr-only">Previous</span>
                    <i className="fas fa-chevron-left"></i>
                  </button>

                  {[...Array(pagination.totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handlePageChange(index + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        filters.page === index + 1
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}

                  <button
                    disabled={!pagination.hasNext}
                    onClick={() => handlePageChange(filters.page + 1)}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${pagination.hasNext ? 'bg-white text-gray-500 hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                  >
                    <span className="sr-only">Next</span>
                    <i className="fas fa-chevron-right"></i>
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