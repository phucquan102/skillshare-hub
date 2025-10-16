import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService } from '../../../services/api/courseService';
import LessonForm from '../../../components/instructor/course/LessonForm/LessonForm';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiVideo, 
  FiClock, 
  FiCalendar, 
  FiUsers,
  FiArrowLeft,
  FiPlay,
  FiSquare,
  FiCheckCircle,
  FiFileText,
  FiRadio,
  FiAward,
  FiDollarSign,
  FiBook,
  FiBarChart2
} from 'react-icons/fi';
import { HiOutlineStatusOnline, HiOutlineAcademicCap } from 'react-icons/hi';

const ManageLessonsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);

  useEffect(() => {
    if (courseId) {
      loadCourseAndLessons();
    }
  }, [courseId]);

  const loadCourseAndLessons = async () => {
    try {
      setLoading(true);
      const [courseResponse, lessonsResponse] = await Promise.all([
        courseService.getCourseById(courseId!),
        courseService.getLessonsByCourse(courseId!)
      ]);
      
      setCourse(courseResponse.course);
      setLessons(lessonsResponse.lessons || []);
    } catch (err: any) {
      setError('Không thể tải thông tin khóa học và bài học');
      console.error('Error loading course and lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🎯 MỚI: Navigate đến trang Start Lesson (có nhúng Jitsi)
  const handleStartMeeting = async (lessonId: string) => {
    try {
      await courseService.startLessonMeeting(lessonId);
      // Chuyển đến trang có nhúng Jitsi
      navigate(`/instructor/course/${courseId}/lesson/${lessonId}/start`);
    } catch (err: any) {
      setError('Không thể bắt đầu buổi học');
      console.error('Error starting meeting:', err);
    }
  };

  const handleEndMeeting = async (lessonId: string) => {
    try {
      await courseService.endLessonMeeting(lessonId);
      loadCourseAndLessons();
    } catch (err: any) {
      setError('Không thể kết thúc buổi học');
      console.error('Error ending meeting:', err);
    }
  };

  const handleCreateLesson = async (lessonData: any) => {
    try {
      await courseService.createLesson(courseId!, lessonData);
      setShowLessonForm(false);
      loadCourseAndLessons();
    } catch (err: any) {
      setError('Không thể tạo bài học');
      console.error('Error creating lesson:', err);
    }
  };

  const handleUpdateLesson = async (lessonData: any) => {
    try {
      await courseService.updateLesson(editingLesson._id, lessonData);
      setEditingLesson(null);
      loadCourseAndLessons();
    } catch (err: any) {
      setError('Không thể cập nhật bài học');
      console.error('Error updating lesson:', err);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài học này?')) {
      try {
        await courseService.deleteLesson(lessonId);
        loadCourseAndLessons();
      } catch (err: any) {
        setError('Không thể xóa bài học');
        console.error('Error deleting lesson:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="w-16 h-16 border-4 border-emerald-200 rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Đang tải thông tin khóa học...</h3>
          <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiRadio className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBook className="w-8 h-8 text-yellow-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy khóa học</h3>
          <p className="text-gray-600 mb-6">Khóa học bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <button 
            onClick={() => navigate('/instructor/courses')}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
          >
            Quay lại danh sách khóa học
          </button>
        </div>
      </div>
    );
  }

  if (showLessonForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <LessonForm
            course={course}
            onSave={handleCreateLesson}
            onCancel={() => setShowLessonForm(false)}
          />
        </div>
      </div>
    );
  }

  if (editingLesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <LessonForm
            course={course}
            lesson={editingLesson}
            onSave={handleUpdateLesson}
            onCancel={() => setEditingLesson(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:text-emerald-700 font-semibold transition-colors duration-200 hover:bg-emerald-50 rounded-2xl"
              >
                <FiArrowLeft className="w-5 h-5" />
                Quay lại
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center">
                  <HiOutlineAcademicCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-emerald-700 bg-clip-text text-transparent">
                    Quản lý Bài học
                  </h1>
                  <p className="text-gray-600 mt-1">{course.title}</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowLessonForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-3"
            >
              <FiPlus className="w-5 h-5" />
              Tạo bài học mới
            </button>
          </div>
        </div>

        {/* Course Info Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
                <FiBook className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Mô tả</p>
                <p className="font-semibold text-gray-900 truncate">{course.description || 'Chưa có mô tả'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100">
              <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center">
                <FiAward className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Loại khóa học</p>
                <p className="font-semibold text-gray-900">{course.courseType || 'Chưa xác định'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100">
              <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center">
                <FiDollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Hình thức thanh toán</p>
                <p className="font-semibold text-gray-900">{course.pricingType || 'Chưa xác định'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100">
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center">
                <FiBarChart2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tổng số bài học</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  {lessons.length} bài
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lessons Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-emerald-700 bg-clip-text text-transparent">
                Danh sách Bài học
              </h2>
              <p className="text-gray-600 mt-1">{lessons.length} bài học được tìm thấy</p>
            </div>
            <button 
              onClick={() => setShowLessonForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-3"
            >
              <FiPlus className="w-5 h-5" />
              Thêm bài học
            </button>
          </div>

          {lessons.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-r from-emerald-100 to-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <FiBook className="w-12 h-12 text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có bài học nào</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Hãy tạo bài học đầu tiên để bắt đầu khóa học của bạn và cung cấp nội dung giá trị cho học viên!
              </p>
              <button 
                onClick={() => setShowLessonForm(true)}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-3 mx-auto"
              >
                <FiPlus className="w-5 h-5" />
                Tạo bài học đầu tiên
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {lessons.map((lesson, index) => (
                <div 
                  key={lesson._id} 
                  className={`bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                    lesson.isMeetingActive 
                      ? 'border-red-200 ring-2 ring-red-100' 
                      : 'border-gray-100 hover:border-emerald-200'
                  }`}
                >
                  {lesson.isMeetingActive && (
                    <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white py-2 px-4 rounded-t-2xl flex items-center gap-2">
                      <FiRadio className="w-4 h-4 animate-pulse" />
                      <span className="font-semibold text-sm">ĐANG PHÁT TRỰC TIẾP</span>
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center text-white font-bold text-sm">
                          #{index + 1}
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg leading-tight">
                          {lesson.title}
                        </h3>
                      </div>
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        lesson.status === 'published' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {lesson.status === 'published' ? (
                          <><FiCheckCircle className="w-3 h-3" /> Đã xuất bản</>
                        ) : (
                          <><FiFileText className="w-3 h-3" /> Bản nháp</>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FiVideo className="w-4 h-4 text-blue-500" />
                        </div>
                        <span>{lesson.lessonType === 'live_online' ? 'Trực tuyến trực tiếp' : 'Video bài giảng'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FiClock className="w-4 h-4 text-purple-500" />
                        </div>
                        <span>{lesson.duration || 0} phút</span>
                      </div>
                      {lesson.actualStartTime && (
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <FiCalendar className="w-4 h-4 text-orange-500" />
                          </div>
                          <span>{new Date(lesson.actualStartTime).toLocaleString('vi-VN')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setEditingLesson(lesson)}
                          className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200"
                          title="Chỉnh sửa bài học"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        
                        {lesson.lessonType === 'live_online' && (
                          <>
                            {lesson.isMeetingActive ? (
                              <>
                                <button 
                                  onClick={() => navigate(`/instructor/course/${courseId}/lesson/${lesson._id}/start`)}
                                  className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl transition-all duration-200"
                                  title="Tham gia lớp học"
                                >
                                  <FiUsers className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleEndMeeting(lesson._id)}
                                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
                                  title="Kết thúc buổi học"
                                >
                                  <FiSquare className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button 
                                onClick={() => handleStartMeeting(lesson._id)}
                                className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all duration-200"
                                title="Bắt đầu buổi học"
                              >
                                <FiPlay className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => handleDeleteLesson(lesson._id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
                        title="Xóa bài học"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageLessonsPage;