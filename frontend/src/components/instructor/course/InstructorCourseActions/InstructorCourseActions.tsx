// src/components/course/CourseActions/InstructorCourseActions.tsx
import React, { useState } from 'react';
import { Course } from '../../../../services/api/courseService';

interface InstructorCourseActionsProps {
  course: Course;
  onEdit: (courseId: string) => void;
  onView: (courseId: string) => void;
  onDelete: (courseId: string) => void;
  onStatusChange: (courseId: string, status: string) => void;
  loading?: { [key: string]: boolean };
}

const InstructorCourseActions: React.FC<InstructorCourseActionsProps> = ({
  course,
  onEdit,
  onView,
  onDelete,
  onStatusChange,
  loading = {}
}) => {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const getActionKey = (action: string) => `${action}_${course._id}`;

  const renderActionButton = (
    actionType: string,
    onClick: () => void,
    className: string,
    title: string,
    iconClass: string,
    disabled: boolean = false
  ) => {
    const actionKey = getActionKey(actionType);
    const isLoading = loading[actionKey];

    return (
      <button
        className={`${className} ${
          isLoading || disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
        } p-2 rounded transition-all duration-200`}
        onClick={onClick}
        disabled={isLoading || disabled}
        title={title}
      >
        {isLoading ? (
          <i className="fas fa-spinner fa-spin"></i>
        ) : (
          <i className={iconClass}></i>
        )}
      </button>
    );
  };

  const getStatusOptions = () => {
    const options = [];
    
    switch (course.status) {
      case 'draft':
        options.push(
          { value: 'pending_review', label: 'Gửi duyệt', icon: 'fas fa-paper-plane', color: 'text-blue-600' }
        );
        break;
      case 'published':
        options.push(
          { value: 'draft', label: 'Chuyển về nháp', icon: 'fas fa-edit', color: 'text-yellow-600' },
          { value: 'archived', label: 'Lưu trữ', icon: 'fas fa-archive', color: 'text-gray-600' }
        );
        break;
      case 'rejected':
        options.push(
          { value: 'draft', label: 'Chỉnh sửa lại', icon: 'fas fa-edit', color: 'text-blue-600' }
        );
        break;
      case 'pending_review':
        // Instructor không có quyền duyệt
        break;
      case 'archived':
        options.push(
          { value: 'draft', label: 'Khôi phục', icon: 'fas fa-undo', color: 'text-green-600' }
        );
        break;
    }
    
    return options;
  };

  return (
    <div className="flex items-center space-x-2">
      {/* View */}
      {renderActionButton(
        'view',
        () => onView(course._id),
        'text-blue-600 hover:bg-blue-50',
        'Xem chi tiết',
        'fas fa-eye'
      )}

      {/* Edit */}
      {renderActionButton(
        'edit',
        () => onEdit(course._id),
        'text-green-600 hover:bg-green-50',
        'Chỉnh sửa',
        'fas fa-edit',
        course.status === 'pending_review' || course.status === 'published'
      )}

      {/* Status Change Dropdown */}
      {getStatusOptions().length > 0 && (
        <div className="relative">
          <button
            className="text-purple-600 hover:bg-purple-50 p-2 rounded transition-all duration-200"
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            title="Thay đổi trạng thái"
          >
            <i className="fas fa-exchange-alt"></i>
          </button>

          {showStatusDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              <div className="py-1">
                {getStatusOptions().map(option => (
                  <button
                    key={option.value}
                    className={`${option.color} hover:bg-gray-50 group flex items-center px-4 py-2 text-sm w-full text-left transition-colors`}
                    onClick={() => {
                      onStatusChange(course._id, option.value);
                      setShowStatusDropdown(false);
                    }}
                    disabled={loading[getActionKey('status')]}
                  >
                    {loading[getActionKey('status')] ? (
                      <i className="fas fa-spinner fa-spin mr-3"></i>
                    ) : (
                      <i className={`${option.icon} mr-3`}></i>
                    )}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete */}
      {renderActionButton(
        'delete',
        () => onDelete(course._id),
        'text-red-600 hover:bg-red-50',
        'Xóa khóa học',
        'fas fa-trash',
        course.currentEnrollments > 0 || course.status === 'published'
      )}

      {/* Quick Actions */}
      {course.status === 'published' && (
        <div className="border-l border-gray-200 pl-2 ml-2">
          {renderActionButton(
            'analytics',
            () => window.open(`/analytics/course/${course._id}`, '_blank'),
            'text-indigo-600 hover:bg-indigo-50',
            'Xem thống kê',
            'fas fa-chart-bar'
          )}
          
          {renderActionButton(
            'students',
            () => window.open(`/course/${course._id}/students`, '_blank'),
            'text-teal-600 hover:bg-teal-50',
            'Quản lý học viên',
            'fas fa-users'
          )}
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {showStatusDropdown && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowStatusDropdown(false)}
        />
      )}
    </div>
  );
};

export default InstructorCourseActions;
