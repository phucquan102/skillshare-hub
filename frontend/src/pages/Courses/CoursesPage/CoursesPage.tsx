import React from 'react';
import CourseList from '../../../components/course/CourseList/CourseList';
import { Link } from 'react-router-dom';

const CoursesPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-4 bg-white rounded-lg shadow-lg">
      {/* Header Section */}
      <div className="py-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-[#3a0ca3] mb-2">Explore Our Courses</h2>
        <p className="text-gray-600">
          Browse through our extensive catalog of courses in various categories and find the perfect learning opportunity for you.
        </p>
      </div>

      {/* Filter and Courses List Section (CourseList) */}
      <div className="py-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-[#3a0ca3] mb-4">Filter Courses</h3>
        <CourseList />
      </div>

      {/* Features Section */}
      <div className="py-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-[#3a0ca3] mb-4">Enhanced Course Browsing Experience</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-gray-200 p-4 rounded-md text-center">
            <h3 className="text-lg font-semibold text-[#3a0ca3] mb-2">Advanced Filtering</h3>
            <p className="text-gray-600">Find exactly what you're looking for with our powerful filtering options</p>
          </div>
          <div className="bg-gray-200 p-4 rounded-md text-center">
            <h3 className="text-lg font-semibold text-[#3a0ca3] mb-2">Detailed Previews</h3>
            <p className="text-gray-600">Watch course introductions and read detailed descriptions before enrolling</p>
          </div>
          <div className="bg-gray-200 p-4 rounded-md text-center">
            <h3 className="text-lg font-semibold text-[#3a0ca3] mb-2">Student Reviews</h3>
            <p className="text-gray-600">Read authentic feedback from students who have taken the courses</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-6 border-b border-gray-200 text-center">
        <h2 className="text-2xl font-bold text-[#3a0ca3] mb-2">Ready to Start Learning?</h2>
        <p className="text-gray-600 mb-4">Sign up or log in to enroll in courses and begin your learning journey</p>
        <div className="flex justify-center gap-3">
          <Link to="/register" className="px-4 py-2 bg-[#4361ee] text-white rounded hover:bg-[#3a0ca3] transition">
            Sign Up Now
          </Link>
          <Link to="/login" className="px-4 py-2 bg-[#4361ee] text-white rounded hover:bg-[#3a0ca3] transition">
            Log In
          </Link>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-6">
        <h2 className="text-2xl font-bold text-[#3a0ca3] mb-4">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-gray-200 p-4 rounded-md">
            <h3 className="text-lg font-semibold text-[#3a0ca3] mb-2">How do I enroll in a course?</h3>
            <p className="text-gray-600">Click on any course, then select the "Enroll" button to begin the process.</p>
          </div>
          <div className="bg-gray-200 p-4 rounded-md">
            <h3 className="text-lg font-semibold text-[#3a0ca3] mb-2">Can I access courses on mobile devices?</h3>
            <p className="text-gray-600">Yes, our platform is fully responsive and works on all devices.</p>
          </div>
          <div className="bg-gray-200 p-4 rounded-md">
            <h3 className="text-lg font-semibold text-[#3a0ca3] mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-600">We accept credit cards, PayPal, and other popular payment methods.</p>
          </div>
          <div className="bg-gray-200 p-4 rounded-md">
            <h3 className="text-lg font-semibold text-[#3a0ca3] mb-2">Can I get a refund if I'm not satisfied?</h3>
            <p className="text-gray-600">We offer a 30-day money-back guarantee on all courses.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;