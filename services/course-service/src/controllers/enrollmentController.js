// enrollment-service/src/controllers/enrollmentController.js
const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');

/**
 * =====================
 *  PURCHASE INDIVIDUAL LESSON
 * =====================
 */
const purchaseLesson = async (req, res) => {
  try {
    const { courseId, lessonId, paymentId, price } = req.body;
    const studentId = new mongoose.Types.ObjectId(req.userId);

    console.log("🛒 [purchaseLesson]");
    console.log("➡️ StudentId:", studentId.toString());
    console.log("➡️ CourseId:", courseId);
    console.log("➡️ LessonId:", lessonId);

    // Validate input
    if (!courseId || !lessonId || !paymentId || !price) {
      return res.status(400).json({ 
        message: 'Thiếu thông tin bắt buộc: courseId, lessonId, paymentId, price' 
      });
    }

    // Kiểm tra course tồn tại và cho phép mua lesson riêng
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    }

    if (!['per_lesson', 'both'].includes(course.pricingType)) {
      return res.status(400).json({ 
        message: 'Khóa học này không cho phép mua từng bài học riêng lẻ' 
      });
    }

    // Kiểm tra lesson tồn tại
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Không tìm thấy bài học' });
    }

    // Tìm enrollment
    let enrollment = await Enrollment.findOne({
      studentId,
      courseId: new mongoose.Types.ObjectId(courseId)
    });

    // 🔥 QUAN TRỌNG: Kiểm tra xem user đã có full access chưa
    if (enrollment && enrollment.hasFullAccess) {
      return res.status(400).json({ 
        message: 'Bạn đã mua toàn bộ khóa học, không cần mua bài học riêng lẻ' 
      });
    }

    if (enrollment) {
      // Kiểm tra xem đã mua lesson này chưa
      const alreadyPurchased = enrollment.purchasedLessons.some(
        purchase => purchase.lessonId.toString() === lessonId
      );

      if (alreadyPurchased) {
        return res.status(400).json({ 
          message: 'Bạn đã mua bài học này rồi' 
        });
      }

      // Thêm lesson vào danh sách đã mua
      enrollment.purchasedLessons.push({
        lessonId: new mongoose.Types.ObjectId(lessonId),
        price,
        purchasedAt: new Date()
      });

    } else {
      // Tạo enrollment mới với lesson đã mua
      enrollment = new Enrollment({
        studentId,
        courseId: new mongoose.Types.ObjectId(courseId),
        paymentId: new mongoose.Types.ObjectId(paymentId),
        purchasedLessons: [{
          lessonId: new mongoose.Types.ObjectId(lessonId),
          price,
          purchasedAt: new Date()
        }],
        enrolledAt: new Date(),
        status: 'active'
      });
    }

    await enrollment.save();
    console.log("✅ Lesson purchased successfully");

    res.status(200).json({
      success: true,
      message: 'Mua bài học thành công',
      enrollment: {
        _id: enrollment._id,
        hasFullAccess: enrollment.hasFullAccess,
        purchasedLessons: enrollment.purchasedLessons
      }
    });

  } catch (error) {
    console.error("❌ Error in purchaseLesson:", error);
    res.status(500).json({ 
      message: 'Lỗi server khi mua bài học',
      error: error.message 
    });
  }
};
/**
 * =====================
 *  CHECK LESSON ACCESS
 * =====================
 */
const checkLessonAccess = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const studentId = new mongoose.Types.ObjectId(req.userId);

    console.log("🔐 [checkLessonAccess]");
    console.log("➡️ StudentId:", studentId.toString());
    console.log("➡️ LessonId:", lessonId);

    // Lấy thông tin lesson để biết courseId
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy bài học' 
      });
    }

    // Tìm enrollment
    const enrollment = await Enrollment.findOne({
      studentId,
      courseId: lesson.courseId
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

    console.log(`🔍 Access check: ${hasAccess} (${accessType})`);

    res.json({
      success: true,
      hasAccess,
      accessType,
      lesson: {
        _id: lesson._id,
        title: lesson.title,
        meetingUrl: lesson.meetingUrl
      }
    });

  } catch (error) {
    console.error("❌ Error in checkLessonAccess:", error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi kiểm tra quyền truy cập',
      error: error.message 
    });
  }
};

/**
 * =====================
 *  MARK LESSON COMPLETED
 * =====================
 */
const markLessonCompleted = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { progress = 100 } = req.body;
    const studentId = new mongoose.Types.ObjectId(req.userId);

    console.log("✅ [markLessonCompleted]");
    console.log("➡️ StudentId:", studentId.toString());
    console.log("➡️ LessonId:", lessonId);
    console.log("➡️ Progress:", progress);

    // Lấy thông tin lesson để biết courseId
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy bài học' 
      });
    }

    // Tìm enrollment
    const enrollment = await Enrollment.findOne({
      studentId,
      courseId: lesson.courseId
    });

    if (!enrollment) {
      return res.status(404).json({ 
        success: false,
        message: 'Bạn chưa đăng ký khóa học này' 
      });
    }

    // Kiểm tra quyền truy cập lesson
    if (!enrollment.hasAccessToLesson(lessonId)) {
      return res.status(403).json({ 
        success: false,
        message: 'Bạn không có quyền truy cập bài học này' 
      });
    }

    // Đánh dấu hoàn thành
    await enrollment.markLessonCompleted(lessonId, progress);

    console.log("📊 Lesson marked as completed");

    res.json({
      success: true,
      message: 'Đã đánh dấu bài học hoàn thành',
      progress: enrollment.progress.overallProgress,
      completedLessons: enrollment.progress.completedLessons.length
    });

  } catch (error) {
    console.error("❌ Error in markLessonCompleted:", error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi đánh dấu bài học hoàn thành',
      error: error.message 
    });
  }
};

/**
 * =====================
 *  GET ENROLLMENT PROGRESS
 * =====================
 */
const getEnrollmentProgress = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const studentId = new mongoose.Types.ObjectId(req.userId);

    console.log("📈 [getEnrollmentProgress]");
    console.log("➡️ StudentId:", studentId.toString());
    console.log("➡️ EnrollmentId:", enrollmentId);

    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      studentId
    }).populate('purchasedLessons.lessonId', 'title order')
      .populate('progress.completedLessons.lessonId', 'title order');

    if (!enrollment) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy enrollment' 
      });
    }

    // Lấy tổng số lesson trong course để tính phần trăm
    const totalLessons = await Lesson.countDocuments({ 
      courseId: enrollment.courseId 
    });

    const progressData = {
      overallProgress: enrollment.progress.overallProgress,
      completedLessons: enrollment.progress.completedLessons.length,
      totalLessons,
      purchasedLessons: enrollment.purchasedLessons.length,
      hasFullAccess: enrollment.hasFullAccess,
      lastAccessed: enrollment.progress.lastAccessed,
      completedLessonsDetails: enrollment.progress.completedLessons,
      purchasedLessonsDetails: enrollment.purchasedLessons
    };

    res.json({
      success: true,
      progress: progressData,
      enrollment: {
        _id: enrollment._id,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt
      }
    });

  } catch (error) {
    console.error("❌ Error in getEnrollmentProgress:", error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi lấy tiến độ học tập',
      error: error.message 
    });
  }
};

/**
 * =====================
 *  GET ENROLLMENT BY COURSE
 * =====================
 */
const getEnrollmentByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = new mongoose.Types.ObjectId(req.userId);

    console.log("📚 [getEnrollmentByCourse]");
    console.log("➡️ StudentId:", studentId.toString());
    console.log("➡️ CourseId:", courseId);

    const enrollment = await Enrollment.findOne({
      studentId,
      courseId: new mongoose.Types.ObjectId(courseId)
    }).populate('courseId', 'title thumbnail instructor')
      .populate('purchasedLessons.lessonId', 'title order scheduleIndex');

    if (!enrollment) {
      return res.status(404).json({ 
        success: false,
        message: 'Bạn chưa đăng ký khóa học này' 
      });
    }

    res.json({
      success: true,
      enrollment,
      accessInfo: {
        hasFullAccess: enrollment.hasFullAccess,
        purchasedLessonsCount: enrollment.purchasedLessons.length,
        canAccessAllLessons: enrollment.hasFullAccess
      }
    });

  } catch (error) {
    console.error("❌ Error in getEnrollmentByCourse:", error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi lấy thông tin enrollment',
      error: error.message 
    });
  }
};

/**
 * =====================
 *  UPDATE ENROLLMENT STATUS
 * =====================
 */
const updateEnrollmentStatus = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { status } = req.body;
    const studentId = new mongoose.Types.ObjectId(req.userId);

    console.log("🔄 [updateEnrollmentStatus]");
    console.log("➡️ StudentId:", studentId.toString());
    console.log("➡️ EnrollmentId:", enrollmentId);
    console.log("➡️ New Status:", status);

    const validStatuses = ['active', 'completed', 'cancelled', 'paused'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(', ')}` 
      });
    }

    const enrollment = await Enrollment.findOneAndUpdate(
      {
        _id: enrollmentId,
        studentId
      },
      {
        status,
        ...(status === 'completed' && { completedAt: new Date() })
      },
      { new: true }
    );

    if (!enrollment) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy enrollment hoặc bạn không có quyền cập nhật' 
      });
    }

    console.log("✅ Enrollment status updated");

    res.json({
      success: true,
      message: `Cập nhật trạng thái enrollment thành ${status}`,
      enrollment: {
        _id: enrollment._id,
        status: enrollment.status,
        completedAt: enrollment.completedAt
      }
    });

  } catch (error) {
    console.error("❌ Error in updateEnrollmentStatus:", error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái enrollment',
      error: error.message 
    });
  }
};

/**
 * =====================
 *  GET COURSE ENROLLMENTS (FOR INSTRUCTOR)
 * =====================
 */
const getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    console.log("👥 [getCourseEnrollments]");
    console.log("➡️ CourseId:", courseId);
    console.log("➡️ Instructor:", req.userId);

    // Kiểm tra instructor có phải là người dạy khóa học này không
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy khóa học' 
      });
    }

    if (course.instructor.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Bạn không có quyền xem danh sách enrollment của khóa học này' 
      });
    }

    const query = { courseId: new mongoose.Types.ObjectId(courseId) };
    if (status) query.status = status;

    const enrollments = await Enrollment.find(query)
      .populate('studentId', 'fullName email profile.avatar')
      .sort({ enrolledAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await Enrollment.countDocuments(query);

    // Thống kê
    const stats = {
      total: await Enrollment.countDocuments({ courseId }),
      active: await Enrollment.countDocuments({ courseId, status: 'active' }),
      completed: await Enrollment.countDocuments({ courseId, status: 'completed' }),
      cancelled: await Enrollment.countDocuments({ courseId, status: 'cancelled' })
    };

    console.log(`📊 Found ${total} enrollments for course ${courseId}`);

    res.json({
      success: true,
      enrollments,
      stats,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalEnrollments: total
      }
    });

  } catch (error) {
    console.error("❌ Error in getCourseEnrollments:", error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi lấy danh sách enrollment khóa học',
      error: error.message 
    });
  }
};
const createEnrollment = async (req, res) => {
  try {
    const { courseId, paymentId } = req.body;
    const studentId = new mongoose.Types.ObjectId(req.userId);

    console.log("🎯 [createEnrollment]");
    console.log("➡️ StudentId (from token):", req.userId);
    console.log("➡️ StudentId (ObjectId):", studentId.toString());
    console.log("➡️ CourseId (body):", courseId);
    console.log("➡️ PaymentId (body):", paymentId);

    // Validate input
    if (!courseId || !paymentId) {
      console.log("❌ Missing input");
      return res.status(400).json({ 
        message: 'courseId và paymentId là bắt buộc' 
      });
    }

    // Kiểm tra course tồn tại
    const course = await Course.findById(courseId);
    console.log("📚 Course found:", course ? course._id.toString() : null);
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    }

    // Kiểm tra course đã published chưa
    if (course.status !== 'published') {
      console.log("⚠️ Course not published:", course.status);
      return res.status(400).json({ message: 'Khóa học chưa được xuất bản' });
    }

    // Kiểm tra đã đăng ký chưa
    console.log("🔎 Checking for existing enrollment...");
    const existingEnrollment = await Enrollment.findOne({
      studentId: new mongoose.Types.ObjectId(studentId),
      courseId: new mongoose.Types.ObjectId(courseId)
    });

    console.log("📌 Query ->", {
      studentId: studentId.toString(),
      courseId: courseId.toString()
    });
    console.log("📌 existingEnrollment:", existingEnrollment ? existingEnrollment._id.toString() : null);

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Bạn đã đăng ký khóa học này rồi' });
    }

    // Kiểm tra số lượng
    console.log(`👥 CurrentEnrollments: ${course.currentEnrollments} / ${course.maxStudents}`);
    if (course.currentEnrollments >= course.maxStudents) {
      return res.status(400).json({ message: 'Khóa học đã đầy' });
    }

    // Tạo enrollment mới
    const enrollment = new Enrollment({
      studentId,
      courseId: new mongoose.Types.ObjectId(courseId),
      paymentId: new mongoose.Types.ObjectId(paymentId),
      enrolledAt: new Date(),
      status: 'active'
    });

    await enrollment.save();
    console.log("✅ Enrollment created:", enrollment._id.toString());

    // Update course count
    course.currentEnrollments += 1;
    await course.save();
    console.log("📈 Course enrollment count updated:", course.currentEnrollments);

    return res.status(201).json({
      success: true,
      message: 'Đăng ký khóa học thành công',
      enrollment
    });

  } catch (error) {
    console.error("❌ Error in createEnrollment:", error);

    if (error.code === 11000) {
      return res.status(400).json({ message: 'Bạn đã đăng ký khóa học này rồi' });
    }

    return res.status(500).json({ 
      message: 'Lỗi server khi đăng ký khóa học',
      error: error.message 
    });
  }
};

/**
 * =====================
 *  GET MY ENROLLMENTS (LEGACY)
 * =====================
 */
const getMyEnrollments = async (req, res) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.userId);
    const { page = 1, limit = 10, status } = req.query;

    console.log("📋 [getMyEnrollments] for student:", studentId.toString());

    const query = { studentId };
    if (status) query.status = status;

    const enrollments = await Enrollment.find(query)
      .populate('courseId')
      .sort({ enrolledAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await Enrollment.countDocuments(query);
    console.log(`📊 Found ${total} enrollments`);

    res.json({
      success: true,
      enrollments,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalEnrollments: total
      }
    });

  } catch (error) {
    console.error("❌ Error in getMyEnrollments:", error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách đăng ký', error: error.message });
  }
};

/**
 * =====================
 *  DELETE ENROLLMENT (LEGACY)
 * =====================
 */
const deleteEnrollment = async (req, res) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.userId);
    const enrollmentId = req.params.id;

    console.log("🗑 [deleteEnrollment]");
    console.log("➡️ StudentId:", studentId.toString());
    console.log("➡️ EnrollmentId:", enrollmentId);

    const enrollment = await Enrollment.findOneAndDelete({
      _id: enrollmentId,
      studentId
    });

    console.log("📌 Deleted enrollment:", enrollment ? enrollment._id.toString() : null);

    if (!enrollment) {
      return res.status(404).json({ message: 'Không tìm thấy enrollment hoặc bạn không có quyền xoá' });
    }

    await Course.findByIdAndUpdate(enrollment.courseId, {
      $inc: { currentEnrollments: -1 }
    });

    console.log("📉 Course enrollment count decreased");

    res.json({ success: true, message: 'Xoá enrollment thành công' });
  } catch (error) {
    console.error("❌ Error in deleteEnrollment:", error);
    res.status(500).json({ message: 'Lỗi server khi xoá enrollment', error: error.message });
  }
};
const checkEnrollment = async (req, res) => {
  try {
    const { userId, courseId, lessonId } = req.query;

    console.log("🔍 [checkEnrollment]");
    console.log("➡️ UserId:", userId);
    console.log("➡️ CourseId:", courseId);
    console.log("➡️ LessonId:", lessonId);

    // Validate input
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: 'userId là bắt buộc' 
      });
    }

    if (!courseId && !lessonId) {
      return res.status(400).json({ 
        success: false,
        message: 'Phải cung cấp courseId hoặc lessonId' 
      });
    }

    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);

      // Tìm enrollment của user cho course này
      const enrollment = await Enrollment.findOne({
        studentId: userObjectId,
        courseId: courseId ? new mongoose.Types.ObjectId(courseId) : undefined
      });

      let isEnrolled = false;
      let enrollmentType = 'none';

      if (enrollment) {
        // Nếu lessonId được cung cấp, kiểm tra xem user có mua lesson này không
        if (lessonId) {
          if (enrollment.hasFullAccess) {
            isEnrolled = true;
            enrollmentType = 'full_course';
          } else if (enrollment.hasAccessToLesson(lessonId)) {
            isEnrolled = true;
            enrollmentType = 'single_lesson';
          }
        } else {
          // Chỉ kiểm tra full course access
          isEnrolled = true;
          enrollmentType = enrollment.hasFullAccess ? 'full_course' : 'partial_course';
        }
      }

      console.log(`✅ Enrollment check result: ${isEnrolled} (${enrollmentType})`);

      res.json({
        success: true,
        isEnrolled,
        enrollmentType, // 'none', 'full_course', 'single_lesson', 'partial_course'
        enrollment: isEnrolled ? {
          _id: enrollment._id.toString(),
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
          hasFullAccess: enrollment.hasFullAccess,
          purchasedLessonsCount: enrollment.purchasedLessons.length
        } : null
      });

    } catch (error) {
      if (error.kind === 'ObjectId') {
        return res.status(400).json({ 
          success: false,
          message: 'userId hoặc courseId không hợp lệ' 
        });
      }
      throw error;
    }

  } catch (error) {
    console.error("❌ Error in checkEnrollment:", error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi kiểm tra enrollment',
      error: error.message 
    });
  }
};
// Cập nhật export để bao gồm tất cả các hàm
module.exports = {
  // Các hàm mới
  purchaseLesson,
  checkLessonAccess,
  markLessonCompleted,
  getEnrollmentProgress,
  getEnrollmentByCourse,
  updateEnrollmentStatus,
  getCourseEnrollments,
  // Các hàm cũ
  createEnrollment,
  getMyEnrollments,
  deleteEnrollment,
  checkEnrollment
};