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
// services/course-service/src/controllers/studentController.js
const getMyCourses = async (req, res) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.userId);
    const { page = 1, limit = 10, status } = req.query;

    console.log("📚 [getMyCourses]");
    console.log("➡️ StudentId:", studentId.toString());

    // Build query
    const query = { studentId };
    if (status && status !== 'all') {
      query.status = status;
    }

    // Get enrollments with course details
    const enrollments = await Enrollment.find(query)
      .populate('courseId', 'title thumbnail description instructor category level pricingType fullCoursePrice currentEnrollments maxStudents status ratings')
      .populate('progress.completedLessons.lessonId', 'title order duration')
      .sort({ enrolledAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await Enrollment.countDocuments(query);

    console.log(`📊 Found ${enrollments.length} enrollments for student`);

    // Format response data - FIX: Kiểm tra tồn tại của progress
    const courses = enrollments.map(enrollment => {
      const course = enrollment.courseId;
      
      // Đảm bảo progress luôn có giá trị mặc định
      const progress = enrollment.progress || {
        overallProgress: 0,
        completedLessons: [],
        lastAccessed: enrollment.enrolledAt
      };

      return {
        enrollmentId: enrollment._id,
        enrolledAt: enrollment.enrolledAt,
        status: enrollment.status,
        progress: {
          overallProgress: progress.overallProgress || 0,
          completedLessons: progress.completedLessons ? progress.completedLessons.length : 0,
          lastAccessed: progress.lastAccessed || enrollment.enrolledAt
        },
        hasFullAccess: enrollment.purchasedLessons ? enrollment.purchasedLessons.length === 0 : true,
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
          totalLessons: course.lessons ? course.lessons.length : 0
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

module.exports = {
  getMyCourses,
  getCourseProgress,
  getLessonDetails,
  getUpcomingLessons,
  getLearningStatistics
};