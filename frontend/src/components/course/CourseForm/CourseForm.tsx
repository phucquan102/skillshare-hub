// src/components/course/CourseForm/CourseForm.tsx
import React, { useState, useEffect } from 'react';
import { Course, CreateCourseData, EditCourseData } from './../../../services/api/courseService';
import { FiSave, FiSend, FiX, FiPlus, FiTrash2 } from 'react-icons/fi';

interface CourseFormProps {
  course?: Course;
  onSubmit: (data: CreateCourseData | EditCourseData, submitType: 'save' | 'submit') => void;
  onCancel: () => void;
  submitting?: boolean;
  isEdit?: boolean;
}

interface Schedule {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  date?: string;
  _id?: string;
}

const CourseForm: React.FC<CourseFormProps> = ({
  course,
  onSubmit,
  onCancel,
  submitting = false,
  isEdit = false
}) => {
  // State cho schedules
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // Hàm format date để xử lý cả ISO string và Date object
  const formatDateForInput = (dateValue: any): string => {
    if (!dateValue) return '';
    
    try {
      // Nếu là string ISO (từ MongoDB)
      if (typeof dateValue === 'string') {
        const date = new Date(dateValue);
        return date.toISOString().split('T')[0];
      }
      // Nếu là Date object
      else if (dateValue instanceof Date) {
        return dateValue.toISOString().split('T')[0];
      }
      // Nếu đã là định dạng YYYY-MM-DD
      else if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
      }
    } catch (error) {
      console.error('Error formatting date:', error);
    }
    
    return '';
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    category: '',
    subcategory: '',
    level: 'beginner',
    pricingType: 'full_course',
    fullCoursePrice: 0,
    maxStudents: 20,
    startDate: '',
    endDate: '',
    prerequisites: '',
    learningOutcomes: '',
    requirements: '',
    tags: '',
    language: 'en',
    thumbnail: '',
    certificate: false,
    featured: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // ✅ QUAN TRỌNG: useEffect để đồng bộ dữ liệu khi course thay đổi
  useEffect(() => {
    if (isEdit && course) {
      console.log("🪄 Updating form when course changes:", course);

      // ✅ THÊM DEBUG: Kiểm tra xem course có startDate và endDate không
      console.log("📅 Course date fields:", {
        hasStartDate: !!course.startDate,
        hasEndDate: !!course.endDate,
        startDate: course.startDate,
        endDate: course.endDate,
        courseKeys: Object.keys(course)
      });

      // ✅ THÊM FALLBACK: Nếu không có startDate/endDate, dùng giá trị mặc định
      const today = new Date().toISOString().split('T')[0];
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      const oneMonthLaterStr = oneMonthLater.toISOString().split('T')[0];

      setFormData({
        title: course.title || '',
        description: course.description || '',
        shortDescription: course.shortDescription || '',
        category: course.category || '',
        subcategory: course.subcategory || '',
        level: course.level || 'beginner',
        pricingType: course.pricingType || 'full_course',
        fullCoursePrice: course.fullCoursePrice || 0,
        maxStudents: course.maxStudents || 20,
        // ✅ SỬA QUAN TRỌNG: Nếu không có date từ API, dùng giá trị mặc định
        startDate: course.startDate ? formatDateForInput(course.startDate) : today,
        endDate: course.endDate ? formatDateForInput(course.endDate) : oneMonthLaterStr,
        prerequisites: course.prerequisites?.join(', ') || '',
        learningOutcomes: course.learningOutcomes?.join(', ') || '',
        requirements: course.requirements?.join(', ') || '',
        tags: course.tags?.join(', ') || '',
        language: course.language || 'en',
        thumbnail: course.thumbnail || '',
        certificate: course?.certificate && typeof course.certificate === 'object' 
          ? (course.certificate.isEnabled || false) 
          : false,
        featured: course.featured || false,
      });

      // Đồng bộ luôn schedules khi edit
      if (course.schedules && course.schedules.length > 0) {
        console.log('📅 Initializing schedules from course:', course.schedules);
        setSchedules(
          course.schedules.map(schedule => ({
            dayOfWeek: schedule.dayOfWeek || '',
            startTime: schedule.startTime || '',
            endTime: schedule.endTime || '',
            date: schedule.date || '',
            _id: schedule._id
          }))
        );
      } else {
        setSchedules([]);
      }
    }
  }, [course, isEdit]);

  // Thêm schedule mới
  const addSchedule = () => {
    setSchedules([...schedules, { dayOfWeek: '', startTime: '', endTime: '' }]);
  };

  // Cập nhật schedule
  const updateSchedule = (index: number, field: keyof Schedule, value: string) => {
    const updatedSchedules = schedules.map((schedule, i) =>
      i === index ? { ...schedule, [field]: value } : schedule
    );
    setSchedules(updatedSchedules);
  };

  // Xóa schedule
  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    
    // Xử lý các trường number
    if (name === 'fullCoursePrice' || name === 'maxStudents') {
      processedValue = value === '' ? 0 : Number(value);
    }
    // Xử lý checkbox
    else if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) newErrors.title = 'Tiêu đề là bắt buộc';
    if (!formData.description.trim()) newErrors.description = 'Mô tả là bắt buộc';
    if (!formData.category.trim()) newErrors.category = 'Danh mục là bắt buộc';
    if (!formData.startDate) newErrors.startDate = 'Ngày bắt đầu là bắt buộc';
    if (!formData.endDate) newErrors.endDate = 'Ngày kết thúc là bắt buộc';
    
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start >= end) newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }

    if ((formData.pricingType === 'full_course' || formData.pricingType === 'both') && 
        (!formData.fullCoursePrice || formData.fullCoursePrice <= 0)) {
      newErrors.fullCoursePrice = 'Giá khóa học phải lớn hơn 0';
    }

    if (formData.maxStudents < 1) {
      newErrors.maxStudents = 'Số học viên tối đa phải ít nhất là 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const prepareFormData = (): CreateCourseData | EditCourseData => {
    const baseData = {
      title: formData.title,
      description: formData.description,
      shortDescription: formData.shortDescription || undefined,
      category: formData.category,
      subcategory: formData.subcategory || undefined,
      level: formData.level,
      pricingType: formData.pricingType,
      fullCoursePrice: formData.fullCoursePrice || undefined,
      maxStudents: formData.maxStudents,
      startDate: formData.startDate,
      endDate: formData.endDate,
      prerequisites: formData.prerequisites ? formData.prerequisites.split(',').map(p => p.trim()).filter(p => p) : [],
      learningOutcomes: formData.learningOutcomes ? formData.learningOutcomes.split(',').map(o => o.trim()).filter(o => o) : [],
      requirements: formData.requirements ? formData.requirements.split(',').map(r => r.trim()).filter(r => r) : [],
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
      language: formData.language,
      thumbnail: formData.thumbnail || undefined,
      featured: formData.featured,
      // Chuyển boolean thành object certificate
      certificate: formData.certificate ? {
        isEnabled: true,
        template: 'default',
        issuedBy: 'SkillShare Hub'
      } : undefined,
      // Thêm schedules vào dữ liệu gửi đi
      schedules: schedules.filter(schedule => 
        schedule.dayOfWeek && schedule.startTime && schedule.endTime
      ),
    };

    console.log('📅 Prepared form data with schedules:', baseData.schedules);
    console.log('📅 Prepared form data with dates:', {
      startDate: baseData.startDate,
      endDate: baseData.endDate
    });
    return baseData as CreateCourseData | EditCourseData;
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData = prepareFormData();
    console.log('📝 [CourseForm] Saving draft:', submitData);
    onSubmit(submitData, 'save');
  };

  const handleSubmitForReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData = prepareFormData();
    console.log('📤 [CourseForm] Submitting for review:', submitData);
    onSubmit(submitData, 'submit');
  };

  return (
    <form className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tiêu đề khóa học *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nhập tiêu đề khóa học"
          />
          {errors.title && <p className="mt-1 text-red-500 text-sm">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả ngắn
          </label>
          <textarea
            name="shortDescription"
            value={formData.shortDescription}
            onChange={handleChange}
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            placeholder="Mô tả ngắn về khóa học (tối đa 300 ký tự)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả chi tiết *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Mô tả chi tiết về khóa học"
          />
          {errors.description && <p className="mt-1 text-red-500 text-sm">{errors.description}</p>}
        </div>
      </div>

      {/* Category and Level */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Danh mục *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${
              errors.category ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Chọn danh mục</option>
            <option value="programming">Lập trình</option>
            <option value="design">Thiết kế</option>
            <option value="business">Kinh doanh</option>
            <option value="marketing">Marketing</option>
            <option value="language">Ngôn ngữ</option>
            <option value="music">Âm nhạc</option>
            <option value="photography">Nhiếp ảnh</option>
            <option value="cooking">Nấu ăn</option>
            <option value="fitness">Thể dục</option>
            <option value="art">Nghệ thuật</option>
            <option value="writing">Viết lách</option>
            <option value="other">Khác</option>
          </select>
          {errors.category && <p className="mt-1 text-red-500 text-sm">{errors.category}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cấp độ
          </label>
          <select
            name="level"
            value={formData.level}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
          >
            <option value="beginner">Người mới bắt đầu</option>
            <option value="intermediate">Trung cấp</option>
            <option value="advanced">Nâng cao</option>
          </select>
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại định giá
          </label>
          <select
            name="pricingType"
            value={formData.pricingType}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
          >
            <option value="full_course">Thanh toán trọn khóa</option>
            <option value="per_lesson">Thanh toán theo bài học</option>
            <option value="both">Cả hai</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Giá khóa học ($) *
          </label>
          <input
            type="number"
            name="fullCoursePrice"
            value={formData.fullCoursePrice}
            onChange={handleChange}
            min="0"
            step="0.01"
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${
              errors.fullCoursePrice ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.fullCoursePrice && <p className="mt-1 text-red-500 text-sm">{errors.fullCoursePrice}</p>}
        </div>
      </div>

      {/* Dates and Capacity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày bắt đầu *
          </label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${
              errors.startDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.startDate && <p className="mt-1 text-red-500 text-sm">{errors.startDate}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày kết thúc *
          </label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${
              errors.endDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.endDate && <p className="mt-1 text-red-500 text-sm">{errors.endDate}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Số học viên tối đa
          </label>
          <input
            type="number"
            name="maxStudents"
            value={formData.maxStudents}
            onChange={handleChange}
            min="1"
            max="100"
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${
              errors.maxStudents ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.maxStudents && <p className="mt-1 text-red-500 text-sm">{errors.maxStudents}</p>}
        </div>
      </div>

      {/* Schedules Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Lịch học</h3>
          <button
            type="button"
            onClick={addSchedule}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Thêm lịch học
          </button>
        </div>

        {schedules.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              📅 Hiện có {schedules.length} lịch học. Bạn có thể chỉnh sửa hoặc thêm mới.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {schedules.map((schedule, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Day of Week */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày trong tuần *
                  </label>
                  <select
                    value={schedule.dayOfWeek}
                    onChange={(e) => updateSchedule(index, 'dayOfWeek', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Chọn ngày</option>
                    <option value="monday">Thứ 2</option>
                    <option value="tuesday">Thứ 3</option>
                    <option value="wednesday">Thứ 4</option>
                    <option value="thursday">Thứ 5</option>
                    <option value="friday">Thứ 6</option>
                    <option value="saturday">Thứ 7</option>
                    <option value="sunday">Chủ nhật</option>
                  </select>
                </div>

                {/* Start Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giờ bắt đầu *
                  </label>
                  <input
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) => updateSchedule(index, 'startTime', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* End Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giờ kết thúc *
                  </label>
                  <input
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) => updateSchedule(index, 'endTime', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Remove Button */}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeSchedule(index)}
                    className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {schedules.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500">Chưa có lịch học nào được thiết lập</p>
            <p className="text-sm text-gray-400 mt-1">Nhấn "Thêm lịch học" để thiết lập lịch học cho khóa học</p>
          </div>
        )}
      </div>

      {/* Certificate Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          name="certificate"
          checked={formData.certificate}
          onChange={handleChange}
          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-900">
          Cung cấp chứng chỉ hoàn thành khóa học
        </label>
      </div>

      {/* Additional Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Điều kiện tiên quyết
          </label>
          <textarea
            name="prerequisites"
            value={formData.prerequisites}
            onChange={handleChange}
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            placeholder="Nhập các điều kiện tiên quyết, phân cách bằng dấu phẩy"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kết quả học tập
          </label>
          <textarea
            name="learningOutcomes"
            value={formData.learningOutcomes}
            onChange={handleChange}
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            placeholder="Nhập các kết quả học tập mong đợi, phân cách bằng dấu phẩy"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={submitting}
          className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <FiSave className="w-5 h-5" />
          {submitting ? 'Đang lưu...' : 'Lưu bản nháp'}
        </button>

        <button
          type="button"
          onClick={handleSubmitForReview}
          disabled={submitting}
          className="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <FiSend className="w-5 h-5" />
          {submitting ? 'Đang gửi...' : 'Gửi để phê duyệt'}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <FiX className="w-5 h-5" />
          Hủy
        </button>
      </div>
    </form>
  );
};

export default CourseForm;