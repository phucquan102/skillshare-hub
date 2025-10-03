import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { courseService, Course } from '../../../services/api/courseService';

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleEnroll = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (course) {
      navigate(`/payment/checkout?courseId=${course._id}&amount=${course.fullCoursePrice || 0}`);
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
    <div className="max-w-6xl mx-auto px-6 py-4 bg-white rounded-lg shadow-lg">
      {/* Header Section */}
      <div className="py-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-[#3a0ca3] mb-2">{course.title}</h2>
        <p className="text-gray-600">{course.shortDescription || course.description}</p>
      </div>

      {/* Course Details */}
      <div className="py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Image and Enroll Button */}
        <div className="md:col-span-1">
          <img
            src={course.thumbnail || 'https://via.placeholder.com/300x150?text=Course'}
            alt={course.title}
            className="w-full h-48 object-cover rounded-md mb-4"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x150?text=Course';
            }}
          />
          <button
            onClick={handleEnroll}
            className="w-full px-4 py-2 bg-[#4361ee] text-white rounded hover:bg-[#3a0ca3] transition"
          >
            Enroll Now
          </button>
        </div>

        {/* Right: Course Info */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-[#3a0ca3] mb-2">Course Details</h3>
          <p className="text-gray-600 mb-4">{course.description}</p>
          <div className="space-y-2">
            <p className="text-gray-600">
              <span className="font-medium">Instructor:</span> {course.instructor?.fullName || 'Unknown'}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Price:</span>{' '}
              {course.fullCoursePrice ? formatCurrency(course.fullCoursePrice) : 'Free'}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Level:</span> {translateLevel(course.level)}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Category:</span> {course.category}
            </p>
            {course.maxStudents && (
              <p className="text-gray-600">
                <span className="font-medium">Max Students:</span> {course.maxStudents}
              </p>
            )}
            {course.currentEnrollments !== undefined && (
              <p className="text-gray-600">
                <span className="font-medium">Current Enrollments:</span> {course.currentEnrollments}
              </p>
            )}
            {course.availableSpots !== undefined && (
              <p className="text-gray-600">
                <span className="font-medium">Available Spots:</span> {course.availableSpots}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      {(course.prerequisites?.length || course.learningOutcomes?.length || course.materialsIncluded?.length) && (
        <div className="py-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-[#3a0ca3] mb-2">Additional Information</h3>
          {course.prerequisites && course.prerequisites.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-medium text-gray-700">Prerequisites</h4>
              <ul className="list-disc list-inside text-gray-600">
                {course.prerequisites.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {course.learningOutcomes && course.learningOutcomes.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-medium text-gray-700">What You'll Learn</h4>
              <ul className="list-disc list-inside text-gray-600">
                {course.learningOutcomes.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {course.materialsIncluded && course.materialsIncluded.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-700">Materials Included</h4>
              <ul className="list-disc list-inside text-gray-600">
                {course.materialsIncluded.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Back Button */}
      <div className="py-6 text-center">
        <button
          onClick={() => navigate('/courses')}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
        >
          Back to Courses
        </button>
      </div>
    </div>
  );
};

export default CourseDetailPage;