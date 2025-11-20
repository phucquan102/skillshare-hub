import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { courseService, Course } from '../../../services/api/courseService';
import { enrollmentService } from '../../../services/api/enrollmentService';
import { ChatContainer } from '../../../components/chat/ChatContainer/ChatContainer';
import { chatService } from '../../../services/api/chatService';
import { ReviewList } from '../../../components/review/ReviewList';
import { ReviewForm } from '../../../components/review/ReviewForm';
import { RatingCard } from '../../../components/review/RatingCard';
import reviewService from '../../../services/api/reviewService';  
import LessonScheduleCard from '../../../components/course/LessonScheduleCard/LessonScheduleCard';

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // 🎯 REFs ĐỂ NGĂN CHẶN GỌI API NHIỀU LẦN
  const processedCourseIdRef = useRef<string | null>(null);
  const processedEnrollmentRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);
  const enrollmentCheckInProgressRef = useRef(false);
  const lessonsProcessingRef = useRef(false);
  const strictModeCountRef = useRef(0);

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'schedule' | 'gallery' | 'chat' | 'reviews'>('overview');
  
  // Enrollment states
  const [enrollment, setEnrollment] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessType, setAccessType] = useState<'none' | 'full_course' | 'single_lesson'>('none');
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Lessons state
  const [lessons, setLessons] = useState<any[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);

  const DEFAULT_THUMBNAIL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDQwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjUgODVIMjc1VjE2NUgxMjVWODVaIiBmaWxsPSIjREVER0RGIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUE5QzlEIiBmb250LXNpemU9IjE2IiBmb250LWZhbWlseT0iQXJpYWwiPkNvdXJzZSBJbWFnZTwvdGV4dD4KPC9zdmc+';

  // 🎯 CLEANUP KHI COMPONENT UNMOUNT
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      fetchInProgressRef.current = false;
      enrollmentCheckInProgressRef.current = false;
      lessonsProcessingRef.current = false;
    };
  }, []);

  // Format date function
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Chưa cập nhật';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Calculate duration function
  const calculateDuration = (startDate: string, endDate: string): string => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 30) {
        return `${diffDays} ngày`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} tháng`;
      } else {
        const years = Math.floor(diffDays / 365);
        return `${years} năm`;
      }
    } catch (error) {
      return 'N/A';
    }
  };

  // Calculate time progress function
  const calculateTimeProgress = (startDate: string, endDate: string): number => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const now = new Date();
      
      const totalDuration = end.getTime() - start.getTime();
      const elapsed = now.getTime() - start.getTime();
      
      if (elapsed <= 0) return 0;
      if (elapsed >= totalDuration) return 100;
      
      return Math.round((elapsed / totalDuration) * 100);
    } catch (error) {
      return 0;
    }
  };

  // 🎯 HÀM LOẠI BỎ DUPLICATE LESSONS
  const removeDuplicateLessons = useCallback((lessons: any[]) => {
    if (!lessons || !Array.isArray(lessons)) return [];
    
    const seen = new Set();
    const uniqueLessons = [];
    
    for (const lesson of lessons) {
      if (!lesson._id) continue;
      
      if (!seen.has(lesson._id)) {
        seen.add(lesson._id);
        uniqueLessons.push(lesson);
      } else {
        console.warn('⚠️ [removeDuplicateLessons] Phát hiện lesson trùng:', lesson._id);
      }
    }
    
    console.log(`📊 [removeDuplicateLessons] ${lessons.length} -> ${uniqueLessons.length} lessons`);
    return uniqueLessons;
  }, []);

  // 🎯 SỬ DỤNG useCallback ĐỂ TRÁNH RE-RENDER KHÔNG CẦN THIẾT
  const processLessonsWithSchedule = useCallback((lessons: any[]) => {
    if (!lessons || !Array.isArray(lessons)) return [];
    
    const uniqueLessons = removeDuplicateLessons(lessons);
    
    return uniqueLessons.map((lesson: any) => {
      let scheduleDetails = null;
      
      if (lesson.actualDate && lesson.actualStartTime) {
        scheduleDetails = {
          type: 'dated',
          date: lesson.actualDate,
          startTime: lesson.actualStartTime,
          endTime: lesson.actualEndTime,
          isLive: lesson.isMeetingActive || false
        };
      }
      else if (lesson.schedule) {
        scheduleDetails = {
          type: 'weekly', 
          dayOfWeek: lesson.schedule.dayOfWeek,
          startTime: lesson.schedule.startTime,
          endTime: lesson.schedule.endTime,
          isLive: false
        };
      }
      
      const now = new Date();
      let isLive = false;
      let isUpcoming = false;
      
      if (scheduleDetails && scheduleDetails.date && scheduleDetails.startTime) {
        try {
          const lessonDate = new Date(scheduleDetails.date);
          const startTime = new Date(lessonDate.toDateString() + ' ' + scheduleDetails.startTime);
          const endTime = new Date(lessonDate.toDateString() + ' ' + scheduleDetails.endTime);
          
          isLive = now >= startTime && now <= endTime;
          isUpcoming = now < startTime;
        } catch (error) {
          console.warn('❌ Error parsing lesson schedule:', error);
        }
      }
      
      return {
        ...lesson,
        scheduleDetails,
        isLive: isLive || lesson.isMeetingActive,
        isUpcoming,
        hasRecording: !!lesson.recordingUrl
      };
    });
  }, [removeDuplicateLessons]);

  // XỬ LÝ LESSONS
  const processLessons = useCallback(async (courseData: Course) => {
    if (!courseData || !courseData._id) {
      setLessons([]);
      return;
    }

    if (lessonsProcessingRef.current) {
      console.log('🛑 [processLessons] Đang xử lý lessons, bỏ qua');
      return;
    }

    lessonsProcessingRef.current = true;
    setLessonsLoading(true);
    
    try {
      const shouldCallAPI = user && (user.role === 'instructor' || user.role === 'admin');

      if (shouldCallAPI) {
        try {
          console.log('🎯 [processLessons] Instructor/Admin - Calling API for detailed lessons');
          const lessonsResponse = await courseService.getLessonsByCourse(courseData._id);
          
          if (!isMountedRef.current) return;
          
          if (lessonsResponse.lessons && lessonsResponse.lessons.length > 0) {
            const processedLessons = processLessonsWithSchedule(lessonsResponse.lessons);
            setLessons(processedLessons);
            return;
          }
        } catch (apiError) {
          console.log('⚠️ [processLessons] API không khả dụng, sử dụng fallback từ course.lessons');
        }
      }

      console.log('🎯 [processLessons] Student/Public - Using lessons from course object');
      const fallbackLessons = processLessonsWithSchedule(courseData.lessons || []);
      
      if (isMountedRef.current) {
        setLessons(fallbackLessons);
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error('❌ [processLessons] Error processing lessons:', error);
      const safeFallbackLessons = processLessonsWithSchedule(courseData.lessons || []);
      setLessons(safeFallbackLessons);
    } finally {
      if (isMountedRef.current) {
        setLessonsLoading(false);
        lessonsProcessingRef.current = false;
      }
    }
  }, [user, processLessonsWithSchedule]);

  // 🎯 FETCH COURSE DATA
  useEffect(() => {
    strictModeCountRef.current++;
    
    if (strictModeCountRef.current > 2) {
      console.log('🛑 [StrictMode] Blocking excessive re-renders');
      return;
    }

    const fetchCourse = async () => {
      if (!courseId) {
        setError('Course ID is missing');
        setLoading(false);
        return;
      }

      if (fetchInProgressRef.current) {
        console.log('🛑 [fetchCourse] Đang fetch, bỏ qua');
        return;
      }

      if (processedCourseIdRef.current === courseId) {
        console.log('🛑 [fetchCourse] Đã fetch course này rồi:', courseId);
        setLoading(false);
        return;
      }

      fetchInProgressRef.current = true;
      processedCourseIdRef.current = courseId;

      try {
        console.log('📡 [fetchCourse] Bắt đầu fetch course details...', courseId);
        const response = await courseService.getCourseById(courseId);
        
        if (!isMountedRef.current) {
          console.log('🛑 [fetchCourse] Component unmounted, bỏ qua set state');
          return;
        }
        
        console.log('✅ [fetchCourse] Nhận được course data:', response.course?.title);
        setCourse(response.course);
        
        if (response.course?.lessons && response.course.lessons.length > 0) {
          console.log('📚 [fetchCourse] Xử lý lessons từ course data:', response.course.lessons.length);
          const uniqueLessons = removeDuplicateLessons(response.course.lessons);
          const processedLessons = processLessonsWithSchedule(uniqueLessons);
          setLessons(processedLessons);
          lessonsProcessingRef.current = false;
        } else {
          console.log('📚 [fetchCourse] Không có lessons, gọi processLessons');
          await processLessons(response.course);
        }
      } catch (error: any) {
        if (!isMountedRef.current) return;
        console.error('❌ [fetchCourse] Error fetching course:', error);
        setError(error?.response?.data?.message || 'Unable to load course details.');
      } finally {
        if (isMountedRef.current) {
          console.log('🏁 [fetchCourse] Hoàn thành fetch course');
          setLoading(false);
          setTimeout(() => {
            fetchInProgressRef.current = false;
          }, 100);
        }
      }
    };

    fetchCourse();
  }, [courseId, processLessonsWithSchedule, removeDuplicateLessons, processLessons]);

  // 🎯 CHECK ENROLLMENT
  useEffect(() => {
    const checkEnrollment = async () => {
      if (!course?._id || !user?.id) {
        console.log('🛑 [checkEnrollment] Thiếu courseId hoặc userId');
        return;
      }

      const enrollmentKey = `${course._id}-${user.id}`;
      
      if (enrollmentCheckInProgressRef.current) {
        console.log('🛑 [checkEnrollment] Đang check enrollment, bỏ qua');
        return;
      }

      if (processedEnrollmentRef.current === enrollmentKey) {
        console.log('🛑 [checkEnrollment] Đã xử lý enrollment trước đó:', enrollmentKey);
        return;
      }

      enrollmentCheckInProgressRef.current = true;
      processedEnrollmentRef.current = enrollmentKey;
      setEnrollmentLoading(true);

      console.log('🔐 [checkEnrollment] Bắt đầu kiểm tra enrollment...', enrollmentKey);

      try {
        const response = await enrollmentService.getEnrollmentByCourse(course._id);
        if (!isMountedRef.current) {
          console.log('🛑 [checkEnrollment] Component unmounted, bỏ qua');
          return;
        }
        
        console.log('✅ [checkEnrollment] Nhận được enrollment response:', response.success);
        
        if (response.success && response.enrollment) {
          console.log('📄 [checkEnrollment] Enrollment data chi tiết:', {
            enrollmentId: response.enrollment._id,
            hasFullAccess: response.enrollment.hasFullAccess,
            purchasedLessons: response.enrollment.purchasedLessons,
            accessType: response.enrollment.hasFullAccess ? 'full_course' : 'single_lesson'
          });
          
          setEnrollment(response.enrollment);
          setHasAccess(true);
          const newAccessType = response.enrollment.hasFullAccess ? 'full_course' : 'single_lesson';
          setAccessType(newAccessType);
          console.log('✅ [checkEnrollment] User có quyền truy cập:', newAccessType);
        } else {
          setEnrollment(null);
          setHasAccess(false);
          setAccessType('none');
          console.log('❌ [checkEnrollment] User không có quyền truy cập');
        }
      } catch (error) {
        if (!isMountedRef.current) return;
        console.error('❌ [checkEnrollment] Error checking enrollment:', error);
        setEnrollment(null);
        setHasAccess(false);
        setAccessType('none');
      } finally {
        if (isMountedRef.current) {
          setEnrollmentLoading(false);
          console.log('🏁 [checkEnrollment] Hoàn thành kiểm tra enrollment');
          setTimeout(() => {
            enrollmentCheckInProgressRef.current = false;
          }, 100);
        }
      }
    };

    if (course?._id && user?.id) {
      checkEnrollment();
    }
  }, [course?._id, user?.id]);

  // 🔍 THÊM LOG DEBUG - Tìm nguyên nhân tại hàm hasAccessToLesson
 const hasAccessToLesson = useCallback((lessonId: string) => {
  console.log('🔍 [hasAccessToLesson] Kiểm tra access CHI TIẾT:', {
    lessonId,
    lessonIdType: typeof lessonId,
    hasEnrollment: !!enrollment,
    accessType,
    purchasedLessons: enrollment?.purchasedLessons,
    enrollmentData: enrollment
  });

  if (!enrollment) {
    console.log('❌ [hasAccessToLesson] Không có enrollment');
    return false;
  }
  
  // 🆕 DEBUG CHI TIẾT: In ra từng purchased lesson để so sánh
  if (enrollment.purchasedLessons && Array.isArray(enrollment.purchasedLessons)) {
    console.log('📋 [hasAccessToLesson] Danh sách purchasedLessons:');
    enrollment.purchasedLessons.forEach((purchase: any, index: number) => {
      let actualLessonId = purchase.lessonId;
      // Nếu lessonId là object (populated) thì lấy _id
      if (actualLessonId && typeof actualLessonId === 'object') {
        actualLessonId = actualLessonId._id;
      }
      console.log(`   [${index}]`, {
        purchaseLessonId: purchase.lessonId,
        actualLessonId,
        lessonIdToCompare: lessonId,
        isMatch: String(actualLessonId) === String(lessonId)
      });
    });
  } else {
    console.warn('⚠️ [hasAccessToLesson] purchasedLessons không phải array:', enrollment.purchasedLessons);
  }
  
  if (accessType === 'full_course') {
    console.log('✅ [hasAccessToLesson] Có full course access');
    return true;
  }
  
  // 🆕 FIX: Xử lý cả trường hợp lessonId là object (populated) và null
  const hasLessonAccess = enrollment.purchasedLessons?.some((purchase: any) => {
    let actualLessonId = purchase.lessonId;
    // Nếu lessonId là object (populated) thì lấy _id
    if (actualLessonId && typeof actualLessonId === 'object') {
      actualLessonId = actualLessonId._id;
    }
    // Bỏ qua nếu actualLessonId là null hoặc undefined
    if (!actualLessonId) {
      return false;
    }
    return String(actualLessonId) === String(lessonId);
  });
  
  console.log('📊 [hasAccessToLesson] Kết quả kiểm tra:', {
    hasLessonAccess,
    purchasedCount: enrollment.purchasedLessons?.length || 0
  });
  
  return hasLessonAccess || false;
}, [enrollment, accessType]);
  // 🔍 THÊM LOG ĐỀ PHÁT HIỆN ISSUE - tại handleLessonClick
  const handleLessonClick = useCallback((lesson: any) => {
    console.log('🖱️ [handleLessonClick] Lesson clicked:', {
      lessonId: lesson._id,
      lessonTitle: lesson.title
    });
    
    const userHasAccess = hasAccessToLesson(lesson._id);
    
    console.log('🎯 [handleLessonClick] Access decision:', {
      userHasAccess,
      accessType,
      enrollment: !!enrollment,
      navigatingTo: userHasAccess ? 'detail' : 'preview'
    });
    
    if (userHasAccess) {
      console.log('✅ [handleLessonClick] Điều hướng tới chi tiết bài học');
      navigate(`/student/lessons/${lesson._id}`);
    } else {
      console.log('👀 [handleLessonClick] Điều hướng tới preview');
      navigate(`/student/lessons/${lesson._id}`, { 
        state: { preview: true } 
      });
    }
  }, [navigate, hasAccessToLesson, accessType, enrollment]);

  // ⚠️ NẾU ISSUE VẪN TIẾP TỤC, THỬ FIX SAU:
  // Sửa enrollment check - có thể `purchasedLessons` không phải là array
  const hasAccessToLessonFallback = useCallback((lessonId: string) => {
    console.log('🔍 [hasAccessToLessonFallback] Full check:', {
      lessonId,
      enrollment,
      accessType,
      hasFullAccess: enrollment?.hasFullAccess
    });

    if (!enrollment) return false;
    
    // 🆕 THÊM: Kiểm tra hasFullAccess trực tiếp từ enrollment
    if (enrollment.hasFullAccess === true) {
      return true;
    }

    if (accessType === 'full_course') {
      return true;
    }
    
    // 🆕 SỬA: Kiểm tra cách khác nếu purchasedLessons không phải array
    if (!Array.isArray(enrollment.purchasedLessons)) {
      console.warn('⚠️ purchasedLessons không phải array:', enrollment.purchasedLessons);
      // Fallback: check xem có lessonId trong object không
      if (enrollment.purchasedLessons && typeof enrollment.purchasedLessons === 'object') {
        return Object.values(enrollment.purchasedLessons).some((purchase: any) => 
          purchase?.lessonId === lessonId
        );
      }
      return false;
    }
    
    const hasLessonAccess = enrollment.purchasedLessons.some((purchase: any) => 
      purchase?.lessonId === lessonId
    );
    
    return hasLessonAccess || false;
  }, [enrollment, accessType]);

  // 🎯 EVENT HANDLERS
  const handleEnrollCourse = useCallback(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (course) {
      navigate(`/payment/checkout?courseId=${course._id}&amount=${course.fullCoursePrice || 0}`);
    }
  }, [user, course, navigate]);

  const handlePurchaseLesson = useCallback((lessonId: string, lessonPrice: number) => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/payment/checkout?courseId=${course?._id}&lessonId=${lessonId}&amount=${lessonPrice}`);
  }, [user, course, navigate]);

  const handleJoinLesson = useCallback(async (lesson: any) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const accessResponse = await enrollmentService.checkLessonAccess(lesson._id);
      
      if (accessResponse.success && accessResponse.hasAccess) {
        if (lesson.meetingUrl) {
          window.open(lesson.meetingUrl, '_blank');
          
          try {
            await enrollmentService.markLessonCompleted(lesson._id, 10);
          } catch (progressError) {
            console.log('Could not update progress, but continuing...');
          }
        } else {
          alert('Bài học này chưa có link học online');
        }
      } else {
        alert('Bạn cần mua bài học này để tham gia');
        setActiveTab('curriculum');
      }
    } catch (error) {
      console.error('Error checking lesson access:', error);
      alert('Lỗi khi kiểm tra quyền truy cập');
    }
  }, [user, navigate]);

  // 🆕 THÊM HÀM XỬ LÝ JOIN LESSON (TÁCH RIÊNG)
  const handleJoinLessonClick = useCallback(async (e: React.MouseEvent, lesson: any) => {
    e.stopPropagation(); // Ngăn sự kiện click lan ra lesson item
    
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      console.log('🔐 [handleJoinLessonClick] Kiểm tra access cho lesson:', lesson._id);
      const accessResponse = await enrollmentService.checkLessonAccess(lesson._id);
      
      console.log('📊 [handleJoinLessonClick] Access response:', accessResponse);
      
      if (accessResponse.success && accessResponse.hasAccess) {
        if (lesson.meetingUrl) {
          window.open(lesson.meetingUrl, '_blank');
          
          try {
            await enrollmentService.markLessonCompleted(lesson._id, 10);
          } catch (progressError) {
            console.log('Could not update progress, but continuing...');
          }
        } else {
          alert('Bài học này chưa có link học online');
        }
      } else {
        alert('Bạn cần mua bài học này để tham gia');
      }
    } catch (error) {
      console.error('Error checking lesson access:', error);
      alert('Lỗi khi kiểm tra quyền truy cập');
    }
  }, [user, navigate]);

  // 🎯 FORMAT FUNCTIONS
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  }, []);

  const translateLevel = useCallback((level: string): string => {
    const levelMap: { [key: string]: string } = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    };
    return levelMap[level] || level;
  }, []);

  const translateDayOfWeek = useCallback((day: number): string => {
    const dayMap: { [key: number]: string } = {
      1: 'Thứ 2',
      2: 'Thứ 3', 
      3: 'Thứ 4',
      4: 'Thứ 5',
      5: 'Thứ 6',
      6: 'Thứ 7',
      0: 'Chủ nhật',
    };
    return dayMap[day] || `Ngày ${day}`;
  }, []);

  const formatTime = useCallback((time: string): string => {
    if (!time) return '';
    return time.slice(0, 5);
  }, []);

  // 🎯 ACCESS CONTROL
  const canPurchaseIndividualLessons = course && 
    (course.pricingType === 'per_lesson' || course.pricingType === 'both');

  // 🎯 DEBUG RENDER COUNT
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  console.log(`🔍 [CourseDetailPage] Render count: ${renderCountRef.current}`, {
    courseId,
    hasCourse: !!course,
    hasUser: !!user,
    lessonsCount: lessons.length,
    loading,
    enrollmentLoading,
    hasAccess,
    accessType,
    enrollment: enrollment ? {
      id: enrollment._id,
      hasFullAccess: enrollment.hasFullAccess,
      purchasedLessonsCount: enrollment.purchasedLessons?.length || 0
    } : null
  });

  // 🎯 LOADING STATE
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 max-w-6xl mx-auto px-6 py-4">
        <span className="animate-spin text-2xl">⏳</span>
        <span className="ml-3 text-gray-600">Loading course...</span>
      </div>
    );
  }

  // 🎯 ERROR STATE
  if (error || !course) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-4 bg-white rounded-lg shadow-lg">
        <div className="bg-red-100 border border-red-600 text-red-600 p-4 rounded-md mb-4">
          {error || 'Course not found'}
        </div>
        <button
          onClick={() => navigate('/courses')}
          className="px-4 py-2 bg-[#4361ee] text-white rounded hover:bg-[#3a0ca3] transition"
        >
          Back to Courses
        </button>
      </div>
    );
  }

 // 🎯 MAIN RENDER
return (
  <div className="max-w-7xl mx-auto px-4 py-8">
    {/* Header Section */}
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Course Image */}
        <div className="lg:col-span-1">
          <img
            src={course.thumbnail || DEFAULT_THUMBNAIL}
            alt={course.title}
            className="w-full h-64 object-cover rounded-xl shadow-md"
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_THUMBNAIL;
            }}
          />
          
          {/* Enrollment Status Badge */}
          {hasAccess && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-green-700 font-medium">
                  {accessType === 'full_course' ? 'Enrolled in full course' : 'Purchased some lessons'}
                </span>
              </div>
              {enrollment?.progress?.overallProgress > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-sm text-green-600 mb-1">
                    <span>Progress:</span>
                    <span>{enrollment.progress.overallProgress}%</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${enrollment.progress.overallProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Gallery Preview */}
          {course.gallery && course.gallery.length > 0 && (
            <div className="mt-4">
              <div className="flex space-x-2 overflow-x-auto">
                {course.gallery.slice(0, 4).map((image, index) => (
                  <img
                    key={`gallery-${index}`}
                    src={image.url}
                    alt={image.alt}
                    className="w-16 h-16 object-cover rounded-lg border"
                  />
                ))}
                {course.gallery.length > 4 && (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                    +{course.gallery.length - 4}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Middle Column - Course Info */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="flex items-center space-x-4 mb-3">
              {course.featured && (
                <span className="px-3 py-1 bg-yellow-500 text-white text-sm rounded-full">
                  Featured
                </span>
              )}
              {course.certificate && (
                <span className="px-3 py-1 bg-green-500 text-white text-sm rounded-full">
                  Certificate available
                </span>
              )}
              {hasAccess && (
                <span className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full">
                  Enrolled
                </span>
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
            
            {/* Timeline badge */}
            {course.startDate && course.endDate && (
              <div className="flex items-center space-x-2 mb-4">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-600">
                  {formatDate(course.startDate)} - {formatDate(course.endDate)}
                </span>
                <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  {calculateDuration(course.startDate, course.endDate)}
                </span>
              </div>
            )}
            
            {course.shortDescription && (
              <p className="text-gray-600 text-lg leading-relaxed mb-3">
                {course.shortDescription}
              </p>
            )}
            
            <p className="text-gray-600 leading-relaxed">
              {course.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Instructor:</span>
              <span className="font-medium text-gray-900">
                {course.instructor?.fullName || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Level:</span>
              <span className="font-medium text-gray-900">
                {translateLevel(course.level)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Category:</span>
              <span className="font-medium text-gray-900">
                {course.subcategory ? `${course.category} › ${course.subcategory}` : course.category}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Students:</span>
              <span className="font-medium text-gray-900">
                {course.currentEnrollments || 0} enrolled
              </span>
            </div>
            {course.language && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">Language:</span>
                <span className="font-medium text-gray-900">
                  {course.language === 'en' ? 'English' : course.language === 'vi' ? 'Vietnamese' : course.language}
                </span>
              </div>
            )}
          </div>

          {/* Pricing Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {course.fullCoursePrice ? formatCurrency(course.fullCoursePrice) : 'Free'}
                </h3>
                <p className="text-gray-600">Full course access</p>
                
                {canPurchaseIndividualLessons && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ Can purchase individual lessons
                  </p>
                )}
              </div>
              
              {!hasAccess ? (
                <button
                  onClick={handleEnrollCourse}
                  className="mt-4 sm:mt-0 px-8 py-3 bg-gradient-to-r from-[#4361ee] to-[#3a0ca3] text-white font-semibold rounded-xl hover:from-[#3a0ca3] hover:to-[#4361ee] transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Enroll Full Course
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('curriculum')}
                  className="mt-4 sm:mt-0 px-8 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Continue Learning
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Navigation Tabs */}
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-[#4361ee] text-[#4361ee]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'curriculum'
                ? 'border-[#4361ee] text-[#4361ee]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Curriculum ({lessons.length})
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'schedule'
                ? 'border-[#4361ee] text-[#4361ee]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Online Schedule
          </button>
          {course.gallery && course.gallery.length > 0 && (
            <button
              onClick={() => setActiveTab('gallery')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'gallery'
                  ? 'border-[#4361ee] text-[#4361ee]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Gallery ({course.gallery.length})
            </button>
          )}
          {hasAccess && (
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'chat'
                  ? 'border-[#4361ee] text-[#4361ee]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Discussion
            </button>
          )}
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reviews'
                ? 'border-[#4361ee] text-[#4361ee]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reviews & Rating
          </button>
        </nav>
      </div>
    </div>

    {/* Tab Content */}
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-3">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Course Timeline */}
            {course.startDate && course.endDate && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Duration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Start</p>
                        <p className="font-semibold text-gray-900">
                          {formatDate(course.startDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">End</p>
                        <p className="font-semibold text-gray-900">
                          {formatDate(course.endDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Time progress bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Time progress</span>
                    <span>{calculateTimeProgress(course.startDate, course.endDate)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${calculateTimeProgress(course.startDate, course.endDate)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Promo Video */}
            {course.promoVideo && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Promo Video</h2>
                <div className="aspect-w-16 aspect-h-9">
                  <video
                    src={course.promoVideo}
                    controls
                    className="w-full h-64 md:h-96 rounded-lg"
                    poster={course.thumbnail}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            )}

            {/* What You'll Learn */}
            {course.learningOutcomes && course.learningOutcomes.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">What You'll Learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.learningOutcomes.map((outcome, index) => (
                    <div key={`outcome-${index}`} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-700">{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {course.requirements && course.requirements.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Requirements</h2>
                <ul className="space-y-2">
                  {course.requirements.map((item, index) => (
                    <li key={`requirement-${index}`} className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'curriculum' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Curriculum</h2>
            {lessonsLoading ? (
              <div className="flex justify-center items-center py-8">
                <span className="animate-spin text-2xl">⏳</span>
                <span className="ml-3 text-gray-600">Loading content...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {lessons && lessons.length > 0 ? (
                  lessons.map((lesson, index) => {
                    const userHasAccess = hasAccessToLesson(lesson._id);
                    const isCompleted = enrollment?.progress?.completedLessons?.some(
                      (completed: any) => completed.lessonId === lesson._id
                    );
                    const lessonPrice = lesson.price || 0;

                    console.log(`📚 [Curriculum] Lesson ${index + 1}:`, {
                      lessonId: lesson._id,
                      userHasAccess,
                      isCompleted,
                      lessonPrice,
                      accessType
                    });

                    return (
                      <div
                        key={`lesson-${lesson._id}-${index}`}
                        onClick={() => handleLessonClick(lesson)}
                        className={`border rounded-xl p-6 transition-all duration-300 cursor-pointer ${
                          userHasAccess 
                            ? 'border-green-200 bg-green-50 hover:border-green-300 hover:bg-green-100' 
                            : 'border-gray-200 hover:border-[#4361ee] hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start space-x-4 mb-4 sm:mb-0">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              userHasAccess 
                                ? isCompleted ? 'bg-green-500' : 'bg-green-100'
                                : 'bg-blue-100'
                            }`}>
                              {userHasAccess && isCompleted ? (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <span className={`font-bold ${
                                  userHasAccess ? 'text-green-600' : 'text-[#4361ee]'
                                }`}>
                                  {index + 1}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {lesson.title}
                                {isCompleted && (
                                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                    Completed
                                  </span>
                                )}
                              </h3>
                              
                              {/* 🆕 ADD DETAILED LESSON INFO */}
                              <div className="space-y-2 mb-2">
                                <p className="text-gray-600 text-sm">
                                  {lesson.description || lesson.shortDescription || 'No description available'}
                                </p>
                                
                                {lesson.objectives && lesson.objectives.length > 0 && (
                                  <div className="text-xs text-gray-500">
                                    <strong>Objectives:</strong> {lesson.objectives.slice(0, 2).join(', ')}
                                    {lesson.objectives.length > 2 && ` and ${lesson.objectives.length - 2} other objectives`}
                                  </div>
                                )}
                                
                                <div className="flex flex-wrap gap-2 text-xs">
                                  {lesson.duration && (
                                    <span className="bg-gray-100 px-2 py-1 rounded">⏱️ {lesson.duration} mins</span>
                                  )}
                                  {lesson.difficulty && (
                                    <span className="bg-gray-100 px-2 py-1 rounded">
                                      🎯 {lesson.difficulty === 'easy' ? 'Easy' : lesson.difficulty === 'medium' ? 'Medium' : 'Hard'}
                                    </span>
                                  )}
                                  {lesson.lessonType === 'live_online' && (
                                    <span className="bg-orange-100 px-2 py-1 rounded">📺 Live Online</span>
                                  )}
                                  {lesson.isPreview && (
                                    <span className="bg-blue-100 px-2 py-1 rounded">👀 Preview</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-lg font-bold text-gray-900">
                              {lessonPrice > 0 ? formatCurrency(lessonPrice) : 'Free'}
                            </span>
                            
                            {userHasAccess ? (
                              <button
                                onClick={(e) => handleJoinLessonClick(e, lesson)}
                                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-300"
                              >
                                {lesson.lessonType === 'live_online' ? 'Join Class' : 'Start Learning'}
                              </button>
                            ) : canPurchaseIndividualLessons && lessonPrice > 0 ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePurchaseLesson(lesson._id, lessonPrice);
                                }}
                                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-300"
                              >
                                Buy Lesson
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    There are no lessons in this course yet
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Online Schedule</h2>
            
            {lessonsLoading ? (
              <div className="flex justify-center items-center py-8">
                <span className="animate-spin text-2xl">⏳</span>
                <span className="ml-3 text-gray-600">Loading schedule...</span>
              </div>
            ) : (
              <>
                {lessons && lessons.length > 0 ? (
                  <div className="space-y-4">
                    {lessons
                      .filter(lesson => lesson.scheduleDetails || (lesson.actualDate && lesson.actualStartTime))
                      .sort((a, b) => {
                        const dateA = a.actualDate ? new Date(a.actualDate) : new Date();
                        const dateB = b.actualDate ? new Date(b.actualDate) : new Date();
                        return dateA.getTime() - dateB.getTime();
                      })
                      .map((lesson, index) => (
                        <LessonScheduleCard 
                          key={`schedule-${lesson._id}-${index}`}
                          lesson={lesson}
                          onJoinLesson={handleJoinLesson}
                          userRole={user?.role || 'student'}
                          hasAccess={hasAccessToLesson(lesson._id)}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {lessons && lessons.length > 0 
                      ? 'No schedule has been set for lessons'
                      : 'This course has no lessons yet'
                    }
                  </div>
                )}
                
                {course.schedules && course.schedules.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</h3>
                    <div className="space-y-3">
                      {course.schedules.map((schedule, index) => (
                        <div key={`weekly-schedule-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-blue-600 font-semibold">
                                {translateDayOfWeek(schedule.dayOfWeek).charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {translateDayOfWeek(schedule.dayOfWeek)}
                              </p>
                              <p className="text-sm text-gray-600">
                                {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                              </p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                            Weekly
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'gallery' && course.gallery && course.gallery.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {course.gallery.map((image, index) => (
                <div key={`gallery-image-${index}`} className="border border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                  />
                  {(image.alt || image.caption) && (
                    <div className="p-3">
                      {image.alt && <p className="font-medium text-gray-900">{image.alt}</p>}
                      {image.caption && <p className="text-sm text-gray-600 mt-1">{image.caption}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white rounded-2xl shadow-lg">
            <ChatContainer 
              courseId={courseId}
              courseName={course.title}
            />
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <RatingCard courseId={courseId || ''} />
            </div>

            {hasAccess && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                {!showReviewForm ? (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-300"
                  >
                    ✍️ Write a review
                  </button>
                ) : (
                  <ReviewForm 
                    courseId={courseId || ''}
                    onReviewSubmitted={() => {
                      setShowReviewForm(false);
                      window.location.reload();
                    }}
                  />
                )}
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <ReviewList courseId={courseId || ''} />
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {hasAccess ? 'Study Status' : 'Enroll in Course'}
          </h3>
          
          {hasAccess ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span className={`px-3 py-1 text-sm rounded-full ${
                  accessType === 'full_course' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {accessType === 'full_course' ? 'Full course' : 'Per-lesson'}
                </span>
              </div>
              
              {enrollment?.progress?.overallProgress > 0 && (
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress:</span>
                    <span>{enrollment.progress.overallProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${enrollment.progress.overallProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => setActiveTab('curriculum')}
                  className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Continue Learning
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Go to Discussion
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Full course price:</span>
                  <span className="text-2xl font-bold text-[#4361ee]">
                    {course.fullCoursePrice ? formatCurrency(course.fullCoursePrice) : 'Free'}
                  </span>
                </div>
                
                {canPurchaseIndividualLessons && (
                  <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                    ✓ Can purchase individual lessons
                  </div>
                )}
              </div>

              <button
                onClick={handleEnrollCourse}
                className="w-full py-3 bg-gradient-to-r from-[#4361ee] to-[#3a0ca3] text-white font-semibold rounded-xl hover:from-[#3a0ca3] hover:to-[#4361ee] transition-all duration-300 shadow-lg hover:shadow-xl mb-3"
              >
                Enroll Full Course
              </button>

              {canPurchaseIndividualLessons && (
                <button
                  onClick={() => setActiveTab('curriculum')}
                  className="w-full py-3 border border-[#4361ee] text-[#4361ee] font-semibold rounded-xl hover:bg-[#4361ee] hover:text-white transition-all duration-300"
                >
                  View Individual Lessons
                </button>
              )}
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Course Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Level:</span>
              <span className="font-medium">{translateLevel(course.level)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Language:</span>
              <span className="font-medium">
                {course.language === 'en' ? 'English' : course.language === 'vi' ? 'Vietnamese' : course.language}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Students:</span>
              <span className="font-medium">{course.currentEnrollments || 0}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Start date:</span>
              <span className="font-medium text-green-600">
                {course.startDate ? formatDate(course.startDate) : 'Not updated'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">End date:</span>
              <span className="font-medium text-red-600">
                {course.endDate ? formatDate(course.endDate) : 'Not updated'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium text-blue-600">
                {course.startDate && course.endDate 
                  ? calculateDuration(course.startDate, course.endDate)
                  : 'Not updated'
                }
              </span>
            </div>
            
            {course.certificate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Certificate:</span>
                <span className="font-medium text-green-600">Yes</span>
              </div>
            )}
          </div>
        </div>

        {course.instructor && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Instructor</h3>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="font-semibold text-blue-600">
                  {course.instructor.fullName?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{course.instructor.fullName}</h4>
                <p className="text-sm text-gray-600">Instructor</p>
              </div>
            </div>

            {hasAccess && (
              <button
                onClick={async () => {
                  if (course.instructor?._id && courseId) {
                    try {
                      await chatService.createInstructorConversation(courseId, course.instructor._id);
                      setActiveTab('chat');
                    } catch (err) {
                      console.error('Error creating conversation:', err);
                      alert('Unable to create conversation. Please try again.');
                    }
                  }
                }}
                className="w-full mt-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-300"
              >
                Message Instructor
              </button>
            )}
          </div>
        )}
      </div>
    </div>

    <div className="mt-8 text-center">
      <button
        onClick={() => navigate('/courses')}
        className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors duration-300"
      >
        Back to Courses
      </button>
    </div>
  </div>
);
};

export default CourseDetailPage;
