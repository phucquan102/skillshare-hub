import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { courseService, Course } from '../../../services/api/courseService';
import { enrollmentService } from '../../../services/api/enrollmentService';

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'schedule' | 'gallery'>('overview');
  
  // Enrollment states
  const [enrollment, setEnrollment] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessType, setAccessType] = useState<'none' | 'full_course' | 'single_lesson'>('none');
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        setError('Course ID is missing');
        setLoading(false);
        return;
      }

      try {
        const response = await courseService.getCourseById(courseId);
        setCourse(response.course);
      } catch (error: any) {
        console.error('Error fetching course:', error);
        setError(error?.response?.data?.message || 'Unable to load course details.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  // Check enrollment when course or user changes
  useEffect(() => {
    const checkEnrollment = async () => {
      if (course && user) {
        setEnrollmentLoading(true);
        try {
          const response = await enrollmentService.getEnrollmentByCourse(course._id);
          if (response.success && response.enrollment) {
            setEnrollment(response.enrollment);
            setHasAccess(true);
            setAccessType(response.enrollment.hasFullAccess ? 'full_course' : 'single_lesson');
          } else {
            setEnrollment(null);
            setHasAccess(false);
            setAccessType('none');
          }
        } catch (error) {
          console.error('Error checking enrollment:', error);
          setEnrollment(null);
          setHasAccess(false);
          setAccessType('none');
        } finally {
          setEnrollmentLoading(false);
        }
      }
    };

    checkEnrollment();
  }, [course, user]);

  const handleEnrollCourse = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (course) {
      navigate(`/payment/checkout?courseId=${course._id}&amount=${course.fullCoursePrice || 0}`);
    }
  };

  const handlePurchaseLesson = (lessonId: string, lessonPrice: number) => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/payment/checkout?courseId=${course?._id}&lessonId=${lessonId}&amount=${lessonPrice}`);
  };

  const handleJoinLesson = async (lesson: any) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const accessResponse = await enrollmentService.checkLessonAccess(lesson._id);
      
      if (accessResponse.success && accessResponse.hasAccess) {
        // Mở link học online
        if (lesson.meetingUrl) {
          window.open(lesson.meetingUrl, '_blank');
          
          // Tự động đánh dấu đã tham gia (có thể tuỳ chọn)
          try {
            await enrollmentService.markLessonCompleted(lesson._id, 10); // 10% progress khi tham gia
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
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const translateLevel = (level: string): string => {
    const levelMap: { [key: string]: string } = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    };
    return levelMap[level] || level;
  };

  const translateDayOfWeek = (day: number): string => {
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
  };

  const formatTime = (time: string): string => {
    if (!time) return '';
    return time.slice(0, 5); // Format: HH:mm
  };

  // Kiểm tra xem khóa học có cho phép mua từng lesson không
  const canPurchaseIndividualLessons = course && 
    (course.pricingType === 'per_lesson' || course.pricingType === 'both');

  // Kiểm tra xem user đã có quyền truy cập lesson cụ thể không
  const hasAccessToLesson = (lessonId: string) => {
    if (!enrollment) return false;
    if (accessType === 'full_course') return true;
    
    // Kiểm tra xem lesson có trong purchasedLessons không
    return enrollment.purchasedLessons?.some((purchase: any) => 
      purchase.lessonId === lessonId
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 max-w-6xl mx-auto px-6 py-4">
        <span className="animate-spin text-2xl">⏳</span>
        <span className="ml-3 text-gray-600">Loading course...</span>
      </div>
    );
  }

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Course Image */}
          <div className="lg:col-span-1">
            <img
              src={course.thumbnail || 'https://via.placeholder.com/400x250?text=Course'}
              alt={course.title}
              className="w-full h-64 object-cover rounded-xl shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x250?text=Course';
              }}
            />
            
            {/* Enrollment Status Badge */}
            {hasAccess && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-green-700 font-medium">
                    {accessType === 'full_course' ? 'Đã đăng ký trọn khóa' : 'Đã mua một số bài học'}
                  </span>
                </div>
                {enrollment?.progress?.overallProgress > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-sm text-green-600 mb-1">
                      <span>Tiến độ:</span>
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
                      key={index}
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
                    Nổi bật
                  </span>
                )}
                {course.certificate && (
                  <span className="px-3 py-1 bg-green-500 text-white text-sm rounded-full">
                    Có chứng chỉ
                  </span>
                )}
                {hasAccess && (
                  <span className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full">
                    Đã đăng ký
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
              
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
                      ✓ Có thể mua từng bài học riêng lẻ
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
                    Tiếp tục học
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
              Tổng quan
            </button>
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'curriculum'
                  ? 'border-[#4361ee] text-[#4361ee]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Nội dung khóa học ({course.lessons?.length || 0})
            </button>
            {course.schedules && course.schedules.length > 0 && (
              <button
                onClick={() => setActiveTab('schedule')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'schedule'
                    ? 'border-[#4361ee] text-[#4361ee]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Lịch học ({course.schedules.length})
              </button>
            )}
            {course.gallery && course.gallery.length > 0 && (
              <button
                onClick={() => setActiveTab('gallery')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'gallery'
                    ? 'border-[#4361ee] text-[#4361ee]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Hình ảnh ({course.gallery.length})
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Promo Video */}
              {course.promoVideo && (
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Video giới thiệu</h2>
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
                      <div key={index} className="flex items-start space-x-3">
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Yêu cầu</h2>
                  <ul className="space-y-2">
                    {course.requirements.map((item, index) => (
                      <li key={index} className="flex items-center space-x-2">
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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Nội dung khóa học</h2>
      <div className="space-y-4">
        {course.lessons && course.lessons.length > 0 ? (
          course.lessons.map((lesson, index) => {
            const userHasAccess = hasAccessToLesson(lesson._id);
            const isCompleted = enrollment?.progress?.completedLessons?.some(
              (completed: any) => completed.lessonId === lesson._id
            );
            const lessonPrice = lesson.price || 0; // Đảm bảo luôn có giá trị số

            return (
              <div
                key={lesson._id}
                className={`border rounded-xl p-6 transition-all duration-300 ${
                  userHasAccess 
                    ? 'border-green-200 bg-green-50 hover:border-green-300' 
                    : 'border-gray-200 hover:border-[#4361ee]'
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
                            Đã hoàn thành
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {lesson.description || 'No description available'}
                      </p>
                      {lesson.duration && (
                        <p className="text-gray-500 text-sm mt-1">
                          Duration: {lesson.duration}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-bold text-gray-900">
                      {lessonPrice > 0 ? formatCurrency(lessonPrice) : 'Free'}
                    </span>
                    
                    {userHasAccess ? (
                      <button
                        onClick={() => handleJoinLesson(lesson)}
                        className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-300"
                      >
                        Tham gia học
                      </button>
                    ) : canPurchaseIndividualLessons && lessonPrice > 0 ? (
                      // ✅ ĐÃ SỬA: Sử dụng lessonPrice thay vì lesson.price
                      <button
                        onClick={() => handlePurchaseLesson(lesson._id, lessonPrice)}
                        className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-300"
                      >
                        Mua bài học
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500">
            Chưa có bài học nào trong khóa học này
          </div>
        )}
      </div>
    </div>
  )}

          {activeTab === 'schedule' && course.schedules && course.schedules.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Lịch học</h2>
              <div className="space-y-4">
                {course.schedules.map((schedule, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl p-6 hover:border-[#4361ee] transition-all duration-300"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Ngày trong tuần</h4>
                        <p className="text-gray-600">
                          {translateDayOfWeek(schedule.dayOfWeek)}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Thời gian</h4>
                        <p className="text-gray-600">
                          {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Múi giờ</h4>
                        <p className="text-gray-600">
                          {schedule.timezone || 'Asia/Ho_Chi_Minh'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Trạng thái</h4>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                          Sắp diễn ra
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'gallery' && course.gallery && course.gallery.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Hình ảnh khóa học</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {course.gallery.map((image, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
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
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Pricing Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {hasAccess ? 'Trạng thái học tập' : 'Đăng ký khóa học'}
            </h3>
            
            {hasAccess ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    accessType === 'full_course' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {accessType === 'full_course' ? 'Trọn khóa' : 'Từng bài'}
                  </span>
                </div>
                
                {enrollment?.progress?.overallProgress > 0 && (
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Tiến độ:</span>
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
                
                <button
                  onClick={() => setActiveTab('curriculum')}
                  className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Tiếp tục học
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Giá trọn khóa:</span>
                    <span className="text-2xl font-bold text-[#4361ee]">
                      {course.fullCoursePrice ? formatCurrency(course.fullCoursePrice) : 'Miễn phí'}
                    </span>
                  </div>
                  
                  {canPurchaseIndividualLessons && (
                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                      ✓ Có thể mua từng bài học riêng
                    </div>
                  )}
                </div>

                <button
                  onClick={handleEnrollCourse}
                  className="w-full py-3 bg-gradient-to-r from-[#4361ee] to-[#3a0ca3] text-white font-semibold rounded-xl hover:from-[#3a0ca3] hover:to-[#4361ee] transition-all duration-300 shadow-lg hover:shadow-xl mb-3"
                >
                  Đăng ký trọn khóa
                </button>

                {canPurchaseIndividualLessons && (
                  <button
                    onClick={() => setActiveTab('curriculum')}
                    className="w-full py-3 border border-[#4361ee] text-[#4361ee] font-semibold rounded-xl hover:bg-[#4361ee] hover:text-white transition-all duration-300"
                  >
                    Xem từng bài học
                  </button>
                )}
              </>
            )}
          </div>

          {/* Rest of sidebar remains the same */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Thông tin khóa học</h3>
            <div className="space-y-3">
              {/* ... existing course details ... */}
            </div>
          </div>

          {/* ... other sidebar sections ... */}
        </div>
      </div>

      {/* Back Button */}
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