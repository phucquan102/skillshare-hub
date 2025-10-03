import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { courseService, Course, CoursesResponse } from '../../../services/api/courseService';
import { FilterState, CourseListProps } from './CourseList.types';

const CourseList: React.FC<CourseListProps> = ({ initialFilters = {} }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [filters, setFilters] = useState<FilterState>({
    page: 1,
    limit: 6,
    search: '',
    category: '',
    level: '',
    minPrice: undefined,
    maxPrice: undefined,
    status: 'published',
    ...initialFilters,
  });

  const [hasMore, setHasMore] = useState<boolean>(false);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setSearchLoading(true);
    setError(null);
    try {
      const response: CoursesResponse = await courseService.getCourses(filters);
      if (response?.courses && response?.pagination) {
        setCourses((prev) => (filters.page === 1 ? response.courses : [...prev, ...response.courses]));
        setHasMore(response.pagination.hasNext);
      } else {
        setCourses([]);
        setHasMore(false);
      }
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      setError(error?.response?.data?.message || 'Unable to load courses.');
      setCourses([]);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
    }, 600);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleFilterChange = (key: keyof FilterState, value: string | number | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePriceFilterChange = (range: string) => {
    let minPrice: number | undefined;
    let maxPrice: number | undefined;
    switch (range) {
      case 'free':
        minPrice = 0;
        maxPrice = 0;
        break;
      case '0-50':
        minPrice = 0;
        maxPrice = 50;
        break;
      case '50-100':
        minPrice = 50;
        maxPrice = 100;
        break;
      case '100+':
        minPrice = 100;
        maxPrice = undefined;
        break;
      default:
        minPrice = undefined;
        maxPrice = undefined;
    }
    setFilters((prev) => ({ ...prev, minPrice, maxPrice, page: 1 }));
  };

  const handleLoadMore = () => {
    setFilters((prev) => ({ ...prev, page: prev.page + 1 }));
  };

const handleEnroll = async (courseId: string, amount: number) => {
  if (!user) {
    navigate('/login');
    return;
  }
  if (!courseId) {
    setError('Course ID is missing');
    return;
  }
  if (amount < 0) {
    setError('Invalid course price');
    return;
  }
  navigate(`/payment/checkout?courseId=${courseId}&amount=${amount}`);
};
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const translateCategory = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      programming: 'Programming',
      design: 'Design',
      business: 'Business',
      marketing: 'Marketing',
      language: 'Language',
      music: 'Music',
      photography: 'Photography',
      cooking: 'Cooking',
      fitness: 'Fitness',
      art: 'Art',
      writing: 'Writing',
      other: 'Other',
    };
    return categoryMap[category] || category;
  };

  const translateLevel = (level: string): string => {
    const levelMap: { [key: string]: string } = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    };
    return levelMap[level] || level;
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      limit: 6,
      search: '',
      category: '',
      level: '',
      minPrice: undefined,
      maxPrice: undefined,
      status: 'published',
    });
  };

  const instructors = useMemo(() => {
    return Array.from(
      new Map(
        courses
          .filter((c) => c.instructor && c.instructor._id)
          .map((c) => [c.instructor._id, c.instructor])
      ).values()
    );
  }, [courses]);

  if (loading && courses.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="animate-spin text-2xl">⏳</span>
        <span className="ml-3 text-gray-600">Loading courses...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-[#3a0ca3] mb-1">Search</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Enter course name..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4361ee] focus:border-[#4361ee]"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchLoading && (
              <span className="absolute right-3 top-3 text-gray-400 animate-spin">⏳</span>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#3a0ca3] mb-1">Category</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4361ee] focus:border-[#4361ee]"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">All</option>
            <option value="programming">Programming</option>
            <option value="design">Design</option>
            <option value="business">Business</option>
            <option value="marketing">Marketing</option>
            <option value="language">Language</option>
            <option value="music">Music</option>
            <option value="photography">Photography</option>
            <option value="cooking">Cooking</option>
            <option value="fitness">Fitness</option>
            <option value="art">Art</option>
            <option value="writing">Writing</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#3a0ca3] mb-1">Instructor</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4361ee] focus:border-[#4361ee]"
            value={filters.instructor || ''}
            onChange={(e) => handleFilterChange('instructor', e.target.value)}
          >
            <option value="">All</option>
            {instructors.map((instructor) => (
              <option key={instructor._id} value={instructor._id}>
                {instructor.fullName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#3a0ca3] mb-1">Price</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4361ee] focus:border-[#4361ee]"
            value={
              filters.minPrice && filters.maxPrice
                ? `${filters.minPrice}-${filters.maxPrice}`
                : filters.minPrice === 0
                ? 'free'
                : ''
            }
            onChange={(e) => handlePriceFilterChange(e.target.value)}
          >
            <option value="">All</option>
            <option value="free">Free</option>
            <option value="0-50">$0 - $50</option>
            <option value="50-100">$50 - $100</option>
            <option value="100+">$100+</option>
          </select>
        </div>
      </div>
      <div className="text-center mb-6">
        <button
          onClick={() => fetchCourses()}
          className="px-4 py-2 bg-[#4361ee] text-white rounded hover:bg-[#3a0ca3] transition mr-2"
        >
          Apply Filters
        </button>
        <button
          onClick={handleResetFilters}
          className="px-4 py-2 bg-[#4361ee] text-white rounded hover:bg-[#3a0ca3] transition"
        >
          Reset Filters
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-600 text-red-600 p-4 rounded-md mb-6 flex items-center">
          <span className="mr-2">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
            ❌
          </button>
        </div>
      )}

      {/* Course List */}
      <h2 className="text-2xl font-bold text-[#3a0ca3] mb-4">Available Courses</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {courses.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <span className="text-4xl text-gray-300 mb-4 block">📚</span>
            <p className="text-gray-500 text-lg">
              {filters.search || filters.category || filters.level || filters.minPrice || filters.maxPrice
                ? 'No courses found matching the criteria'
                : 'No courses available yet'}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {filters.search || filters.category || filters.level || filters.minPrice || filters.maxPrice
                ? 'Try adjusting the filters to see more results'
                : 'Explore to find the right course'}
            </p>
          </div>
        ) : (
          courses
            .filter((course) => {
              if (!filters.instructor) return true;
              return course.instructor._id === filters.instructor;
            })
            .map((course) => (
              <div
                key={course._id}
                className="bg-gray-200 rounded-md overflow-hidden shadow-md hover:shadow-lg transition cursor-pointer flex flex-col"
                onClick={() => handleCourseClick(course._id)}
              >
               <img
  src={course.thumbnail || '/default-course.jpg'}
  alt={course.title}
  className="w-full h-36 object-cover"
  onError={(e) => {
    (e.target as HTMLImageElement).src = '/default-course.jpg';
  }}
/>

                <div className="p-4 flex-1">
                  <h3 className="text-lg font-semibold text-[#3a0ca3] mb-2">
                    {course.title.length > 50 ? `${course.title.substring(0, 50)}...` : course.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{course.shortDescription || course.description}</p>
                  <p className="text-sm text-gray-600">Instructor: {course.instructor?.fullName || 'Unknown'}</p>
                  <p className="text-sm font-medium text-gray-600">
                    {course.fullCoursePrice ? formatCurrency(course.fullCoursePrice) : 'Free'} • {translateLevel(course.level)}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEnroll(course._id, course.fullCoursePrice || 0);
                    }}
                    className="mt-2 px-4 py-2 bg-[#4361ee] text-white rounded hover:bg-[#3a0ca3] transition"
                  >
                    Enroll Now
                  </button>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center mt-6">
          <button
            onClick={handleLoadMore}
            className="px-4 py-2 bg-[#4361ee] text-white rounded hover:bg-[#3a0ca3] transition"
          >
            Load More Courses
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseList;