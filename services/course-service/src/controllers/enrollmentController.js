const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

exports.createEnrollment = async (req, res) => {
  try {
    const { courseId, paymentId } = req.body;
    const studentId = req.userId;

    console.log("🎯 Creating enrollment for student:", studentId);
    console.log("📝 Course ID:", courseId);
    console.log("💳 Payment ID:", paymentId);

    // Validate input
    if (!courseId || !paymentId) {
      return res.status(400).json({ 
        message: 'courseId và paymentId là bắt buộc' 
      });
    }

    // Kiểm tra course tồn tại
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ 
        message: 'Không tìm thấy khóa học' 
      });
    }

    // Kiểm tra course đã published chưa
    if (course.status !== 'published') {
      return res.status(400).json({ 
        message: 'Khóa học chưa được xuất bản' 
      });
    }

    // Kiểm tra đã đăng ký chưa
    const existingEnrollment = await Enrollment.findOne({
      studentId,
      courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({ 
        message: 'Bạn đã đăng ký khóa học này rồi' 
      });
    }

    // Kiểm tra khóa học có còn chỗ không
    if (course.currentEnrollments >= course.maxStudents) {
      return res.status(400).json({ 
        message: 'Khóa học đã đầy' 
      });
    }

    // Tạo enrollment
    const enrollment = new Enrollment({
      studentId,
      courseId,
      paymentId,
      enrolledAt: new Date(),
      status: 'active'
    });

    await enrollment.save();

    // Tăng số lượng enrollment trong course
    course.currentEnrollments += 1;
    await course.save();

    console.log('✅ Enrollment created successfully:', enrollment._id);

    res.status(201).json({
      success: true,
      message: 'Đăng ký khóa học thành công',
      enrollment
    });

  } catch (error) {
    console.error('❌ Error creating enrollment:', error);
    
    // Handle duplicate key error (11000)
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Bạn đã đăng ký khóa học này rồi' 
      });
    }

    res.status(500).json({ 
      message: 'Lỗi server khi đăng ký khóa học',
      error: error.message 
    });
  }
};

exports.getMyEnrollments = async (req, res) => {
  try {
    const studentId = req.userId;
    const { page = 1, limit = 10, status } = req.query;

    console.log("📋 Fetching enrollments for student:", studentId);

    // Build query
    const query = { studentId };
    if (status) {
      query.status = status;
    }

    // Get enrollments with pagination
    const enrollments = await Enrollment.find(query)
      .populate('courseId')
      .sort({ enrolledAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await Enrollment.countDocuments(query);

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
    console.error('❌ Error fetching enrollments:', error);
    res.status(500).json({ 
      message: 'Lỗi server khi lấy danh sách đăng ký',
      error: error.message 
    });
  }
};
exports.deleteEnrollment = async (req, res) => {
  try {
    const studentId = req.userId;
    const enrollmentId = req.params.id;

    const enrollment = await Enrollment.findOneAndDelete({
      _id: enrollmentId,
      studentId: studentId
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Không tìm thấy enrollment hoặc bạn không có quyền xoá' });
    }

    // Giảm số lượng enrollment trong course
    await Course.findByIdAndUpdate(enrollment.courseId, {
      $inc: { currentEnrollments: -1 }
    });

    res.json({ success: true, message: 'Xoá enrollment thành công' });
  } catch (error) {
    console.error('❌ Error deleting enrollment:', error);
    res.status(500).json({ message: 'Lỗi server khi xoá enrollment', error: error.message });
  }
};
