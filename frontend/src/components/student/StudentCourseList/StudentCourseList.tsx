// frontend/src/components/student/StudentCourseList/StudentCourseList.tsx
import React, { useState, useEffect } from 'react';
import { StudentCourse, StudentCourseResponse } from '../../../types/student.types';
import { getStudentCourses } from '../../../services/api/enrollmentService';
import StudentCourseCard from '../StudentCourseCard/StudentCourseCard';
import { 
  FiBook, 
  FiClock, 
  FiCheckCircle, 
  FiFilter,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiBarChart2
} from 'react-icons/fi';

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
      console.log('Fetching student courses with filters:', filters);
      const response: StudentCourseResponse = await getStudentCourses(
        filters.page, 
        filters.limit, 
        filters.status === 'all' ? undefined : filters.status
      );
      
      console.log('🎯 FULL API RESPONSE:', response);
      
      if (response.success) {
        console.log('📊 RESPONSE COURSES:', response.courses);
        
        // Debug chi tiết từng course
        response.courses?.forEach((course, index) => {
          console.log(`📚 Course ${index + 1}:`, course.course.title);
          console.log(`   📝 Course ID:`, course.course._id);
          console.log(`   🔢 Total Lessons (from API):`, course.course.totalLessons);
          console.log(`   ✅ Completed Lessons:`, course.progress.completedLessons);
          console.log(`   💰 Purchased Lessons:`, course.purchasedLessons);
          console.log(`   🔓 Has Full Access:`, course.hasFullAccess);
          console.log(`   📈 Overall Progress:`, course.progress.overallProgress);
          console.log(`   📅 Enrolled At:`, course.enrolledAt);
          console.log('---');
        });
        
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
        setError(response.message || 'An error occurred while loading data');
      }
    } catch (err: any) {
      console.error('Error fetching courses:', err);
      setError(err.message || 'Unable to connect to server');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-16">
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 border-4 border-emerald-200 rounded-full animate-spin"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Loading Your Courses</h3>
            <p className="text-gray-600">We're preparing your learning journey...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl">
              <FiBook className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-emerald-700 bg-clip-text text-transparent">
              My Learning Journey
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Track your progress, continue learning, and achieve your goals
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl">
                <FiBook className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-gray-600 text-sm">Total Courses</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                <FiClock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-gray-600 text-sm">Active Courses</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                <FiCheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                <p className="text-gray-600 text-sm">Completed</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
                <FiBarChart2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </p>
                <p className="text-gray-600 text-sm">Success Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/20 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <FiFilter className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-gray-900">Filter Courses</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 flex items-center gap-2 ${
                filters.status === 'all' 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg' 
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
              }`}
              onClick={() => handleFilterChange('all')}
            >
              <FiBook className="w-4 h-4" />
              All Courses ({stats.total})
            </button>
            <button
              className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 flex items-center gap-2 ${
                filters.status === 'active' 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg' 
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
              }`}
              onClick={() => handleFilterChange('active')}
            >
              <FiClock className="w-4 h-4" />
              In Progress ({stats.active})
            </button>
            <button
              className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 flex items-center gap-2 ${
                filters.status === 'completed' 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg' 
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
              }`}
              onClick={() => handleFilterChange('completed')}
            >
              <FiCheckCircle className="w-4 h-4" />
              Completed ({stats.completed})
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-6 mb-8 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <FiAlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Unable to Load Courses</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
            <button 
              onClick={handleRetry}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-2"
            >
              <FiRefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {/* Course Grid */}
        {!error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {courses.map(course => (
                <StudentCourseCard key={course.enrollmentId} course={course} />
              ))}
            </div>

            {/* Empty State */}
            {courses.length === 0 && !loading && (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 text-center border-2 border-dashed border-gray-300/80 shadow-lg">
                <div className="w-24 h-24 bg-gradient-to-r from-emerald-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiBook className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Courses Found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {filters.status !== 'all' 
                    ? `You don't have any ${filters.status} courses yet.`
                    : "You haven't enrolled in any courses yet. Start your learning journey today!"}
                </p>
                <button
                  onClick={() => window.location.href = '/courses'}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold inline-flex items-center gap-3"
                >
                  <FiBook className="w-5 h-5" />
                  Browse Courses
                </button>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
                <div className="flex items-center justify-between">
                  <button
                    disabled={!pagination.hasPrev}
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                      pagination.hasPrev
                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:shadow-lg hover:scale-105'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <FiChevronLeft className="w-5 h-5" />
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-gray-700 font-medium">
                      Page <span className="text-emerald-600 font-bold">{pagination.currentPage}</span> of{' '}
                      <span className="text-gray-900">{pagination.totalPages}</span>
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-600">
                      {pagination.totalCourses} total courses
                    </span>
                  </div>
                  
                  <button
                    disabled={!pagination.hasNext}
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                      pagination.hasNext
                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:shadow-lg hover:scale-105'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Next
                    <FiChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudentCourseList;