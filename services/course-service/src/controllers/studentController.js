// services/course-service/src/controllers/studentController.js
const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');

/**
 * =====================
 *  GET STUDENT'S COURSES
 * =====================
 */
const getMyCourses = async (req, res) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.userId);
    const { page = 1, limit = 10, status } = req.query;

    console.log("📚 [getMyCourses - FIXED VERSION]");
    console.log("➡️ StudentId:", studentId.toString());

    // Build query
    const query = { studentId };
    if (status && status !== 'all') {
      query.status = status;
    }

    // ✅ FIX: Chỉ populate thông tin cơ bản của course, KHÔNG populate lessons
    const enrollments = await Enrollment.find(query)
      .populate('courseId', 'title thumbnail description instructor category level pricingType fullCoursePrice currentEnrollments maxStudents status ratings') // ❌ BỎ 'lessons' ở đây
      .populate('progress.completedLessons.lessonId', 'title order duration')
      .sort({ enrolledAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await Enrollment.countDocuments(query);

    console.log(`📊 Found ${enrollments.length} enrollments for student`);

    // ✅ FIX: Lấy tất cả course IDs để query lessons một lần duy nhất
    const courseIds = enrollments.map(enrollment => enrollment.courseId._id);
    
    // Lấy tất cả lessons cho các course này từ collection Lesson
    const allLessons = await Lesson.find({
      courseId: { $in: courseIds },
      isActive: true
    }).select('courseId _id').lean();

    console.log(`📖 Found ${allLessons.length} total lessons from Lesson collection`);

    // Nhóm lessons theo courseId
    const lessonsByCourse = {};
    allLessons.forEach(lesson => {
      const courseIdStr = lesson.courseId.toString();
      if (!lessonsByCourse[courseIdStr]) {
        lessonsByCourse[courseIdStr] = [];
      }
      lessonsByCourse[courseIdStr].push(lesson._id);
    });

    // Format response data
    const courses = enrollments.map(enrollment => {
      const course = enrollment.courseId;
      const courseIdStr = course._id.toString();
      
      // ✅ FIX: Lấy lessons từ collection Lesson thay vì từ course.lessons
      const courseLessons = lessonsByCourse[courseIdStr] || [];
      const totalLessons = courseLessons.length;

      // Đếm số completed lessons
      const completedLessons = enrollment.progress?.completedLessons?.filter(
        cl => cl.lessonId && courseLessons.includes(cl.lessonId._id)
      ).length || 0;

      // Tính progress
      const overallProgress = totalLessons > 0 ? 
        Math.round((completedLessons / totalLessons) * 100) : 0;

      console.log(`📊 Course ${course.title}: ${completedLessons}/${totalLessons} lessons completed (${overallProgress}%)`);

      return {
        enrollmentId: enrollment._id,
        enrolledAt: enrollment.enrolledAt,
        status: enrollment.status,
        progress: {
          overallProgress: overallProgress,
          completedLessons: completedLessons,
          lastAccessed: enrollment.progress?.lastAccessed || enrollment.enrolledAt
        },
        hasFullAccess: enrollment.hasFullAccess || (!enrollment.purchasedLessons || enrollment.purchasedLessons.length === 0),
        purchasedLessons: enrollment.purchasedLessons ? enrollment.purchasedLessons.length : 0,
        course: {
          _id: course._id,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail || '/default-course.jpg',
          instructor: course.instructor,
          category: course.category,
          level: course.level,
          pricingType: course.pricingType,
          fullCoursePrice: course.fullCoursePrice,
          currentEnrollments: course.currentEnrollments,
          maxStudents: course.maxStudents,
          status: course.status,
          ratings: course.ratings || { average: 0, count: 0 },
          totalLessons: totalLessons // ✅ Dùng số lessons thực tế từ Lesson collection
        }
      };
    });

    // Get stats
    const stats = {
      total: await Enrollment.countDocuments({ studentId }),
      active: await Enrollment.countDocuments({ studentId, status: 'active' }),
      completed: await Enrollment.countDocuments({ studentId, status: 'completed' }),
      cancelled: await Enrollment.countDocuments({ studentId, status: 'cancelled' })
    };

    console.log(`✅ Returning ${courses.length} courses with accurate lesson counts`);

    res.json({
      success: true,
      courses,
      stats,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalCourses: total,
        hasNext: Number(page) < Math.ceil(total / Number(limit)),
        hasPrev: Number(page) > 1
      }
    });

  } catch (error) {
    console.error("❌ Error in getMyCourses:", error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi lấy danh sách khóa học',
      error: error.message 
    });
  }
};
/**
 * =====================
 *  GET COURSE PROGRESS DETAILS
 * =====================
 */
const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = new mongoose.Types.ObjectId(req.userId);

    console.log("📈 [getCourseProgress]");
    console.log("➡️ StudentId:", studentId.toString());
    console.log("➡️ CourseId:", courseId);

    // Get enrollment
    const enrollment = await Enrollment.findOne({
      studentId,
      courseId: new mongoose.Types.ObjectId(courseId)
    }).populate('progress.completedLessons.lessonId', 'title order duration scheduleIndex')
      .populate('purchasedLessons.lessonId', 'title order scheduleIndex');

    console.log("🔍 Enrollment found:", enrollment ? enrollment._id : 'None');

    if (!enrollment) {
      return res.status(404).json({ 
        success: false,
        message: 'Bạn chưa đăng ký khóa học này' 
      });
    }

    // Get course with lessons
    const course = await Course.findById(courseId)
      .populate('lessons', 'title order duration scheduleIndex lessonType meetingUrl actualStartTime actualEndTime status isPreview isFree')
      .lean();

    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy khóa học' 
      });
    }

    // Format lessons with access and completion status
    const lessons = course.lessons.map(lesson => {
      const isCompleted = enrollment.progress.completedLessons.some(
        completed => completed.lessonId && completed.lessonId._id.toString() === lesson._id.toString()
      );
      
      const hasAccess = enrollment.hasFullAccess || 
        enrollment.purchasedLessons.some(purchase => 
          purchase.lessonId && purchase.lessonId._id.toString() === lesson._id.toString()
        );

      return {
        _id: lesson._id,
        title: lesson.title,
        order: lesson.order,
        duration: lesson.duration,
        scheduleIndex: lesson.scheduleIndex,
        lessonType: lesson.lessonType,
        meetingUrl: lesson.meetingUrl,
        actualStartTime: lesson.actualStartTime,
        actualEndTime: lesson.actualEndTime,
        status: lesson.status,
        isPreview: lesson.isPreview,
        isFree: lesson.isFree,
        hasAccess,
        isCompleted,
        canJoin: hasAccess && lesson.lessonType === 'live_online' && lesson.meetingUrl,
        progress: isCompleted ? 100 : 0
      };
    });

    // Sort lessons by order
    lessons.sort((a, b) => a.order - b.order);

    const progressData = {
      enrollmentId: enrollment._id,
      overallProgress: enrollment.progress.overallProgress,
      completedLessons: enrollment.progress.completedLessons.length,
      totalLessons: lessons.length,
      hasFullAccess: enrollment.hasFullAccess,
      purchasedLessons: enrollment.purchasedLessons.length,
      enrolledAt: enrollment.enrolledAt,
      lastAccessed: enrollment.progress.lastAccessed,
      lessons
    };

    res.json({
      success: true,
      progress: progressData,
      course: {
        _id: course._id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnailUrl || course.thumbnail
      }
    });

  } catch (error) {
    console.error("❌ Error in getCourseProgress:", error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi lấy tiến độ khóa học',
      error: error.message 
    });
  }
};

/**
 * =====================
 *  GET LESSON DETAILS WITH ACCESS CHECK
 * =====================
 */
const getLessonDetails = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const studentId = new mongoose.Types.ObjectId(req.userId);

    console.log("📖 [getLessonDetails]");
    console.log("➡️ StudentId:", studentId.toString());
    console.log("➡️ LessonId:", lessonId);

    // Get lesson details
    const lesson = await Lesson.findById(lessonId)
      .populate('courseId', 'title instructor schedules')
      .lean();

    if (!lesson) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy bài học' 
      });
    }

    // Check enrollment and access
    const enrollment = await Enrollment.findOne({
      studentId,
      courseId: lesson.courseId._id
    });

    let hasAccess = false;
    let accessType = 'none';

    if (enrollment) {
      if (enrollment.hasFullAccess) {
        hasAccess = true;
        accessType = 'full_course';
      } else if (enrollment.hasAccessToLesson(lessonId)) {
        hasAccess = true;
        accessType = 'single_lesson';
      }
    }

    // Get schedule info if available
    let scheduleInfo = null;
    if (lesson.courseId.schedules && lesson.courseId.schedules[lesson.scheduleIndex]) {
      const schedule = lesson.courseId.schedules[lesson.scheduleIndex];
      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      
      scheduleInfo = {
        dayOfWeek: schedule.dayOfWeek,
        dayName: dayNames[schedule.dayOfWeek],
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        timezone: schedule.timezone,
        meetingPlatform: schedule.meetingPlatform,
        meetingUrl: schedule.meetingUrl
      };
    }

    // Check if lesson is completed
    const isCompleted = enrollment && enrollment.progress.completedLessons.some(
      completed => completed.lessonId && completed.lessonId.toString() === lessonId
    );

    const lessonData = {
      _id: lesson._id,
      title: lesson.title,
      description: lesson.description,
      order: lesson.order,
      duration: lesson.duration,
      lessonType: lesson.lessonType,
      meetingUrl: lesson.meetingUrl,
      meetingId: lesson.meetingId,
      meetingPassword: lesson.meetingPassword,
      actualStartTime: lesson.actualStartTime,
      actualEndTime: lesson.actualEndTime,
      recordingUrl: lesson.recordingUrl,
      contents: lesson.contents,
      resources: lesson.resources,
      isPreview: lesson.isPreview,
      isFree: lesson.isFree,
      status: lesson.status,
      scheduleInfo,
      course: {
        _id: lesson.courseId._id,
        title: lesson.courseId.title,
        instructor: lesson.courseId.instructor
      },
      access: {
        hasAccess,
        accessType,
        isCompleted
      },
      canJoinMeeting: hasAccess && lesson.lessonType === 'live_online' && lesson.meetingUrl,
      isMeetingActive: lesson.isMeetingActive
    };

    res.json({
      success: true,
      lesson: lessonData
    });

  } catch (error) {
    console.error("❌ Error in getLessonDetails:", error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi lấy thông tin bài học',
      error: error.message 
    });
  }
};

/**
 * =====================
 *  GET UPCOMING LESSONS
 * =====================
 */
const getUpcomingLessons = async (req, res) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.userId);
    const { limit = 5 } = req.query;

    console.log("🕒 [getUpcomingLessons]");
    console.log("➡️ StudentId:", studentId.toString());

    // Get active enrollments
    const enrollments = await Enrollment.find({
      studentId,
      status: 'active'
    }).populate('courseId', 'title thumbnail');

    const courseIds = enrollments.map(enrollment => enrollment.courseId._id);

    // Get upcoming lessons from enrolled courses
    const now = new Date();
    const upcomingLessons = await Lesson.find({
      courseId: { $in: courseIds },
      lessonType: 'live_online',
      actualStartTime: { $gt: now },
      status: 'published'
    })
    .populate('courseId', 'title thumbnail')
    .sort({ actualStartTime: 1 })
    .limit(Number(limit))
    .lean();

    // Format response
    const lessons = upcomingLessons.map(lesson => {
      const enrollment = enrollments.find(e => e.courseId._id.toString() === lesson.courseId._id.toString());
      
      return {
        _id: lesson._id,
        title: lesson.title,
        actualStartTime: lesson.actualStartTime,
        actualEndTime: lesson.actualEndTime,
        meetingUrl: lesson.meetingUrl,
        course: {
          _id: lesson.courseId._id,
          title: lesson.courseId.title,
          thumbnail: lesson.courseId.thumbnailUrl || lesson.courseId.thumbnail
        },
        enrollmentId: enrollment._id,
        hasAccess: enrollment.hasFullAccess || enrollment.hasAccessToLesson(lesson._id.toString())
      };
    });

    res.json({
      success: true,
      lessons,
      total: upcomingLessons.length
    });

  } catch (error) {
    console.error("❌ Error in getUpcomingLessons:", error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi lấy bài học sắp tới',
      error: error.message 
    });
  }
};

/**
 * =====================
 *  GET LEARNING STATISTICS
 * =====================
 */
const getLearningStatistics = async (req, res) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.userId);

    console.log("📊 [getLearningStatistics]");
    console.log("➡️ StudentId:", studentId.toString());

    // Get all enrollments
    const enrollments = await Enrollment.find({ studentId })
      .populate('courseId', 'title category level')
      .populate('progress.completedLessons.lessonId', 'duration');

    // Calculate statistics
    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.status === 'completed').length;
    const activeCourses = enrollments.filter(e => e.status === 'active').length;

    let totalLessons = 0;
    let completedLessons = 0;
    let totalLearningTime = 0;

    enrollments.forEach(enrollment => {
      totalLessons += enrollment.courseId.lessons ? enrollment.courseId.lessons.length : 0;
      completedLessons += enrollment.progress.completedLessons.length;
      
      // Calculate total learning time from completed lessons
      enrollment.progress.completedLessons.forEach(completed => {
        if (completed.lessonId && completed.lessonId.duration) {
          totalLearningTime += completed.lessonId.duration;
        }
      });
    });

    const averageProgress = totalCourses > 0 ? 
      enrollments.reduce((sum, e) => sum + e.progress.overallProgress, 0) / totalCourses : 0;

    // Courses by category
    const coursesByCategory = {};
    enrollments.forEach(enrollment => {
      const category = enrollment.courseId.category;
      coursesByCategory[category] = (coursesByCategory[category] || 0) + 1;
    });

    const statistics = {
      overview: {
        totalCourses,
        completedCourses,
        activeCourses,
        totalLessons,
        completedLessons,
        averageProgress: Math.round(averageProgress),
        totalLearningTime: Math.round(totalLearningTime / 60) // Convert to hours
      },
      coursesByCategory,
      recentActivity: enrollments
        .sort((a, b) => new Date(b.progress.lastAccessed) - new Date(a.progress.lastAccessed))
        .slice(0, 5)
        .map(e => ({
          courseId: e.courseId._id,
          courseTitle: e.courseId.title,
          lastAccessed: e.progress.lastAccessed,
          progress: e.progress.overallProgress
        }))
    };

    res.json({
      success: true,
      statistics
    });

  } catch (error) {
    console.error("❌ Error in getLearningStatistics:", error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi lấy thống kê học tập',
      error: error.message 
    });
  }
};

/**
 * =====================
 *  GET STUDENT LEARNING SCHEDULE - FIXED VERSION
 * =====================
 */
const getStudentLearningSchedule = async (req, res) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.userId);
    
    console.log("📅 [getStudentLearningSchedule]");
    console.log("➡️ StudentId:", studentId.toString());

    // 1. Lấy tất cả enrollments của student với populate đầy đủ - THÊM STATUS
    const enrollments = await Enrollment.find({
      studentId,
      status: 'active'
    })
    .populate('courseId', 'title thumbnail instructor schedules datedSchedules status') // 🆕 THÊM STATUS
    .populate('purchasedLessons.lessonId')
    .populate('progress.completedLessons.lessonId');

    console.log(`📚 Found ${enrollments.length} enrollments`);

    const scheduleItems = [];
    const now = new Date();

    // 2. Duyệt qua từng enrollment để lấy lessons
    for (const enrollment of enrollments) {
      const course = enrollment.courseId;
      if (!course) {
        console.log(`❌ Course not found for enrollment: ${enrollment._id}`);
        continue;
      }

      try {
        console.log(`🔍 Processing course: ${course.title} (${course._id})`);
        console.log(`🔍 Course status:`, course.status); // 🆕 LOG STATUS
        console.log(`📝 Enrollment details:`, {
          hasFullAccess: enrollment.hasFullAccess,
          purchasedLessonsCount: enrollment.purchasedLessons?.length || 0,
          courseLessonsCount: course.lessons?.length || 0
        });

        // Lấy tất cả lessons mà student có quyền truy cập
        const accessibleLessons = await getAccessibleLessons(enrollment, course);
        
        console.log(`📖 Course ${course.title}: ${accessibleLessons.length} accessible lessons`);
        
        // Thêm vào schedule
        for (const lesson of accessibleLessons) {
          const scheduleItem = await createScheduleItem(lesson, course, enrollment);
          if (scheduleItem) {
            scheduleItems.push(scheduleItem);
          }
        }
      } catch (courseError) {
        console.error(`❌ Error processing course ${course.title}:`, courseError);
      }
    }

    // 3. Sắp xếp theo thời gian
    const sortedItems = [...scheduleItems].sort((a, b) => {
      // Ưu tiên items có date trước
      if (!a.scheduleInfo.date && !b.scheduleInfo.date) return 0;
      if (!a.scheduleInfo.date) return 1;
      if (!b.scheduleInfo.date) return -1;
      
      return new Date(a.scheduleInfo.date) - new Date(b.scheduleInfo.date);
    });

    // 4. Phân loại
    const upcoming = sortedItems.filter(item => 
      item.status === 'upcoming' || item.status === 'live'
    );

    const completed = sortedItems.filter(item => 
      item.status === 'completed'
    );

    console.log(`📊 Schedule summary: ${sortedItems.length} total, ${upcoming.length} upcoming, ${completed.length} completed`);

    res.json({
      success: true,
      schedule: {
        upcoming: upcoming.slice(0, 10), // Giới hạn 10
        completed: completed.slice(0, 5), // Giới hạn 5
        all: sortedItems
      },
      summary: {
        total: sortedItems.length,
        upcoming: upcoming.length,
        completed: completed.length
      }
    });

  } catch (error) {
    console.error("❌ Error in getStudentLearningSchedule:", error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi lấy lịch học',
      error: error.message 
    });
  }
};


 
// Helper function để lấy lessons có quyền truy cập - FIXED VERSION
const getAccessibleLessons = async (enrollment, course) => {
  let lessons = [];

  try {
    console.log(`🔍 [getAccessibleLessons] Checking access for course: ${course._id}`);
    console.log(`🔍 Course status: ${course.status}`);
    console.log(`🔍 Enrollment hasFullAccess: ${enrollment.hasFullAccess}`);
    console.log(`🔍 Purchased lessons count: ${enrollment.purchasedLessons?.length || 0}`);

    // Nếu course đã published, lấy cả draft lessons
    const allowedStatuses = course.status === 'published' 
      ? ['published', 'completed', 'scheduled', 'draft'] // THÊM 'draft' cho course published
      : ['published', 'completed', 'scheduled'];

    console.log(`🔍 Allowed lesson statuses:`, allowedStatuses);

    if (enrollment.hasFullAccess) {
      // Student mua full course - lấy tất cả lessons
      lessons = await Lesson.find({
        courseId: course._id,
        status: { $in: allowedStatuses }
      }).sort({ order: 1 });
      
      console.log(`🔍 [Full Access] Found ${lessons.length} lessons for course ${course._id}`);
    } else {
      // Student mua lesson riêng lẻ - chỉ lấy lessons đã mua
      const purchasedLessonIds = enrollment.purchasedLessons
        .filter(p => p.lessonId)
        .map(p => p.lessonId._id || p.lessonId);
      
      console.log(`🔍 [Individual] Purchased lesson IDs:`, purchasedLessonIds);
      
      if (purchasedLessonIds.length > 0) {
        lessons = await Lesson.find({
          _id: { $in: purchasedLessonIds },
          status: { $in: allowedStatuses }
        }).sort({ order: 1 });
        
        console.log(`🔍 [Individual] Found ${lessons.length} purchased lessons`);
      } else {
        console.log(`🔍 [Individual] No purchased lessons found`);
      }
    }

    // Log chi tiết các lessons tìm thấy
    console.log(`🔍 Final accessible lessons:`, lessons.map(l => ({
      id: l._id,
      title: l.title,
      status: l.status,
      lessonType: l.lessonType,
      scheduleIndex: l.scheduleIndex,
      datedScheduleId: l.datedScheduleId
    })));

  } catch (error) {
    console.error("❌ Error in getAccessibleLessons:", error);
  }

  return lessons;
};
// Helper function để tạo schedule item - FIXED VERSION
// Helper function để tạo schedule item - FIXED VERSION
const createScheduleItem = async (lesson, course, enrollment) => {
  try {
    // Kiểm tra completion
    const isCompleted = enrollment.progress?.completedLessons?.some(
      completed => {
        const completedLessonId = completed.lessonId?._id || completed.lessonId;
        return completedLessonId && completedLessonId.toString() === lesson._id.toString();
      }
    ) || false;

    let scheduleInfo = {
      date: null,
      startTime: null,
      endTime: null,
      type: 'self_paced'
    };

    let status = isCompleted ? 'completed' : 'upcoming';
    const now = new Date();

    console.log(`🔍 [createScheduleItem] Processing lesson: ${lesson.title} (${lesson._id})`);
    console.log(`🔍 Lesson details:`, {
      datedScheduleId: lesson.datedScheduleId,
      scheduleIndex: lesson.scheduleIndex,
      actualDate: lesson.actualDate,
      actualStartTime: lesson.actualStartTime,
      actualEndTime: lesson.actualEndTime,
      lessonType: lesson.lessonType,
      status: lesson.status
    });

    // 🆕 FIX: ƯU TIÊN sử dụng actualDate và actualStartTime từ lesson trước
    if (lesson.actualDate && lesson.actualStartTime) {
      // Chuyển actualDate thành string nếu là đối tượng Date
      const lessonDate = new Date(lesson.actualDate);
      const dateString = lessonDate.toISOString().split('T')[0];
      const scheduleDateTime = new Date(`${dateString}T${lesson.actualStartTime}`);
      
      scheduleInfo = {
        date: dateString,
        startTime: lesson.actualStartTime,
        endTime: lesson.actualEndTime || null,
        type: 'scheduled'
      };

      console.log(`🔍 Using lesson's actualDate:`, {
        lessonDate: lessonDate.toISOString(),
        scheduleDateTime: scheduleDateTime.toISOString(),
        now: now.toISOString()
      });

      // 🆕 FIX: Xác định trạng thái chính xác hơn
      if (isCompleted) {
        status = 'completed';
      } else if (scheduleDateTime < now) {
        status = 'completed'; // Đã qua ngày -> completed
      } else if (scheduleDateTime.toDateString() === now.toDateString()) {
        status = 'live'; // Hôm nay -> live
      } else {
        status = 'upcoming'; // Tương lai -> upcoming
      }

      console.log(`🔍 Status determined: ${status}`);
    }
    // Xác định thời gian từ dated schedule
    else if (lesson.datedScheduleId && course.datedSchedules && course.datedSchedules.length > 0) {
      const datedSchedule = course.datedSchedules.id(lesson.datedScheduleId);
      if (datedSchedule) {
        scheduleInfo = {
          date: datedSchedule.date,
          startTime: datedSchedule.startTime,
          endTime: datedSchedule.endTime,
          type: 'dated'
        };
        
        // 🆕 FIX: Xác định trạng thái chính xác hơn
        const scheduleDateTime = new Date(`${datedSchedule.date}T${datedSchedule.startTime}`);
        console.log(`🔍 Using dated schedule:`, {
          scheduleDate: scheduleDateTime.toISOString(),
          now: now.toISOString()
        });

        if (isCompleted) {
          status = 'completed';
        } else if (scheduleDateTime < now) {
          status = 'completed';
        } else if (scheduleDateTime.toDateString() === now.toDateString()) {
          status = 'live';
        } else {
          status = 'upcoming';
        }

        console.log(`🔍 Status determined: ${status}`);
      }
    }
    // Xác định thời gian từ weekly schedule
    else if (typeof lesson.scheduleIndex === 'number' && 
             course.schedules && 
             course.schedules[lesson.scheduleIndex]) {
      const schedule = course.schedules[lesson.scheduleIndex];
      if (schedule) {
        // Tính ngày tiếp theo cho dayOfWeek
        const nextDate = getNextDateForDay(schedule.dayOfWeek);
        scheduleInfo = {
          date: nextDate,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          type: 'weekly'
        };
        
        // 🆕 FIX: Xác định trạng thái chính xác hơn
        const scheduleDateTime = new Date(`${nextDate}T${schedule.startTime}`);
        console.log(`🔍 Using weekly schedule:`, {
          scheduleDate: scheduleDateTime.toISOString(),
          now: now.toISOString()
        });

        if (isCompleted) {
          status = 'completed';
        } else if (scheduleDateTime < now) {
          status = 'completed';
        } else if (scheduleDateTime.toDateString() === now.toDateString()) {
          status = 'live';
        } else {
          status = 'upcoming';
        }

        console.log(`🔍 Status determined: ${status}`);
      }
    }
    // Nếu không có schedule info, đánh dấu là self-paced
    else {
      console.log(`🔍 No schedule info found, using self-paced`);
      scheduleInfo.type = 'self_paced';
      // 🆕 FIX: Với self-paced, nếu đã completed thì hiển thị completed
      status = isCompleted ? 'completed' : 'upcoming';
    }

    const scheduleItem = {
      _id: lesson._id.toString(),
      courseId: course._id.toString(),
      courseTitle: course.title,
      lessonTitle: lesson.title,
      lessonType: lesson.lessonType,
      accessType: enrollment.hasFullAccess ? 'full_course' : 'single_lesson',
      status: status, // 🆕 Sử dụng status đã được xác định chính xác
      isCompleted,
      scheduleInfo,
      instructorName: getInstructorName(course.instructor),
      courseThumbnail: course.thumbnail || '/default-course.jpg',
      canJoin: !isCompleted && lesson.lessonType === 'live_online' && (lesson.meetingUrl || lesson.jitsiMeetingUrl),
      meetingUrl: lesson.meetingUrl || lesson.jitsiMeetingUrl
    };

    console.log(`🔍 Created schedule item:`, {
      title: scheduleItem.lessonTitle,
      date: scheduleItem.scheduleInfo.date,
      status: scheduleItem.status,
      isCompleted: scheduleItem.isCompleted
    });

    return scheduleItem;

  } catch (error) {
    console.error("❌ Error creating schedule item for lesson:", lesson._id, error);
    return null;
  }
};
// Helper function để tính ngày tiếp theo cho dayOfWeek
const getNextDateForDay = (dayOfWeek) => {
  const now = new Date();
  const result = new Date(now);
  result.setDate(now.getDate() + ((7 + dayOfWeek - now.getDay()) % 7 || 7));
  return result.toISOString().split('T')[0];
};

// Helper function để lấy tên instructor
const getInstructorName = (instructor) => {
  if (!instructor) return 'Unknown Instructor';
  if (typeof instructor === 'string') return instructor;
  if (instructor.fullName) return instructor.fullName;
  if (instructor.name) return instructor.name;
  if (instructor.username) return instructor.username;
  return 'Unknown Instructor';
};

module.exports = {
  getMyCourses,
  getCourseProgress,
  getLessonDetails,
  getUpcomingLessons,
  getLearningStatistics,
  getStudentLearningSchedule
};