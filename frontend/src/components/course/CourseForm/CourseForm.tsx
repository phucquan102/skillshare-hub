// src/components/course/CourseForm/CourseForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Course, CreateCourseData, EditCourseData, GalleryImage } from './../../../services/api/courseService';
import { uploadService } from '../../../services/api/uploadService';
import { FiSave, FiSend, FiX, FiPlus, FiTrash2, FiImage, FiUpload, FiVideo, FiCalendar } from 'react-icons/fi';

interface CourseFormProps {
  course?: Course;
  onSubmit: (data: CreateCourseData | EditCourseData, submitType: 'save' | 'submit') => void;
  onCancel: () => void;
  submitting?: boolean;
  isEdit?: boolean;
}

// 🆕 REMOVED: Weekly schedule interface
// 🆕 KEEP: Dated schedule interface
interface DatedSchedule {
  _id?: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  timezone?: string;
  meetingPlatform?: string;
  individualPrice?: number;
  availableForIndividualPurchase?: boolean;
  notes?: string;
}

interface UploadProgress {
  [key: string]: number;
}

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
  // 🆕 REMOVED: Weekly schedules state
  // 🆕 KEEP: Dated schedules state
  const [datedSchedules, setDatedSchedules] = useState<DatedSchedule[]>([]);
  
  // State for gallery images
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  
  // State for upload progress
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [uploading, setUploading] = useState(false);

  // 🆕 REMOVED: Scheduling type state (only dated schedules now)
  // We'll use dated schedules by default

  // Refs for file inputs
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Function to format date for input
  const formatDateForInput = (dateValue: any): string => {
    if (!dateValue) return '';
    
    try {
      // If it's an ISO string (from MongoDB)
      if (typeof dateValue === 'string') {
        const date = new Date(dateValue);
        return date.toISOString().split('T')[0];
      }
      // If it's a Date object
      else if (dateValue instanceof Date) {
        return dateValue.toISOString().split('T')[0];
      }
      // If it's already in YYYY-MM-DD format
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
    language: 'en', // 🆕 CHANGED: Default to English
    thumbnail: '',
    coverImage: '',
    promoVideo: '',
    certificate: false,
    featured: false,
    // 🆕 KEEP: New settings
    allowIndividualLessonPurchase: false,
    defaultLessonPrice: 0,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // ✅ FIX: useEffect to sync data when course changes
  useEffect(() => {
    if (isEdit && course) {
      console.log("🪄 Updating form when course changes:", course);

      // ✅ ADD DEBUG: Check if course has startDate and endDate
      console.log("📅 Course date fields:", {
        hasStartDate: !!course.startDate,
        hasEndDate: !!course.endDate,
        startDate: course.startDate,
        endDate: course.endDate,
        courseKeys: Object.keys(course)
      });

      // ✅ ADD FALLBACK: If no startDate/endDate, use default values
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
        // ✅ IMPORTANT FIX: If no date from API, use default values
        startDate: course.startDate ? formatDateForInput(course.startDate) : today,
        endDate: course.endDate ? formatDateForInput(course.endDate) : oneMonthLaterStr,
        prerequisites: course.prerequisites?.join(', ') || '',
        learningOutcomes: course.learningOutcomes?.join(', ') || '',
        requirements: course.requirements?.join(', ') || '',
        tags: course.tags?.join(', ') || '',
        language: course.language || 'en', // 🆕 CHANGED: Default to English
        thumbnail: course.thumbnail || '',
        coverImage: course.coverImage || '',
        promoVideo: course.promoVideo || '',
        certificate: course?.certificate && typeof course.certificate === 'object' 
          ? (course.certificate.isEnabled || false) 
          : false,
        featured: course.featured || false,
        // 🆕 KEEP: New settings
        allowIndividualLessonPurchase: (course as any).settings?.allowIndividualLessonPurchase ?? false,
        defaultLessonPrice: (course as any).settings?.lessonPricing?.defaultLessonPrice || 0,
      });

      // 🆕 UPDATED: Only initialize dated schedules
      const hasDatedSchedules = (course as any).datedSchedules && (course as any).datedSchedules.length > 0;
      
      if (hasDatedSchedules) {
        console.log('📅 Initializing dated schedules from course:', (course as any).datedSchedules);
        const formattedDatedSchedules = (course as any).datedSchedules.map((schedule: any) => ({
          _id: schedule._id,
          date: formatDateForInput(schedule.date),
          startTime: schedule.startTime || '',
          endTime: schedule.endTime || '',
          timezone: schedule.timezone || 'UTC',
          meetingPlatform: schedule.meetingPlatform || 'zoom',
          individualPrice: schedule.individualPrice || 0,
          availableForIndividualPurchase: schedule.availableForIndividualPurchase || false,
          notes: schedule.notes || ''
        }));
        setDatedSchedules(formattedDatedSchedules);
      } else {
        setDatedSchedules([]);
      }

      // 🆕 REMOVED: Weekly schedules initialization

      // Sync gallery images
      if (course.gallery && course.gallery.length > 0) {
        console.log('🖼️ Initializing gallery from course:', course.gallery);
        setGallery(course.gallery);
      } else {
        setGallery([]);
      }
    } else {
      // 🆕 ADD: Default initialization for new course
      const today = new Date().toISOString().split('T')[0];
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      const oneMonthLaterStr = oneMonthLater.toISOString().split('T')[0];

      setFormData(prev => ({
        ...prev,
        startDate: today,
        endDate: oneMonthLaterStr
      }));
    }
  }, [course, isEdit]);

  // ========== UPLOAD FUNCTIONS (KEEP AS IS) ==========
  
  // File upload function using uploadService
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
      
      // Show detailed error message
      let errorMessage = 'Upload failed';
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

  // Handle thumbnail upload
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check image format
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, etc.)');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size too large. Please choose a file smaller than 10MB');
      return;
    }

    try {
      const result = await uploadFile(file, 'image');
      setFormData(prev => ({ ...prev, thumbnail: result.url }));
    } catch (error: any) {
      alert(`Thumbnail upload failed: ${error.message}`);
    }
  };

  // Handle cover image upload
  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size too large. Please choose a file smaller than 10MB');
      return;
    }

    try {
      const result = await uploadFile(file, 'image');
      setFormData(prev => ({ ...prev, coverImage: result.url }));
    } catch (error: any) {
      alert(`Cover image upload failed: ${error.message}`);
    }
  };

  // Handle gallery images upload
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    console.log('🖼️ Uploading gallery images:', files.length);

    // Check image format
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      alert('Please select only image files (JPEG, PNG, etc.)');
      return;
    }

    // Check file size
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert('Some files are too large. Please choose files smaller than 10MB');
      return;
    }

    try {
      setUploading(true);
      
      // Upload each file individually for separate progress
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
      alert(`Gallery upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Handle video upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check video format
    const videoFormats = ['mp4', 'mov', 'avi', 'webm'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !videoFormats.includes(fileExtension)) {
      alert('Invalid video format. Supported: MP4, MOV, AVI, WEBM');
      return;
    }

    if (!file.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }

    // Check video size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('Video size too large. Please choose a file smaller than 50MB');
      return;
    }

    try {
      const result = await uploadFile(file, 'video');
      setFormData(prev => ({ ...prev, promoVideo: result.url }));
    } catch (error: any) {
      alert(`Video upload failed: ${error.message}`);
    }
  };

  // ========== DATED SCHEDULES FUNCTIONS ==========

  // 🆕 KEEP: Functions for dated schedules
  const addDatedSchedule = () => {
    const newSchedule: DatedSchedule = {
      date: formData.startDate || new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:30',
      timezone: 'UTC',
      meetingPlatform: 'zoom',
      individualPrice: formData.defaultLessonPrice || 0,
      availableForIndividualPurchase: formData.allowIndividualLessonPurchase,
      notes: ''
    };
    setDatedSchedules([...datedSchedules, newSchedule]);
  };

  const updateDatedSchedule = (index: number, field: keyof DatedSchedule, value: string | number | boolean) => {
    const updatedSchedules = datedSchedules.map((schedule, i) =>
      i === index ? { ...schedule, [field]: value } : schedule
    );
    setDatedSchedules(updatedSchedules);
  };

  const removeDatedSchedule = (index: number) => {
    setDatedSchedules(datedSchedules.filter((_, i) => i !== index));
  };

  // ========== GALLERY FUNCTIONS ==========

  // Remove image from gallery
  const removeGalleryImage = (index: number) => {
    setGallery(gallery.filter((_, i) => i !== index));
  };

  // Update gallery image
  const updateGalleryImage = (index: number, field: keyof GalleryImage, value: string | boolean) => {
    const updatedGallery = gallery.map((image, i) =>
      i === index ? { ...image, [field]: value } : image
    );
    setGallery(updatedGallery);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    
    // Handle number fields
    if (name === 'fullCoursePrice' || name === 'maxStudents' || name === 'defaultLessonPrice') {
      processedValue = value === '' ? 0 : Number(value);
    }
    // Handle checkbox
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

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start >= end) newErrors.endDate = 'End date must be after start date';
    }

    if ((formData.pricingType === 'full_course' || formData.pricingType === 'both') && 
        (!formData.fullCoursePrice || formData.fullCoursePrice <= 0)) {
      newErrors.fullCoursePrice = 'Course price must be greater than 0';
    }

    if (formData.maxStudents < 1) {
      newErrors.maxStudents = 'Maximum students must be at least 1';
    }

    // Add validation for thumbnail
    if (!formData.thumbnail.trim()) {
      newErrors.thumbnail = 'Thumbnail is required';
    }

    // 🆕 UPDATED: Validation only for dated schedules
    if (datedSchedules.length === 0) {
      newErrors.datedSchedules = 'At least one schedule is required';
    } else {
      datedSchedules.forEach((schedule, index) => {
        if (!schedule.date) {
          newErrors[`datedSchedule_${index}_date`] = `Schedule ${index + 1}: Select date`;
        }
        if (!schedule.startTime) {
          newErrors[`datedSchedule_${index}_start`] = `Schedule ${index + 1}: Select start time`;
        }
        if (!schedule.endTime) {
          newErrors[`datedSchedule_${index}_end`] = `Schedule ${index + 1}: Select end time`;
        }
        if (schedule.startTime && schedule.endTime && schedule.startTime >= schedule.endTime) {
          newErrors[`datedSchedule_${index}_time`] = `Schedule ${index + 1}: End time must be after start time`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ FIX: Prepare form data for submission
  const prepareFormData = (): CreateCourseData | EditCourseData => {
    const baseData: any = {
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
      certificate: formData.certificate ? {
        isEnabled: true,
        template: 'default',
        issuedBy: 'SkillShare Hub'
      } : undefined,
      settings: {
        allowIndividualLessonPurchase: formData.allowIndividualLessonPurchase,
        autoCreateLessonsFromSchedules: false,
        useDatedSchedules: true, // 🆕 CHANGED: Always use dated schedules
        maxStudentsPerLesson: formData.maxStudents,
        requireApprovalForEnrollment: false,
        allowRecordingAccess: true,
        notificationPreferences: {
          email: true,
          sms: false,
          push: true
        },
        lessonPricing: formData.allowIndividualLessonPurchase ? {
          allowIndividualPurchase: formData.allowIndividualLessonPurchase,
          defaultLessonPrice: formData.defaultLessonPrice,
          bundleDiscount: 0
        } : undefined
      }
    };

    // 🆕 UPDATED: Only add dated schedules
    if (datedSchedules.length > 0) {
      baseData.datedSchedules = datedSchedules.map(schedule => ({
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        timezone: schedule.timezone,
        meetingPlatform: schedule.meetingPlatform,
        individualPrice: schedule.individualPrice,
        availableForIndividualPurchase: schedule.availableForIndividualPurchase,
        notes: schedule.notes,
        isActive: true
      }));
    }

    console.log('📤 Prepared form data:', {
      datedSchedulesCount: baseData.datedSchedules?.length || 0,
      settings: baseData.settings
    });

    return baseData as CreateCourseData | EditCourseData;
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      console.log('❌ Form validation failed:', errors);
      return;
    }

    const submitData = prepareFormData();
    console.log('📝 [CourseForm] Saving draft:', submitData);
    onSubmit(submitData, 'save');
  };

  const handleSubmitForReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      console.log('❌ Form validation failed:', errors);
      return;
    }

    const submitData = prepareFormData();
    console.log('📤 [CourseForm] Submitting for review:', submitData);
    onSubmit(submitData, 'submit');
  };

  // Show progress bars
  const renderProgressBars = () => {
    return Object.entries(uploadProgress).map(([key, progress]) => (
      <div key={key} className="mb-2">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Uploading...</span>
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
      {/* Basic Information - TRANSLATED TO ENGLISH */}
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter course title"
          />
          {errors.title && <p className="mt-1 text-red-500 text-sm">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Short Description
          </label>
          <textarea
            name="shortDescription"
            value={formData.shortDescription}
            onChange={handleChange}
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            placeholder="Brief description about the course (max 300 characters)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Detailed Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Detailed description about the course"
          />
          {errors.description && <p className="mt-1 text-red-500 text-sm">{errors.description}</p>}
        </div>
      </div>

      {/* Category and Level - TRANSLATED TO ENGLISH */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${
              errors.category ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select category</option>
            <option value="programming">Programming</option>
            <option value="design">Design</option>
            <option value="business">Business</option>
            <option value="marketing">Marketing</option>
            <option value="language">Language</option>
            <option value="music">Music</option>
            <option value="photography">Photography</option>
            <option value="cooking">Cooking</option>
            <option value="fitness">Fitness</option>
            <option value="art">Art</option>
            <option value="writing">Writing</option>
            <option value="other">Other</option>
          </select>
          {errors.category && <p className="mt-1 text-red-500 text-sm">{errors.category}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Level
          </label>
          <select
            name="level"
            value={formData.level}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Pricing - TRANSLATED TO ENGLISH */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pricing Type
          </label>
          <select
            name="pricingType"
            value={formData.pricingType}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
          >
            <option value="full_course">Full Course Payment</option>
            <option value="per_lesson">Pay Per Lesson</option>
            <option value="both">Both</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Price (USD) *
          </label>
          <input
            type="number"
            name="fullCoursePrice"
            value={formData.fullCoursePrice}
            onChange={handleChange}
            min="0"
            step="10"
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${
              errors.fullCoursePrice ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.fullCoursePrice && <p className="mt-1 text-red-500 text-sm">{errors.fullCoursePrice}</p>}
        </div>
      </div>

      {/* Dates and Capacity - TRANSLATED TO ENGLISH */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
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
            End Date *
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
            Maximum Students
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

      {/* 🆕 UPDATED: Course Settings - TRANSLATED TO ENGLISH */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <FiCalendar className="w-5 h-5" />
          Course Settings
        </h3>

        <div className="grid grid-cols-1 gap-6">
          {/* Individual lesson purchase */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Allow Individual Lesson Purchase</h4>
              <p className="text-sm text-gray-500">Students can purchase individual lessons separately</p>
            </div>
            <input
              type="checkbox"
              name="allowIndividualLessonPurchase"
              checked={formData.allowIndividualLessonPurchase}
              onChange={handleChange}
              className="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
            />
          </div>
        </div>

        {/* Default lesson price */}
        {formData.allowIndividualLessonPurchase && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Price per Lesson (USD)
            </label>
            <input
              type="number"
              name="defaultLessonPrice"
              value={formData.defaultLessonPrice}
              onChange={handleChange}
              min="0"
              step="10"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              placeholder="Enter default price per lesson"
            />
          </div>
        )}
      </div>

      {/* ========== DATED SCHEDULES SECTION ========== */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <FiCalendar className="w-5 h-5" />
            Course Schedules
          </h3>
          <button
            type="button"
            onClick={addDatedSchedule}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Add Schedule
          </button>
        </div>

        {datedSchedules.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              📅 Currently have {datedSchedules.length} scheduled sessions.
            </p>
          </div>
        )}

        {/* Show schedules error */}
        {datedSchedules.length === 0 && errors.datedSchedules && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{errors.datedSchedules}</p>
          </div>
        )}

        <div className="space-y-4">
          {datedSchedules.map((schedule, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session Date *
                  </label>
                  <input
                    type="date"
                    value={schedule.date}
                    onChange={(e) => updateDatedSchedule(index, 'date', e.target.value)}
                    min={formData.startDate}
                    max={formData.endDate}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      errors[`datedSchedule_${index}_date`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors[`datedSchedule_${index}_date`] && (
                    <p className="mt-1 text-red-500 text-xs">{errors[`datedSchedule_${index}_date`]}</p>
                  )}
                </div>

                {/* Start Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) => updateDatedSchedule(index, 'startTime', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      errors[`datedSchedule_${index}_start`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors[`datedSchedule_${index}_start`] && (
                    <p className="mt-1 text-red-500 text-xs">{errors[`datedSchedule_${index}_start`]}</p>
                  )}
                </div>

                {/* End Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) => updateDatedSchedule(index, 'endTime', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      errors[`datedSchedule_${index}_end`] || errors[`datedSchedule_${index}_time`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors[`datedSchedule_${index}_end`] && (
                    <p className="mt-1 text-red-500 text-xs">{errors[`datedSchedule_${index}_end`]}</p>
                  )}
                  {errors[`datedSchedule_${index}_time`] && (
                    <p className="mt-1 text-red-500 text-xs">{errors[`datedSchedule_${index}_time`]}</p>
                  )}
                </div>

                {/* Individual Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lesson Price (USD)
                  </label>
                  <input
                    type="number"
                    value={schedule.individualPrice || 0}
                    onChange={(e) => updateDatedSchedule(index, 'individualPrice', Number(e.target.value))}
                    min="0"
                    step="10"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Remove Button */}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeDatedSchedule(index)}
                    className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors w-full"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>

              {/* Additional options */}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={schedule.availableForIndividualPurchase || false}
                    onChange={(e) => updateDatedSchedule(index, 'availableForIndividualPurchase', e.target.checked)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Allow individual purchase for this lesson
                  </label>
                </div>
                
                <div>
                  <input
                    type="text"
                    value={schedule.notes || ''}
                    onChange={(e) => updateDatedSchedule(index, 'notes', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Notes (optional)"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {datedSchedules.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <FiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No schedules have been set up</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add Schedule" to set up course sessions</p>
          </div>
        )}
      </div>

      {/* ========== IMAGES SECTION ========== */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <FiImage className="w-5 h-5" />
          Course Images
        </h3>

        {/* Progress bars */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-700 mb-2">Uploading...</h4>
            {renderProgressBars()}
          </div>
        )}

        {/* Thumbnail */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thumbnail Image *
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
                {formData.thumbnail ? 'Change Image' : 'Select Image'}
              </button>
            </div>

            {/* Preview and URL input */}
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
                      placeholder="Thumbnail image URL"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Thumbnail image for the course. Recommended size: 400x300px
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-xl">
                  <FiImage className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No thumbnail image</p>
                  <p className="text-sm text-gray-400">Select an image from your computer</p>
                </div>
              )}
            </div>
          </div>
          {errors.thumbnail && <p className="mt-1 text-red-500 text-sm">{errors.thumbnail}</p>}
        </div>

        {/* Cover Image */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Image (Banner)
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
                {formData.coverImage ? 'Change Image' : 'Select Image'}
              </button>
            </div>

            {/* Preview and URL input */}
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
                      placeholder="Cover image URL"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Large banner image for course detail page. Recommended size: 1200x400px
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-xl">
                  <FiImage className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No cover image</p>
                  <p className="text-sm text-gray-400">Select an image from your computer</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image Gallery
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
              Select Multiple Images
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Select multiple images to add to course gallery (max 10 images, each under 10MB)
            </p>
          </div>

          {/* Gallery images list */}
          {gallery.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Images in gallery ({gallery.length})</h4>
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
                        <label className="block text-xs text-gray-600 mb-1">Caption</label>
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
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <FiImage className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No images in gallery</p>
              <p className="text-sm text-gray-400 mt-1">Add images to display in course gallery</p>
            </div>
          )}
        </div>

        {/* Promo Video */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Promotional Video
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
                <FiUpload className="w-4 h-4" />
                {formData.promoVideo ? 'Change Video' : 'Select Video'}
              </button>
            </div>

            {/* Preview and URL input */}
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
                      placeholder="Promotional video URL"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Promotional video URL for the course
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-xl">
                  <FiVideo className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No promotional video</p>
                  <p className="text-sm text-gray-400">Select a video from your computer</p>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: MP4, MOV, AVI, WEBM. Maximum size: 50MB
          </p>
        </div>
      </div>

      {/* Additional Fields - TRANSLATED TO ENGLISH */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prerequisites
          </label>
          <textarea
            name="prerequisites"
            value={formData.prerequisites}
            onChange={handleChange}
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            placeholder="Enter prerequisites, separated by commas"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Learning Outcomes
          </label>
          <textarea
            name="learningOutcomes"
            value={formData.learningOutcomes}
            onChange={handleChange}
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            placeholder="Enter expected learning outcomes, separated by commas"
          />
        </div>
      </div>

      {/* Certificate Checkbox - TRANSLATED TO ENGLISH */}
      <div className="flex items-center">
        <input
          type="checkbox"
          name="certificate"
          checked={formData.certificate}
          onChange={handleChange}
          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-900">
          Provide course completion certificate
        </label>
      </div>

      {/* Action Buttons - TRANSLATED TO ENGLISH */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={submitting || uploading}
          className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <FiSave className="w-5 h-5" />
          {submitting ? 'Saving...' : 'Save Draft'}
        </button>

        <button
          type="button"
          onClick={handleSubmitForReview}
          disabled={submitting || uploading}
          className="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <FiSend className="w-5 h-5" />
          {submitting ? 'Submitting...' : 'Submit for Review'}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={submitting || uploading}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <FiX className="w-5 h-5" />
          Cancel
        </button>
      </div>

      {/* Uploading warning - TRANSLATED TO ENGLISH */}
      {(uploading || Object.keys(uploadProgress).length > 0) && (
        <div className="fixed bottom-4 right-4 bg-yellow-500 text-white p-4 rounded-lg shadow-lg">
          <p className="font-medium">Uploading files...</p>
          <p className="text-sm">Please do not close the page</p>
        </div>
      )}
    </form>
  );
};

export default CourseForm;