import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService, Course } from '../../../services/api/courseService';

const AdminCourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (courseId) {
      fetchCourseDetail();
    }
  }, [courseId]);

  const fetchCourseDetail = async () => {
    if (!courseId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await courseService.getCourseById(courseId);
      setCourse(response.course);
    } catch (error: any) {
      console.error('Error fetching course details:', error);
      setError(error?.response?.data?.message || 'Unable to load course information');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!courseId) return;
    
    setActionLoading(prev => ({ ...prev, approve: true }));
    try {
      await courseService.approveCourse(courseId);
      await fetchCourseDetail();
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Unable to approve course');
    } finally {
      setActionLoading(prev => ({ ...prev, approve: false }));
    }
  };

  const handleReject = async () => {
    if (!courseId) return;
    
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    
    setActionLoading(prev => ({ ...prev, reject: true }));
    try {
      await courseService.rejectCourse(courseId, reason);
      await fetchCourseDetail();
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Unable to reject course');
    } finally {
      setActionLoading(prev => ({ ...prev, reject: false }));
    }
  };

  const handleDelete = async () => {
    if (!courseId || !course) return;
    
    if (course.currentEnrollments > 0) {
      alert('Cannot delete course with enrolled students');
      return;
    }

    const confirmMessage = course.status === 'archived' 
      ? 'Are you sure you want to PERMANENTLY DELETE this course? This action cannot be undone!'
      : 'Are you sure you want to delete this course?';

    if (!window.confirm(confirmMessage)) return;

    setActionLoading(prev => ({ ...prev, delete: true }));
    try {
      await courseService.deleteCourse(courseId);
      navigate('/admin/courses');
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Unable to delete course');
      setActionLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const handleArchive = async () => {
    if (!courseId) return;
    
    setActionLoading(prev => ({ ...prev, archive: true }));
    try {
      // 🛠 FIX: Pass object { status: 'archived' }
      await courseService.updateCourseStatus(courseId, { status: 'archived' });
      await fetchCourseDetail();
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Unable to archive course');
    } finally {
      setActionLoading(prev => ({ ...prev, archive: false }));
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <span className="animate-spin text-2xl">⏳</span>
          <span className="ml-3 text-gray-600">Loading course information...</span>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="flex items-center">
            <span className="mr-2">⚠️</span>
            <span>{error || 'Course not found'}</span>
          </div>
          <button
            onClick={() => navigate('/admin/courses')}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Back to list
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      pending_review: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const translateStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      published: 'Published',
      draft: 'Draft',
      pending_review: 'Pending Review',
      rejected: 'Rejected',
      archived: 'Archived',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <button
            onClick={() => navigate('/admin/courses')}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <span className="mr-2">←</span>
            Back to list
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{course.title}</h1>
          <p className="text-gray-600 mt-2">{course.shortDescription || course.description}</p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-2">
          {course.status === 'pending_review' && (
            <>
              <button
                onClick={handleApprove}
                disabled={actionLoading.approve}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading.approve ? 'Approving...' : 'Approve'}
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading.reject}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading.reject ? 'Rejecting...' : 'Reject'}
              </button>
            </>
          )}
          
          {course.status !== 'archived' && course.currentEnrollments === 0 && (
            <button
              onClick={handleDelete}
              disabled={actionLoading.delete}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading.delete ? 'Deleting...' : 'Delete'}
            </button>
          )}
          
          {course.status !== 'archived' && course.currentEnrollments > 0 && (
            <button
              onClick={handleArchive}
              disabled={actionLoading.archive}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
            >
              {actionLoading.archive ? 'Archiving...' : 'Archive'}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Course Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thumbnail */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Thumbnail</h2>
            <img
              src={course.thumbnail || '/default-course.jpg'}
              alt={course.title}
              className="w-full h-64 object-cover rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/default-course.jpg';
              }}
            />
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Detailed Description</h2>
            <p className="text-gray-700 whitespace-pre-line">{course.description}</p>
          </div>

          {/* Course Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Course Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Category:</strong> {course.category}
              </div>
              <div>
                <strong>Level:</strong> {course.level}
              </div>
              <div>
                <strong>Language:</strong> {course.language || 'Vietnamese'}
              </div>
              <div>
                <strong>Payment Type:</strong> {course.pricingType}
              </div>
              <div>
                <strong>Price:</strong> {course.fullCoursePrice ? `${course.fullCoursePrice.toLocaleString()} VND` : 'Free'}
              </div>
              <div>
                <strong>Maximum Students:</strong> {course.maxStudents}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Status</h3>
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(course.status)}`}>
                {translateStatus(course.status)}
              </span>
              <span className="text-sm text-gray-500">
                {course.currentEnrollments} / {course.maxStudents} students
              </span>
            </div>
          </div>

          {/* Instructor Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Instructor</h3>
            <div className="flex items-center space-x-3">
              <img
                src={course.instructor?.profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor?.fullName || 'Unknown')}&background=random`}
                alt={course.instructor?.fullName}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-medium">{course.instructor?.fullName}</p>
                <p className="text-sm text-gray-500">{course.instructor?.email}</p>
              </div>
            </div>
          </div>

          {/* Course Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Statistics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Number of lessons:</span>
                <span>{course.lessons?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Current students:</span>
                <span>{course.currentEnrollments}</span>
              </div>
              <div className="flex justify-between">
                <span>Created date:</span>
                <span>{new Date(course.createdAt).toLocaleDateString('en-US')}</span>
              </div>
              <div className="flex justify-between">
                <span>Updated date:</span>
                <span>{new Date(course.updatedAt).toLocaleDateString('en-US')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCourseDetailPage;