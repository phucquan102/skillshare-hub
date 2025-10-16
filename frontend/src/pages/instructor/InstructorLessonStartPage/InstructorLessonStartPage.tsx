import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService } from '../../../services/api/courseService';

const InstructorLessonStartPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const [meetingInfo, setMeetingInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null); // ✅ lấy user từ localStorage

  useEffect(() => {
    // 🧠 Lấy thông tin user từ localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const startMeeting = async () => {
      try {
        setLoading(true);
        const res = await courseService.startLessonMeeting(lessonId!);
        setMeetingInfo(res);
      } catch (err: any) {
        console.error('Error starting meeting:', err);
        setError('Không thể bắt đầu buổi học');
      } finally {
        setLoading(false);
      }
    };

    if (lessonId) startMeeting();
  }, [lessonId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold">Đang khởi tạo lớp học...</h3>
        </div>
      </div>
    );
  }

  if (error || !meetingInfo) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">{error || 'Lỗi không xác định'}</h1>
        <button 
          onClick={() => navigate(`/instructor/course/${courseId}`)} 
          className="px-6 py-3 bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-colors"
        >
          Quay lại
        </button>
      </div>
    );
  }

  // 🧠 Gắn displayName vào URL nếu có user
  const baseUrl = meetingInfo.meetingUrl || meetingInfo.url;
  const displayName = encodeURIComponent(user?.fullName || user?.name || 'Instructor');
  const meetingUrlWithName = `${baseUrl}#userInfo.displayName="${displayName}"`;

  return (
    <div className="min-h-screen bg-gray-900">
      <iframe
        src={meetingUrlWithName}
        className="w-full h-screen"
        allow="camera; microphone; fullscreen; speaker; display-capture"
        title="Instructor Meeting"
      />
    </div>
  );
};

export default InstructorLessonStartPage;
