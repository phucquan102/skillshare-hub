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

      // 🎯 SỬA: Validate schedules với date
      if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
        return res.status(400).json({ 
          message: 'Danh sách lịch học là bắt buộc',
          required: 'schedules (array of {date, startTime, endTime})'
        });
      }

      // Validate từng schedule
      for (let i = 0; i < schedules.length; i++) {
        const schedule = schedules[i];
        if (!schedule.date || !schedule.startTime || !schedule.endTime) {
          return res.status(400).json({ 
            message: `Schedule ${i+1} thiếu thông tin bắt buộc: date, startTime, endTime`
          });
        }
        
        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(schedule.date)) {
          return res.status(400).json({ 
            message: `Schedule ${i+1} có định dạng ngày không hợp lệ (YYYY-MM-DD)`
          });
        }

        // Validate time format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(schedule.startTime) || !timeRegex.test(schedule.endTime)) {
          return res.status(400).json({ 
            message: `Schedule ${i+1} có định dạng thời gian không hợp lệ (HH:mm)`
          });
        }

        // Validate date không được trong quá khứ
        const scheduleDate = new Date(schedule.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (scheduleDate < today) {
          return res.status(400).json({ 
            message: `Schedule ${i+1} có ngày trong quá khứ`
          });
        }

        // Validate date nằm trong khoảng startDate và endDate của khóa học
        const courseStartDate = new Date(startDate);
        const courseEndDate = new Date(endDate);
        if (scheduleDate < courseStartDate || scheduleDate > courseEndDate) {
          return res.status(400).json({ 
            message: `Schedule ${i+1} có ngày không nằm trong thời gian khóa học (${startDate} đến ${endDate})`
          });
        }

        // Validate time logic
        const start = new Date(`${schedule.date}T${schedule.startTime}`);
        const end = new Date(`${schedule.date}T${schedule.endTime}`);
        if (isNaN(start) || isNaN(end) || start >= end) {
          return res.status(400).json({ 
            message: `Schedule ${i+1} có thời gian không hợp lệ (endTime phải sau startTime)`
          });
        }

        // Kiểm tra trùng lịch
        for (let j = 0; j < i; j++) {
          const otherSchedule = schedules[j];
          if (schedule.date === otherSchedule.date && 
              schedule.startTime === otherSchedule.startTime) {
            return res.status(400).json({ 
              message: `Schedule ${i+1} bị trùng lịch với schedule ${j+1}`
            });
          }
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

      // 🎯 SỬA: Chuẩn bị schedules với date và dayOfWeek
      const processedSchedules = schedules.map(schedule => {
        const scheduleDate = new Date(schedule.date);
        const dayOfWeek = scheduleDate.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ...
        
        return {
          date: schedule.date,
          dayOfWeek: dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          timezone: schedule.timezone || 'Asia/Ho_Chi_Minh',
          meetingPlatform: schedule.meetingPlatform || 'zoom',
          isActive: true,
          hasLesson: false
        };
      });

      const course = new Course({
        title, description, shortDescription, category, subcategory, level,
        pricingType, fullCoursePrice, coInstructors: coInstructors || [],
        schedules: processedSchedules,
        maxStudents, prerequisites: prerequisites || [],
        learningOutcomes: learningOutcomes || [], materialsIncluded: materialsIncluded || [],
        requirements: requirements || [], tags: tags || [], 
        language: language || 'vi',  
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
        scheduleId, lessonType, meetingPlatform, price, isPreview, isFree,
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

      // 🎯 SỬA: Tìm schedule bằng scheduleId thay vì scheduleIndex
      const targetSchedule = course.schedules.id(scheduleId);
      if (!targetSchedule) {
        return res.status(400).json({ 
          message: 'Schedule không tồn tại',
          availableSchedules: course.schedules.map(s => ({
            _id: s._id,
            date: s.date,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            hasLesson: s.hasLesson,
            isActive: s.isActive
          }))
        });
      }

      // 🎯 KIỂM TRA: Schedule đã có lesson chưa
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
        scheduleId: scheduleId,
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

      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

      res.status(201).json({ 
        success: true,
        message: 'Tạo bài học thành công', 
        lesson,
        schedule: {
          _id: targetSchedule._id,
          date: targetSchedule.date,
          dayOfWeek: targetSchedule.dayOfWeek,
          dayName: dayNames[targetSchedule.dayOfWeek],
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

      // 🎯 CHẶN: Không cho phép thay đổi scheduleId sau khi đã tạo
      if (updateData.scheduleId !== undefined && updateData.scheduleId !== lesson.scheduleId) {
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
      const targetSchedule = course.schedules.id(lesson.scheduleId);
      if (targetSchedule) {
        targetSchedule.hasLesson = false;
        targetSchedule.lessonId = null;
        
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

  // 🎯 SỬA: API để lấy danh sách schedules available
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

      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

      const availableSchedules = course.schedules.map(schedule => {
        // Tính thời lượng
        let duration = '';
        if (schedule.startTime && schedule.endTime) {
          const start = new Date(`2000-01-01T${schedule.startTime}`);
          const end = new Date(`2000-01-01T${schedule.endTime}`);
          const diffMs = end.getTime() - start.getTime();
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          
          if (diffHours > 0) {
            duration = `${diffHours} giờ ${diffMinutes > 0 ? `${diffMinutes} phút` : ''}`;
          } else {
            duration = `${diffMinutes} phút`;
          }
        }

        return {
          _id: schedule._id,
          date: schedule.date,
          dayOfWeek: schedule.dayOfWeek,
          dayName: dayNames[schedule.dayOfWeek],
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          duration: duration,
          timezone: schedule.timezone,
          meetingPlatform: schedule.meetingPlatform,
          hasLesson: schedule.hasLesson,
          isAvailable: !schedule.hasLesson && schedule.isActive
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

      // 🎯 THÊM: Lấy thông tin schedule
      const schedule = course.schedules.id(lesson.scheduleId);
      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      
      const lessonWithSchedule = {
        ...lesson,
        schedule: schedule ? {
          _id: schedule._id,
          date: schedule.date,
          dayOfWeek: schedule.dayOfWeek,
          dayName: dayNames[schedule.dayOfWeek],
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          timezone: schedule.timezone
        } : null
      };

      res.json({ lesson: lessonWithSchedule });
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

      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

      // 🎯 THÊM: Lấy thông tin schedule cho mỗi lesson
      const lessonsWithSchedule = lessons.map(lesson => {
        const schedule = course.schedules.id(lesson.scheduleId);
        return {
          ...lesson,
          schedule: schedule ? {
            _id: schedule._id,
            date: schedule.date,
            dayOfWeek: schedule.dayOfWeek,
            dayName: dayNames[schedule.dayOfWeek],
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

      // 1. Lấy course, không cần populate instructor ở đây
      const course = await Course.findById(courseId).populate('lessons').lean();
      if (!course) {
        console.log('⚠️ Course not found in DB:', courseId);
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      console.log('📚 Course found:', {
        _id: course._id,
        title: course.title,
        instructor: course.instructor, // ID giảng viên chính
        coInstructors: course.coInstructors, // Mảng ID đồng giảng viên
        status: course.status
      });

      // 2. Gom tất cả ID giảng viên lại
      let allInstructorIds = [];
      if (course.instructor) {
        allInstructorIds.push(course.instructor.toString());
      }
      if (course.coInstructors && Array.isArray(course.coInstructors)) {
        allInstructorIds.push(...course.coInstructors.map(id => id.toString()));
      }
      
      // Lọc ID duy nhất
      const uniqueInstructorIds = [...new Set(allInstructorIds)];
      
      console.log('👤 All unique instructor IDs:', uniqueInstructorIds);

      let allInstructorsInfo = [];
      
      // 3. Gọi batch-API để lấy thông tin tất cả giảng viên
      if (uniqueInstructorIds.length > 0) {
        allInstructorsInfo = await getMultipleInstructorInfo(uniqueInstructorIds);
      }

      console.log('✅ Fetched info for', allInstructorsInfo.length, 'instructors');

      // 4. Tìm thông tin giảng viên chính từ kết quả batch
      const mainInstructorInfo = allInstructorsInfo.find(
        inst => inst && inst._id && course.instructor && inst._id.toString() === course.instructor.toString()
      ) || { // Dự phòng nếu không tìm thấy (do data rác)
          _id: course.instructor,
          fullName: 'Unknown Instructor',
          profile: { avatar: null, bio: null }
      };

      // 5. Xây dựng object trả về
      const courseWithInstructors = {
        ...course,
        // Giữ lại 'instructor' (object) cho trang khóa học
        instructor: mainInstructorInfo, 
        // 💥 THÊM MỚI: 'instructors' (array) cho ChatService
        instructors: allInstructorsInfo, 
        availableSpots: course.maxStudents - course.currentEnrollments
      };

      console.log('✅ Returning course with all instructors populated');
      res.json({ course: courseWithInstructors });
      
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

      // 🎯 SỬA: Xử lý schedules nếu có
      if (updateData.schedules && Array.isArray(updateData.schedules)) {
        updateData.schedules = updateData.schedules.map(schedule => {
          const scheduleDate = new Date(schedule.date);
          const dayOfWeek = scheduleDate.getDay();
          
          return {
            ...schedule,
            dayOfWeek: dayOfWeek,
            timezone: schedule.timezone || 'Asia/Ho_Chi_Minh',
            meetingPlatform: schedule.meetingPlatform || 'zoom',
            isActive: true,
            hasLesson: false
          };
        });
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

      // ✅ ADMIN: CÓ THỂ XOÁ HOÀN TOÀN BẤT KỲ COURSE NÀY KHÔNG CÓ HỌC VIÊN
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

      // 🎯 SỬA: Xử lý schedules nếu có
      if (updateData.schedules && Array.isArray(updateData.schedules)) {
        updateData.schedules = updateData.schedules.map(schedule => {
          const scheduleDate = new Date(schedule.date);
          const dayOfWeek = scheduleDate.getDay();
          
          return {
            ...schedule,
            dayOfWeek: dayOfWeek,
            timezone: schedule.timezone || 'Asia/Ho_Chi_Minh',
            meetingPlatform: schedule.meetingPlatform || 'zoom',
            isActive: schedule.isActive !== undefined ? schedule.isActive : true,
            hasLesson: schedule.hasLesson || false
          };
        });
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

      // 🎯 SỬA LỖI: Đổi userId thành studentId
      const enrollment = await Enrollment.findOne({ 
        studentId: req.userId,  // Sửa từ userId thành studentId
        courseId: lesson.courseId 
      });

      console.log('🔍 Enrollment check:', {
        studentId: req.userId,
        courseId: lesson.courseId,
        enrollmentFound: !!enrollment,
        enrollmentDetails: enrollment ? {
          _id: enrollment._id,
          hasFullAccess: enrollment.hasFullAccess,
          purchasedLessonsCount: enrollment.purchasedLessons?.length,
          status: enrollment.status
        } : null
      });

      const isAdmin = req.userRole === 'admin';
      const isInstructor = course.instructor.toString() === req.userId;
      
      if (!isAdmin && !isInstructor) {
        if (!enrollment) {
          console.log('❌ No enrollment found for user:', req.userId);
          return res.status(403).json({ message: 'Bạn chưa đăng ký khóa học này' });
        }
        
        // 🎯 THÊM: Kiểm tra enrollment status
        if (enrollment.status !== 'active') {
          console.log('❌ Enrollment not active:', enrollment.status);
          return res.status(403).json({ 
            message: `Enrollment không active (status: ${enrollment.status})` 
          });
        }
        
        // 🎯 CẢI THIỆN: Logic kiểm tra lesson access
        let hasLessonAccess = false;
        
        if (enrollment.hasFullAccess) {
          hasLessonAccess = true;
          console.log('✅ User has full access to course');
        } else if (enrollment.purchasedLessons && enrollment.purchasedLessons.length > 0) {
          // Kiểm tra xem lessonId có trong purchasedLessons không
          const purchasedLesson = enrollment.purchasedLessons.find(
            p => p.lessonId && p.lessonId.toString() === lessonId
          );
          hasLessonAccess = !!purchasedLesson;
          console.log('🔍 Checking purchased lessons:', {
            purchasedLessonsCount: enrollment.purchasedLessons.length,
            lookingForLessonId: lessonId,
            found: !!purchasedLesson
          });
        }
        
        if (!hasLessonAccess && !lesson.isPreview && !lesson.isFree) {
          console.log('❌ No lesson access:', {
            hasLessonAccess,
            isPreview: lesson.isPreview,
            isFree: lesson.isFree
          });
          return res.status(403).json({ 
            message: 'Bạn không có quyền tham gia buổi học này',
            details: {
              hasFullAccess: enrollment.hasFullAccess,
              purchasedThisLesson: hasLessonAccess,
              lessonIsPreview: lesson.isPreview,
              lessonIsFree: lesson.isFree
            }
          });
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

      console.log('✅ User can join meeting:', {
        userId: req.userId,
        displayName,
        userRole: isInstructor ? 'teacher' : 'student',
        currentParticipants: lesson.currentParticipants
      });

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

      // 🎯 SỬA: Xử lý date và dayOfWeek
      const scheduleDate = new Date(scheduleData.date);
      const dayOfWeek = scheduleDate.getDay();

      const newSchedule = {
        ...scheduleData,
        dayOfWeek: dayOfWeek,
        timezone: scheduleData.timezone || 'Asia/Ho_Chi_Minh',
        meetingPlatform: scheduleData.meetingPlatform || 'zoom',
        isActive: true,
        hasLesson: false
      };

      if (!course.schedules) {
        course.schedules = [];
      }

      course.schedules.push(newSchedule);
      await course.save();

      res.json({
        message: 'Thêm lịch học thành công',
        schedule: newSchedule
      });
    } catch (error) {
      console.error('Add course schedule error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  updateCourseSchedule: async (req, res) => {
    try {
      const { courseId, scheduleId } = req.params;
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

      const schedule = course.schedules.id(scheduleId);
      if (!schedule) {
        return res.status(404).json({ message: 'Không tìm thấy lịch học' });
      }

      // 🎯 SỬA: Cập nhật date và dayOfWeek nếu date thay đổi
      if (scheduleData.date && scheduleData.date !== schedule.date) {
        const scheduleDate = new Date(scheduleData.date);
        scheduleData.dayOfWeek = scheduleDate.getDay();
      }

      Object.assign(schedule, scheduleData);
      await course.save();

      res.json({
        message: 'Cập nhật lịch học thành công',
        schedule
      });
    } catch (error) {
      console.error('Update course schedule error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  removeCourseSchedule: async (req, res) => {
    try {
      const { courseId, scheduleId } = req.params;

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

      const schedule = course.schedules.id(scheduleId);
      if (!schedule) {
        return res.status(404).json({ message: 'Không tìm thấy lịch học' });
      }

      // Kiểm tra nếu schedule đã có lesson thì không cho xóa
      if (schedule.hasLesson) {
        return res.status(400).json({ 
          message: 'Không thể xóa lịch học đã có bài học. Vui lòng xóa bài học trước.' 
        });
      }

      course.schedules.pull(scheduleId);
      await course.save();

      res.json({
        message: 'Xóa lịch học thành công'
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

  // 🎯 SỬA: API để lấy chi tiết schedules với trạng thái lesson
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
      const lessons = await Lesson.find({ courseId }).select('scheduleId title order status');

      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

      const scheduleDetails = course.schedules.map(schedule => {
        const lesson = lessons.find(l => l.scheduleId && l.scheduleId.toString() === schedule._id.toString());
        
        // Tính thời lượng
        let duration = '';
        if (schedule.startTime && schedule.endTime) {
          const start = new Date(`2000-01-01T${schedule.startTime}`);
          const end = new Date(`2000-01-01T${schedule.endTime}`);
          const diffMs = end.getTime() - start.getTime();
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          
          if (diffHours > 0) {
            duration = `${diffHours} giờ ${diffMinutes > 0 ? `${diffMinutes} phút` : ''}`;
          } else {
            duration = `${diffMinutes} phút`;
          }
        }

        return {
          _id: schedule._id,
          date: schedule.date,
          dayOfWeek: schedule.dayOfWeek,
          dayName: dayNames[schedule.dayOfWeek],
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          duration: duration,
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

      // Sắp xếp theo date
      scheduleDetails.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Nhóm theo ngày để dễ visualize
      const schedulesByDate = {};
      scheduleDetails.forEach(schedule => {
        if (!schedulesByDate[schedule.date]) {
          schedulesByDate[schedule.date] = [];
        }
        schedulesByDate[schedule.date].push(schedule);
      });

      res.json({
        success: true,
        course: { _id: course._id, title: course.title },
        schedules: scheduleDetails,
        schedulesByDate,
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