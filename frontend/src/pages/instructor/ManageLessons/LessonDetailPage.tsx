import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService } from '../../../services/api/courseService';
import { instructorService } from '../../../services/api/instructorService';
import { useAuth } from '../../../context/AuthContext';
import { CourseWithRating } from '../../../types/course.types';
import { 
  FiArrowLeft, 
  FiPlay, 
  FiSquare, 
  FiClock, 
  FiBook,
  FiInfo,
  FiVideo,
  FiCalendar,
  FiUsers,
  FiBarChart2
} from 'react-icons/fi';
import { HiOutlineStatusOnline, HiOutlineCheckCircle } from 'react-icons/hi';

const LessonDetailPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<any>(null);
  const [course, setCourse] = useState<CourseWithRating | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingLesson, setStartingLesson] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    attendanceRate: 0,
    averageRating: 0,
    loading: true
  });

  useEffect(() => {
    if (lessonId && courseId) {
      loadLessonAndCourse();
      loadCourseStats();
    }
  }, [lessonId, courseId]);

  const loadLessonAndCourse = async () => {
    try {
      setLoading(true);
      const [lessonResponse, courseResponse] = await Promise.all([
        courseService.getLessonById(lessonId!),
        courseService.getCourseById(courseId!)
      ]);

      setLesson(lessonResponse.lesson);
      // Sửa: Ép kiểu qua unknown trung gian
      setCourse(courseResponse.course as unknown as CourseWithRating);
    } catch (err: any) {
      setError('Unable to load lesson information');
      console.error('Error loading lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));
      
      // Lấy thống kê học viên từ course
      if (courseId) {
        const studentsResponse = await instructorService.getStudentsByCourse(courseId, {
          page: 1,
          limit: 100
        });

        // Lấy thông tin rating từ course
        const courseDetails = await courseService.getCourseById(courseId);
        
        const totalStudents = studentsResponse.stats?.total || 0;
        const activeStudents = studentsResponse.stats?.active || 0;
        
        // Tính attendance rate (tỷ lệ học viên active)
        const attendanceRate = totalStudents > 0 
          ? Math.round((activeStudents / totalStudents) * 100)
          : 0;

        // Sửa: Ép kiểu qua unknown trung gian
        const courseWithRating = courseDetails.course as unknown as CourseWithRating;
        const averageRating = courseWithRating?.averageRating || 0;

        setStats({
          totalStudents,
          attendanceRate,
          averageRating,
          loading: false
        });
      }
    } catch (error) {
      console.error('Error loading course stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const handleStartLesson = async () => {
    try {
      setStartingLesson(true);
      setError('');
      
      console.log('🎯 Starting lesson:', lessonId);
      
      let response;
      try {
        response = await courseService.startLesson(lessonId!);
      } catch (error) {
        console.log('⚠️ startLesson failed, trying startLessonWithFallback...');
        response = await courseService.startLessonWithFallback(lessonId!);
      }
      
      console.log('✅ Lesson started successfully:', response);
      
      await loadLessonAndCourse();
      navigate(`/instructor/course/${courseId}/lesson/${lessonId}/start`);
      
    } catch (err: any) {
      console.error('❌ Error starting lesson:', err);
      setError(err.message || 'Unable to start the lesson. Please check if the endpoint exists.');
    } finally {
      setStartingLesson(false);
    }
  };

  const handleEndLesson = async () => {
    try {
      setError('');
      
      console.log('🛑 Ending lesson:', lessonId);
      
      await courseService.endLessonMeeting(lessonId!);
      
      console.log('✅ Lesson ended successfully');
      
      await loadLessonAndCourse();
      
    } catch (err: any) {
      console.error('❌ Error ending lesson:', err);
      setError(err.message || 'Unable to end the lesson');
      
      try {
        console.log('🔄 Trying fallback method...');
        await courseService.endLesson(lessonId!);
        await loadLessonAndCourse();
      } catch (fallbackError: any) {
        console.error('❌ Fallback also failed:', fallbackError);
        setError('Unable to end the lesson using any method');
      }
    }
  };

  const handleJoinMeeting = () => {
    navigate(`/instructor/course/${courseId}/lesson/${lessonId}/start`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="w-16 h-16 border-4 border-emerald-200 rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Lesson</h3>
          <p className="text-gray-600">Preparing your teaching environment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiInfo className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Lesson</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-2 mx-auto"
          >
            <FiArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!lesson || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBook className="w-8 h-8 text-yellow-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Lesson Not Found</h3>
          <p className="text-gray-600 mb-6">The requested lesson could not be found.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-2 mx-auto"
          >
            <FiArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-emerald-100 text-emerald-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'live': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <HiOutlineCheckCircle className="w-4 h-4" />;
      case 'live': return <HiOutlineStatusOnline className="w-4 h-4" />;
      default: return <FiInfo className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Hiển thị lỗi nếu có */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <FiInfo className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-white/20"
            >
              <FiArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-emerald-700 bg-clip-text text-transparent">
                {lesson.title}
              </h1>
              <p className="text-gray-600 mt-1">
                Course: <span className="font-semibold text-emerald-600">{course.title}</span>
              </p>
            </div>
          </div>

          {/* Lesson Actions */}
          <div className="flex items-center gap-4">
            {lesson.lessonType === 'live_online' && (
              <>
                {lesson.isLive ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-2xl">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="font-semibold">LIVE</span>
                    </div>
                    <button
                      onClick={handleJoinMeeting}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-2"
                    >
                      <FiVideo className="w-4 h-4" />
                      Join Meeting
                    </button>
                    <button
                      onClick={handleEndLesson}
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-2"
                    >
                      <FiSquare className="w-4 h-4" />
                      End Lesson
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleStartLesson}
                    disabled={startingLesson}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiPlay className="w-4 h-4" />
                    {startingLesson ? 'Starting...' : 'Start Lesson'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Lesson Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lesson Information Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center">
                  <FiInfo className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Lesson Information</h2>
                  <p className="text-gray-600">Detailed overview of this lesson</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-700 leading-relaxed bg-gray-50/50 rounded-2xl p-6 border border-gray-200/60">
                    {lesson.description || 'No description provided for this lesson.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
                      <FiVideo className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Lesson Type</p>
                      <p className="font-semibold text-gray-900">
                        {lesson.lessonType === 'live_online' ? 'Live Online' : 'Self-paced'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
                      <FiClock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-semibold text-gray-900">{lesson.duration} minutes</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
                      <FiBarChart2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(lesson.status)}`}>
                        {getStatusIcon(lesson.status)}
                        {lesson.status === 'published' ? 'Published' : 
                         lesson.status === 'draft' ? 'Draft' : 
                         lesson.status === 'completed' ? 'Completed' : 
                         lesson.status}
                      </div>
                    </div>
                  </div>

                  {lesson.schedule && (
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100">
                      <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
                        <FiCalendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Scheduled Time</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(lesson.schedule).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Stats & Actions */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/20">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiUsers className="w-5 h-5 text-emerald-500" />
                Session Overview
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50/50 rounded-2xl">
                  <span className="text-gray-600">Enrolled Students</span>
                  {stats.loading ? (
                    <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>
                  ) : (
                    <span className="font-bold text-gray-900">{stats.totalStudents}</span>
                  )}
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50/50 rounded-2xl">
                  <span className="text-gray-600">Attendance Rate</span>
                  {stats.loading ? (
                    <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>
                  ) : (
                    <span className="font-bold text-emerald-600">{stats.attendanceRate}%</span>
                  )}
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50/50 rounded-2xl">
                  <span className="text-gray-600">Average Rating</span>
                  {stats.loading ? (
                    <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>
                  ) : (
                    <span className="font-bold text-yellow-600">
                      {stats.averageRating > 0 ? `${stats.averageRating}/5` : 'No ratings'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/20">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate(`/instructor/course/${courseId}/students`)}
                  className="w-full text-left p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                      <FiUsers className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Manage Attendees</p>
                      <p className="text-sm text-gray-600">View and manage participants</p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => navigate(`/instructor/course/${courseId}/analytics`)}
                  className="w-full text-left p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                      <FiBarChart2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">View Analytics</p>
                      <p className="text-sm text-gray-600">Session performance metrics</p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => navigate(`/instructor/course/${courseId}/materials`)}
                  className="w-full text-left p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                      <FiBook className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Course Materials</p>
                      <p className="text-sm text-gray-600">Access teaching resources</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonDetailPage;