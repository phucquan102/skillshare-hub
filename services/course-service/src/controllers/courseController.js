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

      // 🎯 THÊM: Validate schedules
      if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
        return res.status(400).json({ 
          message: 'Danh sách lịch học là bắt buộc',
          required: 'schedules (array of {dayOfWeek, startTime, endTime})'
        });
      }

      // Validate từng schedule
      for (let i = 0; i < schedules.length; i++) {
        const schedule = schedules[i];
        if (schedule.dayOfWeek === undefined || !schedule.startTime || !schedule.endTime) {
          return res.status(400).json({ 
            message: `Schedule ${i+1} thiếu thông tin bắt buộc: dayOfWeek, startTime, endTime`
          });
        }
        
        // Validate time format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(schedule.startTime) || !timeRegex.test(schedule.endTime)) {
          return res.status(400).json({ 
            message: `Schedule ${i+1} có định dạng thời gian không hợp lệ (HH:mm)`
          });
        }

        // Validate time logic
        const start = new Date(`2000-01-01T${schedule.startTime}`);
        const end = new Date(`2000-01-01T${schedule.endTime}`);
        if (isNaN(start) || isNaN(end) || start >= end) {
          return res.status(400).json({ 
            message: `Schedule ${i+1} có thời gian không hợp lệ (endTime phải sau startTime)`
          });
        }
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
        schedules: schedules.map((s, index) => ({
          ...s,
          timezone: s.timezone || 'Asia/Ho_Chi_Minh',
          meetingPlatform: s.meetingPlatform || 'zoom',
          isActive: true
        })),
        maxStudents, prerequisites: prerequisites || [],
        learningOutcomes: learningOutcomes || [], materialsIncluded: materialsIncluded || [],
        requirements: requirements || [], tags: tags || [], 
        language: language || 'en',  
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
      title, description, shortDescription, order, duration,
      scheduleIndex, lessonType, meetingPlatform, price, isPreview, isFree,
      objectives, prerequisites, difficulty, estimatedStudyTime,
      actualStartTime, actualEndTime, maxParticipants, registrationDeadline
    } = req.body;

    console.log('📚 [createLesson] Creating lesson for course:', courseId);
    console.log('📦 [createLesson] Lesson data:', req.body);

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

    // 🎯 VALIDATION QUAN TRỌNG: Kiểm tra scheduleIndex
    if (scheduleIndex === undefined || scheduleIndex < 0) {
      return res.status(400).json({ 
        message: 'ScheduleIndex là bắt buộc và không được âm'
      });
    }

    // 🎯 KIỂM TRA: Schedule có tồn tại không
    if (scheduleIndex >= course.schedules.length) {
      return res.status(400).json({ 
        message: 'ScheduleIndex không hợp lệ',
        availableSchedules: course.schedules.map((s, idx) => ({
          index: idx,
          dayOfWeek: s.dayOfWeek,
          dayName: ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][s.dayOfWeek],
          startTime: s.startTime,
          endTime: s.endTime,
          hasLesson: s.hasLesson,
          isActive: s.isActive
        }))
      });
    }

    // 🎯 KIỂM TRA: Schedule đã có lesson chưa
    const targetSchedule = course.schedules[scheduleIndex];
    if (targetSchedule.hasLesson) {
      return res.status(400).json({ 
        message: 'Schedule này đã có bài học. Mỗi schedule chỉ được có một bài học.',
        existingLessonId: targetSchedule.lessonId
      });
    }

    // 🎯 KIỂM TRA: Schedule có active không
    if (!targetSchedule.isActive) {
      return res.status(400).json({ 
        message: 'Schedule này không active. Không thể tạo bài học.'
      });
    }

    // VALIDATION: Kiểm tra required fields
    if (!title || !description || order === undefined || !duration || !lessonType) {
      return res.status(400).json({ 
        message: 'Thiếu thông tin bắt buộc',
        required: ['title', 'description', 'order', 'duration', 'lessonType']
      });
    }

    // 🎯 CHO PHÉP THÊM BÀI HỌC VÀO KHÓA HỌC ĐANG CHỜ DUYỆT
    if (course.status === 'rejected') {
      return res.status(400).json({ message: 'Không thể thêm bài học vào khóa học đã bị từ chối' });
    }

    console.log('✅ Validation passed, creating lesson...');

    const lesson = new Lesson({
      courseId,
      title,
      description,
      shortDescription,
      order,
      duration,
      scheduleIndex: scheduleIndex,
      lessonType,
      meetingPlatform: meetingPlatform || targetSchedule.meetingPlatform || 'none',
      price: price || 0,
      isPreview: isPreview || false,
      isFree: isFree || false,
      objectives: objectives || [],
      prerequisites: prerequisites || [],
      difficulty: difficulty || 'medium',
      estimatedStudyTime: estimatedStudyTime || duration,
      maxParticipants: maxParticipants || course.maxStudents,
      registrationDeadline,
      status: 'draft'
    });

    await lesson.save();
    console.log('✅ Lesson created successfully:', lesson._id);

    // 🎯 QUAN TRỌNG: Cập nhật schedule với lesson info
    targetSchedule.hasLesson = true;
    targetSchedule.lessonId = lesson._id;
    
    // Cập nhật course lessons array
    if (!course.lessons) {
      course.lessons = [];
    }
    course.lessons.push(lesson._id);
    
    // Cập nhật metadata
    course.metadata.schedulesWithLessons = course.schedules.filter(s => s.hasLesson).length;
    course.metadata.completionRate = course.scheduleCompletionRate;
    
    await course.save();

    res.status(201).json({ 
      success: true,
      message: 'Tạo bài học thành công', 
      lesson,
      schedule: {
        index: scheduleIndex,
        dayOfWeek: targetSchedule.dayOfWeek,
        dayName: ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][targetSchedule.dayOfWeek],
        startTime: targetSchedule.startTime,
        endTime: targetSchedule.endTime,
        timezone: targetSchedule.timezone
      }
    });

  } catch (error) {
    console.error('❌ [createLesson] Error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi tạo bài học',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

      // 🎯 CHẶN: Không cho phép thay đổi scheduleIndex sau khi đã tạo
      if (updateData.scheduleIndex !== undefined && updateData.scheduleIndex !== lesson.scheduleIndex) {
        return res.status(400).json({ 
          message: 'Không thể thay đổi schedule của bài học. Vui lòng xóa và tạo lại bài học với schedule mới.' 
        });
      }

      // 🎯 CHO PHÉP CẬP NHẬT BÀI HỌC TRONG KHÓA HỌC ĐANG CHỜ DUYỆT
      if (course.status === 'rejected') {
        return res.status(400).json({ message: 'Không thể chỉnh sửa bài học trong khóa học đã bị từ chối' });
      }

      const updatedLesson = await Lesson.findByIdAndUpdate(
        lessonId,
        { ...updateData },
        { new: true, runValidators: true }
      );

      res.json({ 
        success: true,
        message: 'Cập nhật bài học thành công', 
        lesson: updatedLesson 
      });
    } catch (error) {
      console.error('Update lesson error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Lỗi server', 
        error: error.message 
      });
    }
  },

 deleteLesson: async (req, res) => {
  try {
    const { lessonId } = req.params;

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

    // 🎯 QUAN TRỌNG: Cập nhật schedule trước khi xóa lesson
    const scheduleIndex = lesson.scheduleIndex;
    if (course.schedules[scheduleIndex]) {
      course.schedules[scheduleIndex].hasLesson = false;
      course.schedules[scheduleIndex].lessonId = null;
      
      // Cập nhật metadata
      course.metadata.schedulesWithLessons = course.schedules.filter(s => s.hasLesson).length;
      course.metadata.completionRate = course.scheduleCompletionRate;
    }

    await Lesson.findByIdAndDelete(lessonId);
    course.lessons.pull(lessonId);
    await course.save();

    res.json({ 
      success: true,
      message: 'Xóa bài học thành công', 
      lessonId 
    });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server', 
      error: error.message 
    });
  }
},

  // 🎯 THÊM: API để lấy danh sách schedules available
  getAvailableSchedules: async (req, res) => {
    try {
      const { courseId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
      }

      const course = await Course.findById(courseId).select('schedules title');
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      // Chỉ instructor và admin mới được xem
      if (req.userRole !== 'admin' && course.instructor.toString() !== req.userId) {
        return res.status(403).json({ message: 'Bạn không có quyền xem schedules' });
      }

      // Lấy tất cả lessons để kiểm tra schedule nào đã có lesson
      const lessons = await Lesson.find({ courseId }).select('scheduleIndex');

      const scheduleStatusMap = {};
      lessons.forEach(lesson => {
        scheduleStatusMap[lesson.scheduleIndex] = true;
      });

      const availableSchedules = course.schedules.map((schedule, index) => {
        const hasLesson = scheduleStatusMap[index] || false;
        return {
          index: index,
          dayOfWeek: schedule.dayOfWeek,
          dayName: ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][schedule.dayOfWeek],
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          timezone: schedule.timezone,
          meetingPlatform: schedule.meetingPlatform,
          hasLesson: hasLesson,
          isAvailable: !hasLesson // Schedule còn trống để tạo lesson
        };
      });

      res.json({
        success: true,
        course: { _id: course._id, title: course.title },
        schedules: availableSchedules,
        availableCount: availableSchedules.filter(s => s.isAvailable).length,
        totalCount: availableSchedules.length
      });
    } catch (error) {
      console.error('Get available schedules error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Lỗi server', 
        error: error.message 
      });
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

      // 🎯 THÊM: Lấy thông tin schedule cho mỗi lesson
      const lessonsWithSchedule = lessons.map(lesson => {
        const schedule = course.schedules[lesson.scheduleIndex];
        return {
          ...lesson,
          schedule: schedule ? {
            dayOfWeek: schedule.dayOfWeek,
            dayName: ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][schedule.dayOfWeek],
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            timezone: schedule.timezone
          } : null
        };
      });

      const total = await Lesson.countDocuments({ courseId });

      res.json({
        lessons: lessonsWithSchedule,
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

      console.log('🔍 [getCourseById] Fetching course:', courseId);
      console.log('🔍 Request from user:', req.userId || 'public', 'role:', req.userRole || 'public');

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
      }

      const course = await Course.findById(courseId).populate('lessons').lean();
      if (!course) {
        console.log('⚠️ Course not found in DB:', courseId);
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      console.log('📚 Course found:', {
        _id: course._id,
        title: course.title,
        instructor: course.instructor,
        status: course.status
      });

      const instructorId = course.instructor?._id || course.instructor;
      const instructorInfo = await getInstructorInfo(instructorId);

      console.log('👤 Instructor info fetched:', {
        _id: instructorInfo._id,
        fullName: instructorInfo.fullName
      });

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

      console.log('✅ Returning course with instructor');
      res.json({ course: courseWithInstructor });
    } catch (error) {
      console.error('❌ Get course by ID error:', error);
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

      // 🎯 CHẶN: Không cho phép cập nhật schedules nếu đã có lessons
      if (updateData.schedules && Array.isArray(updateData.schedules)) {
        const existingLessons = await Lesson.find({ courseId });
        if (existingLessons.length > 0) {
          return res.status(400).json({ 
            message: 'Không thể thay đổi schedules khi đã có bài học. Vui lòng xóa tất cả bài học trước.' 
          });
        }
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

      if (course.status === 'draft') {
        await Course.findByIdAndDelete(courseId);
        await Lesson.deleteMany({ courseId });
        return res.json({
          message: 'Xóa khóa học nháp thành công',
          courseId,
          permanentlyDeleted: true
        });
      }

      // ✅ ADMIN: CÓ THỂ XOÁ HOÀN TOÀN BẤT KỲ COURSE NÀO KHÔNG CÓ HỌC VIÊN
      if (req.userRole === 'admin') {
        if (course.currentEnrollments > 0) {
          return res.status(400).json({ 
            message: 'Không thể xóa khóa học đang có học viên đăng ký' 
          });
        }
        
        // ✅ XOÁ HOÀN TOÀN
        await Course.findByIdAndDelete(courseId);
        await Lesson.deleteMany({ courseId });
        
        return res.json({
          message: 'Xóa khóa học thành công',
          courseId,
          permanentlyDeleted: true
        });
      }

      // ❌ INSTRUCTOR LOGIC (giữ nguyên)
      if (course.instructor.toString() !== req.userId) {
        return res.status(403).json({ message: 'Bạn chỉ có thể xóa khóa học của mình' });
      }

      if (course.currentEnrollments > 0) {
        return res.status(400).json({ message: 'Không thể xóa khóa học đang có học viên đăng ký' });
      }

      // Instructor chỉ được archive
      course.status = 'archived';
      course.isActive = false;
      await course.save();
      await Lesson.updateMany({ courseId }, { status: 'archived' });

      res.json({
        message: 'Đã lưu trữ khóa học thành công',
        courseId,
        permanentlyDeleted: false
      });
    } catch (error) {
      console.error('Delete course error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  getMyCourses: async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;

      const filter = { 
        instructor: req.userId,
        status: { $ne: 'archived' }  
      };
      
      if (status && status !== 'all') {
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
  },

  // method editCourse cho instructor
  editCourse: async (req, res) => {
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

      // Kiểm tra quyền: chỉ instructor của course hoặc admin được phép edit
      if (req.userRole !== 'admin' && course.instructor.toString() !== req.userId) {
        return res.status(403).json({ message: 'Bạn chỉ có thể chỉnh sửa khóa học của mình' });
      }

      // 🎯 CHẶN: Không cho phép cập nhật schedules nếu đã có lessons
      if (updateData.schedules && Array.isArray(updateData.schedules)) {
        const existingLessons = await Lesson.find({ courseId });
        if (existingLessons.length > 0) {
          return res.status(400).json({ 
            message: 'Không thể thay đổi schedules khi đã có bài học. Vui lòng xóa tất cả bài học trước.' 
          });
        }
      }

      // Nếu instructor edit course đã published, chuyển về pending_review
      let newStatus = course.status;
      let approvalStatus = course.approvalStatus;
      
      if (req.userRole !== 'admin' && course.status === 'published') {
        newStatus = 'pending_review';
        approvalStatus = { status: 'pending', reason: 'Course updated by instructor' };
      }

      // Không cho phép thay đổi một số trường quan trọng
      delete updateData.instructor;
      delete updateData.currentEnrollments;
      delete updateData.ratings;
      delete updateData._id;
      delete updateData.createdAt;

      const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        { 
          ...updateData,
          status: newStatus,
          approvalStatus,
          updatedAt: new Date()
        },
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
        message: req.userRole !== 'admin' && course.status === 'published' 
          ? 'Cập nhật khóa học thành công và đã gửi để admin phê duyệt lại' 
          : 'Cập nhật khóa học thành công',
        course: courseWithInstructor
      });
    } catch (error) {
      console.error('Edit course error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  startLessonMeeting: async (req, res) => {
    try {
      const { lessonId } = req.params;

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
        return res.status(403).json({ message: 'Bạn không có quyền bắt đầu buổi học' });
      }

      const meetingId = `skillshare-${course._id}-${lesson._id}-${Date.now()}`;
      const meetingUrl = `https://meet.jit.si/${meetingId}`;

      lesson.meetingUrl = meetingUrl;
      lesson.meetingId = meetingId;
      lesson.isMeetingActive = true;
      lesson.actualStartTime = new Date();
      lesson.actualEndTime = undefined;

      await lesson.save();

      res.json({
        success: true,
        meetingUrl: lesson.meetingUrl,
        meetingId: lesson.meetingId,
        message: 'Buổi học đã được bắt đầu'
      });

    } catch (error) {
      console.error('Start lesson meeting error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Lỗi khi bắt đầu buổi học', 
        error: error.message 
      });
    }
  },

  endLessonMeeting: async (req, res) => {
    try {
      const { lessonId } = req.params;

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
        return res.status(403).json({ message: 'Bạn không có quyền kết thúc buổi học' });
      }

      lesson.isMeetingActive = false;
      lesson.actualEndTime = new Date();
      lesson.currentParticipants = 0;

      await lesson.save();

      res.json({
        success: true,
        message: 'Buổi học đã được kết thúc và số lượng người tham gia đã được reset'
      });

    } catch (error) {
      console.error('End lesson meeting error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Lỗi khi kết thúc buổi học', 
        error: error.message 
      });
    }
  },

  joinLessonMeeting: async (req, res) => {
    try {
      const { lessonId } = req.params;

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

      const enrollment = await Enrollment.findOne({ 
        userId: req.userId, 
        courseId: lesson.courseId 
      });

      const isAdmin = req.userRole === 'admin';
      const isInstructor = course.instructor.toString() === req.userId;
      
      if (!isAdmin && !isInstructor) {
        if (!enrollment) {
          return res.status(403).json({ message: 'Bạn chưa đăng ký khóa học này' });
        }
        
        const hasLessonAccess = enrollment.hasFullAccess || 
                               (enrollment.purchasedLessons && 
                                enrollment.purchasedLessons.some(p => p.lessonId.toString() === lessonId));
        
        if (!hasLessonAccess && !lesson.isPreview && !lesson.isFree) {
          return res.status(403).json({ message: 'Bạn không có quyền tham gia buổi học này' });
        }
      }

      if (!lesson.isMeetingActive) {
        return res.status(400).json({ message: 'Buổi học chưa được bắt đầu' });
      }

      const maxParticipants = lesson.maxParticipants || course.maxStudents;
      const currentParticipants = lesson.currentParticipants || 0;
      
      if (currentParticipants >= maxParticipants) {
        return res.status(400).json({ 
          message: `Phòng học đã đầy (${currentParticipants}/${maxParticipants})`,
          currentParticipants,
          maxParticipants
        });
      }

      lesson.currentParticipants = currentParticipants + 1;
      await lesson.save();

      let displayName = 'Student';
      try {
        const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
        const userRes = await axios.get(`${userServiceUrl}/internal/${req.userId}`, { 
          timeout: 5000 
        });
        displayName = userRes.data.fullName || 'Student';
      } catch (error) {
        console.error('Error fetching user info:', error.message);
        displayName = req.userFullName || 'Student';
      }

      res.json({
        success: true,
        meetingUrl: lesson.meetingUrl,
        meetingId: lesson.meetingId,
        userRole: isInstructor ? 'teacher' : 'student',
        displayName,
        currentParticipants: lesson.currentParticipants,
        maxParticipants,
        message: 'Có thể tham gia buổi học'
      });

    } catch (error) {
      console.error('Join lesson meeting error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Lỗi khi tham gia buổi học', 
        error: error.message 
      });
    }
  },


  // ========== LESSON CONTENT & RESOURCES ==========
  addLessonContent: async (req, res) => {
    try {
      const { lessonId } = req.params;
      const contentData = req.body;

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
        return res.status(403).json({ message: 'Bạn không có quyền thêm nội dung' });
      }

      if (!lesson.contents) {
        lesson.contents = [];
      }

      lesson.contents.push({
        ...contentData,
        addedAt: new Date(),
        addedBy: req.userId
      });

      await lesson.save();

      res.json({
        message: 'Thêm nội dung thành công',
        lesson
      });
    } catch (error) {
      console.error('Add lesson content error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  removeLessonContent: async (req, res) => {
    try {
      const { lessonId, contentIndex } = req.params;

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
        return res.status(403).json({ message: 'Bạn không có quyền xóa nội dung' });
      }

      if (!lesson.contents || lesson.contents.length <= contentIndex) {
        return res.status(404).json({ message: 'Không tìm thấy nội dung' });
      }

      lesson.contents.splice(contentIndex, 1);
      await lesson.save();

      res.json({
        message: 'Xóa nội dung thành công',
        lesson
      });
    } catch (error) {
      console.error('Remove lesson content error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  addLessonResource: async (req, res) => {
    try {
      const { lessonId } = req.params;
      const resourceData = req.body;

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
        return res.status(403).json({ message: 'Bạn không có quyền thêm tài nguyên' });
      }

      if (!lesson.resources) {
        lesson.resources = [];
      }

      lesson.resources.push({
        ...resourceData,
        addedAt: new Date(),
        addedBy: req.userId
      });

      await lesson.save();

      res.json({
        message: 'Thêm tài nguyên thành công',
        lesson
      });
    } catch (error) {
      console.error('Add lesson resource error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  removeLessonResource: async (req, res) => {
    try {
      const { lessonId, resourceIndex } = req.params;

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
        return res.status(403).json({ message: 'Bạn không có quyền xóa tài nguyên' });
      }

      if (!lesson.resources || lesson.resources.length <= resourceIndex) {
        return res.status(404).json({ message: 'Không tìm thấy tài nguyên' });
      }

      lesson.resources.splice(resourceIndex, 1);
      await lesson.save();

      res.json({
        message: 'Xóa tài nguyên thành công',
        lesson
      });
    } catch (error) {
      console.error('Remove lesson resource error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  // ========== COURSE IMAGE MANAGEMENT ==========
  uploadCourseImage: async (req, res) => {
    try {
      const { courseId } = req.params;
      const { type } = req.body; // 'thumbnail', 'cover', 'gallery'

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      if (req.userRole !== 'admin' && course.instructor.toString() !== req.userId) {
        return res.status(403).json({ message: 'Bạn không có quyền upload ảnh' });
      }

      // Trong thực tế, bạn sẽ xử lý file upload ở đây
      // Đây chỉ là mock response
      const mockImageUrl = `https://example.com/images/${courseId}-${type}-${Date.now()}.jpg`;

      // Cập nhật course với image URL mới
      if (type === 'thumbnail') {
        course.thumbnail = mockImageUrl;
      } else if (type === 'cover') {
        course.coverImage = mockImageUrl;
      } else if (type === 'gallery') {
        if (!course.gallery) course.gallery = [];
        course.gallery.push({
          url: mockImageUrl,
          alt: `Gallery image for ${course.title}`,
          order: course.gallery.length
        });
      }

      await course.save();

      res.json({
        message: 'Upload ảnh thành công',
        url: mockImageUrl
      });
    } catch (error) {
      console.error('Upload course image error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  addGalleryImage: async (req, res) => {
    try {
      const { courseId } = req.params;
      const imageData = req.body;

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      if (req.userRole !== 'admin' && course.instructor.toString() !== req.userId) {
        return res.status(403).json({ message: 'Bạn không có quyền thêm ảnh' });
      }

      if (!course.gallery) {
        course.gallery = [];
      }

      course.gallery.push({
        ...imageData,
        order: course.gallery.length
      });

      await course.save();

      res.json({
        message: 'Thêm ảnh vào gallery thành công',
        gallery: course.gallery
      });
    } catch (error) {
      console.error('Add gallery image error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  removeGalleryImage: async (req, res) => {
    try {
      const { courseId, imageIndex } = req.params;

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      if (req.userRole !== 'admin' && course.instructor.toString() !== req.userId) {
        return res.status(403).json({ message: 'Bạn không có quyền xóa ảnh' });
      }

      if (!course.gallery || course.gallery.length <= imageIndex) {
        return res.status(404).json({ message: 'Không tìm thấy ảnh' });
      }

      course.gallery.splice(imageIndex, 1);
      await course.save();

      res.json({
        message: 'Xóa ảnh khỏi gallery thành công',
        gallery: course.gallery
      });
    } catch (error) {
      console.error('Remove gallery image error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  // ========== COURSE SCHEDULE MANAGEMENT ==========
  addCourseSchedule: async (req, res) => {
    try {
      const { courseId } = req.params;
      const scheduleData = req.body;

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      if (req.userRole !== 'admin' && course.instructor.toString() !== req.userId) {
        return res.status(403).json({ message: 'Bạn không có quyền thêm lịch học' });
      }

      if (!course.schedules) {
        course.schedules = [];
      }

      course.schedules.push({
        ...scheduleData,
        addedAt: new Date(),
        addedBy: req.userId
      });

      await course.save();

      res.json({
        message: 'Thêm lịch học thành công',
        course
      });
    } catch (error) {
      console.error('Add course schedule error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  updateCourseSchedule: async (req, res) => {
    try {
      const { courseId, scheduleIndex } = req.params;
      const scheduleData = req.body;

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      if (req.userRole !== 'admin' && course.instructor.toString() !== req.userId) {
        return res.status(403).json({ message: 'Bạn không có quyền cập nhật lịch học' });
      }

      if (!course.schedules || course.schedules.length <= scheduleIndex) {
        return res.status(404).json({ message: 'Không tìm thấy lịch học' });
      }

      course.schedules[scheduleIndex] = {
        ...course.schedules[scheduleIndex],
        ...scheduleData,
        updatedAt: new Date(),
        updatedBy: req.userId
      };

      await course.save();

      res.json({
        message: 'Cập nhật lịch học thành công',
        course
      });
    } catch (error) {
      console.error('Update course schedule error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  removeCourseSchedule: async (req, res) => {
    try {
      const { courseId, scheduleIndex } = req.params;

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      if (req.userRole !== 'admin' && course.instructor.toString() !== req.userId) {
        return res.status(403).json({ message: 'Bạn không có quyền xóa lịch học' });
      }

      if (!course.schedules || course.schedules.length <= scheduleIndex) {
        return res.status(404).json({ message: 'Không tìm thấy lịch học' });
      }

      course.schedules.splice(scheduleIndex, 1);
      await course.save();

      res.json({
        message: 'Xóa lịch học thành công',
        course
      });
    } catch (error) {
      console.error('Remove course schedule error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  // ========== ANALYTICS & STATISTICS ==========
  getLessonStats: async (req, res) => {
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
        return res.status(403).json({ message: 'Bạn không có quyền xem thống kê' });
      }

      const lessons = await Lesson.find({ courseId });
      
      const stats = {
        totalLessons: lessons.length,
        publishedLessons: lessons.filter(l => l.status === 'published').length,
        draftLessons: lessons.filter(l => l.status === 'draft').length,
        liveLessons: lessons.filter(l => l.isMeetingActive).length,
        totalDuration: lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0),
        averageDuration: lessons.length > 0 ? 
          lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0) / lessons.length : 0,
        lessonsByType: lessons.reduce((acc, lesson) => {
          acc[lesson.lessonType] = (acc[lesson.lessonType] || 0) + 1;
          return acc;
        }, {}),
        totalViewCount: lessons.reduce((sum, lesson) => sum + (lesson.viewCount || 0), 0)
      };

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Get lesson stats error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  getCourseStats: async (req, res) => {
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
        return res.status(403).json({ message: 'Bạn không có quyền xem thống kê' });
      }

      const enrollments = await Enrollment.find({ courseId });
      const lessons = await Lesson.find({ courseId });

      const stats = {
        totalEnrollments: enrollments.length,
        activeEnrollments: enrollments.filter(e => e.status === 'active').length,
        completedEnrollments: enrollments.filter(e => e.status === 'completed').length,
        totalRevenue: enrollments.reduce((sum, enrollment) => {
          if (enrollment.hasFullAccess && course.fullCoursePrice) {
            return sum + course.fullCoursePrice;
          }
          return sum + enrollment.purchasedLessons.reduce((lessonSum, purchase) => 
            lessonSum + (purchase.price || 0), 0
          );
        }, 0),
        totalLessons: lessons.length,
        averageRating: course.ratings?.average || 0,
        ratingCount: course.ratings?.count || 0,
        availableSpots: course.maxStudents - course.currentEnrollments,
        completionRate: enrollments.length > 0 ? 
          (enrollments.filter(e => e.status === 'completed').length / enrollments.length) * 100 : 0
      };

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Get course stats error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },
  // 🆕 API để lấy chi tiết schedules với trạng thái lesson
getCourseSchedules: async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
    }

    const course = await Course.findById(courseId).select('schedules title instructor');
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    }

    // Chỉ instructor và admin mới được xem
    if (req.userRole !== 'admin' && course.instructor.toString() !== req.userId) {
      return res.status(403).json({ message: 'Bạn không có quyền xem schedules' });
    }

    // Lấy tất cả lessons để có thông tin chi tiết
    const lessons = await Lesson.find({ courseId }).select('scheduleIndex title order status');

    const scheduleDetails = course.schedules.map((schedule, index) => {
      const lesson = lessons.find(l => l.scheduleIndex === index);
      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      
      return {
        index: index,
        dayOfWeek: schedule.dayOfWeek,
        dayName: dayNames[schedule.dayOfWeek],
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        timezone: schedule.timezone,
        meetingPlatform: schedule.meetingPlatform,
        isActive: schedule.isActive,
        hasLesson: schedule.hasLesson,
        lessonId: schedule.lessonId,
        lessonInfo: lesson ? {
          _id: lesson._id,
          title: lesson.title,
          order: lesson.order,
          status: lesson.status
        } : null,
        isAvailable: !schedule.hasLesson && schedule.isActive
      };
    });

    // Nhóm theo ngày để dễ visualize
    const schedulesByDay = {};
    scheduleDetails.forEach(schedule => {
      if (!schedulesByDay[schedule.dayOfWeek]) {
        schedulesByDay[schedule.dayOfWeek] = [];
      }
      schedulesByDay[schedule.dayOfWeek].push(schedule);
    });

    res.json({
      success: true,
      course: { _id: course._id, title: course.title },
      schedules: scheduleDetails,
      schedulesByDay,
      summary: {
        totalSchedules: scheduleDetails.length,
        availableSchedules: scheduleDetails.filter(s => s.isAvailable).length,
        occupiedSchedules: scheduleDetails.filter(s => s.hasLesson).length,
        inactiveSchedules: scheduleDetails.filter(s => !s.isActive).length
      }
    });
  } catch (error) {
    console.error('Get course schedules error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server', 
      error: error.message 
    });
  }
},

  getCourseEditHistory: async (req, res) => {
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
        return res.status(403).json({ message: 'Bạn không có quyền xem lịch sử chỉnh sửa' });
      }

      // Mock edit history - trong thực tế bạn nên có collection riêng
      const editHistory = [
        {
          _id: new mongoose.Types.ObjectId(),
          field: 'title',
          oldValue: 'Old Title',
          newValue: course.title,
          editedBy: req.userId,
          editedAt: new Date()
        },
        {
          _id: new mongoose.Types.ObjectId(),
          field: 'description',
          oldValue: 'Old Description',
          newValue: course.description,
          editedBy: req.userId,
          editedAt: new Date()
        }
      ];

      res.json({
        success: true,
        edits: editHistory
      });
    } catch (error) {
      console.error('Get course edit history error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  }
};

module.exports = courseController;