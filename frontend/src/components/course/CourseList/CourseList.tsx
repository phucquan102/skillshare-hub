import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { courseService, Course, CoursesResponse } from '../../../services/api/courseService';
import { FilterState, CourseListProps } from './CourseList.types';
import { 
  FiSearch, 
  FiBook, 
  FiUser, 
  FiDollarSign,
  FiFilter,
  FiRefreshCw,
  FiArrowDown,
  FiAlertCircle,
  FiX,
  FiStar,
  FiClock,
  FiPlayCircle,
  FiBookOpen,
  FiUsers,
  FiBarChart2
} from 'react-icons/fi';
import { 
  HiOutlineAcademicCap,
  HiOutlineSparkles,
  HiOutlineCheckBadge
} from 'react-icons/hi2';

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

  // Statistics for the header
  const courseStats = useMemo(() => {
    return {
      total: courses.length,
      free: courses.filter(course => course.fullCoursePrice === 0).length,
      premium: courses.filter(course => (course.fullCoursePrice || 0) > 0).length,
    };
  }, [courses]);

  if (loading && courses.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-emerald-500/30 rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-center">
            <span className="text-xl font-semibold text-gray-700 block mb-2">Loading Courses</span>
            <span className="text-gray-500">Discovering the best learning opportunities...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500 rounded-xl">
              <FiBookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{courseStats.total}</p>
              <p className="text-emerald-600 font-medium">Total Courses</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500 rounded-xl">
              <HiOutlineCheckBadge className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{courseStats.free}</p>
              <p className="text-green-600 font-medium">Free Courses</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-500 rounded-xl">
              <FiBarChart2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{courseStats.premium}</p>
              <p className="text-teal-600 font-medium">Premium Courses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section - Green Theme */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-12 border border-emerald-100/50 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tr from-teal-500/10 to-emerald-500/10 rounded-full translate-x-1/3 translate-y-1/3"></div>
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl">
              <FiFilter className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-emerald-700 bg-clip-text text-transparent">
              Discover Your Perfect Course
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Search Input */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                <FiSearch className="w-5 h-5 text-emerald-500" />
                <span>Search Courses</span>
              </label>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="AI, Design, Business..."
                  className="w-full px-4 py-4 pl-12 bg-white/70 backdrop-blur-sm border-2 border-gray-200/80 rounded-2xl focus:ring-3 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-lg hover:shadow-xl transition-all duration-300 outline-none text-sm group-hover:border-emerald-300"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-emerald-500 transition-colors duration-300" />
                {searchLoading && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                <FiBook className="w-5 h-5 text-green-500" />
                <span>Category</span>
              </label>
              <div className="relative group">
                <select
                  className="w-full px-4 py-4 pl-12 bg-white/70 backdrop-blur-sm border-2 border-gray-200/80 rounded-2xl focus:ring-3 focus:ring-green-500/20 focus:border-green-500 shadow-lg hover:shadow-xl transition-all duration-300 outline-none cursor-pointer appearance-none text-sm group-hover:border-green-300"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="programming">Programming & Tech</option>
                  <option value="design">Design & Creative</option>
                  <option value="business">Business</option>
                  <option value="marketing">Marketing</option>
                  <option value="language">Language</option>
                  <option value="music">Music & Audio</option>
                  <option value="photography">Photography</option>
                  <option value="cooking">Cooking</option>
                  <option value="fitness">Health & Fitness</option>
                  <option value="art">Art & Culture</option>
                  <option value="writing">Writing</option>
                  <option value="other">Other</option>
                </select>
                <FiBook className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-green-500 transition-colors duration-300" />
                <FiArrowDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              </div>
            </div>

            {/* Instructor Filter */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                <FiUser className="w-5 h-5 text-teal-500" />
                <span>Instructor</span>
              </label>
              <div className="relative group">
                <select
                  className="w-full px-4 py-4 pl-12 bg-white/70 backdrop-blur-sm border-2 border-gray-200/80 rounded-2xl focus:ring-3 focus:ring-teal-500/20 focus:border-teal-500 shadow-lg hover:shadow-xl transition-all duration-300 outline-none cursor-pointer appearance-none text-sm group-hover:border-teal-300"
                  value={filters.instructor || ''}
                  onChange={(e) => handleFilterChange('instructor', e.target.value)}
                >
                  <option value="">All Instructors</option>
                  {instructors.map((instructor) => (
                    <option key={instructor._id} value={instructor._id}>
                      {instructor.fullName}
                    </option>
                  ))}
                </select>
                <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-teal-500 transition-colors duration-300" />
                <FiArrowDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                <FiDollarSign className="w-5 h-5 text-emerald-600" />
                <span>Price Range</span>
              </label>
              <div className="relative group">
                <select
                  className="w-full px-4 py-4 pl-12 bg-white/70 backdrop-blur-sm border-2 border-gray-200/80 rounded-2xl focus:ring-3 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-lg hover:shadow-xl transition-all duration-300 outline-none cursor-pointer appearance-none text-sm group-hover:border-emerald-300"
                  value={
                    filters.minPrice && filters.maxPrice
                      ? `${filters.minPrice}-${filters.maxPrice}`
                      : filters.minPrice === 0
                      ? 'free'
                      : ''
                  }
                  onChange={(e) => handlePriceFilterChange(e.target.value)}
                >
                  <option value="">All Prices</option>
                  <option value="free">Free Courses</option>
                  <option value="0-50">$0 - $50</option>
                  <option value="50-100">$50 - $100</option>
                  <option value="100+">Premium ($100+)</option>
                </select>
                <FiDollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-emerald-600 transition-colors duration-300" />
                <FiArrowDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => fetchCourses()}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 font-semibold text-sm flex items-center gap-3 group/btn shadow-lg"
            >
              <HiOutlineSparkles className="w-5 h-5 group-hover/btn:rotate-180 transition-transform duration-500" />
              Apply Filters
            </button>
            <button
              onClick={handleResetFilters}
              className="px-8 py-4 bg-white/70 backdrop-blur-sm text-gray-700 border-2 border-gray-200/80 rounded-2xl hover:bg-white hover:shadow-lg hover:scale-[1.02] transition-all duration-300 font-semibold text-sm flex items-center gap-3 shadow-lg"
            >
              <FiRefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 text-red-700 p-6 rounded-2xl mb-8 flex items-center shadow-lg animate-[slideDown_0.3s_ease-out] backdrop-blur-sm">
          <FiAlertCircle className="w-6 h-6 mr-3 text-red-500 flex-shrink-0" />
          <span className="flex-1 font-medium text-sm">{error}</span>
          <button 
            onClick={() => setError(null)} 
            className="ml-4 text-red-500 hover:text-red-700 hover:scale-110 transition-all duration-300"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Course List Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <HiOutlineAcademicCap className="w-8 h-8 text-emerald-500" />
          <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-emerald-700 bg-clip-text text-transparent">
            Featured Courses
          </h2>
        </div>
        <p className="text-gray-600 text-lg">Discover the perfect course to advance your skills</p>
      </div>

      {/* Course Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-3xl p-12 border-2 border-dashed border-gray-300/80 backdrop-blur-sm">
              <FiBook className="w-16 h-16 text-gray-400 mx-auto mb-6 animate-float" />
              <p className="text-gray-600 text-xl font-semibold mb-2">
                {filters.search || filters.category || filters.level || filters.minPrice || filters.maxPrice
                  ? 'No courses found matching your criteria'
                  : 'No courses available yet'}
              </p>
              <p className="text-gray-400 text-sm mt-3">
                {filters.search || filters.category || filters.level || filters.minPrice || filters.maxPrice
                  ? 'Try adjusting the filters to see more results'
                  : 'Check back soon for exciting new courses'}
              </p>
            </div>
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
                className="group bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer flex flex-col border border-gray-100 hover:border-emerald-200 hover:-translate-y-2 backdrop-blur-sm"
                onClick={() => handleCourseClick(course._id)}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={course.thumbnail || '/default-course.jpg'}
                    alt={course.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-course.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-emerald-600 text-xs font-bold rounded-full shadow-lg">
                      {translateLevel(course.level)}
                    </span>
                  </div>
                  {course.fullCoursePrice === 0 && (
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">
                        FREE
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors duration-300">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
                    {course.shortDescription || course.description}
                  </p>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FiUser className="w-4 h-4 text-teal-500" />
                      <span className="font-medium">{course.instructor?.fullName || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                        {course.fullCoursePrice ? formatCurrency(course.fullCoursePrice) : 'Free'}
                      </span>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <FiStar className="w-4 h-4 text-yellow-400" />
                        <span>4.8</span>
                        <FiUsers className="w-4 h-4 text-gray-400 ml-2" />
                        <span>1.2k</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEnroll(course._id, course.fullCoursePrice || 0);
                    }}
                    className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 font-semibold flex items-center justify-center gap-3 group/btn"
                  >
                    <FiPlayCircle className="w-5 h-5 group-hover/btn:scale-110 transition-transform duration-300" />
                    {course.fullCoursePrice ? 'Enroll Now' : 'Start Learning'}
                  </button>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center mt-12">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-12 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold flex items-center justify-center gap-3 mx-auto group shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Loading...
              </>
            ) : (
              <>
                <FiArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform duration-300" />
                Load More Courses
                <FiArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform duration-300" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseList;