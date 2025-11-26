// frontend/src/types/course.types.ts
export interface DatedSchedule {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
  meetingPlatform: string;
  isActive: boolean;
  hasLesson: boolean;
  lessonId?: string;
  individualPrice?: number;
  availableForIndividualPurchase?: boolean;
  notes?: string;
}

export interface Schedule {
  _id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
  meetingPlatform: string;
  isActive: boolean;
  hasLesson: boolean;
  lessonId?: string;
}

export interface Lesson {
  _id: string;
  title: string;
  description: string;
  order: number;
  duration: number;
  lessonType: string;
  status: string;
  isMeetingActive: boolean;
  currentParticipants?: number;
  maxParticipants?: number;
  scheduleInfo?: {
    date?: string;
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
    timezone?: string;
    meetingPlatform?: string;
  };
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: string;
  status: string;
  schedules: Schedule[];
  datedSchedules: DatedSchedule[];
  maxStudents?: number;
}

// Tạo interface mở rộng cho course với rating
export interface CourseWithRating extends Course {
  averageRating?: number;
  totalRatings?: number;
  enrollmentCount?: number;
}