// src/components/course/CourseForm/CourseForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Course, CreateCourseData, EditCourseData, GalleryImage } from './../../../services/api/courseService';
import { uploadService } from '../../../services/api/uploadService';
import { FiSave, FiSend, FiX, FiPlus, FiTrash2, FiImage, FiUpload, FiVideo } from 'react-icons/fi';

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

interface UploadProgress {
  [key: string]: number;
}

// Interface cho kết quả upload
interface UploadResult {
  url: string;
  public_id: string;
  format: string;
  resource_type: string;
  bytes: number;
  duration?: number;
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
  
  // State cho gallery images
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  
  // State cho upload progress
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [uploading, setUploading] = useState(false);

  // Refs cho file inputs
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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
    coverImage: '',
    promoVideo: '',
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
        coverImage: course.coverImage || '',
        promoVideo: course.promoVideo || '',
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

      // Đồng bộ gallery images
      if (course.gallery && course.gallery.length > 0) {
        console.log('🖼️ Initializing gallery from course:', course.gallery);
        setGallery(course.gallery);
      } else {
        setGallery([]);
      }
    }
  }, [course, isEdit]);

  // Hàm upload file sử dụng uploadService
  const uploadFile = async (file: File, type: 'image' | 'video'): Promise<UploadResult> => {
    console.log('🔄 Starting upload:', { 
      type, 
      fileName: file.name, 
      size: file.size,
      mimeType: file.type 
    });

    try {
      setUploading(true);
      const fieldName = `uploading_${type}_${Date.now()}`;
      
      // Simulate progress for better UX
      setUploadProgress(prev => ({ ...prev, [fieldName]: 10 }));
      
      let result: UploadResult;
      
      if (type === 'image') {
        const response = await uploadService.uploadImage(file);
        if (!response.image) {
          throw new Error('Upload response does not contain image data');
        }
        result = response.image;
      } else {
        const response = await uploadService.uploadVideo(file);
        if (!response.video) {
          throw new Error('Upload response does not contain video data');
        }
        result = response.video;
      }

      // Complete progress
      setUploadProgress(prev => ({ ...prev, [fieldName]: 100 }));

      // Clear progress after delay
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fieldName];
          return newProgress;
        });
      }, 1000);

      console.log('✅ Upload successful:', result);
      return result;

    } catch (error: any) {
      console.error('❌ Upload failed:', error);
      
      // Hiển thị thông báo lỗi chi tiết
      let errorMessage = 'Upload thất bại';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Hàm xử lý upload thumbnail
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng ảnh
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh (JPEG, PNG, etc.)');
      return;
    }

    // Kiểm tra kích thước file (tối đa 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 10MB');
      return;
    }

    try {
      const result = await uploadFile(file, 'image');
      setFormData(prev => ({ ...prev, thumbnail: result.url }));
    } catch (error: any) {
      alert(`Upload ảnh đại diện thất bại: ${error.message}`);
    }
  };

  // Hàm xử lý upload cover image
  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 10MB');
      return;
    }

    try {
      const result = await uploadFile(file, 'image');
      setFormData(prev => ({ ...prev, coverImage: result.url }));
    } catch (error: any) {
      alert(`Upload ảnh cover thất bại: ${error.message}`);
    }
  };

  // Hàm xử lý upload gallery images
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    console.log('🖼️ Uploading gallery images:', files.length);

    // Kiểm tra định dạng ảnh
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      alert('Vui lòng chỉ chọn file ảnh (JPEG, PNG, etc.)');
      return;
    }

    // Kiểm tra kích thước
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert('Một số file có kích thước quá lớn. Vui lòng chọn file nhỏ hơn 10MB');
      return;
    }

    try {
      setUploading(true);
      
      // Upload từng file một để có progress riêng
      for (const file of files) {
        console.log('📤 Uploading gallery image:', file.name);
        
        const result = await uploadFile(file, 'image');
        
        const newImage: GalleryImage = {
          url: result.url,
          alt: file.name.split('.')[0] || `Image ${gallery.length + 1}`,
          caption: '',
          order: gallery.length,
          isFeatured: false
        };
        
        setGallery(prev => [...prev, newImage]);
      }
      
      console.log('✅ All gallery images uploaded successfully');
    } catch (error: any) {
      console.error('❌ Gallery upload failed:', error);
      alert(`Upload ảnh gallery thất bại: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Hàm xử lý upload video
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng video
    const videoFormats = ['mp4', 'mov', 'avi', 'webm'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !videoFormats.includes(fileExtension)) {
      alert('Định dạng video không hợp lệ. Chấp nhận: MP4, MOV, AVI, WEBM');
      return;
    }

    if (!file.type.startsWith('video/')) {
      alert('Vui lòng chọn file video');
      return;
    }

    // Kiểm tra kích thước video (tối đa 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('Kích thước video quá lớn. Vui lòng chọn file nhỏ hơn 50MB');
      return;
    }

    try {
      const result = await uploadFile(file, 'video');
      setFormData(prev => ({ ...prev, promoVideo: result.url }));
    } catch (error: any) {
      alert(`Upload video thất bại: ${error.message}`);
    }
  };

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

  // Xóa ảnh khỏi gallery
  const removeGalleryImage = (index: number) => {
    setGallery(gallery.filter((_, i) => i !== index));
  };

  // Cập nhật gallery image
  const updateGalleryImage = (index: number, field: keyof GalleryImage, value: string | boolean) => {
    const updatedGallery = gallery.map((image, i) =>
      i === index ? { ...image, [field]: value } : image
    );
    setGallery(updatedGallery);
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

    // Thêm validation cho thumbnail
    if (!formData.thumbnail.trim()) {
      newErrors.thumbnail = 'Ảnh đại diện là bắt buộc';
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
      coverImage: formData.coverImage || undefined,
      promoVideo: formData.promoVideo || undefined,
      gallery: gallery.length > 0 ? gallery : undefined,
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
    console.log('🖼️ Prepared form data with gallery:', baseData.gallery);
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

  // Hiển thị progress bar
  const renderProgressBars = () => {
    return Object.entries(uploadProgress).map(([key, progress]) => (
      <div key={key} className="mb-2">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Đang upload...</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    ));
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

      {/* ========== IMAGES SECTION ========== */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <FiImage className="w-5 h-5" />
          Hình ảnh khóa học
        </h3>

        {/* Progress bars */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-700 mb-2">Đang upload...</h4>
            {renderProgressBars()}
          </div>
        )}

        {/* Thumbnail */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ảnh đại diện (Thumbnail) *
          </label>
          
          <div className="flex flex-col md:flex-row gap-4 items-start">
            {/* Upload button */}
            <div className="flex-shrink-0">
              <input
                type="file"
                ref={thumbnailInputRef}
                onChange={handleThumbnailUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiUpload className="w-4 h-4" />
                {formData.thumbnail ? 'Thay đổi ảnh' : 'Chọn ảnh'}
              </button>
            </div>

            {/* Preview và URL input */}
            <div className="flex-1 w-full">
              {formData.thumbnail ? (
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex-shrink-0">
                    <img 
                      src={formData.thumbnail} 
                      alt="Thumbnail preview" 
                      className="h-20 w-32 object-cover rounded border"
                      onError={(e) => {
                        e.currentTarget.src = '/images/default-course-thumbnail.jpg';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      name="thumbnail"
                      value={formData.thumbnail}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${
                        errors.thumbnail ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="URL ảnh đại diện"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      URL ảnh đại diện cho khóa học. Kích thước đề xuất: 400x300px
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-xl">
                  <FiImage className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Chưa có ảnh đại diện</p>
                  <p className="text-sm text-gray-400">Chọn ảnh từ máy tính của bạn</p>
                </div>
              )}
            </div>
          </div>
          {errors.thumbnail && <p className="mt-1 text-red-500 text-sm">{errors.thumbnail}</p>}
        </div>

        {/* Cover Image */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ảnh cover (Banner)
          </label>
          
          <div className="flex flex-col md:flex-row gap-4 items-start">
            {/* Upload button */}
            <div className="flex-shrink-0">
              <input
                type="file"
                ref={coverImageInputRef}
                onChange={handleCoverImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => coverImageInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiUpload className="w-4 h-4" />
                {formData.coverImage ? 'Thay đổi ảnh' : 'Chọn ảnh'}
              </button>
            </div>

            {/* Preview và URL input */}
            <div className="flex-1 w-full">
              {formData.coverImage ? (
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex-shrink-0">
                    <img 
                      src={formData.coverImage} 
                      alt="Cover preview" 
                      className="h-16 w-full md:w-48 object-cover rounded border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      name="coverImage"
                      value={formData.coverImage}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      placeholder="URL ảnh cover"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ảnh banner lớn cho trang chi tiết khóa học. Kích thước đề xuất: 1200x400px
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-xl">
                  <FiImage className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Chưa có ảnh cover</p>
                  <p className="text-sm text-gray-400">Chọn ảnh từ máy tính của bạn</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bộ sưu tập hình ảnh
          </label>
          
          {/* Upload multiple images */}
          <div className="mb-4">
            <input
              type="file"
              ref={galleryInputRef}
              onChange={handleGalleryUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiUpload className="w-4 h-4" />
              Chọn nhiều ảnh
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Chọn nhiều ảnh để thêm vào bộ sưu tập khóa học (tối đa 10 ảnh, mỗi ảnh dưới 10MB)
            </p>
          </div>

          {/* Gallery images list */}
          {gallery.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Ảnh trong gallery ({gallery.length})</h4>
              {gallery.map((image, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Image preview */}
                    <div className="flex-shrink-0">
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="h-20 w-32 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.src = '/images/default-image.jpg';
                        }}
                      />
                    </div>
                    
                    {/* Image details */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">URL</label>
                        <input
                          type="text"
                          value={image.url}
                          onChange={(e) => updateGalleryImage(index, 'url', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Alt text</label>
                        <input
                          type="text"
                          value={image.alt}
                          onChange={(e) => updateGalleryImage(index, 'alt', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">Chú thích</label>
                        <input
                          type="text"
                          value={image.caption}
                          onChange={(e) => updateGalleryImage(index, 'caption', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    
                    {/* Remove button */}
                    <div className="flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(index)}
                        className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <FiImage className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Chưa có ảnh nào trong gallery</p>
              <p className="text-sm text-gray-400 mt-1">Thêm ảnh để hiển thị trong bộ sưu tập khóa học</p>
            </div>
          )}
        </div>

        {/* Promo Video */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Video giới thiệu
          </label>
          
          <div className="flex flex-col md:flex-row gap-4 items-start">
            {/* Upload button */}
            <div className="flex-shrink-0">
              <input
                type="file"
                ref={videoInputRef}
                onChange={handleVideoUpload}
                accept="video/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiVideo className="w-4 h-4" />
                {formData.promoVideo ? 'Thay đổi video' : 'Chọn video'}
              </button>
            </div>

            {/* Preview và URL input */}
            <div className="flex-1 w-full">
              {formData.promoVideo ? (
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex-shrink-0">
                    <video 
                      src={formData.promoVideo} 
                      controls 
                      className="h-20 w-32 object-cover rounded border"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      name="promoVideo"
                      value={formData.promoVideo}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      placeholder="URL video giới thiệu"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      URL video giới thiệu khóa học
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-xl">
                  <FiVideo className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Chưa có video giới thiệu</p>
                  <p className="text-sm text-gray-400">Chọn video từ máy tính của bạn</p>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Định dạng hỗ trợ: MP4, MOV, AVI, WEBM. Kích thước tối đa: 50MB
          </p>
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
              disabled={submitting || uploading}
              className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <FiSave className="w-5 h-5" />
              {submitting ? 'Đang lưu...' : 'Lưu bản nháp'}
            </button>

            <button
              type="button"
              onClick={handleSubmitForReview}
              disabled={submitting || uploading}
              className="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <FiSend className="w-5 h-5" />
              {submitting ? 'Đang gửi...' : 'Gửi để phê duyệt'}
            </button>

            <button
              type="button"
              onClick={onCancel}
              disabled={submitting || uploading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <FiX className="w-5 h-5" />
              Hủy
            </button>
          </div>

          {/* Uploading warning */}
          {(uploading || Object.keys(uploadProgress).length > 0) && (
            <div className="fixed bottom-4 right-4 bg-yellow-500 text-white p-4 rounded-lg shadow-lg">
              <p className="font-medium">Đang upload file...</p>
              <p className="text-sm">Vui lòng không đóng trang</p>
            </div>
          )}
        </form>
      );
    };

    export default CourseForm;