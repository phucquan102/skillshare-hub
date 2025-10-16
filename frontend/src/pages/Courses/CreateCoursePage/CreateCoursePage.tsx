// src/pages/Courses/CreateCoursePage/CreateCoursePage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { courseService, CreateCourseData, EditCourseData } from '../../../services/api/courseService';
import CourseForm from '../../../components/course/CourseForm/CourseForm';

const CreateCoursePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateCourseData | EditCourseData, submitType: 'save' | 'submit') => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🎯 [CreateCoursePage] Submitting course:', { data, submitType });

      // ✅ FIX: Chuẩn bị dữ liệu với schedules
      const createData: CreateCourseData = {
        title: data.title || '',
        description: data.description || '',
        shortDescription: data.shortDescription || '',
        category: data.category || '',
        subcategory: data.subcategory || '',
        level: data.level || 'beginner',
        pricingType: data.pricingType || 'full_course',
        fullCoursePrice: data.fullCoursePrice || 0,
        maxStudents: data.maxStudents || 20,
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        prerequisites: Array.isArray(data.prerequisites) 
          ? data.prerequisites 
          : (data.prerequisites ? [data.prerequisites] : []),
        learningOutcomes: Array.isArray(data.learningOutcomes) 
          ? data.learningOutcomes 
          : (data.learningOutcomes ? [data.learningOutcomes] : []),
        requirements: Array.isArray(data.requirements) 
          ? data.requirements 
          : (data.requirements ? [data.requirements] : []),
        tags: Array.isArray(data.tags) 
          ? data.tags 
          : (data.tags ? [data.tags] : []),
        language: data.language || 'vi',
        thumbnail: data.thumbnail || '',
        // ✅ THÊM: Các trường mới từ interface
        schedules: (data as any).schedules || [], // Lấy schedules từ form data
        gallery: (data as any).gallery || [],
        coverImage: (data as any).coverImage || '',
        promoVideo: (data as any).promoVideo || '',
        // Certificate đã được xử lý đúng từ CourseForm
        certificate: data.certificate,
        featured: data.featured || false,
        // ✅ THÊM: Các trường optional khác
        coInstructors: (data as any).coInstructors || [],
        discount: (data as any).discount,
        courseType: (data as any).courseType || 'live_online',
        settings: (data as any).settings
      };

      console.log('📤 [CreateCoursePage] Final data to send:', createData);
      console.log('📅 Schedules in create data:', createData.schedules);

      // Validate dữ liệu bắt buộc
      if (!createData.title.trim()) {
        throw new Error('Tiêu đề khóa học là bắt buộc');
      }
      if (!createData.description.trim()) {
        throw new Error('Mô tả khóa học là bắt buộc');
      }
      if (!createData.category.trim()) {
        throw new Error('Danh mục khóa học là bắt buộc');
      }
      if (!createData.startDate) {
        throw new Error('Ngày bắt đầu là bắt buộc');
      }
      if (!createData.endDate) {
        throw new Error('Ngày kết thúc là bắt buộc');
      }

      // ✅ FIX: Validate schedules - BẮT BUỘC có ít nhất 1 schedule
      if (!createData.schedules || createData.schedules.length === 0) {
        throw new Error('Cần ít nhất một lịch học cho khóa học');
      }

      // Validate dates
      const startDate = new Date(createData.startDate);
      const endDate = new Date(createData.endDate);
      if (startDate >= endDate) {
        throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
      }

      // Validate pricing
      if ((createData.pricingType === 'full_course' || createData.pricingType === 'both') && 
          (!createData.fullCoursePrice || createData.fullCoursePrice <= 0)) {
        throw new Error('Giá khóa học phải lớn hơn 0 khi chọn thanh toán trọn khóa');
      }

      let response;
      
      if (submitType === 'save') {
        // Tạo course với status draft
        response = await courseService.createCourse(createData);
        console.log('✅ Course created as draft:', response);
        alert('Khóa học đã được tạo thành công dưới dạng bản nháp!');
      } else {
        // Tạo course và sau đó submit để phê duyệt
        response = await courseService.createCourse(createData);
        console.log('✅ Course created, submitting for approval:', response);
        
        // Submit course để phê duyệt
        await courseService.submitForApproval(response.course._id);
        alert('Khóa học đã được tạo và gửi để admin phê duyệt!');
      }

      // Điều hướng về trang quản lý khóa học
      navigate('/instructor/courses');

    } catch (error: any) {
      console.error('❌ Error creating course:', error);
      setError(error.message || 'Có lỗi xảy ra khi tạo khóa học');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/instructor/courses');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tạo khóa học mới</h1>
          <p className="text-gray-600 mt-2">Điền thông tin bên dưới để tạo khóa học mới</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Lỗi khi tạo khóa học</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Course Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <CourseForm 
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitting={loading}
            isEdit={false}
          />
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Hướng dẫn tạo khóa học</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Lưu bản nháp:</strong> Khóa học sẽ được lưu dưới dạng nháp và bạn có thể chỉnh sửa sau</li>
            <li>• <strong>Gửi để phê duyệt:</strong> Khóa học sẽ được gửi cho admin xem xét và phê duyệt</li>
            <li>• Các trường có dấu * là bắt buộc</li>
            <li>• <strong>Lịch học:</strong> Bắt buộc phải có ít nhất một lịch học</li>
            <li>• Đảm bảo thông tin mô tả rõ ràng và hấp dẫn</li>
            <li>• Ngày kết thúc phải sau ngày bắt đầu</li>
            <li>• Giá khóa học phải lớn hơn 0 khi chọn thanh toán trọn khóa</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateCoursePage;