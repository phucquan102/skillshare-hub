const Course = require('../models/Course');
const mongoose = require('mongoose');
const axios = require('axios');

// Helper function để gọi API user service
const getInstructorInfo = async (userId) => {
  try {
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
    const url = `${userServiceUrl}/${userId}`;

    const response = await axios.get(url, { timeout: 5000 });
    
    // Handle different response formats
    let userData;
    if (response.data.user) {
      userData = response.data.user;
    } else if (response.data._id) {
      userData = response.data;
    } else {
      throw new Error('Unexpected response format from user service');
    }

    return {
      _id: userData._id,
      fullName: userData.fullName,
      email: userData.email,
      profile: userData.profile || {}
    };
  } catch (error) {
    console.error('Error fetching instructor info:', error.message);
    return {
      _id: userId,
      fullName: 'Unknown Instructor',
      email: 'unknown@example.com',
      profile: { avatar: null, bio: null }
    };
  }
};

const getMultipleInstructorInfo = async (userIds) => {
  try {
    const uniqueUserIds = [...new Set(userIds)];
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
    const url = `${userServiceUrl}/users/batch`;

    const response = await axios.post(url, { userIds: uniqueUserIds }, { timeout: 10000 });
    
    // Handle different response formats
    let usersData;
    if (response.data.users) {
      usersData = response.data.users;
    } else if (Array.isArray(response.data)) {
      usersData = response.data;
    } else {
      throw new Error('Unexpected response format from user service');
    }

    return usersData.map(user => ({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profile: user.profile || {}
    }));
  } catch (error) {
    console.error('Error fetching multiple instructors info:', error.message);
    return userIds.map(userId => ({
      _id: userId,
      fullName: 'Unknown Instructor',
      email: 'unknown@example.com',
      profile: { avatar: null, bio: null }
    }));
  }
};
const courseController = {
  // Tạo khóa học mới (Instructor only)
  createCourse: async (req, res) => {
    try {
      const {
        title, description, shortDescription, category, level,
        pricingType, fullCoursePrice, lessons, schedules,
        maxStudents, tags, requirements, whatYouWillLearn,
        thumbnail, startDate, endDate
      } = req.body;

      // Validate instructor permission
      if (req.userRole !== 'instructor' && req.userRole !== 'admin') {
        return res.status(403).json({ 
          message: 'Chỉ giảng viên mới có thể tạo khóa học' 
        });
      }

      // Validate required fields
      if (!title || !description || !category || !startDate || !endDate) {
        return res.status(400).json({ 
          message: 'Thiếu thông tin bắt buộc: title, description, category, startDate, endDate' 
        });
      }

      // Validate pricing
      if (pricingType === 'full_course' && !fullCoursePrice) {
        return res.status(400).json({ 
          message: 'Giá khóa học là bắt buộc khi chọn thanh toán trọn khóa' 
        });
      }

      if (pricingType === 'per_lesson' && lessons) {
        const invalidLessons = lessons.filter(lesson => !lesson.price);
        if (invalidLessons.length > 0) {
          return res.status(400).json({ 
            message: 'Tất cả bài học phải có giá khi chọn thanh toán theo buổi' 
          });
        }
      }

      // Validate date
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start >= end) {
        return res.status(400).json({ 
          message: 'Ngày kết thúc phải sau ngày bắt đầu' 
        });
      }

      const course = new Course({
        title,
        description,
        shortDescription,
        instructor: req.userId,
        category,
        level,
        pricingType,
        fullCoursePrice,
        lessons: lessons || [],
        schedules: schedules || [],
        maxStudents,
        tags: tags || [],
        requirements: requirements || [],
        whatYouWillLearn: whatYouWillLearn || [],
        thumbnail,
        startDate: start,
        endDate: end
      });

      await course.save();

      // Gọi API để lấy thông tin instructor
      const instructorInfo = await getInstructorInfo(req.userId);
      const courseWithInstructor = {
        ...course.toObject(),
        instructor: {
          _id: instructorInfo._id,
          fullName: instructorInfo.fullName,
          email: instructorInfo.email,
          profile: {
            avatar: instructorInfo.profile?.avatar
          }
        }
      };

      res.status(201).json({
        message: 'Tạo khóa học thành công',
        course: courseWithInstructor
      });
    } catch (error) {
      console.error('Create course error:', error);
      res.status(500).json({ 
        message: 'Lỗi server', 
        error: error.message 
      });
    }
  },

  // Lấy danh sách khóa học với search và filter
  getCourses: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        category,
        level,
        pricingType,
        minPrice,
        maxPrice,
        status = 'published',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build filter object
      const filter = { status };
      
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (category) {
        filter.category = category;
      }
      
      if (level) {
        filter.level = level;
      }
      
      if (pricingType) {
        filter.pricingType = pricingType;
      }
      
      if (minPrice || maxPrice) {
        filter.fullCoursePrice = {};
        if (minPrice) filter.fullCoursePrice.$gte = Number(minPrice);
        if (maxPrice) filter.fullCoursePrice.$lte = Number(maxPrice);
      }

      // Sort options
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const courses = await Course.find(filter)
        .sort(sortOptions)
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .lean();

      const total = await Course.countDocuments(filter);

      // Lấy danh sách instructor IDs
      const instructorIds = courses.map(course => course.instructor);
      
      // Gọi API để lấy thông tin instructors
      const instructorsInfo = await getMultipleInstructorInfo(instructorIds);
      
      // Map instructors với courses
      const instructorsMap = {};
      instructorsInfo.forEach(instructor => {
        instructorsMap[instructor._id] = instructor;
      });

      // Kết hợp thông tin courses với instructor info
      const coursesWithInstructors = courses.map(course => {
        const instructorInfo = instructorsMap[course.instructor] || {
          _id: course.instructor,
          fullName: 'Unknown Instructor',
          email: 'unknown@example.com',
          profile: { avatar: null, bio: null }
        };

        return {
          ...course,
          instructor: {
            _id: instructorInfo._id,
            fullName: instructorInfo.fullName,
            email: instructorInfo.email,
            profile: {
              avatar: instructorInfo.profile?.avatar,
              bio: instructorInfo.profile?.bio
            }
          },
          availableSpots: course.maxStudents - course.currentEnrollments
        };
      });

      res.json({
        courses: coursesWithInstructors,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalCourses: total,
          hasNext: Number(page) < Math.ceil(total / Number(limit)),
          hasPrev: Number(page) > 1
        }
      });
    } catch (error) {
      console.error('Get courses error:', error);
      res.status(500).json({ 
        message: 'Lỗi server', 
        error: error.message 
      });
    }
  },

  // Lấy chi tiết khóa học
  getCourseById: async (req, res) => {
    try {
      const { courseId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
      }

      const course = await Course.findById(courseId).lean();

      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      // Gọi API để lấy thông tin instructor
      const instructorInfo = await getInstructorInfo(course.instructor);

      const courseWithInstructor = {
        ...course,
        instructor: {
          _id: instructorInfo._id,
          fullName: instructorInfo.fullName,
          email: instructorInfo.email,
          profile: instructorInfo.profile
        },
        availableSpots: course.maxStudents - course.currentEnrollments,
        totalLessons: course.lessons.length
      };

      res.json({ course: courseWithInstructor });
    } catch (error) {
      console.error('Get course by ID error:', error);
      res.status(500).json({ 
        message: 'Lỗi server', 
        error: error.message 
      });
    }
  },

  // Cập nhật khóa học (Instructor only - own courses)
  updateCourse: async (req, res) => {
    try {
      const { courseId } = req.params;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      // Check ownership (instructor can only edit their own courses)
      if (req.userRole !== 'admin' && course.instructor.toString() !== req.userId) {
        return res.status(403).json({ 
          message: 'Bạn chỉ có thể chỉnh sửa khóa học của mình' 
        });
      }

      // Remove sensitive fields that shouldn't be updated directly
      delete updateData.instructor;
      delete updateData.currentEnrollments;
      delete updateData.ratings;

      const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        { ...updateData },
        { new: true, runValidators: true }
      ).lean();

      // Gọi API để lấy thông tin instructor
      const instructorInfo = await getInstructorInfo(updatedCourse.instructor);
      const courseWithInstructor = {
        ...updatedCourse,
        instructor: {
          _id: instructorInfo._id,
          fullName: instructorInfo.fullName,
          email: instructorInfo.email,
          profile: {
            avatar: instructorInfo.profile?.avatar
          }
        }
      };

      res.json({
        message: 'Cập nhật khóa học thành công',
        course: courseWithInstructor
      });
    } catch (error) {
      console.error('Update course error:', error);
      res.status(500).json({ 
        message: 'Lỗi server', 
        error: error.message 
      });
    }
  },

  // Xóa khóa học (Soft delete)
  deleteCourse: async (req, res) => {
    try {
      const { courseId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      // Check ownership
      if (req.userRole !== 'admin' && course.instructor.toString() !== req.userId) {
        return res.status(403).json({ 
          message: 'Bạn chỉ có thể xóa khóa học của mình' 
        });
      }

      // Check if course has active enrollments
      if (course.currentEnrollments > 0) {
        return res.status(400).json({ 
          message: 'Không thể xóa khóa học đang có học viên đăng ký' 
        });
      }

      // Soft delete - change status to archived
      course.status = 'archived';
      course.isActive = false;
      await course.save();

      res.json({
        message: 'Xóa khóa học thành công',
        courseId
      });
    } catch (error) {
      console.error('Delete course error:', error);
      res.status(500).json({ 
        message: 'Lỗi server', 
        error: error.message 
      });
    }
  },

  // Lấy khóa học của instructor hiện tại
  getMyCourses: async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;

      const filter = { instructor: req.userId };
      if (status) {
        filter.status = status;
      }

      const courses = await Course.find(filter)
        .sort({ updatedAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .lean();

      const total = await Course.countDocuments(filter);

      // Add calculated fields (không cần gọi API instructor vì đây là khóa học của chính user)
      const coursesWithStats = courses.map(course => ({
        ...course,
        availableSpots: course.maxStudents - course.currentEnrollments,
        totalLessons: course.lessons.length
      }));

      res.json({
        courses: coursesWithStats,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalCourses: total
        }
      });
    } catch (error) {
      console.error('Get my courses error:', error);
      res.status(500).json({ 
        message: 'Lỗi server', 
        error: error.message 
      });
    }
  },

  // Cập nhật trạng thái khóa học (publish/draft/archive)
  updateCourseStatus: async (req, res) => {
    try {
      const { courseId } = req.params;
      const { status } = req.body;

      if (!['draft', 'published', 'archived'].includes(status)) {
        return res.status(400).json({ 
          message: 'Trạng thái không hợp lệ' 
        });
      }

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      // Check ownership
      if (req.userRole !== 'admin' && course.instructor.toString() !== req.userId) {
        return res.status(403).json({ 
          message: 'Bạn không có quyền thay đổi trạng thái khóa học này' 
        });
      }

      course.status = status;
      course.isActive = status === 'published';
      await course.save();

      res.json({
        message: `${status === 'published' ? 'Xuất bản' : status === 'draft' ? 'Chuyển về nháp' : 'Lưu trữ'} khóa học thành công`,
        course: {
          id: course._id,
          title: course.title,
          status: course.status,
          isActive: course.isActive
        }
      });
    } catch (error) {
      console.error('Update course status error:', error);
      res.status(500).json({ 
        message: 'Lỗi server', 
        error: error.message 
      });
    }
  }
};

module.exports = courseController;