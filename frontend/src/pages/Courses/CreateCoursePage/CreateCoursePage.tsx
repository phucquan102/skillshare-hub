// src/pages/Courses/CreateCoursePage/CreateCoursePage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { courseService, CreateCourseData, EditCourseData } from '../../../services/api/courseService';
import CourseForm from '../../../components/course/CourseForm/CourseForm';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

      // ✅ Prepare data with both schedules and datedSchedules
      const createData: any = {
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
        schedules: (data as any).schedules || [],
        datedSchedules: (data as any).datedSchedules || [],
        gallery: (data as any).gallery || [],
        coverImage: (data as any).coverImage || '',
        promoVideo: (data as any).promoVideo || '',
        certificate: data.certificate,
        featured: data.featured || false,
        coInstructors: (data as any).coInstructors || [],
        discount: (data as any).discount,
        courseType: (data as any).courseType || 'live_online',
        settings: (data as any).settings
      };

      console.log('📤 [CreateCoursePage] Final data to send:', createData);

      // Validate required data
      if (!createData.title.trim()) {
        throw new Error('Course title is required');
      }
      if (!createData.description.trim()) {
        throw new Error('Course description is required');
      }
      if (!createData.category.trim()) {
        throw new Error('Course category is required');
      }
      if (!createData.startDate) {
        throw new Error('Start date is required');
      }
      if (!createData.endDate) {
        throw new Error('End date is required');
      }

      // Validate schedules
      const hasWeeklySchedules = createData.schedules && createData.schedules.length > 0;
      const hasDatedSchedules = createData.datedSchedules && createData.datedSchedules.length > 0;
      if (!hasWeeklySchedules && !hasDatedSchedules) {
        throw new Error('At least one class schedule is required for the course');
      }

      // Validate dates
      const startDate = new Date(createData.startDate);
      const endDate = new Date(createData.endDate);
      if (startDate >= endDate) {
        throw new Error('End date must be after start date');
      }

      // Validate pricing
      if ((createData.pricingType === 'full_course' || createData.pricingType === 'both') && 
          (!createData.fullCoursePrice || createData.fullCoursePrice <= 0)) {
        throw new Error('Course price must be greater than 0 when selecting full course payment');
      }

      let response;

      if (submitType === 'save') {
        // Create course with draft status
        response = await courseService.createCourse(createData);
        console.log('✅ Course created as draft:', response);

        // Show success toast
        toast.success('🎉 Course saved as draft! You can continue editing later.', {
          position: 'top-right',
          autoClose: 3500,
          pauseOnHover: true,
        });

        // Navigate after a short delay so toast is visible
        setTimeout(() => {
          navigate('/instructor/courses');
        }, 600);

      } else {
        // Create course and then submit for approval
        response = await courseService.createCourse(createData);
        console.log('✅ Course created, submitting for approval:', response);

        // Submit course for approval
        await courseService.submitForApproval(response.course._id);

        // Show success toast
        toast.success("🚀 Course created and submitted for admin approval! You'll be notified once it's reviewed.", {
          position: 'top-right',
          autoClose: 4500,
          pauseOnHover: true,
        });

        // Navigate after a short delay so toast is visible
        setTimeout(() => {
          navigate('/instructor/courses');
        }, 700);
      }

    } catch (error: any) {
      console.error('❌ Error creating course:', error);
      const message = error?.message || 'An error occurred while creating the course';
      setError(message);
      toast.error(message, { position: 'top-right', autoClose: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      navigate('/instructor/courses');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <ToastContainer />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Create New Course</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Build your masterpiece course step by step. Fill in the details below to create an engaging learning experience.
          </p>
        </div>

        {/* Enhanced Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-6 mb-8 shadow-md animate-fade-in">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-red-800">Unable to Create Course</h3>
                <div className="mt-2 text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Course Form Container */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border border-gray-100">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Details</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
          </div>

          <CourseForm 
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitting={loading}
            isEdit={false}
          />
        </div>

        {/* Enhanced Help Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl">
          <div className="flex items-start mb-6">
            <div className="flex-shrink-0 mt-1">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-bold mb-3">Course Creation Guide</h3>
              <div className="grid md:grid-cols-2 gap-4 text-blue-100">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-white rounded-full mt-2 mr-3"></span>
                    <span><strong className="text-white">Save as Draft:</strong> Course will be saved privately for later editing</span>
                  </div>
                  <div className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-white rounded-full mt-2 mr-3"></span>
                    <span><strong className="text-white">Submit for Review:</strong> Course will be sent to admin for approval</span>
                  </div>
                  <div className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-white rounded-full mt-2 mr-3"></span>
                    <span>Fields marked with <span className="text-red-300">*</span> are required</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-white rounded-full mt-2 mr-3"></span>
                    <span><strong className="text-white">Class Schedule:</strong> At least one schedule is mandatory</span>
                  </div>
                  <div className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-white rounded-full mt-2 mr-3"></span>
                    <span>Ensure descriptions are clear and engaging</span>
                  </div>
                  <div className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-white rounded-full mt-2 mr-3"></span>
                    <span>End date must be after start date</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Tips */}
          <div className="mt-6 pt-6 border-t border-blue-400">
            <h4 className="font-semibold mb-3 text-blue-100">Pro Tips:</h4>
            <div className="flex flex-wrap gap-3">
              <span className="bg-blue-400 bg-opacity-30 px-3 py-1 rounded-full text-sm">Use high-quality images</span>
              <span className="bg-blue-400 bg-opacity-30 px-3 py-1 rounded-full text-sm">Set realistic pricing</span>
              <span className="bg-blue-400 bg-opacity-30 px-3 py-1 rounded-full text-sm">Clear learning outcomes</span>
              <span className="bg-blue-400 bg-opacity-30 px-3 py-1 rounded-full text-sm">Engaging video preview</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCoursePage;
