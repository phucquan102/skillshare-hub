import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { studentScheduleService } from '../../../services/api/studentScheduleService';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  FiCalendar, 
  FiRefreshCw, 
  FiBook, 
  FiVideo, 
  FiClock,
  FiUsers,
  FiCheckCircle,
  FiFilter,
  FiPlay,
  FiAward,
  FiArrowRight,
  FiUser
} from 'react-icons/fi';
import { HiOutlineAcademicCap, HiOutlineCalendar, HiOutlineSparkles } from 'react-icons/hi';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  extendedProps: {
    type: 'lesson';
    courseId: string;
    courseTitle: string;
    lessonId: string;
    lessonTitle: string;
    lessonType: string;
    status: 'upcoming' | 'completed' | 'live' | 'missed';
    isCompleted: boolean;
    canJoin: boolean;
    meetingUrl?: string;
    instructorName: string;
    accessType: string;
    courseThumbnail?: string;
    duration?: number;
    lessonStatus?: string;
  };
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

const StudentSchedulePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedView, setSelectedView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('timeGridWeek');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [courses, setCourses] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any>(null);

  // ✅ FIX: Hàm tạo date đúng với timezone VN
  const createEventDate = (dateString: string, timeString: string): Date => {
    try {
      if (!dateString || !timeString) return new Date();
      
      // Tạo datetime string
      const datetimeString = `${dateString}T${timeString}:00`;
      let date = new Date(datetimeString);
      
      // ✅ FIX: Điều chỉnh timezone VN (UTC+7)
      // Vì server trả về time VN nhưng Date() hiểu là UTC
      // Nên cần thêm 7 giờ để có time VN đúng
      const vietnamOffset = 7 * 60 * 60 * 1000;
      date = new Date(date.getTime() + vietnamOffset);
      
      return date;
    } catch (error) {
      console.error('Error creating event date:', error);
      return new Date();
    }
  };

  const fetchCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔄 [Frontend] Fetching learning schedule...');
      const response = await studentScheduleService.getLearningSchedule();
      console.log('📅 [Frontend] API Response:', response);
      
      setSchedule(response);
      
      // ✅ FIX: Lấy tất cả items từ schedule.all thay vì chỉ upcoming + completed
      const allItems = response.schedule.all || [];
      console.log('📋 [Frontend] All items:', allItems);
      
      // Chuyển đổi dữ liệu thành events cho FullCalendar
      const allEvents: CalendarEvent[] = [];

      allItems.forEach((item: any) => {
        console.log('🔍 [Frontend] Processing item:', {
          id: item._id,
          title: item.lessonTitle,
          status: item.status,
          scheduleInfo: item.scheduleInfo
        });

        if (item.scheduleInfo?.date && item.scheduleInfo.startTime) {
          const startDate = item.scheduleInfo.date;
          const startTime = item.scheduleInfo.startTime;
          const endTime = item.scheduleInfo.endTime || '23:59';

          // ✅ FIX: Sử dụng hàm tạo date đúng
          const start = createEventDate(startDate, startTime);
          const end = createEventDate(startDate, endTime);

          console.log('📅 [Frontend] Created event dates:', {
            start: start.toISOString(),
            end: end.toISOString(),
            startLocal: start.toString()
          });

          // Xác định màu sắc và trạng thái
          let backgroundColor = '#10b981'; // Màu xanh: upcoming
          let borderColor = '#10b981';
          let status: 'upcoming' | 'completed' | 'live' | 'missed' = 'upcoming';

          if (item.status === 'completed' || item.isCompleted) {
            backgroundColor = '#6b7280'; // Xám: đã hoàn thành
            borderColor = '#6b7280';
            status = 'completed';
          } else if (item.status === 'live') {
            backgroundColor = '#ef4444'; // Đỏ: đang diễn ra
            borderColor = '#ef4444';
            status = 'live';
          } else if (item.status === 'missed') {
            backgroundColor = '#9ca3af'; // Xám nhạt: đã lỡ
            borderColor = '#9ca3af';
            status = 'missed';
          }

          allEvents.push({
            id: item._id,
            title: item.lessonTitle,
            start,
            end,
            backgroundColor,
            borderColor,
            textColor: '#ffffff',
            extendedProps: {
              type: 'lesson',
              courseId: item.courseId,
              courseTitle: item.courseTitle,
              lessonId: item._id,
              lessonTitle: item.lessonTitle,
              lessonType: item.lessonType,
              status,
              isCompleted: item.isCompleted,
              canJoin: item.canJoin,
              meetingUrl: item.meetingUrl,
              instructorName: item.instructorName,
              accessType: item.accessType,
              courseThumbnail: item.courseThumbnail,
              duration: item.duration,
              lessonStatus: item.lessonStatus
            }
          });
        } else {
          console.log('❌ [Frontend] Item missing schedule info:', item);
        }
      });

      console.log('🎯 [Frontend] Final events:', allEvents);
      setEvents(allEvents);

      // Lấy danh sách khóa học duy nhất để filter
      const uniqueCourses: any[] = [];
      allItems.forEach((item: any) => {
        if (!uniqueCourses.find(c => c._id === item.courseId)) {
          uniqueCourses.push({
            _id: item.courseId,
            title: item.courseTitle
          });
        }
      });
      setCourses(uniqueCourses);

    } catch (err: any) {
      console.error('❌ [Frontend] Error fetching calendar data:', err);
      setError(err.message || 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event;
    const extendedProps = event.extendedProps;

    console.log('🎯 [Frontend] Event clicked:', extendedProps);

    // Nếu bài học có thể tham gia (live), điều hướng đến meeting
    if (extendedProps.canJoin && extendedProps.lessonType === 'live_online') {
      navigate(`/student/course/${extendedProps.courseId}/lesson/${extendedProps.lessonId}/meeting`);
    } else {
      // Điều hướng đến trang chi tiết bài học
      navigate(`/student/lessons/${extendedProps.lessonId}`);
    }
  };

  const handleDateSelect = (selectInfo: any) => {
    console.log('📅 [Frontend] Selected date: ', selectInfo.start, selectInfo.end);
  };

  const renderEventContent = (eventInfo: any) => {
    const { event } = eventInfo;
    const extendedProps = event.extendedProps;
    
    return (
      <div className="p-1 text-white" style={{ fontSize: '12px', lineHeight: '1.2' }}>
        <div className="flex items-center gap-1 mb-1">
          {extendedProps.lessonType === 'live_online' ? (
            <FiVideo className="w-3 h-3" />
          ) : (
            <FiBook className="w-3 h-3" />
          )}
          <strong className="truncate">{event.title}</strong>
        </div>
        
        {extendedProps.status === 'live' && (
          <div className="flex items-center gap-1 bg-red-600 px-1 py-0.5 rounded text-xs">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
        )}
        
        <div className="text-xs opacity-90 truncate">
          {extendedProps.instructorName}
        </div>
        
        {extendedProps.lessonType === 'live_online' && extendedProps.status === 'upcoming' && (
          <div className="flex items-center gap-1 text-xs">
            <FiClock className="w-2.5 h-2.5" />
            <span>{event.start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>
    );
  };

  const handleJoinNow = (event: CalendarEvent) => {
    if (event.extendedProps.canJoin && event.extendedProps.lessonType === 'live_online') {
      navigate(`/student/course/${event.extendedProps.courseId}/lesson/${event.extendedProps.lessonId}/meeting`);
    }
  };

  // ✅ FIX: Thêm debug info trong render
  console.log('🎯 [Frontend] Current state:', {
    loading,
    error,
    schedule: schedule?.summary,
    eventsCount: events.length,
    events: events.map(e => ({
      title: e.title,
      start: e.start.toISOString(),
      status: e.extendedProps.status
    }))
  });

  if (loading) {
    return (
      <div className="min-h-96 flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-200 rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-700">Loading schedule</p>
            <p className="text-gray-500 text-sm">Arranging your learning schedule...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCalendar className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to load schedule</h3>
          <p className="text-gray-600 mb-6">{error || 'Please try again later'}</p>
          <button
            onClick={fetchCalendarData}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredEvents = selectedCourse === 'all' 
    ? events 
    : events.filter(event => event.extendedProps.courseId === selectedCourse);

  console.log('🔍 [Frontend] Filtered events:', filteredEvents.length);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-3xl p-8 text-white mb-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <HiOutlineAcademicCap className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">My Learning Schedule</h1>
                <p className="text-emerald-100 opacity-90">Track and manage your learning schedule</p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{schedule.summary.total}</div>
                <div className="text-emerald-100 text-sm">Total Lessons</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{schedule.summary.upcoming}</div>
                <div className="text-emerald-100 text-sm">Upcoming</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{schedule.summary.completed}</div>
                <div className="text-emerald-100 text-sm">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {events.filter(e => e.extendedProps.status === 'live').length}
                </div>
                <div className="text-emerald-100 text-sm">Live</div>
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

      {/* Controls */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-4 mb-6 border border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-200">
              <FiFilter className="text-gray-500 w-4 h-4" />
              <select 
                value={selectedCourse} 
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-gray-700 font-medium"
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-gray-600">Upcoming</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">Live</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-gray-600">Completed</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                selectedView === 'dayGridMonth' 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
              onClick={() => setSelectedView('dayGridMonth')}
            >
              <FiCalendar className="w-4 h-4" />
              Month
            </button>
            <button 
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                selectedView === 'timeGridWeek' 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
              onClick={() => setSelectedView('timeGridWeek')}
            >
              <FiCalendar className="w-4 h-4" />
              Week
            </button>
            <button 
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                selectedView === 'timeGridDay' 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
              onClick={() => setSelectedView('timeGridDay')}
            >
              <FiCalendar className="w-4 h-4" />
              Day
            </button>
            <button 
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                selectedView === 'listWeek' 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
              onClick={() => setSelectedView('listWeek')}
            >
              <FiCalendar className="w-4 h-4" />
              List
            </button>

            <button 
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-300 shadow-sm border border-gray-200 font-medium"
              onClick={fetchCalendarData}
              disabled={loading}
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-white/20 mb-6">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          initialView={selectedView}
          events={filteredEvents}
          eventClick={handleEventClick}
          selectable={true}
          select={handleDateSelect}
          eventContent={renderEventContent}
          height="auto"
          locale="en"
          buttonText={{
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day',
            list: 'List'
          }}
          allDaySlot={false}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          weekends={true}
          nowIndicator={true}
          editable={false}
          droppable={false}
          dayMaxEvents={3}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          // ✅ FIX: Thêm event display để debug
          eventDisplay="block"
          eventDidMount={(info) => {
            console.log('📅 [FullCalendar] Event mounted:', info.event);
          }}
        />
      </div>

      {/* Upcoming Events Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Now Section */}
        <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <FiVideo className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Live Now</h3>
              <p className="text-red-100 opacity-90 text-sm">Join Now</p>
            </div>
          </div>
          
          {events.filter(e => e.extendedProps.status === 'live').length === 0 ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiClock className="w-8 h-8" />
              </div>
              <p className="text-red-100">No live classes currently</p>
            </div>
          ) : (
            events.filter(e => e.extendedProps.status === 'live').map(event => (
              <div key={event.id} className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold truncate">{event.extendedProps.lessonTitle}</h4>
                  <div className="flex items-center gap-1 bg-white/30 px-2 py-1 rounded-full text-xs">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span>LIVE</span>
                  </div>
                </div>
                <p className="text-red-100 text-sm mb-3 truncate">{event.extendedProps.courseTitle}</p>
                <button
                  onClick={() => handleJoinNow(event)}
                  className="w-full bg-white text-red-600 py-2 rounded-xl font-semibold hover:bg-red-50 transition-colors duration-300 flex items-center justify-center gap-2"
                >
                  <FiPlay className="w-4 h-4" />
                  Join Now
                </button>
              </div>
            ))
          )}
        </div>

        {/* Today's Schedule */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <FiClock className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Today</h3>
              <p className="text-gray-600 text-sm">Today's Schedule</p>
            </div>
          </div>

          {events.filter(e => {
            const today = new Date();
            return e.start.toDateString() === today.toDateString();
          }).length === 0 ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <HiOutlineSparkles className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No classes scheduled for today</p>
            </div>
          ) : (
            events.filter(e => {
              const today = new Date();
              return e.start.toDateString() === today.toDateString();
            }).map(event => (
              <div key={event.id} className="border-l-4 border-emerald-500 bg-white rounded-xl p-4 mb-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 truncate">{event.extendedProps.lessonTitle}</h4>
                  <span className="text-sm text-gray-500">
                    {event.start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2 truncate">{event.extendedProps.courseTitle}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FiUser className="w-3 h-3" />
                  <span>{event.extendedProps.instructorName}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    event.extendedProps.status === 'completed' ? 'bg-green-100 text-green-800' :
                    event.extendedProps.status === 'live' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {event.extendedProps.status === 'completed' ? 'Đã hoàn thành' :
                     event.extendedProps.status === 'live' ? 'Đang diễn ra' : 'Sắp diễn ra'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <FiAward className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Quick Actions</h3>
              <p className="text-blue-100 opacity-90 text-sm">Quick Access</p>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => navigate('/student/courses')}
              className="w-full bg-white/20 backdrop-blur-sm rounded-xl p-4 text-left hover:bg-white/30 transition-all duration-300 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FiBook className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">My Courses</p>
                  <p className="text-blue-100 text-sm">View all courses</p>
                </div>
              </div>
              <FiArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
            </button>

            <button 
              onClick={() => navigate('/student/progress')}
              className="w-full bg-white/20 backdrop-blur-sm rounded-xl p-4 text-left hover:bg-white/30 transition-all duration-300 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FiCheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">Learning Progress</p>
                  <p className="text-blue-100 text-sm">Track your progress</p>
                </div>
              </div>
              <FiArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
            </button>

            <button 
              onClick={() => navigate('/courses')}
              className="w-full bg-white/20 backdrop-blur-sm rounded-xl p-4 text-left hover:bg-white/30 transition-all duration-300 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <HiOutlineSparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">Discover Courses</p>
                  <p className="text-blue-100 text-sm">Find new courses</p>
                </div>
              </div>
              <FiArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSchedulePage;