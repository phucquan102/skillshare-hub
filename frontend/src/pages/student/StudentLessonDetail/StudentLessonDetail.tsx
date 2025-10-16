// frontend/src/pages/student/StudentLessonDetail/StudentLessonDetail.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const StudentLessonDetail: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="mb-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          ← Quay lại
        </button>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-4">Chi tiết bài học</h1>
          <p className="text-gray-600">Lesson ID: {lessonId}</p>
          <p className="mt-4">Trang chi tiết bài học đang được phát triển...</p>
        </div>
      </div>
    </div>
  );
};

export default StudentLessonDetail;