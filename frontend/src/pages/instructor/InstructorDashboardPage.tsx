import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService, Course } from '../../services/api/courseService';
import { 
  FiBook, 
  FiUsers, 
  FiDollarSign, 
  FiStar, 
  FiPlus,
  FiEdit,
  FiSettings,
  FiBarChart2,
  FiCreditCard,
  FiCalendar,
  FiArrowRight,
  FiTrendingUp
} from 'react-icons/fi';
import { HiOutlineAcademicCap, HiOutlineSparkles } from 'react-icons/hi';

interface DashboardStats {
  totalEarnings: number;
  studentsEnrolled: number;
  upcomingSessions: number;
  coursesCreated: number;
  totalReviews: number;
  averageRating: number;
}

const InstructorDashboardPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showAllCourses, setShowAllCourses] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        setDebugInfo('Fetching courses...');

        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }

        console.log('🎯 Starting course fetch via courseService.getMyCourses()');
        const response = await courseService.getMyCourses({
          page: 1,
          limit: 100
        });

        console.log('✅ Courses response:', response);
        const coursesArray = response?.courses || [];
        console.log(`✅ Successfully loaded ${coursesArray.length} courses`);
        setCourses(coursesArray);
        setDebugInfo(`Loaded ${coursesArray.length} courses successfully`);

      } catch (err: any) {
        console.error('❌ Error fetching dashboard data:', err);
        const errorMessage = err.response?.data?.message || 
                            err.message || 
                            'Failed to load courses';
        setError(errorMessage);
        setDebugInfo(`Error: ${errorMessage}. Check console for details.`);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const calculateStats = (): DashboardStats => {
    const totalStudents = courses.reduce((sum, course) => 
      sum + (course.currentEnrollments || 0), 0
    );
    
    const totalReviews = courses.reduce((sum, course) => 
      sum + (course.ratings?.count || 0), 0
    );

    const totalRating = courses.reduce((sum, course) => 
      sum + (course.ratings?.average || 0), 0
    );
    
    const averageRating = courses.length > 0 
      ? totalRating / courses.length 
      : 0;

    const totalEarnings = courses.reduce((sum, course: any) => {
      const coursePrice = course.fullCoursePrice || 0;
      const enrollments = course.currentEnrollments || 0;
      const courseEarnings = coursePrice * enrollments;
      return sum + courseEarnings;
    }, 0);

    return {
      totalEarnings: Math.floor(totalEarnings),
      studentsEnrolled: totalStudents,
      upcomingSessions: 0,
      coursesCreated: courses.length,
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(1))
    };
  };

  const stats = calculateStats();

  const handleCreateCourse = () => {
    navigate('/instructor/courses/create');
  };

  const handleManageCourse = (courseId: string) => {
    navigate(`/instructor/courses/${courseId}`);
  };

  const handleEditCourse = (courseId: string) => {
    navigate(`/instructor/courses/${courseId}/edit`);
  };

  const handleViewAllCourses = () => {
    navigate('/instructor/courses');
  };

  if (loading) {
    return (
      <div className="min-h-96 flex flex-col items-center justify-center py-12">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-200 rounded-full animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-lg font-medium text-gray-700 mt-4">Loading your dashboard...</p>
        <p className="text-sm text-gray-500 mt-2">{debugInfo}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl">
            <HiOutlineAcademicCap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-emerald-700 bg-clip-text text-transparent">
              Welcome back, {user?.fullName || 'Instructor'}!
            </h2>
            <p className="text-gray-600 text-lg">Manage your courses and track your teaching performance</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-6 mb-8 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-red-500 rounded-xl">
              <FiSettings className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-red-800 font-bold text-lg mb-2">Error Loading Courses</h4>
              <p className="text-red-700 mb-4">{error}</p>
              <details className="cursor-pointer">
                <summary className="text-red-600 font-medium text-sm">Debug Information</summary>
                <div className="mt-2 p-3 bg-white/50 rounded-lg">
                  <code className="text-xs text-gray-700 font-mono">{debugInfo}</code>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-emerald-500 to-green-500 text-white rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Total Earnings</p>
              <p className="text-3xl font-bold mt-2">${stats.totalEarnings.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <FiDollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-emerald-100 text-sm">
            <FiTrendingUp className="w-4 h-4" />
            <span>+12% this month</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500 to-green-500 text-white rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Students Enrolled</p>
              <p className="text-3xl font-bold mt-2">{stats.studentsEnrolled}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <FiUsers className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-emerald-100 text-sm">
            <FiTrendingUp className="w-4 h-4" />
            <span>+8 new students</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500 to-green-500 text-white rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Your Courses</p>
              <p className="text-3xl font-bold mt-2">{stats.coursesCreated}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <FiBook className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-emerald-100 text-sm">
            <span>{stats.coursesCreated > 0 ? 'Active courses' : 'No courses yet'}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-green-500 text-white rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Average Rating</p>
              <p className="text-3xl font-bold mt-2">{stats.averageRating}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <FiStar className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-emerald-100 text-sm">
            <span>Based on {stats.totalReviews} reviews</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-2">
          {/* Your Courses Section */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white/20 mb-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-xl">
                  <FiBook className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Your Courses</h3>
                  <p className="text-gray-600">Manage and track your course performance</p>
                </div>
              </div>
              <button 
                onClick={handleCreateCourse}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-2"
              >
                <FiPlus className="w-5 h-5" />
                Create Course
              </button>
            </div>

            {courses.length > 0 ? (
              <div className="space-y-4">
                {(showAllCourses ? courses : courses.slice(0, 6)).map(course => (
                  <div 
                    key={course._id}
                    className="bg-gradient-to-r from-gray-50 to-emerald-50/50 rounded-2xl p-6 border border-gray-200/60 hover:border-emerald-300 transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <img
                            src={course.thumbnail || '/default-course.jpg'}
                            alt={course.title}
                            className="w-16 h-16 object-cover rounded-xl"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-bold text-gray-900 text-lg">{course.title}</h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                course.status === 'published' 
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {course.status}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                              {course.shortDescription || course.description}
                            </p>
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2">
                                <FiUsers className="w-4 h-4 text-gray-500" />
                                <span className="font-semibold text-gray-900">{course.currentEnrollments || 0}</span>
                                <span className="text-gray-500 text-sm">Students</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FiStar className="w-4 h-4 text-yellow-500" />
                                <span className="font-semibold text-gray-900">{course.ratings?.average?.toFixed(1) || '0.0'}</span>
                                <span className="text-gray-500 text-sm">Rating</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FiBarChart2 className="w-4 h-4 text-gray-500" />
                                <span className="font-semibold text-gray-900">{course.ratings?.count || 0}</span>
                                <span className="text-gray-500 text-sm">Reviews</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      <button 
                        onClick={() => handleManageCourse(course._id)}
                        className="flex-1 px-4 py-2 bg-white text-emerald-600 border-2 border-emerald-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                      >
                        <FiSettings className="w-4 h-4" />
                        Manage
                      </button>
                      <button 
                        onClick={() => handleEditCourse(course._id)}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium flex items-center justify-center gap-2"
                      >
                        <FiEdit className="w-4 h-4" />
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-r from-emerald-100 to-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <FiBook className="w-12 h-12 text-emerald-500" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-3">No courses yet</h4>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Create your first course to start teaching on SkillShare Hub and share your knowledge with students worldwide.
                </p>
                <button 
                  onClick={handleCreateCourse}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-3 mx-auto"
                >
                  <HiOutlineSparkles className="w-6 h-6" />
                  Create Your First Course
                </button>
              </div>
            )}

            {courses.length > 6 && (
              <div className="text-center mt-8">
                <button 
                  onClick={() => setShowAllCourses(!showAllCourses)}
                  className="px-6 py-3 bg-white text-emerald-600 border-2 border-emerald-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 font-medium flex items-center gap-2 mx-auto"
                >
                  {showAllCourses ? 'Show Less' : `View All Courses (${courses.length})`}
                  <FiArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          {courses.length > 0 && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500 rounded-xl">
                  <FiCalendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Recent Activity</h3>
                  <p className="text-gray-600">Latest updates from your courses</p>
                </div>
              </div>
              <div className="space-y-4">
                {courses.slice(0, 3).map((course, idx) => (
                  <div 
                    key={course._id}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-emerald-50/50 rounded-2xl border border-gray-200/60"
                  >
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <FiBook className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        <span className="text-emerald-600">{course.title}</span> - {course.status}
                      </p>
                      <span className="text-sm text-gray-500">
                        Updated {new Date(course.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{course.currentEnrollments || 0}</span>
                      <p className="text-sm text-gray-500">students</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Quick Actions */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-500 rounded-xl">
                <HiOutlineSparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Quick Actions</h3>
                <p className="text-gray-600">Manage your teaching activities</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { 
                  icon: <FiPlus className="w-6 h-6" />, 
                  title: 'Create Course', 
                  desc: 'Start building a new course', 
                  action: handleCreateCourse,
                  color: 'from-emerald-500 to-green-500'
                },
                { 
                  icon: <FiBook className="w-6 h-6" />, 
                  title: 'Manage Courses', 
                  desc: 'View and edit your courses', 
                  action: () => navigate('/instructor/courses'),
                  color: 'from-blue-500 to-cyan-500'
                },
                { 
                  icon: <FiBarChart2 className="w-6 h-6" />, 
                  title: 'View Analytics', 
                  desc: 'See your performance metrics', 
                  action: () => navigate('/instructor/analytics'),
                  color: 'from-purple-500 to-pink-500'
                },
                { 
                  icon: <FiCreditCard className="w-6 h-6" />, 
                  title: 'Earnings', 
                  desc: 'Track your revenue', 
                  action: () => navigate('/instructor/earnings'),
                  color: 'from-orange-500 to-red-500'
                }
              ].map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.action}
                  className="w-full text-left p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200/60 hover:shadow-lg hover:scale-105 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 bg-gradient-to-r ${action.color} rounded-xl text-white group-hover:scale-110 transition-transform duration-300`}>
                      {action.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-lg">{action.title}</h4>
                      <p className="text-gray-600 text-sm">{action.desc}</p>
                    </div>
                    <FiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* View All Courses Card */}
          {courses.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-500 to-green-500 rounded-3xl p-6 text-white shadow-xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiBook className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold mb-2">View All Courses</h4>
                <p className="text-emerald-100 mb-4">
                  Manage all {courses.length} of your courses in one place
                </p>
                <button 
                  onClick={handleViewAllCourses}
                  className="w-full py-3 bg-white text-emerald-600 rounded-xl hover:scale-105 transition-transform duration-200 font-semibold flex items-center justify-center gap-2"
                >
                  View Courses
                  <FiArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboardPage;