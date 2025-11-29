// src/pages/student/StudentLessonDetail/StudentLessonDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { courseService } from '../../../services/api/courseService';
import { enrollmentService } from '../../../services/api/enrollmentService';

const StudentLessonDetail: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId?: string; lessonId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isPreview = location.state?.preview || false;
  const courseIdFromState = location.state?.courseId || courseId;

  const [lesson, setLesson] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canPurchaseIndividual, setCanPurchaseIndividual] = useState(false);
  const [joiningMeeting, setJoiningMeeting] = useState(false);

  // 🆕 HÀM MỚI: Xử lý courseId từ nhiều định dạng khác nhau
  const getCourseIdString = (courseData: any): string | null => {
    if (!courseData) return null;
    
    // Nếu là string
    if (typeof courseData === 'string') {
      return courseData.trim() !== '' ? courseData : null;
    }
    
    // Nếu là object có _id
    if (typeof courseData === 'object' && courseData._id) {
      return courseData._id;
    }
    
    // Nếu là object có id
    if (typeof courseData === 'object' && courseData.id) {
      return courseData.id;
    }
    
    return null;
  };

  // 🆕 THÊM: Kiểm tra access riêng biệt
  const checkAccess = async (lessonData: any) => {
    try {
      if (isPreview) {
        setHasAccess(true);
        return;
      }

      // Nếu lesson có price = 0, tự động có access
      if (lessonData.price === 0 || lessonData.price === undefined) {
        console.log('💰 Lesson is free, granting access');
        setHasAccess(true);
        return;
      }

      // Kiểm tra access từ enrollment service
      const accessCheck = await enrollmentService.checkLessonAccess(lessonId!);
      console.log('🔐 Access check result:', accessCheck);
      
      if (accessCheck.success) {
        setHasAccess(accessCheck.hasAccess);
      } else {
        // Fallback: kiểm tra từ lesson data
        const hasAccessFromLesson = lessonData.access?.hasAccess || false;
        setHasAccess(hasAccessFromLesson);
      }
    } catch (error) {
      console.error('❌ Error checking access:', error);
      // Nếu có lỗi, mặc định không có access
      setHasAccess(false);
    }
  };

  useEffect(() => {
    const loadLesson = async () => {
      if (!lessonId) {
        setError('Lesson ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('📡 [StudentLessonDetail] Loading lesson:', {
          lessonId,
          isPreview,
          courseIdFromState,
          courseIdFromParams: courseId
        });
        
        let response;
        
        if (isPreview) {
          console.log('🔍 Using getLessonById for preview');
          response = await courseService.getLessonById(lessonId);
          
          if (response.success && response.lesson) {
            console.log('✅ Preview lesson data received:', response);
            setLesson(response.lesson);
            setHasAccess(true); // Preview luôn có access
            
            // 🆕 SỬA: Load course info cho preview với xử lý courseId
            if (response.lesson.courseId) {
              try {
                const courseIdToLoad = getCourseIdString(response.lesson.courseId);
                if (courseIdToLoad) {
                  console.log('📚 Loading course for preview:', courseIdToLoad);
                  const courseData = await courseService.getCourseById(courseIdToLoad);
                  if (courseData.course) {
                    setCourse(courseData.course);
                  }
                } else {
                  console.warn('⚠️ No valid courseId found for preview');
                }
              } catch (courseError) {
                console.warn('⚠️ Could not load course for preview:', courseError);
              }
            }
          } else {
            setError('Unable to load lesson preview');
          }
        } else {
          // Normal lesson load
          const lessonResponse = await courseService.getLessonById(lessonId);
          console.log('✅ [StudentLessonDetail] Lesson data received:', lessonResponse);

          if (lessonResponse.success && lessonResponse.lesson) {
            setLesson(lessonResponse.lesson);
            
            // 🆕 SỬA: Gọi hàm checkAccess riêng
            await checkAccess(lessonResponse.lesson);

            // 🆕 SỬA: Load course info với xử lý courseId
            const courseIdToLoad = getCourseIdString(lessonResponse.lesson.courseId);
            console.log('📚 [StudentLessonDetail] Attempting to load course:', courseIdToLoad);
            
            if (courseIdToLoad) {
              try {
                const courseData = await courseService.getCourseById(courseIdToLoad);
                if (courseData.course) {
                  setCourse(courseData.course);
                  const canPurchase = ['per_lesson', 'both'].includes(courseData.course.pricingType);
                  setCanPurchaseIndividual(canPurchase);
                  console.log('💰 [StudentLessonDetail] Course loaded successfully:', courseData.course.title);
                }
              } catch (courseError: any) {
                console.error('❌ [StudentLessonDetail] Error loading course:', courseError.message);
              }
            } else {
              console.warn('⚠️ No courseId available to load');
            }
          } else {
            setError('Unable to load lesson information');
          }
        }
      } catch (err: any) {
        console.error('❌ [StudentLessonDetail] Error loading lesson:', err);
        
        if (err.message && (err.message.includes('403') || err.message.toLowerCase().includes('permission'))) {
          setError('You do not have permission to access this lesson. Please enroll in the course to view content.');
        } else {
          setError(err.response?.data?.message || 'Server connection error');
        }
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [lessonId, isPreview]);

  // 🆕 SỬA HOÀN TOÀN: Hàm join live class - chuyển hướng đến trang LessonLivePage
  const handleJoinLive = async () => {
    if (!lessonId) {
      alert('Missing lesson information');
      return;
    }

    try {
      setJoiningMeeting(true);
      console.log('🎯 [StudentLessonDetail] Attempting to join live class...');

      // Kiểm tra quyền truy cập
      if (!hasAccess && !isPreview) {
        alert('Bạn không có quyền truy cập bài học này. Vui lòng mua bài học trước.');
        setJoiningMeeting(false);
        return;
      }

      // 🆕 SỬA: Xác định courseId để chuyển hướng với xử lý tốt hơn
      let finalCourseId = getCourseIdString(course?._id) || courseIdFromState || courseId;

      console.log('🔍 Course info for navigation:', {
        courseFromState: courseIdFromState,
        courseFromParams: courseId,
        courseFromData: course?._id,
        finalCourseId
      });

      // Nếu không có courseId, thử lấy từ lesson data
      if (!finalCourseId && lesson?.courseId) {
        finalCourseId = getCourseIdString(lesson.courseId);
      }

      if (!finalCourseId) {
        alert('Không thể xác định khóa học. Vui lòng thử lại.');
        setJoiningMeeting(false);
        return;
      }

      console.log('🔄 Navigating to live lesson page:', {
        courseId: finalCourseId,
        lessonId
      });

      // 🆕 SỬA QUAN TRỌNG: Sử dụng route giống với StudentLessonList
      navigate(`/student/course/${finalCourseId}/lesson/${lessonId}/meeting`);

    } catch (error: any) {
      console.error('❌ Error joining live class:', error);
      alert(`Không thể tham gia lớp học: ${error.message || 'Vui lòng thử lại sau'}`);
    } finally {
      setJoiningMeeting(false);
    }
  };
  const handleBack = () => {
    if (course) {
      navigate(`/courses/${course._id}`);
    } else {
      navigate(-1);
    }
  };

  // 🆕 SỬA: Logic hiển thị button
  const shouldShowPurchaseButton = 
    !hasAccess && 
    !isPreview && 
    canPurchaseIndividual && 
    lesson?.price > 0;

  const shouldShowJoinButton = 
    hasAccess && 
    lesson?.lessonType === 'live_online';

  console.log('🎯 [StudentLessonDetail] Button visibility:', {
    shouldShowPurchaseButton,
    shouldShowJoinButton,
    hasAccess,
    isPreview,
    canPurchaseIndividual,
    lessonPrice: lesson?.price,
    lessonType: lesson?.lessonType
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Lesson not found'}</p>
          <button 
            onClick={handleBack}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={handleBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>
          {lesson.description && (
            <p className="text-gray-600 mt-2">{lesson.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {/* Access Status */}
              {!hasAccess && !isPreview && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-yellow-800">
                      🔒 You need to purchase this lesson to view full content
                    </p>
                  </div>
                </div>
              )}

              {isPreview && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <p className="text-blue-800">
                      👀 You are viewing a lesson preview
                    </p>
                  </div>
                </div>
              )}

              {/* Lesson Contents */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Lesson Content</h2>
                
                {(hasAccess || isPreview) ? (
                  <div className="space-y-4">
                    {/* Video/Document Contents */}
                    {lesson.contents && lesson.contents.length > 0 ? (
                      lesson.contents.map((content: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                          <div className="flex items-center mb-2">
                            {content.type === 'video' && (
                              <span className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </span>
                            )}
                            {content.type === 'document' && (
                              <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </span>
                            )}
                            <h3 className="font-semibold text-lg">{content.title}</h3>
                          </div>
                          {content.description && (
                            <p className="text-gray-600 text-sm mb-2">{content.description}</p>
                          )}
                          {/* Render content based on type */}
                          {content.type === 'video' && content.url && hasAccess && (
                            <div className="mt-3">
                              <video 
                                controls 
                                className="w-full rounded-lg"
                                poster={content.thumbnail}
                              >
                                <source src={content.url} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          )}
                          {content.type === 'video' && !hasAccess && (
                            <div className="bg-gray-100 rounded-lg p-8 text-center">
                              <p className="text-gray-500">Purchase the lesson to watch the video</p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No content available for this lesson</p>
                      </div>
                    )}

                    {/* Live Lesson Join Button */}
                    {shouldShowJoinButton && (
                      <button
                        onClick={handleJoinLive}
                        disabled={joiningMeeting}
                        className={`w-full py-3 rounded-lg transition-colors flex items-center justify-center ${
                          joiningMeeting 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {joiningMeeting ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Redirecting...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            🎥 Join the online class
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-gray-100 rounded-lg p-8">
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <p className="text-gray-500 mb-4">Purchase the lesson to view full content</p>
                      <button
                        onClick={() => {
                          if (course) {
                            navigate(`/payment/checkout?courseId=${course._id}&lessonId=${lessonId}&amount=${lesson.price || 0}`);
                          } else {
                            alert('Course information not available');
                          }
                        }}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Purchase - {lesson.price ? `$${lesson.price}` : 'Free'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Learning Objectives */}
              {lesson.objectives && lesson.objectives.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-3">Learning Objectives</h3>
                  <ul className="space-y-2">
                    {lesson.objectives.map((obj: string, index: number) => (
                      <li key={index} className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Prerequisites */}
              {lesson.prerequisites && lesson.prerequisites.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-3">Prerequisites</h3>
                  <ul className="space-y-2">
                    {lesson.prerequisites.map((req: string, index: number) => (
                      <li key={index} className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase Card */}
            {shouldShowPurchaseButton && (
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
                <h3 className="text-xl font-bold mb-4">Buy Lesson</h3>
                <div className="text-center mb-4">
                  <span className="text-3xl font-bold text-green-600">
                    {lesson.price ? `$${lesson.price}` : 'Free'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (course) {
                      navigate(`/payment/checkout?courseId=${course._id}&lessonId=${lessonId}&amount=${lesson.price || 0}`);
                    } else {
                      alert('Course information not available');
                    }
                  }}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Purchase Now
                </button>
                {course && (
                  <button
                    onClick={() => navigate(`/courses/${course._id}`)}
                    className="w-full mt-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    View Full Course
                  </button>
                )}
              </div>
            )}

            {/* Lesson Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">Lesson Info</h3>
              <div className="space-y-3">
                {lesson.duration && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{lesson.duration} minutes</span>
                  </div>
                )}
                {lesson.difficulty && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Difficulty:</span>
                    <span className="font-medium capitalize">{lesson.difficulty}</span>
                  </div>
                )}
                {lesson.lessonType && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Format:</span>
                    <span className="font-medium">
                      {lesson.lessonType === 'live_online' ? 'Live Online' : 
                       lesson.lessonType === 'self_paced' ? 'Self-paced' : 'Blended'}
                    </span>
                  </div>
                )}
                {lesson.estimatedStudyTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated study time:</span>
                    <span className="font-medium">{lesson.estimatedStudyTime} minutes</span>
                  </div>
                )}
                {/* 🆕 THÊM: Price info */}
                {lesson.price !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-medium">
                      {lesson.price === 0 ? 'Free' : `$${lesson.price}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Resources - only visible if user has access */}
            {hasAccess && lesson.resources && lesson.resources.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">Resources</h3>
                <div className="space-y-2">
                  {lesson.resources.map((resource: any, index: number) => (
                    <a
                      key={index}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="mr-3">📎</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{resource.name}</p>
                        <p className="text-sm text-gray-500">{resource.type}</p>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLessonDetail;