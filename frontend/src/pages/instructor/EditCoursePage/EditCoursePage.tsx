// src/pages/instructor/EditCoursePage/EditCoursePage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { courseService, Course, EditCourseData, CreateCourseData } from '../../../services/api/courseService';
import CourseForm from '../../../components/course/CourseForm/CourseForm';
import { FiArrowLeft, FiSend, FiAlertCircle } from 'react-icons/fi';

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
      if (!courseId) {
        setError('Không tìm thấy ID khóa học');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 [EditCoursePage] Fetching instructor course:', courseId);
        console.log('👤 Current user:', user);

        // ✅ Gọi API đúng route cho instructor
        const response = await courseService.getInstructorCourseById(courseId);
        const courseData = response.course;

        console.log('📚 Course fetched:', courseData);
        console.log('📅 Current schedules:', courseData.schedules);

        // ✅ FIX: Kiểm tra dữ liệu course có tồn tại không
        if (!courseData) {
          setError('Không tìm thấy thông tin khóa học');
          setLoading(false);
          return;
        }

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
          setLoading(false);
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
          setLoading(false);
          return;
        }

        console.log('✅ Permission granted - User can edit this course');
        setCourse(courseData);
      } catch (error: any) {
        console.error('❌ Error fetching course:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Không thể tải thông tin khóa học';
        setError(errorMessage);
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
  if (!courseId || !course) {
    setError('Không tìm thấy khóa học để cập nhật');
    return;
  }

  try {
    setSubmitting(true);
    setError(null);

    console.log('🎯 [EditCoursePage] Submitting:', { formData, submitType });

    // ✅ FIX QUAN TRỌNG: Chuẩn bị dữ liệu update
    const updateData: EditCourseData = {
      title: formData.title,
      description: formData.description,
      shortDescription: formData.shortDescription,
      category: formData.category,
      subcategory: formData.subcategory,
      level: formData.level,
      pricingType: formData.pricingType,
      fullCoursePrice: formData.fullCoursePrice,
      maxStudents: formData.maxStudents,
      prerequisites: formData.prerequisites,
      learningOutcomes: formData.learningOutcomes,
      requirements: formData.requirements,
      tags: formData.tags,
      language: formData.language,
      thumbnail: formData.thumbnail,
      coverImage: formData.coverImage,
      promoVideo: formData.promoVideo,
      gallery: formData.gallery,
      featured: formData.featured,
      certificate: formData.certificate,
      
      // ✅ QUAN TRỌNG: Chỉ gửi schedules nếu có thay đổi, không gửi nếu không có
      schedules: (formData as any).schedules && (formData as any).schedules.length > 0 
        ? (formData as any).schedules 
        : undefined // Không gửi trường này nếu không thay đổi
    };

    // ✅ FIX: Loại bỏ các trường undefined để tránh lỗi server
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof EditCourseData] === undefined) {
        delete updateData[key as keyof EditCourseData];
      }
    });

    console.log('📤 Final update data:', updateData);
    console.log('📅 Schedules in update data:', updateData.schedules);

    let response;
    
    if (submitType === 'save') {
      response = await courseService.updateCourse(courseId, updateData);
      console.log('✅ Course saved as draft:', response);
      alert('Đã lưu thay đổi thành công!');
    } else {
      response = await courseService.updateCourse(courseId, updateData);
      console.log('✅ Course updated, submitting for approval:', response);
      
      // Chỉ submit for approval nếu course chưa được approved
      if (course.approvalStatus?.status !== 'approved') {
        await courseService.submitForApproval(courseId);
        alert('Khóa học đã được cập nhật và gửi để admin phê duyệt!');
      } else {
        alert('Khóa học đã được cập nhật thành công!');
      }
    }

    // Quay lại trang quản lý khóa học
    navigate('/instructor/courses');
  } catch (error: any) {
    console.error('❌ Error updating course:', error);
    
    // ✅ FIX: Hiển thị thông báo lỗi chi tiết hơn
    let errorMessage = 'Có lỗi xảy ra khi cập nhật khóa học';
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // Hiển thị thông báo lỗi chi tiết từ server nếu có
    if (error.response?.data?.details) {
      console.error('📋 Server error details:', error.response.data.details);
      errorMessage += `\nChi tiết: ${JSON.stringify(error.response.data.details)}`;
    }
    
    setError(errorMessage);
  } finally {
    setSubmitting(false);
  }
};
  const handleCancel = () => {
    if (window.confirm('Bạn có chắc muốn hủy? Các thay đổi chưa lưu sẽ bị mất.')) {
      navigate('/instructor/courses');
    }
  };

  // Hiển thị loading
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

  // Hiển thị lỗi nếu không tải được course
  if (error && !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Lỗi</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Thử lại
            </button>
            <button
              onClick={() => navigate('/instructor/courses')}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Hiển thị nếu không tìm thấy course
  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy khóa học</h2>
          <p className="text-gray-600 mb-6">Khóa học bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <button
            onClick={() => navigate('/instructor/courses')}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
          >
            Quay lại danh sách khóa học
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors group"
          >
            <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Quay lại danh sách khóa học
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa khóa học</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  course.status === 'published' 
                    ? 'bg-green-100 text-green-800' 
                    : course.status === 'pending_review'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {course.status === 'published'
                    ? 'Đã xuất bản'
                    : course.status === 'pending_review'
                    ? 'Đang chờ duyệt'
                    : 'Bản nháp'}
                </span>
                
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  course.approvalStatus?.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : course.approvalStatus?.status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {course.approvalStatus?.status === 'approved'
                    ? 'Đã phê duyệt'
                    : course.approvalStatus?.status === 'rejected'
                    ? 'Bị từ chối'
                    : 'Chưa phê duyệt'}
                </span>

                {course.schedules && course.schedules.length > 0 && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    📅 {course.schedules.length} lịch học
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 mt-3 max-w-2xl">
                {course.title}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 sm:mt-0 flex gap-2">
              <button
                onClick={() => window.open(`/courses/${course._id}`, '_blank')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Xem trước
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Lỗi khi cập nhật khóa học</h4>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <CourseForm
            course={course}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitting={submitting}
            isEdit={true}
          />
        </div>

        {/* Course Status Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <FiSend className="w-5 h-5" />
            Trạng thái khóa học
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="text-blue-600 font-medium">Trạng thái</div>
              <div className="text-blue-900 mt-1">
                {course.status === 'published'
                  ? '🟢 Đã xuất bản'
                  : course.status === 'pending_review'
                  ? '🟡 Đang chờ duyệt'
                  : '⚫ Bản nháp'}
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="text-blue-600 font-medium">Phê duyệt</div>
              <div className="text-blue-900 mt-1">
                {course.approvalStatus?.status === 'approved'
                  ? '✅ Đã phê duyệt'
                  : course.approvalStatus?.status === 'rejected'
                  ? '❌ Bị từ chối'
                  : '⏳ Đang chờ'}
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="text-blue-600 font-medium">Học viên</div>
              <div className="text-blue-900 mt-1">
                {course.currentEnrollments || 0} / {course.maxStudents || 20}
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="text-blue-600 font-medium">Đánh giá</div>
              <div className="text-blue-900 mt-1">
                ⭐ {course.ratings?.average?.toFixed(1) || '0.0'} ({course.ratings?.count || 0})
              </div>
            </div>
          </div>

          {course.approvalStatus?.reason && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-yellow-800 text-sm">
                <strong>Lý do từ admin:</strong> {course.approvalStatus.reason}
              </div>
            </div>
          )}
        </div>

        {/* Current Schedules Information */}
        {course.schedules && course.schedules.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              📅 Lịch học hiện tại
            </h3>
            <div className="text-sm text-green-800">
              <p className="mb-3">Các lịch học sau sẽ được giữ nguyên nếu bạn không thay đổi trong form:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {course.schedules.map((schedule, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border border-green-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-green-900">
                          {schedule.dayOfWeek === 0 ? 'Chủ nhật' :
                           schedule.dayOfWeek === 1 ? 'Thứ 2' :
                           schedule.dayOfWeek === 2 ? 'Thứ 3' :
                           schedule.dayOfWeek === 3 ? 'Thứ 4' :
                           schedule.dayOfWeek === 4 ? 'Thứ 5' :
                           schedule.dayOfWeek === 5 ? 'Thứ 6' : 'Thứ 7'}
                        </div>
                        <div className="text-green-700 text-sm mt-1">
                          ⏰ {schedule.startTime} - {schedule.endTime}
                        </div>
                        {schedule.meetingPlatform && schedule.meetingPlatform !== 'none' && (
                          <div className="text-green-600 text-xs mt-1">
                            📍 {schedule.meetingPlatform === 'zoom' ? 'Zoom' :
                                schedule.meetingPlatform === 'google_meet' ? 'Google Meet' :
                                schedule.meetingPlatform === 'microsoft_teams' ? 'Microsoft Teams' : 'Online'}
                          </div>
                        )}
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        schedule.isActive ? 'bg-green-500' : 'bg-gray-300'
                      }`} title={schedule.isActive ? 'Đang hoạt động' : 'Đã tắt'}></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-700 text-sm">
                  💡 <strong>Lưu ý:</strong> Nếu bạn thêm lịch học mới trong form, tất cả lịch học cũ sẽ bị thay thế. 
                  Để giữ nguyên lịch học hiện tại, không thay đổi phần lịch học trong form.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Debug Information (chỉ hiển thị trong development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 bg-gray-100 border border-gray-300 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Debug Information</h3>
            <details>
              <summary className="cursor-pointer text-sm text-gray-600">Xem chi tiết dữ liệu course</summary>
              <pre className="mt-2 text-xs bg-gray-800 text-green-400 p-3 rounded-lg overflow-auto max-h-60">
                {JSON.stringify(course, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditCoursePage;