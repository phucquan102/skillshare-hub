import React, { useState, useEffect } from 'react';
import { studentScheduleService } from '../../../services/api/studentScheduleService';
import { 
  FiCalendar, 
  FiClock, 
  FiCheckCircle, 
  FiPlayCircle, 
  FiBook,
  FiVideo,
  FiUser,
  FiArrowRight,
  FiAward
} from 'react-icons/fi';
import { HiOutlineAcademicCap, HiOutlineSparkles } from 'react-icons/hi';

interface ScheduleItem {
  _id: string;
  courseId: string;
  courseTitle: string;
  lessonTitle: string;
  lessonType: string;
  accessType: 'full_course' | 'single_lesson';
  status: 'upcoming' | 'completed';
  isCompleted: boolean;
  scheduleInfo: {
    date?: string;
    startTime?: string;
    endTime?: string;
    type: string;
  };
  instructorName: string;
  courseThumbnail?: string;
  canJoin: boolean;
  meetingUrl?: string;
}

const StudentSchedulePage: React.FC = () => {
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'upcoming' | 'completed'>('upcoming');

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await studentScheduleService.getLearningSchedule();
      setSchedule(response);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeRemaining = (dateString: string, startTime: string) => {
    const now = new Date();
    const lessonDate = new Date(`${dateString}T${startTime}`);
    const diffTime = lessonDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Ngày mai';
    if (diffDays > 1) return `${diffDays} ngày tới`;
    return 'Đã qua';
  };

  if (loading) {
    return (
      <div className="min-h-96 flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-200 rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-700">Đang tải lịch học</p>
            <p className="text-gray-500 text-sm">Sắp xếp lịch học của bạn...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCalendar className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Không thể tải lịch học</h3>
          <p className="text-gray-600 mb-6">Vui lòng thử lại sau hoặc liên hệ hỗ trợ nếu vấn đề tiếp diễn.</p>
          <button
            onClick={fetchSchedule}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const currentItems = view === 'upcoming' ? schedule.schedule.upcoming : schedule.schedule.completed;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-3xl p-8 text-white mb-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <HiOutlineAcademicCap className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Lịch Học Của Tôi</h1>
                <p className="text-emerald-100 opacity-90">Theo dõi và quản lý lịch học của bạn</p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{schedule.summary.total}</div>
                <div className="text-emerald-100 text-sm">Tổng số bài</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{schedule.summary.upcoming}</div>
                <div className="text-emerald-100 text-sm">Sắp diễn ra</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{schedule.summary.completed}</div>
                <div className="text-emerald-100 text-sm">Đã hoàn thành</div>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <div className="text-4xl font-bold">{new Date().getDate()}</div>
              <div className="text-emerald-100 text-sm">
                {new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-2 mb-8 border border-white/20">
        <div className="flex space-x-2">
          <button
            className={`flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 flex-1 text-center justify-center ${
              view === 'upcoming'
                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
            onClick={() => setView('upcoming')}
          >
            <FiClock className="w-5 h-5" />
            Sắp Diễn Ra ({schedule.summary.upcoming})
          </button>
          <button
            className={`flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 flex-1 text-center justify-center ${
              view === 'completed'
                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
            onClick={() => setView('completed')}
          >
            <FiCheckCircle className="w-5 h-5" />
            Đã Hoàn Thành ({schedule.summary.completed})
          </button>
        </div>
      </div>

      {/* Schedule List */}
      <div className="space-y-4">
        {currentItems.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-12 text-center border border-white/20">
            <div className="w-24 h-24 bg-gradient-to-r from-emerald-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              {view === 'upcoming' ? (
                <HiOutlineSparkles className="w-12 h-12 text-emerald-500" />
              ) : (
                <FiAward className="w-12 h-12 text-emerald-500" />
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {view === 'upcoming' ? 'Không có bài học nào sắp diễn ra!' : 'Chưa có bài học nào được hoàn thành.'}
            </h3>
            <p className="text-gray-600 text-lg mb-6">
              {view === 'upcoming' 
                ? 'Hãy khám phá thêm các khóa học để bổ sung vào lịch học của bạn!' 
                : 'Hoàn thành các bài học đầu tiên để xem chúng ở đây!'}
            </p>
            {view === 'upcoming' && (
              <button className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-3 mx-auto">
                <FiBook className="w-5 h-5" />
                Khám Phá Khóa Học Mới
              </button>
            )}
          </div>
        ) : (
          currentItems.map((item: ScheduleItem) => (
            <div 
              key={item._id} 
              className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 hover:border-emerald-200 group"
            >
              <div className="p-6">
                <div className="flex gap-6">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-100 to-green-100">
                      {item.courseThumbnail ? (
                        <img 
                          src={item.courseThumbnail} 
                          alt={item.courseTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FiBook className="w-8 h-8 text-emerald-500" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors duration-300 mb-2">
                          {item.lessonTitle}
                        </h3>
                        <p className="text-gray-600 font-medium mb-1">{item.courseTitle}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-2">
                            <FiUser className="w-4 h-4" />
                            <span>{item.instructorName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FiVideo className="w-4 h-4" />
                            <span>{item.lessonType === 'live_online' ? 'Trực tuyến' : 'Tự học'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status & Action */}
                      <div className="text-right flex-shrink-0">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-3 ${
                          item.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.status === 'completed' ? (
                            <>
                              <FiCheckCircle className="w-4 h-4" />
                              Đã hoàn thành
                            </>
                          ) : (
                            <>
                              <FiClock className="w-4 h-4" />
                              Sắp diễn ra
                            </>
                          )}
                        </div>

                        {item.canJoin && (
                          <button 
                            onClick={() => window.open(item.meetingUrl, '_blank')}
                            className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-3 rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-2 group/btn"
                          >
                            <FiPlayCircle className="w-5 h-5 group-hover/btn:scale-110 transition-transform duration-300" />
                            Tham gia ngay
                            <FiArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Schedule Info & Badges */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        {item.scheduleInfo.date && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <FiCalendar className="w-4 h-4 text-emerald-500" />
                            <span className="font-medium">{formatDate(item.scheduleInfo.date)}</span>
                            {item.scheduleInfo.startTime && (
                              <>
                                <span>•</span>
                                <FiClock className="w-4 h-4 text-emerald-500" />
                                <span className="font-medium">
                                  {item.scheduleInfo.startTime} - {item.scheduleInfo.endTime}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                          item.accessType === 'full_course' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.accessType === 'full_course' ? 'Full Course' : 'Single Lesson'}
                        </span>
                        {item.status === 'upcoming' && item.scheduleInfo.date && (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                            {getTimeRemaining(item.scheduleInfo.date, item.scheduleInfo.startTime || '00:00')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentSchedulePage;