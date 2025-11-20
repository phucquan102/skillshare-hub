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
      setError('Unable to load lesson information');
      console.error('Error loading lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartLesson = async () => {
    try {
      await courseService.startLesson(lessonId!);
      loadLessonAndCourse(); 
    } catch (err: any) {
      setError('Unable to start the lesson');
      console.error('Error starting lesson:', err);
    }
  };

  const handleEndLesson = async () => {
    try {
      await courseService.endLesson(lessonId!);
      loadLessonAndCourse();
    } catch (err: any) {
      setError('Unable to end the lesson');
      console.error('Error ending lesson:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading lesson...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!lesson || !course) {
    return <div className="error">Lesson not found</div>;
  }

  return (
    <div className="lesson-detail-page">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Back
        </button>
        <h1>{lesson.title}</h1>

        <div className="lesson-actions">
          {lesson.lessonType === 'live_online' && (
            <>
              {lesson.isLive ? (
                <button onClick={handleEndLesson} className="btn btn-danger">
                  End Lesson
                </button>
              ) : (
                <button onClick={handleStartLesson} className="btn btn-success">
                  Start Lesson
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="lesson-content">
        <div className="lesson-info">
          <div className="info-card">
            <h3>Lesson Information</h3>

            <div className="info-grid">
              <div className="info-item">
                <strong>Description:</strong>
                <p>{lesson.description}</p>
              </div>

              <div className="info-item">
                <strong>Lesson Type:</strong>
                <span>{lesson.lessonType === 'live_online' ? 'Live Online' : 'Self-paced'}</span>
              </div>

              <div className="info-item">
                <strong>Duration:</strong>
                <span>{lesson.duration} minutes</span>
              </div>

              <div className="info-item">
                <strong>Status:</strong>
                <span className={`status ${lesson.status}`}>
                  {lesson.status === 'published'
                    ? 'Published'
                    : lesson.status === 'draft'
                    ? 'Draft'
                    : lesson.status === 'completed'
                    ? 'Completed'
                    : lesson.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Meeting Section */}
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
