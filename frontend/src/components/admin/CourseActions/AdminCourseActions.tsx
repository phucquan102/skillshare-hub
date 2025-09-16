import React from 'react';
import { Course } from '../../../services/api/courseServices';

interface AdminCourseActionsProps {
  course: Course;
  onView: (courseId: string) => void;
  onApprove: (courseId: string) => void;
  onReject: (courseId: string) => void;
  onDelete: (courseId: string) => void;
  loading?: { [key: string]: boolean };
}

const AdminCourseActions: React.FC<AdminCourseActionsProps> = ({
  course,
  onView,
  onApprove,
  onReject,
  onDelete,
  loading = {},
}) => {
  const getActionKey = (action: string) => `${action}_${course._id}`;
  const isLoading = (action: string) => loading[getActionKey(action)];

  const renderActionButton = (
    actionType: string,
    onClick: () => void,
    className: string,
    title: string,
    icon: string,
    disabled: boolean = false
  ) => (
    <button
      className={`${className} ${
        isLoading(actionType) || disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
      } p-2 rounded transition-all duration-200 text-lg`}
      onClick={onClick}
      disabled={isLoading(actionType) || disabled}
      title={title}
    >
      {isLoading(actionType) ? '⏳' : icon}
    </button>
  );

  return (
    <div className="flex items-center space-x-2">
      {/* View Button */}
      {renderActionButton(
        'view',
        () => onView(course._id),
        'text-blue-600 hover:bg-blue-50',
        'Xem chi tiết',
        '👀'
      )}

      {/* Approve / Reject khi pending_review */}
      {course.status === 'pending_review' && (
        <>
          {renderActionButton(
            'approve',
            () => onApprove(course._id),
            'text-green-600 hover:bg-green-50',
            'Phê duyệt khóa học',
            '✅'
          )}
          {renderActionButton(
            'reject',
            () => onReject(course._id),
            'text-red-600 hover:bg-red-50',
            'Từ chối khóa học',
            '❌'
          )}
        </>
      )}

      {/* Delete Button */}
      {renderActionButton(
        'delete',
        () => onDelete(course._id),
        'text-red-600 hover:bg-red-50',
        'Xóa khóa học',
        '🗑️',
        course.currentEnrollments > 0 && course.status !== 'archived'
      )}
    </div>
  );
};

export default AdminCourseActions;