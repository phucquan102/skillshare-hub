import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface LessonFormProps {
  course: any;
  lesson?: any;
  availableSchedules?: any[];
  onSave?: (lessonData: any) => void;
  onCancel?: () => void;
}

interface ScheduleOption {
  index: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  display: string;
}

const getDayName = (dayOfWeek: number): string => {
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return days[dayOfWeek] || `Ngày ${dayOfWeek}`;
};

const LessonForm: React.FC<LessonFormProps> = ({ 
  course, 
  lesson, 
  availableSchedules = [],
  onSave, 
  onCancel 
}) => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  interface FormData {
    title: string;
    description: string;
    shortDescription: string;
    order: number;
    duration: number;
    scheduleIndex: number;
    lessonType: string;
    meetingPlatform: string;
    price: number;
    isPreview: boolean;
    isFree: boolean;
    objectives: string[];
    prerequisites: string[];
    difficulty: string;
    estimatedStudyTime: number;
    maxParticipants: number;
    registrationDeadline: number;
  }

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    shortDescription: '',
    order: 1,
    duration: 60,
    scheduleIndex: -1,
    lessonType: 'live_online',
    meetingPlatform: 'jitsi',
    price: 0,
    isPreview: false,
    isFree: false,
    objectives: [] as string[],
    prerequisites: [] as string[],
    difficulty: 'medium',
    estimatedStudyTime: 90,
    maxParticipants: 0,
    registrationDeadline: 60
  });

  const [newObjective, setNewObjective] = useState('');
  const [newPrerequisite, setNewPrerequisite] = useState('');
  const [showActualTimes, setShowActualTimes] = useState(false);

  // 🔧 FIX: Sử dụng useMemo thay vì setState trong useEffect
  const scheduleOptions = useMemo((): ScheduleOption[] => {
    const schedules = availableSchedules.length > 0 
      ? availableSchedules 
      : (course?.schedules || []);

    return schedules
      .filter((schedule: any) => schedule.isActive && !schedule.hasLesson)
      .map((schedule: any, index: number) => ({
        index: schedule.index !== undefined ? schedule.index : index,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        display: `${getDayName(schedule.dayOfWeek)} - ${schedule.startTime} đến ${schedule.endTime}`
      }));
  }, [course?.schedules, availableSchedules]);

  // 🔧 FIX: Tách riêng useEffect để set form data khi lesson thay đổi
  useEffect(() => {
    if (lesson) {
      const initialData: FormData = {
        title: lesson.title || '',
        description: lesson.description || '',
        shortDescription: lesson.shortDescription || '',
        order: lesson.order || 1,
        duration: lesson.duration || 60,
        scheduleIndex: lesson.scheduleIndex ?? -1,
        lessonType: lesson.lessonType || 'live_online',
        meetingPlatform: lesson.meetingPlatform || 'jitsi',
        price: lesson.price || 0,
        isPreview: lesson.isPreview || false,
        isFree: lesson.isFree || false,
        objectives: lesson.objectives || [],
        prerequisites: lesson.prerequisites || [],
        difficulty: lesson.difficulty || 'medium',
        estimatedStudyTime: lesson.estimatedStudyTime || 90,
        maxParticipants: lesson.maxParticipants || 0,
        registrationDeadline: lesson.registrationDeadline || 60
      };

      setFormData(initialData);
    }
  }, [lesson]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : 
              type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              value
    }));
  };

  const addObjective = () => {
    if (newObjective.trim()) {
      setFormData(prev => ({
        ...prev,
        objectives: [...prev.objectives, newObjective.trim()]
      }));
      setNewObjective('');
    }
  };

  const removeObjective = (index: number) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index)
    }));
  };

  const addPrerequisite = () => {
    if (newPrerequisite.trim()) {
      setFormData(prev => ({
        ...prev,
        prerequisites: [...prev.prerequisites, newPrerequisite.trim()]
      }));
      setNewPrerequisite('');
    }
  };

  const removePrerequisite = (index: number) => {
    setFormData(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.scheduleIndex === -1) {
      alert('Vui lòng chọn lịch học cho bài học');
      return;
    }

    // Debug: Kiểm tra scheduleOptions
    console.log('🔍 Debug handleSubmit:', {
      formDataScheduleIndex: formData.scheduleIndex,
      formDataScheduleIndexType: typeof formData.scheduleIndex,
      scheduleOptions: scheduleOptions,
      scheduleOptionsIndices: scheduleOptions.map(s => ({ index: s.index, type: typeof s.index }))
    });

    const selectedSchedule = scheduleOptions.find((s: ScheduleOption) => {
      const match = s.index === Number(formData.scheduleIndex);
      console.log(`So sánh: s.index=${s.index} (${typeof s.index}) vs formData.scheduleIndex=${Number(formData.scheduleIndex)} (number) = ${match}`);
      return match;
    });

    if (!selectedSchedule) {
      console.error('❌ Lịch học không được tìm thấy');
      alert('Lịch học đã chọn không tồn tại hoặc không khả dụng. Vui lòng chọn lại lịch học.');
      return;
    }

    console.log('✅ Submitting lesson with schedule:', {
      scheduleIndex: formData.scheduleIndex,
      selectedSchedule: selectedSchedule
    });
    
    onSave?.(formData);
  };

  return (
    <div className="lesson-form">
      <h2>{lesson ? 'Chỉnh sửa bài học' : 'Tạo bài học mới'}</h2>
      
      {scheduleOptions.length === 0 && (
        <div className="alert alert-warning">
          <strong>⚠️ Không có lịch học khả dụng!</strong>
          <p>Khóa học này chưa có lịch học hoặc tất cả lịch học đã được sử dụng.</p>
          <p>Vui lòng thêm lịch học trong phần chỉnh sửa khóa học trước khi tạo bài học.</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Tiêu đề bài học *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            disabled={scheduleOptions.length === 0 && !lesson}
          />
        </div>

        <div className="form-group">
          <label htmlFor="shortDescription">Mô tả ngắn</label>
          <textarea
            id="shortDescription"
            name="shortDescription"
            value={formData.shortDescription}
            onChange={handleInputChange}
            rows={2}
            maxLength={300}
            disabled={scheduleOptions.length === 0 && !lesson}
          />
          <div className="char-count">{formData.shortDescription.length}/300</div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Mô tả chi tiết</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            disabled={scheduleOptions.length === 0 && !lesson}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="order">Thứ tự bài học *</label>
            <input
              type="number"
              id="order"
              name="order"
              value={formData.order}
              onChange={handleInputChange}
              min="1"
              required
              disabled={scheduleOptions.length === 0 && !lesson}
            />
          </div>

          <div className="form-group">
            <label htmlFor="duration">Thời lượng (phút) *</label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              min="1"
              max="480"
              required
              disabled={scheduleOptions.length === 0 && !lesson}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="scheduleIndex">Lịch học *</label>
          {lesson ? (
            <div>
              <input
                type="text"
                value={
                  scheduleOptions.find((s: ScheduleOption) => s.index === Number(formData.scheduleIndex))?.display ||
                  `Schedule Index: ${formData.scheduleIndex}`
                }
                readOnly
                className="readonly-input"
              />
              <p className="form-help">
                Không thể thay đổi lịch học sau khi bài học đã được tạo
              </p>
            </div>
          ) : (
            <select
              id="scheduleIndex"
              name="scheduleIndex"
              value={formData.scheduleIndex}
              onChange={handleInputChange}
              required
              disabled={scheduleOptions.length === 0}
            >
              <option value={-1}>Chọn lịch học...</option>
              {scheduleOptions.map((schedule: ScheduleOption) => (
                <option key={schedule.index} value={schedule.index}>
                  {schedule.display}
                </option>
              ))}
            </select>
          )}
          {scheduleOptions.length === 0 && !lesson && (
            <p className="form-error">
              Không có lịch học khả dụng. Vui lòng thêm lịch học trong khóa học trước.
            </p>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="lessonType">Loại bài học</label>
            <select
              id="lessonType"
              name="lessonType"
              value={formData.lessonType}
              onChange={handleInputChange}
              disabled={scheduleOptions.length === 0 && !lesson}
            >
              <option value="self_paced">Tự học</option>
              <option value="live_online">Trực tuyến</option>
              <option value="hybrid">Kết hợp</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="meetingPlatform">Nền tảng meeting</label>
            <select
              id="meetingPlatform"
              name="meetingPlatform"
              value={formData.meetingPlatform}
              onChange={handleInputChange}
              disabled={scheduleOptions.length === 0 && !lesson}
            >
              <option value="jitsi">Jitsi Meet</option>
              <option value="none">Không có</option>
            </select>
          </div>
        </div>

        {(course.pricingType === 'per_lesson' || course.pricingType === 'both') && (
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Giá bài học (VND)</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                disabled={scheduleOptions.length === 0 && !lesson}
              />
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="maxParticipants">Số học viên tối đa (0 = không giới hạn)</label>
            <input
              type="number"
              id="maxParticipants"
              name="maxParticipants"
              value={formData.maxParticipants}
              onChange={handleInputChange}
              min="0"
              disabled={scheduleOptions.length === 0 && !lesson}
            />
          </div>

          <div className="form-group">
            <label htmlFor="registrationDeadline">Hạn đăng ký trước (phút)</label>
            <input
              type="number"
              id="registrationDeadline"
              name="registrationDeadline"
              value={formData.registrationDeadline}
              onChange={handleInputChange}
              min="0"
              disabled={scheduleOptions.length === 0 && !lesson}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Mục tiêu học tập</label>
          <div className="array-input">
            <input
              type="text"
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              placeholder="Nhập mục tiêu học tập..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addObjective();
                }
              }}
              disabled={scheduleOptions.length === 0 && !lesson}
            />
            <button 
              type="button" 
              onClick={addObjective}
              disabled={scheduleOptions.length === 0 && !lesson}
            >
              Thêm
            </button>
          </div>
          <div className="array-list">
            {formData.objectives.map((obj, index) => (
              <div key={index} className="array-item">
                <span>{obj}</span>
                <button 
                  type="button" 
                  onClick={() => removeObjective(index)}
                  disabled={scheduleOptions.length === 0 && !lesson}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Điều kiện tiên quyết</label>
          <div className="array-input">
            <input
              type="text"
              value={newPrerequisite}
              onChange={(e) => setNewPrerequisite(e.target.value)}
              placeholder="Nhập điều kiện tiên quyết..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addPrerequisite();
                }
              }}
              disabled={scheduleOptions.length === 0 && !lesson}
            />
            <button 
              type="button" 
              onClick={addPrerequisite}
              disabled={scheduleOptions.length === 0 && !lesson}
            >
              Thêm
            </button>
          </div>
          <div className="array-list">
            {formData.prerequisites.map((preq, index) => (
              <div key={index} className="array-item">
                <span>{preq}</span>
                <button 
                  type="button" 
                  onClick={() => removePrerequisite(index)}
                  disabled={scheduleOptions.length === 0 && !lesson}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="isPreview"
              name="isPreview"
              checked={formData.isPreview}
              onChange={handleInputChange}
              disabled={scheduleOptions.length === 0 && !lesson}
            />
            <label htmlFor="isPreview">Bài học xem trước</label>
          </div>

          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="isFree"
              name="isFree"
              checked={formData.isFree}
              onChange={handleInputChange}
              disabled={scheduleOptions.length === 0 && !lesson}
            />
            <label htmlFor="isFree">Miễn phí</label>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={onCancel} 
            className="btn-secondary"
          >
            Hủy
          </button>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={scheduleOptions.length === 0 && !lesson}
          >
            {lesson ? 'Cập nhật' : 'Tạo bài học'}
          </button>
        </div>
      </form>

      <style>{`
        .readonly-input {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }
        .form-help {
          font-size: 0.875rem;
          color: #666;
          margin-top: 0.25rem;
        }
        .form-error {
          font-size: 0.875rem;
          color: #dc3545;
          margin-top: 0.25rem;
        }
        .alert {
          padding: 1rem;
          margin-bottom: 1rem;
          border: 1px solid transparent;
          border-radius: 0.25rem;
        }
        .alert-warning {
          color: #856404;
          background-color: #fff3cd;
          border-color: #ffeaa7;
        }
      `}</style>
    </div>
  );
};

export default LessonForm;