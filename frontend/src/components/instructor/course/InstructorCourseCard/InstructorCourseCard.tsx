import React from 'react';
import { Course } from '../../../../services/api/courseService';
import { 
  FiEdit, 
  FiTrash2, 
  FiBarChart2,
  FiUsers,
  FiDollarSign,
  FiBook,
  FiEye,
  FiClock,
  FiStar
} from 'react-icons/fi';
import { HiOutlineAcademicCap } from 'react-icons/hi';

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
      draft: { 
        label: 'Draft', 
        color: 'bg-gray-100 text-gray-800 border border-gray-200',
        icon: '📝'
      },
      published: { 
        label: 'Published', 
        color: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        icon: '✅'
      },
      pending: { 
        label: 'Pending Review', 
        color: 'bg-amber-100 text-amber-800 border border-amber-200',
        icon: '⏳'
      },
      rejected: { 
        label: 'Revisions Needed', 
        color: 'bg-red-100 text-red-800 border border-red-200',
        icon: '⚠️'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <span className={`px-3 py-1.5 rounded-2xl text-xs font-semibold ${config.color} flex items-center gap-1.5 backdrop-blur-sm`}>
        <span>{config.icon}</span>
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

  const getLevelBadge = (level: string) => {
    const levelConfig = {
      beginner: { color: 'from-green-500 to-emerald-500', label: 'Beginner' },
      intermediate: { color: 'from-blue-500 to-cyan-500', label: 'Intermediate' },
      advanced: { color: 'from-purple-500 to-pink-500', label: 'Advanced' }
    };
    
    const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.beginner;
    
    return (
      <span className={`px-3 py-1.5 bg-gradient-to-r ${config.color} text-white text-xs font-semibold rounded-2xl backdrop-blur-sm shadow-lg`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="group bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/20 overflow-hidden hover:-translate-y-2">
      {/* Course Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={course.thumbnail || '/default-course.jpg'}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Status Badge */}
        <div className="absolute top-4 left-4">
          {getStatusBadge(course.status)}
        </div>
        
        {/* Level Badge */}
        <div className="absolute top-4 right-4">
          {getLevelBadge(course.level)}
        </div>

        {/* Quick Actions Overlay */}
        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
          <div className="flex justify-center gap-2">
            <button
              onClick={() => onEdit?.(course)}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg"
            >
              <FiEdit className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={() => onViewStats?.(course)}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg"
            >
              <FiBarChart2 className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={() => onManageLessons?.(course)}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg"
            >
              <FiBook className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="p-6">
        {/* Course Title & Description */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors duration-300">
            {course.title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
            {course.shortDescription || course.description}
          </p>
        </div>

        {/* Course Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <div className="p-2 bg-emerald-500 rounded-xl">
                <FiUsers className="w-3 h-3 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{course.currentEnrollments || 0}</p>
            </div>
            <p className="text-xs text-gray-600 font-medium">Students</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <div className="p-2 bg-amber-500 rounded-xl">
                <FiStar className="w-3 h-3 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{course.ratings?.average || 0}</p>
            </div>
            <p className="text-xs text-gray-600 font-medium">Rating</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <div className="p-2 bg-green-500 rounded-xl">
                <FiDollarSign className="w-3 h-3 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {course.fullCoursePrice ? formatCurrency(course.fullCoursePrice).replace('$', '') : '0'}
              </p>
            </div>
            <p className="text-xs text-gray-600 font-medium">Price</p>
          </div>
        </div>

        {/* Primary Action Button */}
        {onManageLessons && (
          <button
            onClick={() => onManageLessons(course)}
            className="w-full mb-4 px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 font-semibold flex items-center justify-center gap-3 group/btn"
          >
            <FiBook className="w-5 h-5 group-hover/btn:scale-110 transition-transform duration-300" />
            Manage Course Content
          </button>
        )}

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onEdit?.(course)}
            className="px-4 py-3 bg-white border-2 border-emerald-200 text-emerald-600 rounded-2xl hover:bg-emerald-50 hover:border-emerald-300 hover:scale-[1.02] transition-all duration-300 font-medium flex items-center justify-center gap-2 group/edit"
          >
            <FiEdit className="w-4 h-4 group-hover/edit:scale-110 transition-transform duration-300" />
            Edit
          </button>
          
          <button
            onClick={() => onViewStats?.(course)}
            className="px-4 py-3 bg-white border-2 border-blue-200 text-blue-600 rounded-2xl hover:bg-blue-50 hover:border-blue-300 hover:scale-[1.02] transition-all duration-300 font-medium flex items-center justify-center gap-2 group/stats"
          >
            <FiBarChart2 className="w-4 h-4 group-hover/stats:scale-110 transition-transform duration-300" />
            Analytics
          </button>
          
          <button
            onClick={() => onDelete?.(course._id)}
            className="px-4 py-3 bg-white border-2 border-red-200 text-red-600 rounded-2xl hover:bg-red-50 hover:border-red-300 hover:scale-[1.02] transition-all duration-300 font-medium flex items-center justify-center gap-2 group/delete"
          >
            <FiTrash2 className="w-4 h-4 group-hover/delete:scale-110 transition-transform duration-300" />
            Delete
          </button>
          
          <button className="px-4 py-3 bg-white border-2 border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-50 hover:border-gray-300 hover:scale-[1.02] transition-all duration-300 font-medium flex items-center justify-center gap-2 group/preview">
            <FiEye className="w-4 h-4 group-hover/preview:scale-110 transition-transform duration-300" />
            Preview
          </button>
        </div>

        {/* Quick Status Update */}
        {course.status === 'draft' && (
          <button
            onClick={() => onUpdateStatus?.(course._id, 'pending')}
            className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 font-semibold text-sm flex items-center justify-center gap-2"
          >
            <HiOutlineAcademicCap className="w-4 h-4" />
            Submit for Review
          </button>
        )}
      </div>
    </div>
  );
};

export default InstructorCourseCard;