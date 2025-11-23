// services/api/studentScheduleService.ts
import { apiRequest } from '../../utils/apiUtils';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export interface StudentScheduleItem {
  _id: string;
  courseId: string;
  courseTitle: string;
  lessonTitle: string;
  lessonType: string;
  accessType: 'full_course' | 'single_lesson';
  status: 'upcoming' | 'completed';
  isCompleted: boolean;
  scheduleInfo: {
    date?: string;
    startTime?: string;
    endTime?: string;
    type: string;
  };
  instructorName: string;
  courseThumbnail?: string;
  canJoin: boolean;
  meetingUrl?: string;
}

export interface StudentScheduleResponse {
  success: boolean;
  schedule: {
    upcoming: StudentScheduleItem[];
    completed: StudentScheduleItem[];
    all: StudentScheduleItem[];
  };
  summary: {
    total: number;
    upcoming: number;
    completed: number;
  };
}

export const studentScheduleService = {
  getLearningSchedule: async (): Promise<StudentScheduleResponse> => {
    const endpoint = `${API_BASE_URL}/api/students/learning-schedule`;
    
    try {
      const response = await apiRequest<StudentScheduleResponse>(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return response;
    } catch (error) {
      console.error('Error fetching learning schedule:', error);
      throw error;
    }
  }
};