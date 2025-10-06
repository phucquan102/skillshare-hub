// src/pages/instructor/EditCoursePage/EditCoursePage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { courseService, Course, EditCourseData, CreateCourseData } from '../../../services/api/courseService';
import CourseForm from '../../../components/course/CourseForm/CourseForm';
import { FiArrowLeft, FiSend } from 'react-icons/fi';

const EditCoursePage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;

      try {
        setLoading(true);
        console.log('🔍 [EditCoursePage] Fetching instructor course:', courseId);
        console.log('👤 Current user:', user);

        // ✅ Gọi API đúng route cho instructor
        const response = await courseService.getInstructorCourseById(courseId);
        const courseData = response.course;

        console.log('📚 Course fetched:', courseData);
        console.log('📅 Current schedules:', courseData.schedules); // Debug schedules

        // ✅ FIX QUAN TRỌNG: Xử lý cả 2 trường hợp instructor là object hoặc string
        let instructorId: string;
        
        if (typeof courseData.instructor === 'string') {
          // Trường hợp instructor là string ID
          instructorId = courseData.instructor;
          console.log('📝 Instructor is string:', instructorId);
        } else if (courseData.instructor && courseData.instructor._id) {
          // Trường hợp instructor là object có _id
          instructorId = courseData.instructor._id;
          console.log('📝 Instructor is object with _id:', instructorId);
        } else {
          console.error('❌ Invalid instructor data:', courseData.instructor);
          setError('Dữ liệu instructor không hợp lệ');
          return;
        }

        const userId = user?._id || user?.id;
        
        console.log('🔐 [DEBUG] Permission check details:', {
          instructorId,
          userId,
          typeOfInstructorId: typeof instructorId,
          typeOfUserId: typeof userId,
          stringInstructorId: String(instructorId),
          stringUserId: String(userId),
          equality: String(instructorId) === String(userId)
        });

        // ✅ Kiểm tra quyền CHÍNH XÁC
        const isAdmin = user?.role === 'admin';
        const isCourseInstructor = String(instructorId) === String(userId);

        console.log('🔐 [DEBUG] Permission results:', { 
          isAdmin, 
          isCourseInstructor,
          userRole: user?.role
        });

        if (!isAdmin && !isCourseInstructor) {
          console.error('❌ Permission denied - Details:', {
            isAdmin,
            isCourseInstructor,
            instructorId,
            userId
          });
          setError('Bạn không có quyền chỉnh sửa khóa học này');
          return;
        }

        console.log('✅ Permission granted - User can edit this course');
        setCourse(courseData);
      } catch (error: any) {
        console.error('❌ Error fetching course:', error);
        setError('Không thể tải thông tin khóa học: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, user]);

  const handleSubmit = async (
    formData: CreateCourseData | EditCourseData,
    submitType: 'save' | 'submit'
  ) => {
    if (!courseId || !course) return;

    try {
      setSubmitting(true);
      setError(null);

      console.log('🎯 [EditCoursePage] Submitting:', { formData, submitType });
      console.log('📅 Current course schedules:', course.schedules); // Debug current schedules
      console.log('📅 Form data schedules:', (formData as any).schedules); // Debug form schedules

      // ✅ QUAN TRỌNG: Giữ nguyên schedules nếu không có thay đổi
      const updateData: EditCourseData = {
        ...formData,
        // Giữ nguyên schedules cũ nếu formData không có schedules hoặc schedules rỗng
        schedules: (formData as any).schedules && (formData as any).schedules.length > 0 
          ? (formData as any).schedules 
          : course.schedules || []
      };

      console.log('📅 Final schedules to update:', updateData.schedules);

      let response;
      if (submitType === 'save') {
        response = await courseService.updateCourse(courseId, updateData);
        console.log('✅ Course saved as draft:', response);
        alert('Đã lưu thay đổi thành công!');
      } else {
        response = await courseService.updateCourse(courseId, updateData);
        console.log('✅ Course updated, submitting for approval:', response);
        await courseService.submitForApproval(courseId);
        alert('Khóa học đã được cập nhật và gửi để admin phê duyệt!');
      }

      navigate('/instructor/courses');
    } catch (error: any) {
      console.error('❌ Error updating course:', error);
      setError(error.message || 'Có lỗi xảy ra khi cập nhật khóa học');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/instructor/courses');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Đang tải thông tin khóa học...</p>
        </div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiSend className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Lỗi</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/instructor/courses')}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy khóa học</h2>
          <button
            onClick={() => navigate('/instructor/courses')}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            Quay lại
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa khóa học</h1>
              <p className="text-gray-600 mt-2">
                {course.title} •{' '}
                {course.status === 'published'
                  ? 'Đã xuất bản'
                  : course.status === 'pending_review'
                  ? 'Đang chờ duyệt'
                  : 'Bản nháp'}
              </p>
              {course.schedules && course.schedules.length > 0 && (
                <p className="text-sm text-blue-600 mt-1">
                  📅 Đã có {course.schedules.length} lịch học được thiết lập
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <CourseForm
            course={course}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitting={submitting}
            isEdit={true}
          />
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Trạng thái khóa học</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <strong>Hiện tại:</strong>{' '}
              {course.status === 'published'
                ? 'Đã xuất bản'
                : course.status === 'pending_review'
                ? 'Đang chờ duyệt'
                : 'Bản nháp'}
            </div>
            <div>
              <strong>Phê duyệt:</strong>{' '}
              {course.approvalStatus?.status === 'approved'
                ? 'Đã phê duyệt'
                : course.approvalStatus?.status === 'rejected'
                ? 'Bị từ chối'
                : 'Đang chờ'}
            </div>
            {course.approvalStatus?.reason && (
              <div className="md:col-span-2">
                <strong>Lý do:</strong> {course.approvalStatus.reason}
              </div>
            )}
          </div>
        </div>

        {/* Hiển thị thông tin schedules hiện tại */}
        {course.schedules && course.schedules.length > 0 && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="font-semibold text-green-900 mb-2">Lịch học hiện tại</h3>
            <div className="text-sm text-green-800">
              <p className="mb-2">Các lịch học sau sẽ được giữ nguyên nếu bạn không thay đổi:</p>
              <ul className="list-disc list-inside space-y-1">
                {course.schedules.map((schedule, index) => (
                  <li key={index}>
                    {schedule.dayOfWeek} • {schedule.startTime} - {schedule.endTime}
                    {schedule.date && ` • Ngày: ${new Date(schedule.date).toLocaleDateString('vi-VN')}`}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditCoursePage;