import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { courseService, Course } from '../../../../services/api/courseService';
import InstructorCourseCard from '../InstructorCourseCard/InstructorCourseCard';
import { 
  FiSearch, 
  FiFilter,
  FiRefreshCw,
  FiPlus,
  FiBarChart2,
  FiUsers,
  FiDollarSign,
  FiAlertCircle, // Thêm import này
  FiX // Thêm import này
} from 'react-icons/fi';

interface InstructorCourseListProps {
  onEditCourse?: (course: Course) => void;
  onViewStats?: (course: Course) => void;
}

const InstructorCourseList: React.FC<InstructorCourseListProps> = ({ 
  onEditCourse, 
  onViewStats 
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const navigate = useNavigate();
  const { user } = useAuth();

 const fetchCourses = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    console.log('🎯 Fetching instructor courses with filters:', {
      page: 1,
      limit: 50,
      status: statusFilter === 'all' ? undefined : statusFilter
    });
    
    const response = await courseService.getMyCourses({
      page: 1,
      limit: 50,
      status: statusFilter === 'all' ? undefined : statusFilter
    });
    
    console.log('✅ Courses fetched successfully:', response);
    setCourses(response.courses || []);
  } catch (error: any) {
    console.error('❌ Error fetching instructor courses:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    setError(error.response?.data?.message || 'Unable to load your courses');
    setCourses([]);
  } finally {
    setLoading(false);
  }
}, [statusFilter]);
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStats = useCallback(() => {
    const total = courses.length;
    const published = courses.filter(c => c.status === 'published').length;
    const draft = courses.filter(c => c.status === 'draft').length;
    const pending = courses.filter(c => c.status === 'pending').length;
    const totalStudents = courses.reduce((sum, course) => sum + course.currentEnrollments, 0);
    const totalRevenue = courses.reduce((sum, course) => {
      const price = course.fullCoursePrice || 0;
      const students = course.currentEnrollments || 0;
      return sum + (price * students * 0.7); // Assuming 70% revenue share
    }, 0);

    return { total, published, draft, pending, totalStudents, totalRevenue };
  }, [courses]);

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <FiBarChart2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-blue-600 font-medium">Total Courses</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <FiUsers className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
              <p className="text-green-600 font-medium">Total Students</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <FiDollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
              <p className="text-purple-600 font-medium">Total Revenue</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <FiBarChart2 className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
              <p className="text-orange-600 font-medium">Published</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Courses</h2>
          <p className="text-gray-600">Manage and track your teaching content</p>
        </div>
        <button
          onClick={() => navigate('/instructor/courses/create')}
          className="px-6 py-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all duration-300 font-semibold flex items-center gap-3 shadow-lg hover:shadow-xl"
        >
          <FiPlus className="w-5 h-5" />
          Create New Course
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FiSearch className="w-4 h-4" />
              Search Courses
            </label>
            <input
              type="text"
              placeholder="Search by title or description..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FiFilter className="w-4 h-4" />
              Status Filter
            </label>
            <select
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-300"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="pending">Pending Review</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 opacity-0">Actions</label>
            <div className="flex gap-2">
              <button
                onClick={fetchCourses}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium flex items-center justify-center gap-2"
              >
                <FiRefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiAlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCourses.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="bg-gray-50 rounded-3xl p-8 border-2 border-dashed border-gray-300">
              <FiBarChart2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-semibold mb-2">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No courses match your criteria' 
                  : 'No courses created yet'}
              </p>
              <p className="text-gray-400 text-sm mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Create your first course to start teaching'}
              </p>
              <button
                onClick={() => navigate('/instructor/courses/create')}
                className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all duration-300 font-semibold"
              >
                Create Your First Course
              </button>
            </div>
          </div>
        ) : (
          filteredCourses.map((course) => (
            <InstructorCourseCard
              key={course._id}
              course={course}
              onEdit={onEditCourse}
              onViewStats={onViewStats}
              onDelete={async (courseId) => {
                try {
                  await courseService.deleteCourse(courseId);
                  setCourses(prev => prev.filter(c => c._id !== courseId));
                } catch (error: any) {
                  setError('Failed to delete course');
                }
              }}
              onUpdateStatus={async (courseId, status) => {
                try {
                  await courseService.updateCourseStatus(courseId, { status });
                  await fetchCourses();
                } catch (error: any) {
                  setError('Failed to update course status');
                }
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default InstructorCourseList;