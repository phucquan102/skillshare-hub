import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService } from '../../../services/api/courseService';
import { createMeeting } from '../../../services/api/jitsiService'; // 👈 Thêm dòng này
import { FiArrowLeft, FiUsers, FiClock, FiAlertCircle } from 'react-icons/fi';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const LessonLivePage: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [meetingData, setMeetingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const jitsiContainerRef = useRef<HTMLDivElement | null>(null);
  const jitsiApiRef = useRef<any>(null);

  // 🧭 1. Load dữ liệu khoá học + buổi học + user
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [courseResponse, lessonResponse] = await Promise.all([
          courseService.getCourseById(courseId!),
          courseService.getLessonById(lessonId!)
        ]);

        setCourse(courseResponse.course);
        setLesson(lessonResponse.lesson);

        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        } else {
          setError('Bạn chưa đăng nhập');
        }
      } catch (err: any) {
        setError('Không thể tải thông tin lớp học');
        console.error('Error loading lesson:', err);
      } finally {
        setLoading(false);
      }
    };

    if (courseId && lessonId) {
      loadData();
    }
  }, [courseId, lessonId]);

  // 🧠 2. Gọi API Backend tạo phòng Jitsi (JWT)
  useEffect(() => {
    const initMeeting = async () => {
      if (!lesson || !user) return;
      try {
        const meeting = await createMeeting({
          courseId,
          lessonId,
          subject: lesson.title,
          userInfo: {
            displayName: user.fullName || user.name,
            email: user.email
          },
          isModerator: user.role === 'instructor'
        });
        setMeetingData(meeting);
      } catch (err: any) {
        console.error('Error creating Jitsi meeting:', err);
        setError('Không thể tạo phòng học trực tuyến');
      }
    };

    initMeeting();
  }, [lesson, user, courseId, lessonId]);

  // 🧩 3. Mount Jitsi khi có meetingData
  useEffect(() => {
    if (!meetingData || !jitsiContainerRef.current) return;

    const domain = meetingData.domain;
    const roomName = meetingData.roomName;
    const options = {
      roomName,
      parentNode: jitsiContainerRef.current,
      jwt: meetingData.jwtToken,
      configOverwrite: meetingData.config,
      interfaceConfigOverwrite: meetingData.interfaceConfig,
      userInfo: {
        displayName: user?.fullName || user?.name || 'Học viên',
        email: user?.email || ''
      }
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);
    jitsiApiRef.current = api;

    api.addEventListener('participantJoined', (p: any) => {
      console.log('👤 Tham gia:', p.displayName);
    });

    api.addEventListener('participantLeft', (p: any) => {
      console.log('👋 Rời phòng:', p.displayName);
    });

    api.addEventListener('videoConferenceLeft', () => {
      navigate(`/course/${courseId}`);
    });

    return () => api.dispose();
  }, [meetingData, navigate, courseId, user]);

  // 🌀 Loading
  if (loading) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900">Loading class...</h3>
        </div>
      </div>
    );
  }

  /* Error / missing data */
  if (error || !lesson || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to join the class</h3>
          <p className="text-gray-600 mb-6">{error || 'Class not found'}</p>
          <button 
            onClick={() => navigate('/courses')}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            Back to courses
          </button>
        </div>
      </div>
    );
  }

  /* Main UI with Jitsi container */
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(`/course/${courseId}`)}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
              <span>Back to course</span>
            </button>
          </div>

          <div className="text-center">
            <h1 className="text-xl font-bold text-white">{lesson.title}</h1>
            <p className="text-gray-400 text-sm">{course.title}</p>
          </div>

          <div className="flex items-center gap-4 text-gray-300">
            <div className="flex items-center gap-2">
              <FiClock className="w-4 h-4" />
              <span>{lesson.duration} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <FiUsers className="w-4 h-4" />
              <span>Participants</span>
            </div>
          </div>
        </div>
      </div>

      {/* Jitsi Meeting Container */}
      <div ref={jitsiContainerRef} style={{ width: '100%', height: 'calc(100vh - 72px)' }} />
    </div>
  );
};

export default LessonLivePage;