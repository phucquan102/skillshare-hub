import React, { useState, useEffect } from 'react';
import { courseService } from '../../../services/api/courseService';
import './LessonMeeting.module.scss';

interface LessonMeetingProps {
  lesson: any;
  user: any;
  isInstructor?: boolean;
  onMeetingUpdate?: (lesson: any) => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const LessonMeeting: React.FC<LessonMeetingProps> = ({
  lesson,
  user,
  isInstructor = false,
  onMeetingUpdate,
}) => {
  const [showMeeting, setShowMeeting] = useState(false);
  const [meetingInfo, setMeetingInfo] = useState<any>(null);
  const [joiningMeeting, setJoiningMeeting] = useState(false);
  const [startingMeeting, setStartingMeeting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meetingStatus, setMeetingStatus] = useState<'idle' | 'starting' | 'live' | 'ended'>('idle');

  useEffect(() => {
    if (lesson.isMeetingActive) {
      setMeetingStatus('live');
    } else if (lesson.actualStartTime && lesson.actualEndTime) {
      setMeetingStatus('ended');
    } else {
      setMeetingStatus('idle');
    }
  }, [lesson]);

  const handleStartMeeting = async () => {
    try {
      setStartingMeeting(true);
      setError(null);
      console.log('Starting meeting for lesson:', lesson._id);
      const response = await courseService.startLessonMeeting(lesson._id);

      const meetingId = response.meetingId || `skillshare-${lesson.courseId}-${lesson._id}`;
      setMeetingInfo({
        meetingUrl: response.meetingUrl || `https://meet.jit.si/${meetingId}`,
        meetingId,
      });

      setMeetingStatus('live');
      setShowMeeting(true);

      if (onMeetingUpdate) {
        onMeetingUpdate({
          ...lesson,
          isMeetingActive: true,
          meetingId: meetingId,
        });
      }
    } catch (err: any) {
      console.error('Error starting meeting:', err);
      setError(err.message || 'Unable to start the meeting');
    } finally {
      setStartingMeeting(false);
    }
  };

  const handleJoinMeeting = async () => {
    try {
      setJoiningMeeting(true);
      setError(null);
      console.log('Joining meeting for lesson:', lesson._id);
      const response = await courseService.joinLessonMeeting(lesson._id);

      const meetingId = response.meetingId || `skillshare-${lesson.courseId}-${lesson._id}`;
      setMeetingInfo({
        meetingUrl: response.meetingUrl || `https://meet.jit.si/${meetingId}`,
        meetingId,
      });

      setShowMeeting(true);
    } catch (err: any) {
      console.error('Error joining meeting:', err);
      setError(err.message || 'Unable to join the meeting');
    } finally {
      setJoiningMeeting(false);
    }
  };

  const handleMeetingEnd = async () => {
    try {
      if (isInstructor) {
        await courseService.endLessonMeeting(lesson._id);
      }
      setShowMeeting(false);
      setMeetingInfo(null);
      setMeetingStatus('ended');

      if (onMeetingUpdate) {
        onMeetingUpdate({
          ...lesson,
          isMeetingActive: false,
          actualEndTime: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      console.error('Error ending meeting:', err);
      setError('Error ending meeting: ' + (err.message || err));
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusInfo = () => {
    switch (meetingStatus) {
      case 'live':
        return {
          text: 'Live',
          className: 'status-live',
          icon: '🔴',
          description: 'The lesson is currently in progress',
        };
      case 'ended':
        return {
          text: 'Ended',
          className: 'status-ended',
          icon: '⚫',
          description: 'The lesson has ended',
        };
      case 'starting':
        return {
          text: 'Starting',
          className: 'status-starting',
          icon: '🟡',
          description: 'Initializing the lesson...',
        };
      default:
        return {
          text: 'Upcoming',
          className: 'status-upcoming',
          icon: '🟢',
          description: 'The lesson will start soon',
        };
    }
  };

  const statusInfo = getStatusInfo();

  // Initialize Jitsi API when meetingInfo is ready
  useEffect(() => {
    if (showMeeting && meetingInfo) {
      const domain = 'meet.jit.si';
      const options = {
        roomName: meetingInfo.meetingId,
        parentNode: document.getElementById('jitsi-container'),
        userInfo: {
          displayName: user?.fullName || user?.name || 'Guest',
          email: user?.email || '',
        },
        configOverwrite: {
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
        },
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);
      return () => {
        try {
          api.dispose();
        } catch (disposeErr) {
          console.warn('Error disposing Jitsi API:', disposeErr);
        }
      };
    }
  }, [showMeeting, meetingInfo, user]);

  // If meeting is active and meetingInfo exists -> show meeting UI
  if (showMeeting && meetingInfo) {
    return (
      <div className="lesson-meeting-container">
        <div className="meeting-header">
          <h3>Room: {meetingInfo.meetingId}</h3>
          <div className="header-right">
            <span className="status-badge status-live">
              <span className="status-icon">🔴</span> Live
            </span>
            {isInstructor && (
              <button onClick={handleMeetingEnd} className="end-meeting-btn">
                End Meeting
              </button>
            )}
          </div>
        </div>

        <div
          id="jitsi-container"
          style={{ width: '100%', height: '80vh', background: '#000', marginTop: '1rem' }}
        ></div>
      </div>
    );
  }

  // UI before meeting starts or after it ends
  return (
    <div className="lesson-meeting-info">
      <div className="meeting-card">
        <div className="meeting-header">
          <div className="header-icon">
            <i className="icon-video">📹</i>
          </div>
          <div className="header-content">
            <h3>Online Lesson</h3>
            <p>{statusInfo.description}</p>
          </div>
          <div className={`status-badge ${statusInfo.className}`}>
            <span className="status-icon">{statusInfo.icon}</span>
            {statusInfo.text}
          </div>
        </div>

        <div className="meeting-details">
          <div className="detail-section">
            <h4>Session Info</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-label">
                  <i className="icon-hash">#</i>
                  <span>Room ID:</span>
                </div>
                <div className="detail-value">
                  {lesson.meetingId ? (
                    <code className="room-code">{lesson.meetingId}</code>
                  ) : (
                    <span className="text-muted">Not created yet</span>
                  )}
                </div>
              </div>

              {lesson.actualStartTime && (
                <div className="detail-item">
                  <div className="detail-label">
                    <i className="icon-clock">⏰</i>
                    <span>Start Time:</span>
                  </div>
                  <div className="detail-value">{formatTime(lesson.actualStartTime)}</div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="error-message">
              <i className="icon-error">⚠️</i>
              <span>{error}</span>
              <button onClick={() => setError(null)} className="close-error">
                ×
              </button>
            </div>
          )}
        </div>

        <div className="meeting-actions">
          {meetingStatus === 'live' ? (
            <button
              onClick={handleJoinMeeting}
              className={`join-meeting-btn ${joiningMeeting ? 'loading' : ''}`}
              disabled={joiningMeeting}
            >
              {joiningMeeting ? (
                <>
                  <div className="loading-spinner"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <i className="icon-join">🎯</i>
                  Join Lesson
                </>
              )}
            </button>
          ) : isInstructor && meetingStatus !== 'ended' ? (
            <button
              onClick={handleStartMeeting}
              className={`start-meeting-btn ${startingMeeting ? 'loading' : ''}`}
              disabled={startingMeeting}
            >
              {startingMeeting ? (
                <>
                  <div className="loading-spinner"></div>
                  Starting...
                </>
              ) : (
                <>
                  <i className="icon-start">🚀</i>
                  Start Lesson
                </>
              )}
            </button>
          ) : lesson.recordingUrl ? (
            <a
              href={lesson.recordingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="recording-link"
            >
              <i className="icon-play">▶️</i>
              Watch Recording
            </a>
          ) : (
            <div className="info-message">
              <i className="icon-info">ℹ️</i>
              <div>
                <p>The session {meetingStatus === 'ended' ? 'has ended' : 'has not started yet'}</p>
                {isInstructor && meetingStatus !== 'ended' && (
                  <button
                    className="btn-start-meeting"
                    onClick={handleStartMeeting}
                    disabled={startingMeeting}
                  >
                    <i className="icon-start">🚀</i>
                    Start Lesson
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonMeeting;
