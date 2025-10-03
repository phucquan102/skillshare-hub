import { Course, CoursesFilter, CoursesResponse } from '../../../services/api/courseService';
export interface FilterState {
  page: number;
  limit: number;
  search: string;
  category: string;
  level: string;
  instructor?: string; // Client-side filter
  minPrice?: number;
  maxPrice?: number;
  status: string;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalCourses: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CourseListProps {
  initialFilters?: Partial<FilterState>;
}