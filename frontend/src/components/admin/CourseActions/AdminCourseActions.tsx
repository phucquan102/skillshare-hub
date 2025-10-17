import React from 'react';
import { Course } from '../../../services/api/courseService';
import { 
  FiEye, 
  FiCheck, 
  FiX, 
  FiTrash2, 
  FiLoader,
  FiArchive,
  FiEdit
} from 'react-icons/fi';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

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
    variant: 'view' | 'approve' | 'reject' | 'delete' | 'edit',
    title: string,
    disabled: boolean = false
  ) => {
    const baseClasses = "flex items-center justify-center p-3 rounded-2xl transition-all duration-300 font-medium text-sm group relative";
    
    const variants = {
      view: "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-lg hover:scale-105 border border-blue-200",
      approve: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:shadow-lg hover:scale-105 border border-emerald-200",
      reject: "bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-lg hover:scale-105 border border-red-200",
      delete: "bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-lg hover:scale-105 border border-red-200",
      edit: "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:shadow-lg hover:scale-105 border border-gray-200"
    };

    const icons = {
      view: <FiEye className="w-4 h-4" />,
      approve: <FiCheck className="w-4 h-4" />,
      reject: <FiX className="w-4 h-4" />,
      delete: <FiTrash2 className="w-4 h-4" />,
      edit: <FiEdit className="w-4 h-4" />
    };

    const loadingIcons = {
      view: <FiLoader className="w-4 h-4 animate-spin" />,
      approve: <FiLoader className="w-4 h-4 animate-spin" />,
      reject: <FiLoader className="w-4 h-4 animate-spin" />,
      delete: <FiLoader className="w-4 h-4 animate-spin" />,
      edit: <FiLoader className="w-4 h-4 animate-spin" />
    };

    return (
      <button
        className={`${baseClasses} ${variants[variant]} ${
          isLoading(actionType) || disabled 
            ? 'opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-none' 
            : 'cursor-pointer'
        }`}
        onClick={onClick}
        disabled={isLoading(actionType) || disabled}
        title={title}
      >
        {/* Tooltip */}
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
          {title}
          {disabled && course.currentEnrollments > 0 && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-2 h-2 bg-gray-900 rotate-45"></div>
          )}
        </div>

        {/* Icon */}
        {isLoading(actionType) ? loadingIcons[variant] : icons[variant]}

        {/* Disabled Reason Badge */}
        {disabled && course.currentEnrollments > 0 && (
          <div className="absolute -top-1 -right-1">
            <HiOutlineExclamationCircle className="w-3 h-3 text-red-500" />
          </div>
        )}
      </button>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_review: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'Pending Review' },
      published: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', text: 'Published' },
      draft: { color: 'bg-gray-100 text-gray-800 border-gray-200', text: 'Draft' },
      archived: { color: 'bg-purple-100 text-purple-800 border-purple-200', text: 'Archived' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', text: 'Rejected' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/60">
      {/* Status Badge */}
      <div className="flex-1">
        {getStatusBadge(course.status)}
        {course.currentEnrollments > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            {course.currentEnrollments} enrolled
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* View Button */}
        {renderActionButton(
          'view',
          () => onView(course._id),
          'view',
          'View Course Details'
        )}

        {/* Approve / Reject khi pending_review */}
        {course.status === 'pending_review' && (
          <>
            {renderActionButton(
              'approve',
              () => onApprove(course._id),
              'approve',
              'Approve Course'
            )}
            {renderActionButton(
              'reject',
              () => onReject(course._id),
              'reject',
              'Reject Course'
            )}
          </>
        )}

        {/* Archive Button for published courses */}
        {course.status === 'published' && (
          renderActionButton(
            'archive',
            () => onDelete(course._id), // Assuming archive uses delete action
            'delete',
            'Archive Course',
            course.currentEnrollments > 0
          )
        )}

        {/* Delete Button for other statuses */}
        {course.status !== 'published' && course.status !== 'pending_review' && (
          renderActionButton(
            'delete',
            () => onDelete(course._id),
            'delete',
            'Delete Course',
            course.currentEnrollments > 0 && course.status !== 'archived'
          )
        )}
      </div>
    </div>
  );
};

export default AdminCourseActions;