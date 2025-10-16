// src/pages/instructor/LessonDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService } from '../../../services/api/courseService';
import LessonMeeting from '../../../components/course/LessonMeeting/LessonMeeting';
import { useAuth } from '../../../context/AuthContext';

const LessonDetailPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (lessonId && courseId) {
      loadLessonAndCourse();
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
      setCourse(courseResponse.course);
    } catch (err: any) {
      setError('Không thể tải thông tin bài học');
      console.error('Error loading lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartLesson = async () => {
    try {
      await courseService.startLesson(lessonId!);
      loadLessonAndCourse(); // Reload để cập nhật trạng thái
    } catch (err: any) {
      setError('Không thể bắt đầu bài học');
      console.error('Error starting lesson:', err);
    }
  };

  const handleEndLesson = async () => {
    try {
      await courseService.endLesson(lessonId!);
      loadLessonAndCourse(); // Reload để cập nhật trạng thái
    } catch (err: any) {
      setError('Không thể kết thúc bài học');
      console.error('Error ending lesson:', err);
    }
  };

  if (loading) {
    return <div className="loading">Đang tải bài học...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!lesson || !course) {
    return <div className="error">Không tìm thấy bài học</div>;
  }

  return (
    <div className="lesson-detail-page">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Quay lại
        </button>
        <h1>{lesson.title}</h1>
        <div className="lesson-actions">
          {lesson.lessonType === 'live_online' && (
            <>
              {lesson.isLive ? (
                <button onClick={handleEndLesson} className="btn btn-danger">
                  Kết thúc bài học
                </button>
              ) : (
                <button onClick={handleStartLesson} className="btn btn-success">
                  Bắt đầu bài học
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="lesson-content">
        <div className="lesson-info">
          <div className="info-card">
            <h3>Thông tin bài học</h3>
            <div className="info-grid">
              <div className="info-item">
                <strong>Mô tả:</strong>
                <p>{lesson.description}</p>
              </div>
              <div className="info-item">
                <strong>Loại bài học:</strong>
                <span>{lesson.lessonType === 'live_online' ? 'Trực tuyến' : 'Tự học'}</span>
              </div>
              <div className="info-item">
                <strong>Thời lượng:</strong>
                <span>{lesson.duration} phút</span>
              </div>
              <div className="info-item">
                <strong>Trạng thái:</strong>
                <span className={`status ${lesson.status}`}>
                  {lesson.status === 'published' ? 'Đã xuất bản' : 
                   lesson.status === 'draft' ? 'Bản nháp' : 
                   lesson.status === 'completed' ? 'Đã hoàn thành' : lesson.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="meeting-section">
          {lesson.lessonType === 'live_online' && (
            <LessonMeeting lesson={lesson} user={user} />
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonDetailPage;