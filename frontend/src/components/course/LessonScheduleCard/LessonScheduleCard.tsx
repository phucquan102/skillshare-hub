import React from 'react';

interface LessonScheduleCardProps {
  lesson: any;
  onJoinLesson: (lessonId: string) => void;
  userRole: string;
  hasAccess: boolean;
}

const LessonScheduleCard: React.FC<LessonScheduleCardProps> = ({ 
  lesson, 
  onJoinLesson, 
  userRole,
  hasAccess
}) => {
  const isInstructor = userRole === 'instructor' || userRole === 'admin';
  const canJoin = isInstructor || hasAccess || lesson.isPreview || lesson.isFree;

  const getStatusBadge = () => {
    if (lesson.isLive) {
      return (
        <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full flex items-center">
          <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
          Live now
        </span>
      );
    }
    if (lesson.isUpcoming) {
      return (
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
          ⏳ Upcoming
        </span>
      );
    }
    if (lesson.hasRecording) {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
          📹 Recording available
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
        📅 Scheduled
      </span>
    );
  };

  const getScheduleTime = () => {
    if (!lesson.scheduleDetails) return null;

    const { scheduleDetails } = lesson;

    // Dated schedule
    if (scheduleDetails.type === 'dated' && scheduleDetails.date) {
      const date = new Date(scheduleDetails.date);
      return {
        date: date.toLocaleDateString('en-GB'), // English format
        time: `${scheduleDetails.startTime} - ${scheduleDetails.endTime}`,
        fullDate: date
      };
    }

    // Weekly schedule
    if (scheduleDetails.type === 'weekly') {
      const dayNamesEn = [
        'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
      ];

      return {
        date: dayNamesEn[scheduleDetails.dayOfWeek],
        time: `${scheduleDetails.startTime} - ${scheduleDetails.endTime}`,
        fullDate: null
      };
    }

    return null;
  };

  const scheduleTime = getScheduleTime();

  return (
    <div
      className={`border rounded-xl p-6 transition-all duration-300 ${
        lesson.isLive
          ? 'border-red-300 bg-red-50 shadow-lg'
          : lesson.isUpcoming
          ? 'border-yellow-300 bg-yellow-50'
          : 'border-gray-200 hover:border-blue-300 bg-white'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 pr-4">
              {lesson.title}
              {lesson.isPreview && (
                <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                  Preview
                </span>
              )}
            </h3>
            {getStatusBadge()}
          </div>

          {scheduleTime && (
            <div className="flex items-center space-x-6 text-gray-600 mb-3">
              {/* Date */}
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium">{scheduleTime.date}</span>
              </div>

              {/* Time */}
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{scheduleTime.time}</span>
              </div>
            </div>
          )}

          {lesson.description && (
            <p className="text-gray-600 text-sm leading-relaxed">
              {lesson.description}
            </p>
          )}

          {lesson.duration && (
            <p className="text-gray-500 text-sm mt-2">
              Duration: {lesson.duration} minutes
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col space-y-2 mt-4 lg:mt-0 lg:ml-6 lg:w-48">
          {lesson.isLive && canJoin && (
            <button
              onClick={() => onJoinLesson(lesson._id)}
              className="w-full px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors duration-300 flex items-center justify-center space-x-2"
            >
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              <span>Join now</span>
            </button>
          )}

          {!lesson.isLive && lesson.hasRecording && canJoin && (
            <button className="w-full px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors duration-300">
              Watch recording
            </button>
          )}

          {isInstructor && (
            <button className="w-full px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors duration-300">
              Manage lesson
            </button>
          )}

          {!hasAccess && !lesson.isPreview && !lesson.isFree && (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Purchase required to join</p>
              {lesson.price > 0 && (
                <p className="text-lg font-bold text-green-600">
                  {lesson.price.toLocaleString('en-US')} VND
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Additional info when live */}
      {lesson.isLive && (
        <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between text-sm text-red-800">
            <span>🔴 Live streaming</span>
            <span>{lesson.currentParticipants || 0} participants</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonScheduleCard;
