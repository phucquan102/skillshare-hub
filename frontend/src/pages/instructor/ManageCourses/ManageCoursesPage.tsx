import React from 'react';
import { useNavigate } from 'react-router-dom';
import InstructorCourseList from '../../../components/instructor/course/InstructorCourseList/InstructorCourseList';
import { Course } from '../../../services/api/courseService';

const ManageCoursesPage: React.FC = () => {
  const navigate = useNavigate();

  const handleEditCourse = (course: Course) => {
    navigate(`/instructor/courses/edit/${course._id}`);
  };

  const handleViewStats = (course: Course) => {
    navigate(`/instructor/courses/stats/${course._id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <InstructorCourseList 
          onEditCourse={handleEditCourse}
          onViewStats={handleViewStats}
        />
      </div>
    </div>
  );
};

export default ManageCoursesPage;