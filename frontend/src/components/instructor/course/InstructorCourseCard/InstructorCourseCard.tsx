import React from 'react';
import { Course } from '../../../../services/api/courseService';
import { 
  FiEdit, 
  FiTrash2, 
  FiBarChart2,
  FiUsers,
  FiDollarSign,
  FiBook
} from 'react-icons/fi';

interface InstructorCourseCardProps {
  course: Course;
  onEdit?: (course: Course) => void;
  onViewStats?: (course: Course) => void;
  onManageLessons?: (course: Course) => void;
  onDelete?: (courseId: string) => void;
  onUpdateStatus?: (courseId: string, status: string) => void;
}

const InstructorCourseCard: React.FC<InstructorCourseCardProps> = ({
  course,
  onEdit,
  onViewStats,
  onManageLessons,
  onDelete,
  onUpdateStatus
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
      published: { label: 'Published', color: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Course Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={course.thumbnail || '/default-course.jpg'}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 right-4">
          {getStatusBadge(course.status)}
        </div>
        <div className="absolute bottom-4 left-4">
          <span className="px-3 py-1 bg-black/70 text-white text-sm rounded-full backdrop-blur-sm">
            {course.level}
          </span>
        </div>
      </div>

      {/* Course Content */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {course.title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {course.shortDescription || course.description}
        </p>

        {/* Course Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <FiUsers className="w-4 h-4 text-gray-400" />
              <p className="text-2xl font-bold text-gray-900">{course.currentEnrollments}</p>
            </div>
            <p className="text-xs text-gray-500">Students</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <FiBarChart2 className="w-4 h-4 text-gray-400" />
              <p className="text-2xl font-bold text-gray-900">{course.ratings?.average || 0}</p>
            </div>
            <p className="text-xs text-gray-500">Rating</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <FiDollarSign className="w-4 h-4 text-gray-400" />
              <p className="text-2xl font-bold text-gray-900">
                {course.fullCoursePrice ? formatCurrency(course.fullCoursePrice).replace('$', '') : '0'}
              </p>
            </div>
            <p className="text-xs text-gray-500">Price</p>
          </div>
        </div>

        {/* Manage Lessons Button */}
        {onManageLessons && (
          <button
            onClick={() => onManageLessons(course)}
            className="w-full mb-3 px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all duration-300 font-medium flex items-center justify-center gap-2"
          >
            <FiBook className="w-4 h-4" />
            Manage Lessons
          </button>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit?.(course)}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-300 font-medium flex items-center justify-center gap-2"
          >
            <FiEdit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => onViewStats?.(course)}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-300 font-medium flex items-center justify-center gap-2"
          >
            <FiBarChart2 className="w-4 h-4" />
            Stats
          </button>
          <button
            onClick={() => onDelete?.(course._id)}
            className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-300 font-medium flex items-center justify-center gap-2"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Status Update */}
        {course.status === 'draft' && (
          <button
            onClick={() => onUpdateStatus?.(course._id, 'pending')}
            className="w-full mt-3 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 font-medium text-sm"
          >
            Submit for Review
          </button>
        )}
      </div>
    </div>
  );
};

export default InstructorCourseCard;