// src/pages/Dashboard/DashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStudentCourses } from '../../services/api/enrollmentService';
import { studentScheduleService } from '../../services/api/studentScheduleService';
import { paymentService } from '../../services/api/paymentService';
// Import types from courseService
import { Schedule } from '../../services/api/courseService'; 

import { 
  FiBook, 
  FiCheckCircle, 
  FiClock, 
  FiCalendar,
  FiStar,
  FiTrendingUp,
  FiPlay,
  FiUser,
  FiDollarSign,
  FiArrowRight,
  FiSearch,
  FiSettings,
  FiBarChart2
} from 'react-icons/fi';
import { HiOutlineAcademicCap, HiOutlineSparkles } from 'react-icons/hi';

// ========== INTERFACE DEFINITIONS ==========

// Interface for statistics data
interface LearningStats {
  totalEnrolledCourses: number;
  completedCourses: number;
  totalLearningHours: number;
  upcomingSessions: number;
  averageRating: number;
  completionRate: number;
}

// Interface for courses (Dashboard View Model)
interface StudentCourse {
  _id: string;
  title: string;
  progress: number;
  thumbnail?: string;
  instructor: {
    fullName: string;
  };
  course?: any;
}

// Interface for payment history
interface PaymentHistory {
  _id: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed' | string;
  createdAt: string;
  courseTitle?: string;
  paymentMethod: string;
}

// Interface for Upcoming Sessions 
interface UpcomingSession {
  _id: string;
  courseId: string;
  lessonId?: string;
  courseTitle: string;
  lessonTitle: string;
  instructorName: string;
  scheduleInfo: Schedule & {
    date: string;
  };
  canJoin: boolean;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Stats State
  const [stats, setStats] = useState<LearningStats>({
    totalEnrolledCourses: 0,
    completedCourses: 0,
    totalLearningHours: 0,
    upcomingSessions: 0,
    averageRating: 0,
    completionRate: 0
  });

  // Data States
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'payments'>('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [coursesData, scheduleData, paymentsData] = await Promise.all([
        getStudentCourses(1, 4).catch(err => {
          console.error('Error loading courses:', err);
          return { success: false, courses: [] };
        }),
        studentScheduleService.getLearningSchedule().catch(err => {
          console.error('Error loading schedule:', err);
          return { success: false, schedule: { upcoming: [] } };
        }),
        paymentService.getPaymentHistory().catch(err => {
          console.error('Error loading payments:', err);
          return { payments: [] };
        })
      ]);

      // 1. Process Courses & Stats
      if (coursesData?.success && Array.isArray(coursesData.courses)) {
        // FIX: Explicitly type studentCourses as any[] to satisfy TypeScript
        const studentCourses: any[] = coursesData.courses;
        
        const totalEnrolled = studentCourses.length;
        
        const completedCourses = studentCourses.filter((course: any) => 
          course.progress?.overallProgress === 100
        ).length;
        
        // Now .reduce will work because TypeScript knows it is an array
        const totalHours = studentCourses.reduce((sum: number, course: any) => {
          return sum + (course.course?.totalLessons || 0);
        }, 0);
        
        const completionRate = totalEnrolled > 0 
          ? Math.round((completedCourses / totalEnrolled) * 100) 
          : 0;

        const upcomingSessionsCount = scheduleData?.success && scheduleData?.schedule?.upcoming 
          ? scheduleData.schedule.upcoming.length 
          : 0;

        setStats({
          totalEnrolledCourses: totalEnrolled,
          completedCourses: completedCourses,
          totalLearningHours: totalHours,
          upcomingSessions: upcomingSessionsCount,
          averageRating: 4.5,
          completionRate: completionRate
        });

        const mappedCourses: StudentCourse[] = studentCourses.map((courseData: any) => ({
          _id: courseData.course?._id || courseData._id || Math.random().toString(),
          title: courseData.course?.title || 'Untitled Course',
          progress: courseData.progress?.overallProgress || 0,
          thumbnail: courseData.course?.thumbnail,
          instructor: {
            fullName: courseData.course?.instructor?.fullName || 'Instructor'
          },
          course: courseData.course
        }));
        
        setCourses(mappedCourses);
      } else {
        setCourses([]);
      }

      // 2. Process Schedule
      if (scheduleData?.success && Array.isArray(scheduleData?.schedule?.upcoming)) {
        const mappedSessions: UpcomingSession[] = scheduleData.schedule.upcoming
          .slice(0, 3)
          .map((item: any) => ({
            _id: item._id || Math.random().toString(),
            courseId: item.courseId,
            lessonId: item.lessonId || item.lesson?._id,
            courseTitle: item.courseTitle,
            lessonTitle: item.lessonTitle,
            instructorName: item.instructorName,
            scheduleInfo: item.scheduleInfo,
            canJoin: item.canJoin
          }));
        setUpcomingSessions(mappedSessions);
      } else {
        setUpcomingSessions([]);
      }

      // 3. Process Payments
      if (paymentsData?.payments && Array.isArray(paymentsData.payments)) {
        setPaymentHistory(paymentsData.payments.slice(0, 5));
      } else {
        setPaymentHistory([]);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setCourses([]);
      setUpcomingSessions([]);
      setPaymentHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Format Helpers
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '--:--';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-20">
            <div className="relative inline-block mb-6">
              <div className="w-16 h-16 border-4 border-emerald-200 rounded-full animate-spin"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Your Dashboard</h3>
            <p className="text-gray-600">Preparing your learning journey...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-emerald-700 bg-clip-text text-transparent mb-2">
                Welcome back, {user?.fullName || 'Learner'}! 👋
              </h1>
              <p className="text-gray-600 text-lg">
                Here's your learning progress and upcoming sessions
              </p>
            </div>
            {/* Tab Buttons */}
            <div className="flex items-center gap-3">
              <button 
                className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                  activeTab === 'overview' 
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg' 
                    : 'bg-white/80 text-gray-700 hover:bg-white'
                }`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button 
                className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                  activeTab === 'payments' 
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg' 
                    : 'bg-white/80 text-gray-700 hover:bg-white'
                }`}
                onClick={() => setActiveTab('payments')}
              >
                Payment History
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Stat Card: Enrolled */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Enrolled Courses</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalEnrolledCourses}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <FiBook className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Stat Card: Completed */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Completed</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.completedCourses}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center">
                  <FiCheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Stat Card: Hours */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Learning Hours</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalLearningHours}h</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center">
                  <FiClock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Stat Card: Sessions */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Upcoming Sessions</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.upcomingSessions}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <FiCalendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: My Courses & Schedule */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* My Courses */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">My Courses</h2>
                  <Link to="/dashboard/courses" className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">
                    View All <FiArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <div key={course._id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-emerald-50/50 rounded-2xl border border-gray-200/60 hover:border-emerald-200 transition-all duration-300">
                        <img 
                          src={course.thumbnail || '/default-course.jpg'} 
                          alt={course.title}
                          className="w-16 h-16 object-cover rounded-xl"
                          onError={(e) => { 
                            (e.target as HTMLImageElement).src = '/default-course.jpg'; 
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{course.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            by {course.instructor?.fullName || 'Instructor'}
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(course.progress, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                              {Math.min(course.progress, 100)}% Complete
                            </span>
                          </div>
                        </div>
                        <Link 
                          to={`/dashboard/courses/${course._id}`} 
                          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
                        >
                          Continue
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <HiOutlineAcademicCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Courses Yet</h3>
                      <Link to="/courses" className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-semibold inline-flex items-center gap-2">
                        <FiSearch className="w-4 h-4" /> Explore Courses
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Sessions */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Upcoming Sessions</h2>
                  <Link to="/dashboard/schedule" className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">
                    Full Schedule <FiArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {upcomingSessions.length > 0 ? (
                    upcomingSessions.map((session) => (
                      <div key={session._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50/50 rounded-2xl border border-blue-200/60">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {session.scheduleInfo?.startTime ? formatTime(session.scheduleInfo.startTime) : '--:--'}
                            </div>
                            <div className="text-sm text-blue-500">
                              {session.scheduleInfo?.date ? formatDate(session.scheduleInfo.date) : 'TBD'}
                            </div>
                          </div>
                          <div className="w-px h-12 bg-blue-200"></div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{session.lessonTitle || 'Session'}</h4>
                            <p className="text-sm text-gray-600">{session.courseTitle || 'Course'}</p>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <FiUser className="w-3 h-3" />
                              {session.instructorName || 'Instructor'}
                            </div>
                          </div>
                        </div>
                        {session.canJoin && session.lessonId && (
                          <Link 
                            to={`/student/lessons/${session.lessonId}/live`} 
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-semibold flex items-center gap-2"
                          >
                            <FiPlay className="w-4 h-4" /> Join
                          </Link>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No upcoming sessions scheduled</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar: Progress & Actions */}
            <div className="space-y-8">
              {/* Learning Progress */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center">
                    <FiTrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Learning Progress</h2>
                </div>
                
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <div className="w-32 h-32 rounded-full border-8 border-gray-200 relative mx-auto">
                      <div 
                        className="absolute top-0 left-0 w-full h-full rounded-full border-8 border-transparent"
                        style={{
                          background: `conic-gradient(#10b981 0% ${stats.completionRate}%, #e5e7eb ${stats.completionRate}% 100%)`,
                          mask: 'radial-gradient(white 55%, transparent 56%)',
                          WebkitMask: 'radial-gradient(white 55%, transparent 56%)'
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-900">{stats.completionRate}%</span>
                      </div>
                    </div>
                    <p className="text-gray-600 font-medium mt-2">Overall Completion</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Rating</span>
                    <div className="flex items-center gap-1">
                      <FiStar className="w-4 h-4 text-yellow-400" />
                      <span className="font-semibold text-gray-900">{stats.averageRating}/5</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Learning Hours</span>
                    <span className="font-semibold text-gray-900">{stats.totalLearningHours}h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Courses Completed</span>
                    <span className="font-semibold text-gray-900">{stats.completedCourses}/{stats.totalEnrolledCourses}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <HiOutlineSparkles className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
                </div>
                
                <div className="space-y-3">
                  <Link to="/courses" className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-purple-50/50 rounded-2xl border border-gray-200/60 hover:border-purple-200 transition-all duration-300 group">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FiSearch className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900">Explore Courses</span>
                  </Link>
                  
                  <Link to="/dashboard/schedule" className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-2xl border border-gray-200/60 hover:border-blue-200 transition-all duration-300 group">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FiCalendar className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900">My Schedule</span>
                  </Link>
                  
                  <Link to="/dashboard/profile" className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-emerald-50/50 rounded-2xl border border-gray-200/60 hover:border-emerald-200 transition-all duration-300 group">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FiSettings className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900">Profile Settings</span>
                  </Link>
                  
                  <button onClick={() => setActiveTab('payments')} className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-orange-50/50 rounded-2xl border border-gray-200/60 hover:border-orange-200 transition-all duration-300 group w-full text-left">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FiDollarSign className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900">Payment History</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Payment History Tab */
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment History</h2>
                <p className="text-gray-600">Your recent transactions and payment details</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FiBarChart2 className="w-4 h-4" /> Last 5 transactions
              </div>
            </div>
            
            {paymentHistory.length > 0 ? (
              <div className="space-y-4">
                {paymentHistory.map((payment) => (
                  <div key={payment._id} className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-emerald-50/50 rounded-2xl border border-gray-200/60 hover:border-emerald-200 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center">
                        <FiDollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{payment.courseTitle || 'Course Payment'}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>{payment.paymentMethod === 'stripe' ? 'Credit Card' : payment.paymentMethod}</span>
                          <span>•</span>
                          <span>{formatDate(payment.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 mb-1">
                        {formatCurrency(payment.amount)}
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        payment.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {payment.status === 'completed' ? 'Completed' :
                         payment.status === 'pending' ? 'Processing' : 'Failed'}
                      </span>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Total Transactions: <strong>{paymentHistory.length}</strong>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    Total Spent: {formatCurrency(paymentHistory.reduce((total, payment) => total + payment.amount, 0))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FiDollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Transactions Yet</h3>
                <Link to="/courses" className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-semibold inline-flex items-center gap-2">
                  <FiSearch className="w-4 h-4" /> Explore Courses
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;