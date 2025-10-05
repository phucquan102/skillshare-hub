const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const mongoose = require('mongoose');
const axios = require('axios');
const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
client.connect();

const getInstructorInfo = async (userId) => {
  try {
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
    const response = await axios.get(`${userServiceUrl}/internal/${userId}`, { timeout: 5000 });
    const userData = response.data;

    return {
      _id: userData._id,
      fullName: userData.fullName || 'Unknown Name',
      email: userData.email || 'unknown@example.com',
      profile: userData.profile || { avatar: null, bio: null }
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
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
    const response = await axios.post(`${userServiceUrl}/internal/batch`, { userIds: uniqueUserIds }, { timeout: 5000 });
    return response.data.users.map(user => ({
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
  createCourse: async (req, res) => {
  try {
    console.log('🎯 [createCourse] Started for user:', req.userId);
    console.log('📦 Request body:', req.body);

    const {
      title, description, shortDescription, category, subcategory, level,
      pricingType, fullCoursePrice, coInstructors, schedules,
      maxStudents, prerequisites, learningOutcomes, materialsIncluded,
      requirements, tags, language, thumbnail, promoVideo, gallery,
      discount, certificate, featured, startDate, endDate
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !pricingType || !startDate || !endDate) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        message: 'Thiếu thông tin bắt buộc',
        required: ['title', 'description', 'category', 'pricingType', 'startDate', 'endDate']
      });
    }

    if (req.userRole !== 'instructor' && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Chỉ giảng viên mới có thể tạo khóa học' });
    }

    // Validate pricing
    if (pricingType === 'full_course' && (!fullCoursePrice && fullCoursePrice !== 0)) {
      return res.status(400).json({ message: 'Giá khóa học là bắt buộc khi chọn thanh toán trọn khóa' });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end) || start >= end) {
      return res.status(400).json({ message: 'Ngày bắt đầu và kết thúc không hợp lệ' });
    }

    console.log('✅ Validation passed, creating course...');

    const course = new Course({
      title, description, shortDescription, category, subcategory, level,
      pricingType, fullCoursePrice, coInstructors: coInstructors || [],
      schedules: schedules || [], maxStudents, prerequisites: prerequisites || [],
      learningOutcomes: learningOutcomes || [], materialsIncluded: materialsIncluded || [],
      requirements: requirements || [], tags: tags || [], 
      language: language || 'en', // ĐỔI 'vi' THÀNH 'en' HOẶC BỎ TRỐNG
      thumbnail, promoVideo, gallery: gallery || [], discount, certificate, featured,
      startDate, endDate,
      instructor: req.userId, 
      status: 'draft', 
      approvalStatus: { status: 'pending' }
    });

    await course.save();
    console.log('✅ Course created successfully:', course._id);

    // Populate instructor info
    const instructorInfo = await getInstructorInfo(req.userId);
    const courseWithInstructor = {
      ...course.toObject(),
      instructor: {
        _id: instructorInfo._id,
        fullName: instructorInfo.fullName,
        email: instructorInfo.email,
        profile: { avatar: instructorInfo.profile?.avatar }
      }
    };

    res.status(201).json({
      message: 'Tạo khóa học thành công',
      course: courseWithInstructor
    });
  } catch (error) {
    console.error('❌ [createCourse] Error:', {
      message: error.message,
      stack: error.stack,
      userId: req.userId
    });
    
    // Handle specific errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Dữ liệu không hợp lệ',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Khóa học với tiêu đề này đã tồn tại' });
    }

    res.status(500).json({ 
      message: 'Lỗi server khi tạo khóa học',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
},

  updateCourseStatus: async (req, res) => {
    try {
      const { courseId } = req.params;
      const { status } = req.body;

      if (!['draft', 'pending_review', 'archived'].includes(status)) {
        return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
      }

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      if (req.userRole !== 'admin' && course.instructor.toString() !== req.userId) {
        return res.status(403).json({ message: 'Bạn không có quyền thay đổi trạng thái khóa học này' });
      }

    

      course.status = status;
      course.isActive = status === 'published';
      course.approvalStatus = status === 'pending_review' ? { status: 'pending' } : course.approvalStatus;
      await course.save();

      res.json({
        message: `Khóa học đã được ${status === 'pending_review' ? 'submit để duyệt' : status === 'draft' ? 'chuyển về nháp' : 'lưu trữ'}`,
        course: { id: course._id, title: course.title, status: course.status, isActive: course.isActive }
      });
    } catch (error) {
      console.error('Update course status error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  createLesson: async (req, res) => {
    try {
      const { courseId } = req.params;
      const {
        title, description, order, duration, price, type,
        content, resources, isPreview, schedule, requirements, objectives, metadata
      } = req.body;

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      if (req.userRole !== 'admin' && course.instructor.toString() !== req.userId) {
        return res.status(403).json({ message: 'Bạn không có quyền thêm bài học' });
      }

      if ((course.pricingType === 'per_lesson' || course.pricingType === 'both') && !price) {
        return res.status(400).json({ message: 'Giá bài học là bắt buộc' });
      }

      if (course.status === 'published' || course.status === 'pending_review') {
        return res.status(400).json({ message: 'Không thể thêm bài học vào khóa học đã xuất bản hoặc đang chờ duyệt' });
      }

      const lesson = new Lesson({
        courseId,
        title,
        description,
        order,
        duration,
        price,
        type,
        content,
        resources: resources || [],
        isPreview: isPreview || false,
        schedule,
        requirements: requirements || [],
        objectives: objectives || [],
        metadata,
        status: 'draft'
      });

      await lesson.save();

      course.lessons.push(lesson._id);
      await course.save();

      res.status(201).json({ message: 'Tạo bài học thành công', lesson });
    } catch (error) {
      console.error('Create lesson error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  updateLesson: async (req, res) => {
    try {
      const { lessonId } = req.params;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        return res.status(400).json({ message: 'ID bài học không hợp lệ' });
      }

      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: 'Không tìm thấy bài học' });
      }

      const course = await Course.findById(lesson.courseId);
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      if (req.userRole !== 'admin' && course.instructor.toString() !== req.userId) {
        return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa bài học' });
      }

      if (course.status === 'published' || course.status === 'pending_review') {
        return res.status(400).json({ message: 'Không thể chỉnh sửa bài học trong khóa học đã xuất bản hoặc đang chờ duyệt' });
      }

      if ((course.pricingType === 'per_lesson' || course.pricingType === 'both') && updateData.price === undefined) {
        return res.status(400).json({ message: 'Giá bài học là bắt buộc' });
      }

      const updatedLesson = await Lesson.findByIdAndUpdate(
        lessonId,
        { ...updateData, status: updateData.status || lesson.status },
        { new: true, runValidators: true }
      );

      res.json({ message: 'Cập nhật bài học thành công', lesson: updatedLesson });
    } catch (error) {
      console.error('Update lesson error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  deleteLesson: async (req, res) => {
    try {
      const { lessonId } = req.params; // Chỉ cần lessonId

      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        return res.status(400).json({ message: 'ID bài học không hợp lệ' });
      }

      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: 'Không tìm thấy bài học' });
      }

      const course = await Course.findById(lesson.courseId);
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      if (req.userRole !== 'admin' && course.instructor.toString() !== req.userId) {
        return res.status(403).json({ message: 'Bạn không có quyền xóa bài học' });
      }

      if (course.status === 'published' || course.status === 'pending_review') {
        return res.status(400).json({ message: 'Không thể xóa bài học trong khóa học đã xuất bản hoặc đang chờ duyệt' });
      }

      await Lesson.findByIdAndDelete(lessonId);
      course.lessons.pull(lessonId);
      await course.save();

      res.json({ message: 'Xóa bài học thành công', lessonId });
    } catch (error) {
      console.error('Delete lesson error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  getPendingCourses: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;

      const filter = { status: 'pending_review' };
      const courses = await Course.find(filter)
        .populate('lessons')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .lean();

      const total = await Course.countDocuments(filter);

      const instructorIds = courses.map(course => course.instructor);
      const instructorsInfo = await getMultipleInstructorInfo(instructorIds);

      const instructorsMap = {};
      instructorsInfo.forEach(instructor => {
        instructorsMap[instructor._id] = instructor;
      });

      const coursesWithInstructors = courses.map(course => ({
        ...course,
        instructor: instructorsMap[course.instructor] || {
          _id: course.instructor,
          fullName: 'Unknown Instructor',
          email: 'unknown@example.com',
          profile: { avatar: null, bio: null }
        },
        availableSpots: course.maxStudents - course.currentEnrollments
      }));

      res.json({
        courses: coursesWithInstructors,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalCourses: total
        }
      });
    } catch (error) {
      console.error('Get pending courses error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  approveCourse: async (req, res) => {
    try {
      const { courseId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      if (course.status !== 'pending_review') {
        return res.status(400).json({ message: 'Khóa học không ở trạng thái chờ duyệt' });
      }

      course.status = 'published';
      course.isActive = true;
      course.approvalStatus = { status: 'approved' };
      await course.save();

      res.json({ message: 'Phê duyệt khóa học thành công', courseId });
    } catch (error) {
      console.error('Approve course error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },
getLessonById: async (req, res) => {
  try {
    const { lessonId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: 'ID bài học không hợp lệ' });
    }

    const lesson = await Lesson.findById(lessonId).lean();
    if (!lesson) {
      return res.status(404).json({ message: 'Không tìm thấy bài học' });
    }

    const course = await Course.findById(lesson.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    }

    // Chỉ admin, instructor của khóa học, hoặc student đã đăng ký mới có quyền xem
    const enrollment = await Enrollment.findOne({ userId: req.userId, courseId: lesson.courseId });
    if (req.userRole !== 'admin' && 
        course.instructor.toString() !== req.userId && 
        !enrollment && 
        !lesson.isPreview) {
      return res.status(403).json({ message: 'Bạn không có quyền xem bài học này' });
    }

    res.json({ lesson });
  } catch (error) {
    console.error('Get lesson by ID error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
},
getLessonsByCourse: async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    }

    // Chỉ admin, instructor, hoặc student đã đăng ký mới có quyền xem
    const enrollment = await Enrollment.findOne({ userId: req.userId, courseId });
    if (req.userRole !== 'admin' && 
        course.instructor.toString() !== req.userId && 
        !enrollment) {
      return res.status(403).json({ message: 'Bạn không có quyền xem danh sách bài học' });
    }

    const lessons = await Lesson.find({ courseId })
      .sort({ order: 1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await Lesson.countDocuments({ courseId });

    res.json({
      lessons,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalLessons: total
      }
    });
  } catch (error) {
    console.error('Get lessons by course error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
},
  rejectCourse: async (req, res) => {
    try {
      const { courseId } = req.params;
      const { reason } = req.body;

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
      }

      if (!reason) {
        return res.status(400).json({ message: 'Lý do từ chối là bắt buộc' });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      if (course.status !== 'pending_review') {
        return res.status(400).json({ message: 'Khóa học không ở trạng thái chờ duyệt' });
      }

      course.status = 'rejected';
      course.isActive = false;
      course.approvalStatus = { status: 'rejected', reason };
      await course.save();

      res.json({ message: 'Từ chối khóa học thành công', courseId });
    } catch (error) {
      console.error('Reject course error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  // createEnrollment: async (req, res) => {
  //   try {
  //   console.log("➡️ createEnrollment called by user:", req.userId, "role:", req.userRole);

  //     const { courseId, paymentId } = req.body;

  //     if (!mongoose.Types.ObjectId.isValid(courseId)) {
  //       return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
  //     }

  //     if (!mongoose.Types.ObjectId.isValid(paymentId)) {
  //       return res.status(400).json({ message: 'ID thanh toán không hợp lệ' });
  //     }

  //     const course = await Course.findById(courseId);
  //     if (!course) {
  //       return res.status(404).json({ message: 'Không tìm thấy khóa học' });
  //     }

  //     if (course.status !== 'published') {
  //       return res.status(400).json({ message: 'Khóa học chưa được xuất bản' });
  //     }

  //     if (course.currentEnrollments >= course.maxStudents) {
  //       return res.status(400).json({ message: 'Khóa học đã đầy' });
  //     }

  //     const existingEnrollment = await Enrollment.findOne({ userId: req.userId, courseId });
  //     if (existingEnrollment) {
  //       return res.status(400).json({ message: 'Bạn đã đăng ký khóa học này' });
  //     }

  //     const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3003';
  //     let payment;
  //     try {
  //       const response = await axios.get(`${paymentServiceUrl}/api/payments/${paymentId}`, {
  //         headers: { Authorization: req.header('Authorization') },
  //         timeout: 5000
  //       });
  //       payment = response.data.payment;
  //       if (payment.userId.toString() !== req.userId || payment.courseId.toString() !== courseId) {
  //         return res.status(400).json({ message: 'Thanh toán không hợp lệ' });
  //       }
  //       if (payment.paymentStatus !== 'completed') {
  //         return res.status(400).json({ message: 'Thanh toán chưa hoàn tất' });
  //       }
  //     } catch (error) {
  //       return res.status(400).json({ message: 'Không thể xác minh thanh toán', error: error.message });
  //     }

  //     const enrollment = new Enrollment({
  //       userId: req.userId,
  //       courseId,
  //       paymentId
  //     });

  //     await enrollment.save();

  //     course.currentEnrollments += 1;
  //     await course.save();

  //     res.status(201).json({ message: 'Đăng ký khóa học thành công', enrollment });
  //   } catch (error) {
  //     console.error('Create enrollment error:', error);
  //     res.status(500).json({ message: 'Lỗi server', error: error.message });
  //   }
  // },

  getCourses: async (req, res) => {
    try {
      const {
        page = 1, limit = 10, search, category, subcategory, level,
        pricingType, minPrice, maxPrice, status = 'published', sortBy = 'createdAt', sortOrder = 'desc'
      } = req.query;

      const filter = { status };
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      if (category) filter.category = category;
      if (subcategory) filter.subcategory = subcategory;
      if (level) filter.level = level;
      if (pricingType) filter.pricingType = pricingType;
      if (minPrice || maxPrice) {
        filter.fullCoursePrice = {};
        if (minPrice) filter.fullCoursePrice.$gte = Number(minPrice);
        if (maxPrice) filter.fullCoursePrice.$lte = Number(maxPrice);
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const courses = await Course.find(filter)
        .populate('lessons')
        .sort(sortOptions)
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .lean();

      const total = await Course.countDocuments(filter);

      const instructorIds = courses.map(course => course.instructor);
      const instructorsInfo = await getMultipleInstructorInfo(instructorIds);

      const instructorsMap = {};
      instructorsInfo.forEach(instructor => {
        instructorsMap[instructor._id] = instructor;
      });

      const coursesWithInstructors = courses.map(course => ({
        ...course,
        instructor: instructorsMap[course.instructor] || {
          _id: course.instructor,
          fullName: 'Unknown Instructor',
          email: 'unknown@example.com',
          profile: { avatar: null, bio: null }
        },
        availableSpots: course.maxStudents - course.currentEnrollments
      }));

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
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  getCourseById: async (req, res) => {
    try {
      const { courseId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
      }

      const course = await Course.findById(courseId).populate('lessons').lean();
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      const instructorInfo = await getInstructorInfo(course.instructor);
      const courseWithInstructor = {
        ...course,
        instructor: {
          _id: instructorInfo._id,
          fullName: instructorInfo.fullName,
          email: instructorInfo.email,
          profile: instructorInfo.profile
        },
        availableSpots: course.maxStudents - course.currentEnrollments
      };

      res.json({ course: courseWithInstructor });
    } catch (error) {
      console.error('Get course by ID error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

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

      if (req.userRole !== 'admin' && course.instructor.toString() !== req.userId) {
        return res.status(403).json({ message: 'Bạn chỉ có thể chỉnh sửa khóa học của mình' });
      }

      delete updateData.instructor;
      delete updateData.currentEnrollments;
      delete updateData.ratings;

      const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        { ...updateData },
        { new: true, runValidators: true }
      ).populate('lessons');

      const instructorInfo = await getInstructorInfo(updatedCourse.instructor);
      const courseWithInstructor = {
        ...updatedCourse.toObject(),
        instructor: {
          _id: instructorInfo._id,
          fullName: instructorInfo.fullName,
          email: instructorInfo.email,
          profile: { avatar: instructorInfo.profile?.avatar }
        }
      };

      res.json({
        message: 'Cập nhật khóa học thành công',
        course: courseWithInstructor
      });
    } catch (error) {
      console.error('Update course error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

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

      if (req.userRole !== 'admin' && course.instructor.toString() !== req.userId) {
        return res.status(403).json({ message: 'Bạn chỉ có thể xóa khóa học của mình' });
      }

      if (course.currentEnrollments > 0) {
        return res.status(400).json({ message: 'Không thể xóa khóa học đang có học viên đăng ký' });
      }

      course.status = 'archived';
      course.isActive = false;
      await course.save();

      await Lesson.updateMany({ courseId }, { status: 'archived' });

      res.json({
        message: 'Xóa khóa học thành công',
        courseId
      });
    } catch (error) {
      console.error('Delete course error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  getMyCourses: async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;

      const filter = { instructor: req.userId };
      if (status) {
        filter.status = status;
      }

      const courses = await Course.find(filter)
        .populate('lessons')
        .sort({ updatedAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .lean();

      const total = await Course.countDocuments(filter);

      const coursesWithStats = courses.map(course => ({
        ...course,
        availableSpots: course.maxStudents - course.currentEnrollments
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
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  }
};

module.exports = courseController;