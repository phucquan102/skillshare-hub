import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { courseService } from '../../../services/api/courseService';

const PaymentSuccess: React.FC = () => {
  const location = useLocation();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Nhận params từ cả state và URL search params
  const { courseId: stateCourseId, courseName, amount: stateAmount } = location.state || {};
  
  // Lấy courseId từ URL search params nếu không có trong state
  const query = new URLSearchParams(location.search);
  const urlCourseId = query.get('courseId');
  const urlAmount = query.get('amount');
  const urlPaymentId = query.get('paymentId');

  const courseId = stateCourseId || urlCourseId;
  const finalAmount = stateAmount || urlAmount;

  useEffect(() => {
    const fetchCourse = async () => {
      if (courseId) {
        try {
          const courseResponse = await courseService.getCourseById(courseId);
          setCourse(courseResponse.course);
        } catch (error) {
          console.error('Error fetching course:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div>Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          
          <p className="text-lg text-gray-600 mb-2">
            You have successfully enrolled in the course.
          </p>
          
          {course ? (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800">{course.title}</h2>
              <p className="text-gray-600">Amount: ${finalAmount}</p>
            </div>
          ) : courseName ? (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800">{courseName}</h2>
              <p className="text-gray-600">Amount: ${finalAmount}</p>
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {courseId && (
              <Link
                to={`/courses/${courseId}`}
                className="bg-[#4361ee] text-white px-6 py-3 rounded-lg hover:bg-[#3a0ca3] transition-colors font-semibold"
              >
                Go to Course
              </Link>
            )}
            
            <Link
              to="/courses"
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
            >
              Back to Courses
            </Link>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> The course has been added to your learning dashboard. 
              You can access it anytime from your profile.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;