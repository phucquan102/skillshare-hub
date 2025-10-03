import React, { useState } from 'react';
import styles from './CourseForm.module.scss';
import { CreateCourseData } from '../../../services/api/courseService';

interface CourseFormProps {
  onSubmit: (data: CreateCourseData) => void;
  loading?: boolean;
}

const CourseForm: React.FC<CourseFormProps> = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState<CreateCourseData>({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    pricingType: 'full_course',
    fullCoursePrice: undefined,
    maxStudents: 50,
    startDate: '',
    endDate: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'fullCoursePrice' || name === 'maxStudents' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.category || !formData.pricingType || !formData.startDate || !formData.endDate) {
      alert('Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }

    if (formData.pricingType === 'full_course' && !formData.fullCoursePrice) {
      alert('Giá khóa học là bắt buộc khi chọn Full Course');
      return;
    }

    onSubmit(formData);
  };

  return (
    <form className={styles.courseForm} onSubmit={handleSubmit}>
      <div>
        <label>Tiêu đề *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Mô tả *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          required
        />
      </div>

     <div>
  <label>Danh mục *</label>
  <select
    name="category"
    value={formData.category}
    onChange={handleChange}
    required
  >
    <option value="">-- Chọn danh mục --</option>
    <option value="programming">Lập trình</option>
    <option value="design">Thiết kế</option>
    <option value="business">Kinh doanh</option>
    <option value="marketing">Tiếp thị</option>
    <option value="language">Ngôn ngữ</option>
    <option value="music">Âm nhạc</option>
    <option value="photography">Nhiếp ảnh</option>
    <option value="cooking">Nấu ăn</option>
    <option value="fitness">Thể dục</option>
    <option value="art">Nghệ thuật</option>
    <option value="writing">Viết lách</option>
    <option value="other">Khác</option>
  </select>
</div>

      <div>
        <label>Trình độ</label>
        <select name="level" value={formData.level} onChange={handleChange}>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div>
        <label>Pricing Type *</label>
        <select name="pricingType" value={formData.pricingType} onChange={handleChange}>
          <option value="full_course">Full Course</option>
          <option value="per_lesson">Per Lesson</option>
          <option value="both">Both</option>
        </select>
      </div>

      {formData.pricingType === 'full_course' && (
        <div>
          <label>Giá khóa học *</label>
          <input
            type="number"
            name="fullCoursePrice"
            value={formData.fullCoursePrice || ''}
            onChange={handleChange}
            min={0}
          />
        </div>
      )}

      <div>
        <label>Số lượng học viên tối đa *</label>
        <input
          type="number"
          name="maxStudents"
          value={formData.maxStudents}
          onChange={handleChange}
          min={1}
          required
        />
      </div>

      <div>
        <label>Ngày bắt đầu *</label>
        <input
          type="date"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Ngày kết thúc *</label>
        <input
          type="date"
          name="endDate"
          value={formData.endDate}
          onChange={handleChange}
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Đang tạo...' : 'Tạo khóa học'}
      </button>
    </form>
  );
};

export default CourseForm;
