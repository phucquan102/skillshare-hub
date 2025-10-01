const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

/**
 * =====================
 *  CREATE ENROLLMENT
 * =====================
 */
exports.createEnrollment = async (req, res) => {
  try {
    const { courseId, paymentId } = req.body;
    const studentId = new mongoose.Types.ObjectId(req.userId); // ép ObjectId

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
 *  GET MY ENROLLMENTS
 * =====================
 */
exports.getMyEnrollments = async (req, res) => {
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
 *  DELETE ENROLLMENT
 * =====================
 */
exports.deleteEnrollment = async (req, res) => {
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
