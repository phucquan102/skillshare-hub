import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService } from '../../../services/api/courseService';

const StudentLessonMeeting: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const [meetingInfo, setMeetingInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const joinMeeting = async () => {
      try {
        setLoading(true);
        const response = await courseService.joinLessonMeeting(lessonId!);
        setMeetingInfo(response);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tham gia lớp học');
        console.error('Error joining meeting:', err);
      } finally {
        setLoading(false);
      }
    };

    if (lessonId) {
      joinMeeting();
    }
  }, [lessonId]);

  const handleMeetingEnd = () => {
    navigate(`/course/${courseId}`);
  };

  // 🎯 XỬ LÝ KHI USER RỜI KHỎI MEETING (tùy chọn)
  const handleLeaveMeeting = async () => {
    // Có thể gọi API để giảm currentParticipants nếu cần
    navigate(`/course/${courseId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold">Đang kết nối đến lớp học...</h3>
        </div>
      </div>
    );
  }

  if (error || !meetingInfo) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">!</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Lỗi kết nối</h3>
          <p className="text-gray-400 mb-6">{error || 'Không thể tham gia lớp học'}</p>
          <button 
            onClick={() => navigate(`/course/${courseId}`)}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            Quay lại khóa học
          </button>
        </div>
      </div>
    );
  }

  // 🎯 TẠO MEETING URL VỚI DISPLAY NAME
  const getMeetingUrlWithUserInfo = () => {
    const baseUrl = meetingInfo.meetingUrl;
    const displayName = encodeURIComponent(meetingInfo.displayName || 'Student');
    const userRole = meetingInfo.userRole || 'student';
    
    // Jitsi Meet hỗ trợ truyền thông tin user qua URL parameters
    return `${baseUrl}#userInfo.displayName="${displayName}"&userInfo.email="${userRole}@class.com"`;
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 bg-gray-800 p-4 rounded-2xl">
          <div>
            <h1 className="text-2xl font-bold text-white">Lớp học trực tuyến</h1>
            <p className="text-gray-400">
              Người tham gia: {meetingInfo.currentParticipants}/{meetingInfo.maxParticipants}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleLeaveMeeting}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Rời lớp học
            </button>
            {meetingInfo.userRole === 'teacher' && (
              <button
                onClick={handleMeetingEnd}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Kết thúc lớp học
              </button>
            )}
          </div>
        </div>

        {/* Meeting Container */}
        <div className="flex-1 bg-black rounded-2xl overflow-hidden">
          {meetingInfo.meetingUrl ? (
            <iframe
              src={getMeetingUrlWithUserInfo()}
              className="w-full h-full"
              allow="camera; microphone; fullscreen; speaker; display-capture"
              title="Lesson Meeting"
              allowFullScreen
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Đang tải lớp học...</p>
              </div>
            </div>
          )}
        </div>

        {/* Meeting Info */}
        <div className="mt-4 p-4 bg-gray-800 rounded-2xl text-white">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold mb-2">Thông tin lớp học:</h3>
              <p>Vai trò: <span className="capitalize">{meetingInfo.userRole}</span></p>
              <p>Tên hiển thị: {meetingInfo.displayName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">
                ID: {meetingInfo.meetingId?.substring(0, 8)}...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLessonMeeting;