// course-service/src/controllers/datedScheduleController.js
const mongoose = require('mongoose');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');

const datedScheduleController = {

  // 🆕 Tạo dated schedules cho khóa học
  createDatedSchedules: async (req, res) => {
    try {
      const { courseId } = req.params;
      const { schedules } = req.body;

      console.log('📅 [createDatedSchedules] Creating dated schedules for course:', courseId);

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

      if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
        return res.status(400).json({ message: 'Danh sách lịch học là bắt buộc' });
      }

      const now = new Date();
      const newSchedules = [];
      const errors = [];

      for (let i = 0; i < schedules.length; i++) {
        const scheduleData = schedules[i];
        
        try {
          const scheduleDate = new Date(scheduleData.date);
          
          // Validate date
          if (isNaN(scheduleDate.getTime())) {
            errors.push(`Schedule ${i+1}: Ngày không hợp lệ`);
            continue;
          }

          if (scheduleDate < now) {
            errors.push(`Schedule ${i+1}: Ngày không được trong quá khứ`);
            continue;
          }

          // Validate time
          if (!scheduleData.startTime || !scheduleData.endTime) {
            errors.push(`Schedule ${i+1}: Thiếu thời gian bắt đầu/kết thúc`);
            continue;
          }

          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeRegex.test(scheduleData.startTime) || !timeRegex.test(scheduleData.endTime)) {
            errors.push(`Schedule ${i+1}: Định dạng thời gian không hợp lệ (HH:mm)`);
            continue;
          }

          if (scheduleData.startTime >= scheduleData.endTime) {
            errors.push(`Schedule ${i+1}: Thời gian kết thúc phải sau thời gian bắt đầu`);
            continue;
          }

          // Check for duplicate dates and times
          const isDuplicate = course.datedSchedules.some(s => 
            new Date(s.date).toDateString() === scheduleDate.toDateString() &&
            s.startTime === scheduleData.startTime
          );

          if (isDuplicate) {
            errors.push(`Schedule ${i+1}: Đã có lịch học vào ${scheduleData.date} ${scheduleData.startTime}`);
            continue;
          }

          newSchedules.push({
            date: scheduleDate,
            startTime: scheduleData.startTime,
            endTime: scheduleData.endTime,
            timezone: scheduleData.timezone || 'Asia/Ho_Chi_Minh',
            meetingPlatform: scheduleData.meetingPlatform || 'zoom',
            individualPrice: scheduleData.individualPrice || course.settings?.lessonPricing?.defaultLessonPrice || 0,
            availableForIndividualPurchase: scheduleData.availableForIndividualPurchase || false,
            notes: scheduleData.notes || '',
            isActive: true,
            hasLesson: false
          });

        } catch (error) {
          errors.push(`Schedule ${i+1}: ${error.message}`);
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({ 
          message: 'Có lỗi xảy ra khi tạo lịch học',
          errors 
        });
      }

      if (newSchedules.length === 0) {
        return res.status(400).json({ message: 'Không có lịch học nào hợp lệ để thêm' });
      }

      // Thêm schedules mới
      course.datedSchedules.push(...newSchedules);
      await course.save();

      console.log(`✅ Added ${newSchedules.length} dated schedules to course ${courseId}`);

      res.status(201).json({
        success: true,
        message: `Đã thêm ${newSchedules.length} lịch học thành công`,
        schedules: newSchedules,
        totalSchedules: course.datedSchedules.length
      });

    } catch (error) {
      console.error('Create dated schedules error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Lỗi server khi tạo lịch học',
        error: error.message 
      });
    }
  },

  // 🆕 Lấy danh sách dated schedules
  getDatedSchedules: async (req, res) => {
    try {
      const { courseId } = req.params;
      const { 
        page = 1, 
        limit = 10, 
        showAvailableOnly = false,
        showPurchasableOnly = false,
        startDate,
        endDate,
        status = 'all' // all, upcoming, past
      } = req.query;

      console.log('📋 [getDatedSchedules] Fetching schedules for course:', courseId);

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
      }

      const course = await Course.findById(courseId).select('datedSchedules title instructor settings');
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      // Kiểm tra quyền
      const isInstructorOrAdmin = req.userRole === 'admin' || course.instructor.toString() === req.userId;
      if (!isInstructorOrAdmin) {
        return res.status(403).json({ message: 'Bạn không có quyền xem lịch học' });
      }

      let schedules = course.datedSchedules;

      // Lọc theo trạng thái available
      if (showAvailableOnly === 'true') {
        schedules = schedules.filter(s => s.isActive && !s.hasLesson);
      }

      // Lọc theo purchasable
      if (showPurchasableOnly === 'true') {
        schedules = schedules.filter(s => 
          s.isActive && 
          !s.hasLesson && 
          s.availableForIndividualPurchase
        );
      }

      // Lọc theo khoảng thời gian
      if (startDate) {
        const start = new Date(startDate);
        schedules = schedules.filter(s => new Date(s.date) >= start);
      }

      if (endDate) {
        const end = new Date(endDate);
        schedules = schedules.filter(s => new Date(s.date) <= end);
      }

      // Lọc theo trạng thái thời gian
      const now = new Date();
      if (status === 'upcoming') {
        schedules = schedules.filter(s => new Date(s.date) >= now);
      } else if (status === 'past') {
        schedules = schedules.filter(s => new Date(s.date) < now);
      }

      // Sắp xếp theo date
      schedules.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Phân trang
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedSchedules = schedules.slice(startIndex, endIndex);

      // Lấy thông tin lesson cho các schedule đã có lesson
      const scheduleIdsWithLessons = paginatedSchedules
        .filter(s => s.hasLesson)
        .map(s => s.lessonId);

      const lessons = await Lesson.find({ 
        _id: { $in: scheduleIdsWithLessons } 
      }).select('title status order');

      const lessonsMap = {};
      lessons.forEach(lesson => {
        lessonsMap[lesson._id] = lesson;
      });

      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

      const schedulesWithDetails = paginatedSchedules.map(schedule => {
        const scheduleDate = new Date(schedule.date);
        const dayOfWeek = scheduleDate.getDay();
        const lessonInfo = schedule.hasLesson ? lessonsMap[schedule.lessonId] : null;
        
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
          dayOfWeek: dayOfWeek,
          dayName: dayNames[dayOfWeek],
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          duration: duration,
          timezone: schedule.timezone,
          meetingPlatform: schedule.meetingPlatform,
          meetingUrl: schedule.meetingUrl,
          isActive: schedule.isActive,
          hasLesson: schedule.hasLesson,
          lessonId: schedule.lessonId,
          individualPrice: schedule.individualPrice,
          availableForIndividualPurchase: schedule.availableForIndividualPurchase,
          notes: schedule.notes,
          lessonInfo: lessonInfo ? {
            _id: lessonInfo._id,
            title: lessonInfo.title,
            status: lessonInfo.status,
            order: lessonInfo.order
          } : null,
          isAvailable: !schedule.hasLesson && schedule.isActive,
          isPurchasable: !schedule.hasLesson && schedule.isActive && schedule.availableForIndividualPurchase,
          isPast: new Date(schedule.date) < now
        };
      });

      // Thống kê
      const stats = {
        total: schedules.length,
        available: schedules.filter(s => !s.hasLesson && s.isActive).length,
        occupied: schedules.filter(s => s.hasLesson).length,
        purchasable: schedules.filter(s => !s.hasLesson && s.isActive && s.availableForIndividualPurchase).length,
        upcoming: schedules.filter(s => new Date(s.date) >= now).length,
        past: schedules.filter(s => new Date(s.date) < now).length
      };

      res.json({
        success: true,
        schedules: schedulesWithDetails,
        stats,
        course: {
          _id: course._id,
          title: course.title,
          usesDatedSchedules: course.settings?.useDatedSchedules || false
        },
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(schedules.length / Number(limit)),
          totalSchedules: schedules.length,
          hasNext: endIndex < schedules.length,
          hasPrev: startIndex > 0
        }
      });

    } catch (error) {
      console.error('Get dated schedules error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Lỗi server khi lấy danh sách lịch học',
        error: error.message 
      });
    }
  },

  // 🆕 Tạo lesson từ dated schedule
  createLessonFromDatedSchedule: async (req, res) => {
    try {
      const { courseId, scheduleId } = req.params;
      const lessonData = req.body;

      console.log('📚 [createLessonFromDatedSchedule] Creating lesson from schedule:', scheduleId);

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      if (req.userRole !== 'admin' && course.instructor.toString() !== req.userId) {
        return res.status(403).json({ message: 'Bạn không có quyền tạo bài học' });
      }

      // Tìm schedule
      const schedule = course.datedSchedules.id(scheduleId);
      if (!schedule) {
        return res.status(404).json({ message: 'Không tìm thấy lịch học' });
      }

      if (schedule.hasLesson) {
        return res.status(400).json({ message: 'Lịch học này đã có bài học' });
      }

      if (!schedule.isActive) {
        return res.status(400).json({ message: 'Lịch học này không active' });
      }

      // Validate required fields
      const { title, description, order } = lessonData;
      if (!title || !description || order === undefined) {
        return res.status(400).json({ 
          message: 'Thiếu thông tin bắt buộc: title, description, order' 
        });
      }

      // Kiểm tra order không trùng
      const existingLessonWithOrder = await Lesson.findOne({
        courseId,
        order: parseInt(order)
      });

      if (existingLessonWithOrder) {
        return res.status(400).json({ 
          message: `Đã có bài học với số thứ tự ${order}` 
        });
      }

      // Tạo lesson mới
      const lesson = new Lesson({
        courseId,
        datedScheduleId: scheduleId,
        title,
        description,
        shortDescription: lessonData.shortDescription,
        order: parseInt(order),
        actualDate: schedule.date,
        actualStartTime: schedule.startTime,
        actualEndTime: schedule.endTime,
        price: lessonData.price || schedule.individualPrice,
        availableForIndividualPurchase: lessonData.availableForIndividualPurchase !== undefined 
          ? lessonData.availableForIndividualPurchase 
          : schedule.availableForIndividualPurchase,
        lessonType: lessonData.lessonType || 'live_online',
        meetingPlatform: lessonData.meetingPlatform || schedule.meetingPlatform,
        meetingUrl: lessonData.meetingUrl || schedule.meetingUrl,
        status: 'draft',
        isPreview: lessonData.isPreview || false,
        isFree: lessonData.isFree || false,
        maxParticipants: lessonData.maxParticipants || course.maxStudents,
        difficulty: lessonData.difficulty || 'medium'
      });

      await lesson.save();

      // Cập nhật schedule
      schedule.hasLesson = true;
      schedule.lessonId = lesson._id;
      await course.save();

      console.log(`✅ Created lesson ${lesson._id} from dated schedule ${scheduleId}`);

      // Lấy thông tin schedule đầy đủ để trả về
      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      const scheduleDate = new Date(schedule.date);
      const dayOfWeek = scheduleDate.getDay();

      res.status(201).json({
        success: true,
        message: 'Tạo bài học thành công',
        lesson: {
          _id: lesson._id,
          title: lesson.title,
          order: lesson.order,
          status: lesson.status,
          price: lesson.price,
          availableForIndividualPurchase: lesson.availableForIndividualPurchase
        },
        schedule: {
          _id: schedule._id,
          date: schedule.date,
          dayOfWeek: dayOfWeek,
          dayName: dayNames[dayOfWeek],
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          timezone: schedule.timezone
        }
      });

    } catch (error) {
      console.error('Create lesson from dated schedule error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Lỗi server khi tạo bài học',
        error: error.message 
      });
    }
  },

  // 🆕 Cập nhật dated schedule
  updateDatedSchedule: async (req, res) => {
    try {
      const { courseId, scheduleId } = req.params;
      const updateData = req.body;

      console.log('✏️ [updateDatedSchedule] Updating schedule:', scheduleId);

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

      const schedule = course.datedSchedules.id(scheduleId);
      if (!schedule) {
        return res.status(404).json({ message: 'Không tìm thấy lịch học' });
      }

      // Không cho phép cập nhật date nếu đã có lesson
      if (updateData.date && schedule.hasLesson) {
        const newDate = new Date(updateData.date);
        const now = new Date();
        
        if (newDate < now) {
          return res.status(400).json({ message: 'Ngày schedule không được trong quá khứ' });
        }

        if (newDate.toDateString() !== new Date(schedule.date).toDateString()) {
          return res.status(400).json({ 
            message: 'Không thể thay đổi ngày của lịch học đã có bài học' 
          });
        }
      }

      // Validate time nếu có thay đổi
      if (updateData.startTime || updateData.endTime) {
        const startTime = updateData.startTime || schedule.startTime;
        const endTime = updateData.endTime || schedule.endTime;

        if (startTime >= endTime) {
          return res.status(400).json({ 
            message: 'Thời gian kết thúc phải sau thời gian bắt đầu' 
          });
        }
      }

      // Cập nhật các trường được phép
      const allowedUpdates = ['startTime', 'endTime', 'timezone', 'meetingPlatform', 
                             'meetingUrl', 'meetingId', 'meetingPassword', 'isActive',
                             'individualPrice', 'availableForIndividualPurchase', 'notes'];
      
      let hasChanges = false;
      allowedUpdates.forEach(field => {
        if (updateData[field] !== undefined && updateData[field] !== schedule[field]) {
          schedule[field] = updateData[field];
          hasChanges = true;
        }
      });

      // Xử lý riêng cho date (nếu không có lesson)
      if (updateData.date && !schedule.hasLesson) {
        const newDate = new Date(updateData.date);
        const now = new Date();
        
        if (newDate < now) {
          return res.status(400).json({ message: 'Ngày schedule không được trong quá khứ' });
        }

        if (newDate.toDateString() !== new Date(schedule.date).toDateString()) {
          schedule.date = newDate;
          hasChanges = true;
        }
      }

      if (!hasChanges) {
        return res.status(400).json({ message: 'Không có thay đổi nào để cập nhật' });
      }

      await course.save();

      console.log(`✅ Updated dated schedule ${scheduleId}`);

      res.json({
        success: true,
        message: 'Cập nhật lịch học thành công',
        schedule: {
          _id: schedule._id,
          date: schedule.date,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          isActive: schedule.isActive,
          hasLesson: schedule.hasLesson,
          individualPrice: schedule.individualPrice,
          availableForIndividualPurchase: schedule.availableForIndividualPurchase
        }
      });

    } catch (error) {
      console.error('Update dated schedule error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Lỗi server khi cập nhật lịch học',
        error: error.message 
      });
    }
  },

  // 🆕 Xóa dated schedule
  deleteDatedSchedule: async (req, res) => {
    try {
      const { courseId, scheduleId } = req.params;

      console.log('🗑️ [deleteDatedSchedule] Deleting schedule:', scheduleId);

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

      const schedule = course.datedSchedules.id(scheduleId);
      if (!schedule) {
        return res.status(404).json({ message: 'Không tìm thấy lịch học' });
      }

      // Nếu có lesson, xóa lesson trước
      if (schedule.hasLesson && schedule.lessonId) {
        await Lesson.findByIdAndDelete(schedule.lessonId);
        console.log(`✅ Deleted associated lesson ${schedule.lessonId}`);
      }

      // Xóa schedule
      course.datedSchedules.pull(scheduleId);
      await course.save();

      console.log(`✅ Deleted dated schedule ${scheduleId}`);

      res.json({
        success: true,
        message: 'Xóa lịch học thành công',
        deletedScheduleId: scheduleId,
        deletedLessonId: schedule.hasLesson ? schedule.lessonId : null
      });

    } catch (error) {
      console.error('Delete dated schedule error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Lỗi server khi xóa lịch học',
        error: error.message 
      });
    }
  },

  // 🆕 Kích hoạt/tắt dated scheduling
  toggleDatedScheduling: async (req, res) => {
    try {
      const { courseId } = req.params;
      const { enabled } = req.body;

      console.log('🔧 [toggleDatedScheduling] Setting dated scheduling to:', enabled);

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      if (req.userRole !== 'admin' && course.instructor.toString() !== req.userId) {
        return res.status(403).json({ message: 'Bạn không có quyền thay đổi cài đặt' });
      }

      if (enabled === undefined) {
        return res.status(400).json({ message: 'Thiếu tham số enabled' });
      }

      // Khởi tạo settings nếu chưa có
      if (!course.settings) {
        course.settings = {};
      }

      course.settings.useDatedSchedules = Boolean(enabled);
      course.metadata.usesDatedSchedules = Boolean(enabled);

      await course.save();

      console.log(`✅ Set dated scheduling to ${enabled} for course ${courseId}`);

      res.json({
        success: true,
        message: `Đã ${enabled ? 'bật' : 'tắt'} chế độ lịch học theo ngày cụ thể`,
        usesDatedSchedules: course.settings.useDatedSchedules
      });

    } catch (error) {
      console.error('Toggle dated scheduling error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Lỗi server khi thay đổi cài đặt',
        error: error.message 
      });
    }
  },

  // 🆕 Lấy danh sách dated schedules có thể mua (cho student)
  getPurchasableSchedules: async (req, res) => {
    try {
      const { courseId } = req.params;

      console.log('🛒 [getPurchasableSchedules] Fetching purchasable schedules for course:', courseId);

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
      }

      const course = await Course.findById(courseId)
        .select('datedSchedules title pricingType settings instructor');
      
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      // Kiểm tra course có cho phép mua lesson riêng không
      if (!['per_lesson', 'both'].includes(course.pricingType)) {
        return res.status(400).json({ 
          message: 'Khóa học này không cho phép mua từng bài học riêng lẻ' 
        });
      }

      const now = new Date();
      const purchasableSchedules = course.datedSchedules.filter(schedule => 
        schedule.isActive && 
        !schedule.hasLesson && 
        schedule.availableForIndividualPurchase &&
        new Date(schedule.date) >= now
      );

      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

      const schedulesWithDetails = purchasableSchedules.map(schedule => {
        const scheduleDate = new Date(schedule.date);
        const dayOfWeek = scheduleDate.getDay();

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
          dayOfWeek: dayOfWeek,
          dayName: dayNames[dayOfWeek],
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          duration: duration,
          timezone: schedule.timezone,
          meetingPlatform: schedule.meetingPlatform,
          individualPrice: schedule.individualPrice,
          notes: schedule.notes,
          daysUntil: Math.ceil((scheduleDate - now) / (1000 * 60 * 60 * 24))
        };
      });

      // Sắp xếp theo date
      schedulesWithDetails.sort((a, b) => new Date(a.date) - new Date(b.date));

      res.json({
        success: true,
        schedules: schedulesWithDetails,
        course: {
          _id: course._id,
          title: course.title,
          pricingType: course.pricingType,
          currency: course.currency
        },
        total: purchasableSchedules.length
      });

    } catch (error) {
      console.error('Get purchasable schedules error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Lỗi server khi lấy danh sách lịch học có thể mua',
        error: error.message 
      });
    }
  }
};

module.exports = datedScheduleController;