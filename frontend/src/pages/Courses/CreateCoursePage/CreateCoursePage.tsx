import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService, CreateCourseData } from '../../../services/api/courseService';
import CourseForm from '../../../components/course/CourseForm/CourseForm';

const CreateCoursePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateCourseData) => {
    try {
      setLoading(true);
      setError(null);
      const res = await courseService.createCourse(data);
      alert(res.message);
      navigate('/admin/courses'); // quay về list sau khi tạo
    } catch (err: any) {
      console.error('Error creating course:', err);
      setError(err.message || 'Tạo khóa học thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Tạo khóa học mới</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <CourseForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
};

export default CreateCoursePage;
