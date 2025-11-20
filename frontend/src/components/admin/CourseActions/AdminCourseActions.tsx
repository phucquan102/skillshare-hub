import React, { useState } from 'react';
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
  userRole?: string;
  onView: (courseId: string) => void;
  onApprove: (courseId: string) => void;
  onReject: (courseId: string) => void;
  onDelete: (courseId: string) => void;
  loading?: { [key: string]: boolean };
}

const AdminCourseActions: React.FC<AdminCourseActionsProps> = ({
  course,
  userRole = 'admin',
  onView,
  onApprove,
  onReject,
  onDelete,
  loading = {},
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const getActionKey = (action: string) => `${action}_${course._id}`;
  const isLoading = (action: string) => loading[getActionKey(action)];
  
  // ✅ SỬA: Logic kiểm tra quyền xóa mới
  const isAdmin = userRole === 'admin';
  const hasEnrollments = course.currentEnrollments > 0;

  // ✅ SỬA: Hàm kiểm tra quyền xóa
  const canUserDelete = () => {
    // Admin có thể xóa bất kỳ course nào
    if (isAdmin) return true;
    
    // Instructor chỉ có thể xóa course draft không có enrollment
    return course.status === 'draft' && !hasEnrollments;
  };

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

    let tooltipText = title;
    if (!canUserDelete() && actionType === 'delete') {
      if (isAdmin) {
        tooltipText = `Admin: Có thể xóa (${course.currentEnrollments} học viên)`;
      } else {
        tooltipText = `Không thể xóa: ${course.currentEnrollments} học viên đã đăng ký`;
      }
    }

    return (
      <button
        className={`${baseClasses} ${variants[variant]} ${
          isLoading(actionType) || disabled 
            ? 'opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-none'
            : 'cursor-pointer hover:scale-105 hover:shadow-lg'
        }`}
        onClick={onClick}
        disabled={isLoading(actionType) || disabled}
        title={tooltipText}
      >
        {/* Tooltip */}
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
          {tooltipText}
        </div>

        {/* Icon */}
        {isLoading(actionType) ? loadingIcons[variant] : icons[variant]}

        {/* Admin Badge cho delete button */}
        {isAdmin && actionType === 'delete' && hasEnrollments && (
          <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
            A
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

  // ✅ SỬA: Hàm xử lý click xóa
  const handleDeleteClick = () => {
    if (!canUserDelete()) {
      return;
    }
    
    // Hiện confirmation cho admin có enrollment
    if (isAdmin && hasEnrollments) {
      setShowDeleteConfirm(true);
    } else {
      onDelete(course._id);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/60">
        {/* Status Badge */}
        <div className="flex-1">
          {getStatusBadge(course.status)}
          {course.currentEnrollments > 0 && (
            <div className={`text-xs mt-1 ${isAdmin ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}>
              {course.currentEnrollments} enrolled {isAdmin && '(Admin có thể xóa)'}
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

          {/* Delete Button - luôn hiển thị nếu có quyền */}
          {canUserDelete() && (
            renderActionButton(
              'delete',
              handleDeleteClick,
              'delete',
              isAdmin && hasEnrollments 
                ? `Xóa Course (có ${course.currentEnrollments} học viên)` 
                : 'Xóa Course',
              false // ✅ KHÔNG disable nữa
            )
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <HiOutlineExclamationCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-bold text-gray-900">Xác nhận xóa</h3>
            </div>
            
            <p className="text-gray-600 mb-2">
              Bạn sắp xóa khóa học: <strong>{course.title}</strong>
            </p>
            
            {hasEnrollments && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-orange-800">
                  ⚠️ <strong>{course.currentEnrollments} học viên</strong> đã đăng ký khóa học này. 
                  <br />
                  <strong>Toàn bộ enrollment và lesson sẽ bị xóa.</strong>
                </p>
              </div>
            )}

            <p className="text-gray-700 text-sm mb-6">
              Thao tác này <strong className="text-red-600">không thể hoàn tác</strong>. Bạn chắc chắn muốn tiếp tục?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete(course._id);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                disabled={isLoading('delete')}
              >
                {isLoading('delete') ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <FiTrash2 className="w-4 h-4" />
                    {hasEnrollments ? 'XÓA HOÀN TOÀN' : 'Xóa Course'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminCourseActions;