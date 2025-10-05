// pages/Courses/CreateCoursePage/CreateCoursePage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService, CreateCourseData } from '../../../services/api/courseService';
import CourseForm from '../../../components/course/CourseForm/CourseForm';
import { useAuth } from '../../../context/AuthContext';
import { authService } from '../../../services/api/authService';

const CreateCoursePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(true);
  
  // 🔥 FIX: Sử dụng ref để tránh infinite loop
  const hasChecked = useRef(false);

  useEffect(() => {
    // 🔥 FIX: Chỉ chạy 1 lần duy nhất
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkInstructorStatus = async () => {
      try {
        console.log('🔍 [CreateCoursePage] Checking instructor status...');
        
        // Lấy profile trực tiếp, không dùng forceRefreshToken
        const profileResponse = await authService.getProfile();
        const currentUser = profileResponse.user;

        console.log('🔍 Current user role:', currentUser.role);

        if (currentUser.role !== 'instructor') {
          setError('Bạn cần nâng cấp lên instructor để tạo khóa học');
          setVerifying(false);
          setTimeout(() => navigate('/become-instructor'), 2000);
          return;
        }

        updateUser(currentUser);
        setVerifying(false);
        
      } catch (error: any) {
        console.error('❌ Status check failed:', error);
        setError('Không thể xác thực quyền instructor. Vui lòng thử lại.');
        setVerifying(false);
      }
    };

    checkInstructorStatus();
  }, []); // 🔥 FIX: Empty dependency array

  const handleSubmit = async (data: CreateCourseData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🚀 Starting course creation...');
      console.log('📋 Form data:', JSON.stringify(data, null, 2));

      // Validate token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
      }

      // Decode token
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🎭 Token info:', {
          role: payload.role,
          userId: payload.userId,
          exp: new Date(payload.exp * 1000),
          isExpired: payload.exp * 1000 < Date.now()
        });

        if (payload.role !== 'instructor') {
          throw new Error('Token không có quyền instructor. Vui lòng đăng xuất và đăng nhập lại.');
        }

        if (payload.exp * 1000 < Date.now()) {
          throw new Error('Token đã hết hạn. Vui lòng đăng nhập lại.');
        }
      } catch (tokenError: any) {
        console.error('❌ Token validation error:', tokenError);
        throw new Error(tokenError.message || 'Token không hợp lệ');
      }

      // Call API
      console.log('📡 Calling API...');
      const res = await courseService.createCourse(data);
      
      console.log('✅ Course created successfully:', res);
      alert(res.message || 'Tạo khóa học thành công!');
      navigate('/instructor/courses');

    } catch (err: any) {
      console.error('❌ Error:', err);
      
      let errorMessage = err.message || 'Tạo khóa học thất bại';
      
      if (err.message?.includes('instructor') || err.message?.includes('giảng viên')) {
        errorMessage = 'Lỗi quyền truy cập. Vui lòng đăng xuất và đăng nhập lại.';
      } else if (err.message?.includes('Token')) {
        errorMessage = err.message;
      } else if (err.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Bạn không có quyền tạo khóa học. Vui lòng nâng cấp lên instructor.';
      }
      
      setError(errorMessage);
      
      if (errorMessage.includes('đăng nhập lại')) {
        setTimeout(() => {
          localStorage.clear();
          window.location.href = '/login';
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-lg">Đang kiểm tra quyền instructor...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Tạo khóa học mới</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Lỗi:</p>
          <p>{error}</p>
          {error.includes('đăng xuất') && (
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Đăng xuất ngay
            </button>
          )}
        </div>
      )}
      
      <CourseForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
};

export default CreateCoursePage;