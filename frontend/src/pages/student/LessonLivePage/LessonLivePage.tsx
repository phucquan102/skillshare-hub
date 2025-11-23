import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService } from '../../../services/api/courseService';
import api from '../../../services/api/apiConfig';  
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
  const participantIdRef = useRef<string | null>(null);

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

  // 🧠 2. Gọi API Backend join meeting
  useEffect(() => {
    const joinMeeting = async () => {
      if (!lesson || !user || !lessonId || !courseId) return;
      
      try {
        console.log("🚀 Joining meeting for lesson:", lessonId);
        console.log("👤 User info:", user);
        
        // ✅ BƯỚC 1: Kiểm tra access trước khi join
        const canJoin = await checkAccessBeforeJoin();
        if (!canJoin) return;

        console.log("✅ Access check passed, proceeding to join meeting");

        // ✅ BƯỚC 2: POST /jitsi/join với courseId
        const response = await api.post('/jitsi/join', {
          lessonId: lessonId,
          courseId: courseId, // 🆕 THÊM courseId
          userInfo: {
            id: user._id || user.id,
            email: user.email,
            displayName: user.name || user.displayName || user.username,
            avatar: user.avatar || user.profilePicture || ''
          },
          userId: user._id || user.id
        });

        if (response.data.success) {
          const { meeting } = response.data;
          setMeetingData(meeting);
          
          // 🆕 LƯỚI participantId để dùng khi leave
          participantIdRef.current = meeting.participantId;
          
          console.log("✅ Meeting joined successfully");
          console.log("   - Participants:", meeting.currentParticipants);
          console.log("   - Max:", meeting.maxParticipants);
          console.log("   - ParticipantId:", meeting.participantId);
        } else {
          throw new Error(response.data.message || 'Failed to join meeting');
        }
      } catch (err: any) {
        console.error('❌ Error joining meeting:', err);
        const errorMessage = err.response?.data?.message || err.message;
        setError(`Không thể tham gia lớp học: ${errorMessage}`);
      }
    };

    joinMeeting();
  }, [lesson, user, lessonId, courseId]);

  // Kiểm tra access trước khi join
  const checkAccessBeforeJoin = async () => {
    try {
      console.log("🔍 Checking access for lesson:", lessonId);
      const response = await api.get(`/jitsi/check-access/${lessonId}`);
      const { hasAccess, accessType, message } = response.data;
      
      if (!hasAccess) {
        setError(`Bạn không có quyền truy cập: ${message}`);
        return false;
      }
      
      console.log(`✅ Access granted: ${accessType}`);
      return true;
    } catch (error: any) {
      console.error('Error checking access:', error);
      setError('Lỗi kiểm tra quyền truy cập: ' + (error.response?.data?.message || error.message));
      return false;
    }
  };

  // 🧩 3. Mount Jitsi khi có meetingData
  useEffect(() => {
    if (!meetingData || !jitsiContainerRef.current) return;

    console.log("🎬 Initializing Jitsi Meet...");
    
    try {
      const domain = meetingData.domain;
      const options = {
        ...meetingData.config,
        parentNode: jitsiContainerRef.current
      };

      console.log("   - Domain:", domain);
      console.log("   - RoomName:", meetingData.roomName);

      // Xóa API cũ nếu tồn tại
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        console.log("♻️ Cleaned up previous Jitsi instance");
      }

      // Tạo API mới
      const jitsiApi = new window.JitsiMeetExternalAPI(domain, options);
      jitsiApiRef.current = jitsiApi;

      // ✅ Xử lý sự kiện videoConferenceJoined
      jitsiApi.addEventListener('videoConferenceJoined', () => {
        console.log('✅ Đã tham gia phòng họp thành công');
      });

      // ✅ Xử lý sự kiện videoConferenceLeft (khi user rời)
      jitsiApi.addEventListener('videoConferenceLeft', async () => {
        console.log('👋 Đã rời phòng họp');
        
        // 🆕 THÊM: Gọi API leave để xóa participant record
        if (participantIdRef.current) {
          try {
            console.log("📤 Notifying backend about leaving...");
            await api.post('/jitsi/leave', {
              participantId: participantIdRef.current,
              lessonId: lessonId
            });
            console.log("✅ Leave notification sent successfully");
          } catch (err) {
            console.error('⚠️ Error notifying leave (non-blocking):', err);
            // Không throw error ở đây, vì user đã rời rồi
          }
        }
        
        navigate(`/course/${courseId}`);
      });

      jitsiApi.addEventListener('participantJoined', (participant: any) => {
        console.log('👤 Người tham gia mới:', participant.displayName);
      });

      jitsiApi.addEventListener('participantLeft', (participant: any) => {
        console.log('🚪 Người rời khỏi:', participant.displayName);
      });

      jitsiApi.addEventListener('error', (error: any) => {
        console.error('❌ Jitsi error:', error);
        setError('Lỗi kết nối phòng họp: ' + error.message);
      });

      jitsiApi.addEventListener('readyToClose', () => {
        console.log('🔌 Jitsi ready to close');
        navigate(`/course/${courseId}`);
      });

      console.log("✅ Jitsi Meet initialized successfully");

    } catch (err: any) {
      console.error('❌ Error initializing Jitsi:', err);
      setError('Không thể khởi tạo phòng họp: ' + err.message);
    }

    // Cleanup: dispose Jitsi khi component unmount
    return () => {
      if (jitsiApiRef.current) {
        console.log("🧹 Cleaning up Jitsi instance on unmount");
        jitsiApiRef.current.dispose();
      }
    };
  }, [meetingData, navigate, courseId, lessonId]);

  // 🌀 Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900">Đang tải lớp học...</h3>
          <p className="text-gray-600 mt-2">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  // ❌ Error state
  if (error || !lesson || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Không thể tham gia lớp học</h3>
          <p className="text-gray-600 mb-4">{error || 'Lớp học không tồn tại'}</p>
          <div className="space-y-3">
            <button 
              onClick={() => navigate(`/course/${courseId}`)}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
            >
              Quay lại khóa học
            </button>
            <button 
              onClick={() => navigate('/courses')}
              className="w-full px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
            >
              Danh sách khóa học
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Main UI with Jitsi container
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                // 🆕 Notify leave trước khi navigate
                if (participantIdRef.current) {
                  api.post('/jitsi/leave', {
                    participantId: participantIdRef.current,
                    lessonId: lessonId
                  }).catch(err => console.error('Error leaving:', err));
                }
                navigate(`/course/${courseId}`);
              }}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              <FiArrowLeft className="w-5 h-5" />
              <span>Quay lại khóa học</span>
            </button>
          </div>

          <div className="text-center flex-1 mx-8">
            <h1 className="text-xl font-bold text-white truncate">{lesson.title}</h1>
            <p className="text-gray-400 text-sm truncate">{course.title}</p>
          </div>

          <div className="flex items-center gap-4 text-gray-300">
            <div className="flex items-center gap-2">
              <FiClock className="w-4 h-4" />
              <span>{lesson.duration || 0} phút</span>
            </div>
            <div className="flex items-center gap-2">
              <FiUsers className="w-4 h-4" />
              <span>
                {meetingData?.currentParticipants || 0} / {meetingData?.maxParticipants || 50}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state - Connecting to meeting */}
      {!meetingData && !error && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Đang kết nối phòng họp...</p>
          </div>
        </div>
      )}

      {/* Jitsi Meeting Container */}
      <div 
        ref={jitsiContainerRef} 
        style={{ 
          width: '100%', 
          height: meetingData ? 'calc(100vh - 72px)' : '0',
          display: meetingData ? 'block' : 'none'
        }} 
      />
    </div>
  );
};

export default LessonLivePage;