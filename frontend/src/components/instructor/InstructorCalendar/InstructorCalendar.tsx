import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { courseService } from '../../../services/api/courseService';
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
  FiPlus,
  FiFilter
} from 'react-icons/fi';
import { HiOutlineAcademicCap, HiOutlineCalendar } from 'react-icons/hi';
import styles from './InstructorCalendar.module.scss';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  extendedProps: {
    type: 'lesson' | 'schedule' | 'dated_schedule';
    courseId: string;
    courseTitle: string;
    lessonId?: string;
    lessonTitle?: string;
    status: string;
    isMeetingActive?: boolean;
    participants?: number;
    maxParticipants?: number;
    resource?: any;
  };
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

const InstructorCalendar: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedView, setSelectedView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('timeGridWeek');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [courses, setCourses] = useState<any[]>([]);
const navigate = useNavigate();
  const fetchCalendarData = useCallback(async () => {
    if (!user?._id) return;

    try {
      setLoading(true);
      setError('');

      const coursesResponse = await courseService.getMyCourses({ 
        page: 1, 
        limit: 100,
        status: 'all'
      });
      
      const coursesData = coursesResponse.courses || [];
      setCourses(coursesData);
      
      const allEvents: CalendarEvent[] = [];

      for (const course of coursesData) {
        if (selectedCourse !== 'all' && course._id !== selectedCourse) continue;

        try {
          const lessonsResponse = await courseService.getLessonsByCourse(course._id, {
            page: 1,
            limit: 100
          });
          
          const lessons = lessonsResponse.lessons || [];

          lessons.forEach((lesson: any) => {
            if (lesson.scheduleInfo) {
              const eventDate = lesson.scheduleInfo.date 
                ? new Date(lesson.scheduleInfo.date)
                : calculateNextDate(lesson.scheduleInfo.dayOfWeek || 0);
              
              const startTime = lesson.scheduleInfo.startTime || '00:00';
              const endTime = lesson.scheduleInfo.endTime || '01:00';
              
              const start = new Date(`${eventDate.toDateString()} ${startTime}`);
              const end = new Date(`${eventDate.toDateString()} ${endTime}`);
              
              let backgroundColor = '#10b981';
              let borderColor = '#10b981';
              
              if (lesson.isMeetingActive) {
                backgroundColor = '#ef4444';
                borderColor = '#ef4444';
              } else if (lesson.status === 'completed') {
                backgroundColor = '#6b7280';
                borderColor = '#6b7280';
              }
              
              allEvents.push({
                id: lesson._id,
                title: `${course.title} - ${lesson.title}`,
                start,
                end,
                backgroundColor,
                borderColor,
                textColor: '#ffffff',
                extendedProps: {
                  type: 'lesson',
                  courseId: course._id,
                  courseTitle: course.title,
                  lessonId: lesson._id,
                  lessonTitle: lesson.title,
                  status: lesson.status || 'draft',
                  isMeetingActive: lesson.isMeetingActive,
                  participants: lesson.currentParticipants,
                  maxParticipants: lesson.maxParticipants
                }
              });
            }
          });

          if (course.schedules && course.schedules.length > 0) {
            course.schedules.forEach((schedule: any) => {
              if (!schedule.hasLesson && schedule.isActive) {
                const eventDate = calculateNextDate(schedule.dayOfWeek);
                const start = new Date(`${eventDate.toDateString()} ${schedule.startTime}`);
                const end = new Date(`${eventDate.toDateString()} ${schedule.endTime}`);
                
                allEvents.push({
                  id: `schedule-${schedule._id || Math.random()}`,
                  title: `${course.title} - Available Slot`,
                  start,
                  end,
                  backgroundColor: '#f59e0b',
                  borderColor: '#f59e0b',
                  textColor: '#1f2937',
                  extendedProps: {
                    type: 'schedule',
                    courseId: course._id,
                    courseTitle: course.title,
                    status: 'available',
                    resource: schedule
                  }
                });
              }
            });
          }

        } catch (courseError) {
          console.error(`Error processing course ${course.title}:`, courseError);
        }
      }

      setEvents(allEvents);
    } catch (err: any) {
      console.error('Error fetching calendar data:', err);
      setError(err.message || 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }, [user, selectedCourse]);

  const calculateNextDate = (dayOfWeek: number): Date => {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = (dayOfWeek - currentDay + 7) % 7;
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + diff);
    return nextDate;
  };

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);
  
const handleEventClick = (clickInfo: any) => {
  const event = clickInfo.event;
  const extendedProps = event.extendedProps;
  
  if (extendedProps.type === 'lesson') {
    // Điều hướng đến trang chi tiết lesson
    navigate(`/instructor/courses/${extendedProps.courseId}/lessons/${extendedProps.lessonId}`);
  } else if (extendedProps.type === 'schedule') {
    const scheduleId = extendedProps.resource?._id;
    if (scheduleId) {
      navigate(`/instructor/courses/${extendedProps.courseId}/create-lesson?scheduleId=${scheduleId}`);
    }
  }
};

  const handleDateSelect = (selectInfo: any) => {
    const start = selectInfo.start;
    const end = selectInfo.end;
    
    const confirmCreate = window.confirm(
      `Create new teaching schedule?\nFrom: ${start.toLocaleString()}\nTo: ${end.toLocaleString()}`
    );
    
    if (confirmCreate) {
      const queryParams = new URLSearchParams({
        startTime: start.toISOString(),
        endTime: end.toISOString()
      });
      window.open(`/instructor/courses/create?${queryParams.toString()}`, '_blank');
    }
  };

  const renderEventContent = (eventInfo: any) => {
    const { event } = eventInfo;
    const extendedProps = event.extendedProps;
    
    return (
      <div className={styles.eventContent}>
        <div className={styles.eventHeader}>
          {extendedProps.type === 'schedule' ? (
            <FiCalendar className={styles.eventIcon} />
          ) : extendedProps.isMeetingActive ? (
            <div className={styles.liveIndicator}></div>
          ) : extendedProps.status === 'completed' ? (
            <FiCheckCircle className={styles.eventIcon} />
          ) : (
            <FiVideo className={styles.eventIcon} />
          )}
          <span className={styles.eventTitle}>{event.title}</span>
        </div>
        {extendedProps.isMeetingActive && (
          <div className={styles.liveBadge}>
            <FiUsers className={styles.badgeIcon} />
            Live ({extendedProps.participants}/{extendedProps.maxParticipants})
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingAnimation}>
          <div className={styles.spinner}></div>
          <HiOutlineCalendar className={styles.calendarIcon} />
        </div>
        <h3>Loading Teaching Schedule</h3>
        <p>Fetching your courses and lessons...</p>
      </div>
    );
  }

  return (
    <div className={styles.calendarContainer}>
      {/* Header Section */}
      <div className={styles.calendarHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerInfo}>
            <div className={styles.headerIcon}>
              <HiOutlineCalendar className={styles.mainIcon} />
            </div>
            <div>
              <h1>Teaching Calendar</h1>
              <p>Manage your courses, lessons, and teaching schedule</p>
            </div>
          </div>
          
          <div className={styles.headerActions}>
            <button 
              className={styles.primaryButton}
              onClick={() => window.open('/instructor/courses/create', '_blank')}
            >
              <FiPlus className={styles.buttonIcon} />
              New Course
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.filterSection}>
            <div className={styles.filterGroup}>
              <FiFilter className={styles.filterIcon} />
              <select 
                value={selectedCourse} 
                onChange={(e) => setSelectedCourse(e.target.value)}
                className={styles.courseFilter}
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.viewControls}>
            <button 
              className={`${styles.viewButton} ${selectedView === 'dayGridMonth' ? styles.active : ''}`}
              onClick={() => setSelectedView('dayGridMonth')}
            >
              Month
            </button>
            <button 
              className={`${styles.viewButton} ${selectedView === 'timeGridWeek' ? styles.active : ''}`}
              onClick={() => setSelectedView('timeGridWeek')}
            >
              Week
            </button>
            <button 
              className={`${styles.viewButton} ${selectedView === 'timeGridDay' ? styles.active : ''}`}
              onClick={() => setSelectedView('timeGridDay')}
            >
              Day
            </button>
            <button 
              className={`${styles.viewButton} ${selectedView === 'listWeek' ? styles.active : ''}`}
              onClick={() => setSelectedView('listWeek')}
            >
              List
            </button>
          </div>

          <button 
            className={styles.refreshButton}
            onClick={fetchCalendarData}
            disabled={loading}
          >
            <FiRefreshCw className={`${styles.refreshIcon} ${loading ? styles.spinning : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className={styles.errorAlert}>
          <div className={styles.errorContent}>
            <div className={styles.errorIcon}>⚠️</div>
            <div className={styles.errorText}>
              <strong>Unable to load calendar</strong>
              <p>{error}</p>
            </div>
            <button onClick={fetchCalendarData} className={styles.retryButton}>
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={`${styles.colorBox} ${styles.lesson}`}></span>
          <FiVideo className={styles.legendIcon} />
          <span>Scheduled Lessons</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.colorBox} ${styles.live}`}></span>
          <div className={styles.livePulse}></div>
          <span>Live Sessions</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.colorBox} ${styles.completed}`}></span>
          <FiCheckCircle className={styles.legendIcon} />
          <span>Completed</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.colorBox} ${styles.schedule}`}></span>
          <FiCalendar className={styles.legendIcon} />
          <span>Available Slots</span>
        </div>
      </div>

      {/* Calendar */}
      <div className={styles.calendarWrapper}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          initialView={selectedView}
          events={events}
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
        />
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <div className={styles.statIcon}>
            <FiBook className={styles.statSvg} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>
              {events.filter(e => e.extendedProps.type === 'lesson').length}
            </span>
            <span className={styles.statLabel}>Scheduled Lessons</span>
          </div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statIcon}>
            <div className={styles.liveIndicator}></div>
          </div>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>
              {events.filter(e => e.extendedProps.isMeetingActive).length}
            </span>
            <span className={styles.statLabel}>Live Now</span>
          </div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statIcon}>
            <FiCalendar className={styles.statSvg} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>
              {events.filter(e => e.extendedProps.type === 'schedule').length}
            </span>
            <span className={styles.statLabel}>Available Slots</span>
          </div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statIcon}>
            <FiCheckCircle className={styles.statSvg} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>
              {events.filter(e => e.extendedProps.status === 'completed').length}
            </span>
            <span className={styles.statLabel}>Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorCalendar;