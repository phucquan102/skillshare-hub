import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService } from '../../../../services/api/courseService';

interface LessonFormProps {
  course: any;
  lesson?: any;
  availableSchedules?: any[];
  onSave?: (lessonData: any) => void;
  onCancel?: () => void;
}

const LessonForm: React.FC<LessonFormProps> = ({ 
  course, 
  lesson, 
  availableSchedules = [],
  onSave, 
  onCancel 
}) => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [schedules, setSchedules] = useState<any[]>([]);
  const [fetchingSchedules, setFetchingSchedules] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hasManuallyEditedPrice, setHasManuallyEditedPrice] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    order: 1,
    duration: 60,
    scheduleId: '',
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

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!courseId) return;

      try {
        setFetchingSchedules(true);
        setFetchError(null);
        
        console.log('📋 Fetching schedules for course:', courseId);
        
        const usesDatedSchedules = course?.settings?.useDatedSchedules || 
                                 course?.metadata?.usesDatedSchedules || 
                                 false;
        const scheduleType = usesDatedSchedules ? 'dated' : 'weekly';
        
        console.log('🎯 Course schedule settings:', {
          usesDatedSchedules,
          scheduleType,
          courseSettings: course?.settings,
          courseMetadata: course?.metadata
        });

        const schedulesResponse = await courseService.getAvailableSchedulesByType(
          courseId, 
          scheduleType
        );
        
        console.log('📅 API schedules response:', schedulesResponse);
        setSchedules(schedulesResponse.schedules);
        
      } catch (error: any) {
        console.error('❌ Error fetching schedules:', error);
        setFetchError('Unable to load schedule list: ' + error.message);
      } finally {
        setFetchingSchedules(false);
      }
    };

    fetchSchedules();
  }, [courseId, course]);

  useEffect(() => {
    if (lesson) {
      const scheduleId = lesson.scheduleId || lesson.datedScheduleId || '';

      const initialData = {
        title: lesson.title || '',
        description: lesson.description || '',
        shortDescription: lesson.shortDescription || '',
        order: lesson.order || 1,
        duration: lesson.duration || 60,
        scheduleId: scheduleId,
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

      console.log('📝 Setting initial form data from lesson:', initialData);
      setFormData(initialData);
    }
  }, [lesson]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    const newValue = type === 'number' ? Number(value) : 
                   type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                   value;

    console.log(`🔄 Changing ${name}:`, newValue);
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    if (name === 'price') {
      setHasManuallyEditedPrice(true);
      console.log('💰 User manually edited price');
    }

    if (name === 'scheduleId' && value) {
      const selectedSchedule = schedules.find(s => s._id === value);
      
      if (selectedSchedule) {
        console.log('📅 Selected schedule:', selectedSchedule);

        if (selectedSchedule.duration) {
          const durationMatch = selectedSchedule.duration.match(/(?:(\d+) hours?\s*)?\s*(\d+) minutes?/);
          if (durationMatch) {
            const hours = durationMatch[1] ? parseInt(durationMatch[1]) : 0;
            const minutes = durationMatch[2] ? parseInt(durationMatch[2]) : 0;
            const totalMinutes = hours * 60 + minutes;
            
            if (totalMinutes > 0) {
              setFormData(prev => ({
                ...prev,
                duration: totalMinutes
              }));
              console.log(`⏱️ Auto-set duration to ${totalMinutes} minutes`);
            }
          }
        }

        if (selectedSchedule.scheduleType === 'dated' && 
            selectedSchedule.individualPrice && 
            selectedSchedule.individualPrice > 0 &&
            !hasManuallyEditedPrice) {
          
          setFormData(prev => ({
            ...prev,
            price: selectedSchedule.individualPrice
          }));
          console.log(`💰 Auto-set price to ${selectedSchedule.individualPrice} from dated schedule`);
        }

        if (selectedSchedule.scheduleType === 'weekly' && !hasManuallyEditedPrice) {
          setFormData(prev => ({
            ...prev,
            price: 0
          }));
          console.log('💰 Auto-set price to 0 for weekly schedule');
        }
      }
    }
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
    
    if (!formData.scheduleId) {
      alert('Please select a schedule for the lesson');
      return;
    }

    console.log('🔍 Submitting lesson data:', formData);

    const selectedSchedule = schedules.find(s => s._id === formData.scheduleId);

    if (!selectedSchedule) {
      console.error('❌ Selected schedule not found');
      alert('The selected schedule does not exist. Please choose another schedule.');
      return;
    }

    const isDatedSchedule = selectedSchedule.scheduleType === 'dated';
    const submitData = {
      ...formData,
      ...(isDatedSchedule 
        ? { datedScheduleId: formData.scheduleId, scheduleId: undefined }
        : { scheduleId: formData.scheduleId, datedScheduleId: undefined }
      )
    };

    console.log('📤 Final submit data:', submitData);
    console.log('🎯 Schedule type:', isDatedSchedule ? 'dated' : 'weekly');
    
    onSave?.(submitData);
  };

  if (fetchingSchedules) {
    return (
      <div className="lesson-form">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading schedule list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lesson-form">
      <h2>{lesson ? 'Edit Lesson' : 'Create New Lesson'}</h2>
      
      {fetchError && (
        <div className="alert alert-error">
          <strong>❌ Error loading schedules!</strong>
          <p>{fetchError}</p>
        </div>
      )}

      {schedules.length === 0 && !fetchingSchedules && (
        <div className="alert alert-warning">
          <strong>⚠️ No available schedules!</strong>
          <p>This course has no schedules or all schedules are already in use.</p>
          <p>Please add schedules in the course edit section before creating lessons.</p>
          {courseId && (
            <button 
              type="button" 
              className="btn-secondary mt-2"
              onClick={() => navigate(`/instructor/courses/${courseId}/edit`)}
            >
              Go to Course Edit Page
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Lesson Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            disabled={schedules.length === 0 && !lesson}
          />
        </div>

        <div className="form-group">
          <label htmlFor="shortDescription">Short Description</label>
          <textarea
            id="shortDescription"
            name="shortDescription"
            value={formData.shortDescription}
            onChange={handleInputChange}
            rows={2}
            maxLength={300}
            disabled={schedules.length === 0 && !lesson}
          />
          <div className="char-count">{formData.shortDescription.length}/300</div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Detailed Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            disabled={schedules.length === 0 && !lesson}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="order">Lesson Order *</label>
            <input
              type="number"
              id="order"
              name="order"
              value={formData.order}
              onChange={handleInputChange}
              min="1"
              required
              disabled={schedules.length === 0 && !lesson}
            />
          </div>

          <div className="form-group">
            <label htmlFor="duration">Duration (minutes) *</label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              min="1"
              max="480"
              required
              disabled={schedules.length === 0 && !lesson}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="scheduleId">Schedule *</label>
          {lesson ? (
            <div>
              <input
                type="text"
                value={
                  schedules.find(s => s._id === formData.scheduleId)?.display ||
                  `Schedule ID: ${formData.scheduleId}`
                }
                readOnly
                className="readonly-input"
              />
              <p className="form-help">
                Cannot change schedule after lesson has been created
              </p>
            </div>
          ) : (
            <select
              id="scheduleId"
              name="scheduleId"
              value={formData.scheduleId}
              onChange={handleInputChange}
              required
              disabled={schedules.length === 0}
            >
              <option value="">Select schedule...</option>
              {schedules.map((schedule) => (
                <option key={schedule._id} value={schedule._id}>
                  {schedule.display || `${schedule.dayName} - ${schedule.startTime} to ${schedule.endTime}`}
                  {schedule.individualPrice && schedule.individualPrice > 0 && (
                    ` - ${schedule.individualPrice.toLocaleString()} VND`
                  )}
                </option>
              ))}
            </select>
          )}
          {schedules.length === 0 && !lesson && (
            <p className="form-error">
              No available schedules. Please add schedules in the course first.
            </p>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="lessonType">Lesson Type</label>
            <select
              id="lessonType"
              name="lessonType"
              value={formData.lessonType}
              onChange={handleInputChange}
              disabled={schedules.length === 0 && !lesson}
            >
              <option value="self_paced">Self-paced</option>
              <option value="live_online">Live Online</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="meetingPlatform">Meeting Platform</label>
            <select
              id="meetingPlatform"
              name="meetingPlatform"
              value={formData.meetingPlatform}
              onChange={handleInputChange}
              disabled={schedules.length === 0 && !lesson}
            >
              <option value="jitsi">Jitsi Meet</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>

        {(course?.pricingType === 'per_lesson' || course?.pricingType === 'both') && (
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">
                Lesson Price (VND)
                {hasManuallyEditedPrice && (
                  <span className="edit-badge">✓ Edited</span>
                )}
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                disabled={schedules.length === 0 && !lesson}
                placeholder="Price will auto-fill when selecting a priced schedule"
              />
              <p className="form-help">
                {hasManuallyEditedPrice 
                  ? "You have manually edited the price. It won't auto-change when selecting different schedules."
                  : "Price will auto-fill when selecting a priced schedule. You can edit if needed."
                }
              </p>
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="maxParticipants">Max Participants (0 = unlimited)</label>
            <input
              type="number"
              id="maxParticipants"
              name="maxParticipants"
              value={formData.maxParticipants}
              onChange={handleInputChange}
              min="0"
              disabled={schedules.length === 0 && !lesson}
            />
          </div>

          <div className="form-group">
            <label htmlFor="registrationDeadline">Registration Deadline (minutes)</label>
            <input
              type="number"
              id="registrationDeadline"
              name="registrationDeadline"
              value={formData.registrationDeadline}
              onChange={handleInputChange}
              min="0"
              disabled={schedules.length === 0 && !lesson}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Learning Objectives</label>
          <div className="array-input">
            <input
              type="text"
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              placeholder="Enter learning objective..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addObjective();
                }
              }}
              disabled={schedules.length === 0 && !lesson}
            />
            <button 
              type="button" 
              onClick={addObjective}
              disabled={schedules.length === 0 && !lesson}
            >
              Add
            </button>
          </div>
          <div className="array-list">
            {formData.objectives.map((obj, index) => (
              <div key={index} className="array-item">
                <span>{obj}</span>
                <button 
                  type="button" 
                  onClick={() => removeObjective(index)}
                  disabled={schedules.length === 0 && !lesson}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Prerequisites</label>
          <div className="array-input">
            <input
              type="text"
              value={newPrerequisite}
              onChange={(e) => setNewPrerequisite(e.target.value)}
              placeholder="Enter prerequisite..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addPrerequisite();
                }
              }}
              disabled={schedules.length === 0 && !lesson}
            />
            <button 
              type="button" 
              onClick={addPrerequisite}
              disabled={schedules.length === 0 && !lesson}
            >
              Add
            </button>
          </div>
          <div className="array-list">
            {formData.prerequisites.map((preq, index) => (
              <div key={index} className="array-item">
                <span>{preq}</span>
                <button 
                  type="button" 
                  onClick={() => removePrerequisite(index)}
                  disabled={schedules.length === 0 && !lesson}
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
              disabled={schedules.length === 0 && !lesson}
            />
            <label htmlFor="isPreview">Preview Lesson</label>
          </div>

          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="isFree"
              name="isFree"
              checked={formData.isFree}
              onChange={handleInputChange}
              disabled={schedules.length === 0 && !lesson}
            />
            <label htmlFor="isFree">Free Lesson</label>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={onCancel} 
            className="btn-secondary"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={schedules.length === 0 && !lesson}
          >
            {lesson ? 'Update' : 'Create Lesson'}
          </button>
        </div>
      </form>

      <style>{`
        .lesson-form {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-row {
          display: flex;
          gap: 20px;
        }
        .form-row .form-group {
          flex: 1;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
        }
        input[type="text"],
        input[type="number"],
        textarea,
        select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        .readonly-input {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }
        .char-count {
          font-size: 12px;
          color: #666;
          text-align: right;
          margin-top: 4px;
        }
        .array-input {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }
        .array-input input {
          flex: 1;
        }
        .array-list {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .array-item {
          display: flex;
          justify-content: between;
          align-items: center;
          padding: 5px 10px;
          background: #f9f9f9;
          border-radius: 4px;
        }
        .array-item span {
          flex: 1;
        }
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .checkbox-group input[type="checkbox"] {
          width: auto;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }
        .btn-primary, .btn-secondary {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        .btn-primary {
          background: #007bff;
          color: white;
        }
        .btn-primary:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
        .btn-secondary {
          background: #6c757d;
          color: white;
        }
        .loading-state {
          text-align: center;
          padding: 2rem;
        }
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 2s linear infinite;
          margin: 0 auto 1rem;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .alert {
          padding: 1rem;
          margin-bottom: 1rem;
          border-radius: 4px;
        }
        .alert-warning {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
        }
        .alert-error {
          background-color: #fee;
          border: 1px solid #fcc;
          color: #c00;
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
        .edit-badge {
          background: #28a745;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.75rem;
          margin-left: 8px;
        }
      `}</style>
    </div>
  );
};

export default LessonForm;